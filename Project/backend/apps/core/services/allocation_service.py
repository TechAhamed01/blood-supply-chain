# apps/core/services/allocation_service.py
import math
from typing import List, Dict, Optional, Tuple
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Sum
from apps.core.models import (
    Hospital, BloodBank, Inventory, 
    EmergencyAllocation, AllocationDetail,
    DemandHistory, RequestStatus, AllocationStatus
)

class AllocationService:
    """Service layer for emergency blood allocation logic"""
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    @staticmethod
    def estimate_travel_time(distance_km: float) -> int:
        """Estimate travel time in minutes based on distance"""
        # Assume average speed of 40 km/h with traffic
        avg_speed_kmh = 40
        time_hours = distance_km / avg_speed_kmh
        return int(time_hours * 60)
    
    @classmethod
    def find_available_blood_banks(cls, blood_type: str, units_required: int) -> List[Dict]:
        """Find blood banks with available stock for required blood type"""
        compatible_types = cls.get_compatible_blood_types(blood_type)
        
        # Find inventory items that are available
        available_inventory = Inventory.objects.filter(
            blood_type__in=compatible_types,
            units_available__gt=0,
            expiry_date__gt=timezone.now().date(),
            is_quarantined=False,
            quality_check_passed=True
        ).select_related('blood_bank').order_by('expiry_date')  # FIFO
        
        # Group by blood bank
        bank_stock = {}
        for item in available_inventory:
            bank = item.blood_bank
            if bank.id not in bank_stock:
                bank_stock[bank.id] = {
                    'blood_bank': bank,
                    'total_units': 0,
                    'inventory_items': []
                }
            bank_stock[bank.id]['total_units'] += item.units_available
            bank_stock[bank.id]['inventory_items'].append(item)
        
        # Filter banks that have enough total units
        result = []
        for bank_id, stock in bank_stock.items():
            if stock['total_units'] >= units_required:
                result.append({
                    'blood_bank': stock['blood_bank'],
                    'total_units': stock['total_units'],
                    'inventory_items': stock['inventory_items']
                })
        
        return result
    
    @staticmethod
    def get_compatible_blood_types(blood_type: str) -> List[str]:
        """Get compatible blood types for transfusion"""
        compatibility_map = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            'AB-': ['A-', 'B-', 'AB-', 'O-'],
            'O+': ['O+', 'O-'],
            'O-': ['O-']
        }
        return compatibility_map.get(blood_type, [blood_type])
    
    @classmethod
    @transaction.atomic
    def allocate_emergency_request(cls, hospital_id: int, blood_type: str, 
                                   units_required: int, **kwargs) -> Dict:
        """
        Main allocation logic for emergency requests
        Returns allocation result with recommendations
        """
        try:
            hospital = Hospital.objects.get(id=hospital_id, is_active=True)
        except Hospital.DoesNotExist:
            return {'success': False, 'error': 'Hospital not found'}
        
        # Create emergency allocation record
        allocation = EmergencyAllocation.objects.create(
            hospital=hospital,
            blood_type=blood_type,
            units_required=units_required,
            hospital_lat=hospital.latitude,
            hospital_lon=hospital.longitude,
            status=AllocationStatus.PROCESSING
        )
        
        # Find available blood banks
        available_banks = cls.find_available_blood_banks(blood_type, units_required)
        
        if not available_banks:
            allocation.status = AllocationStatus.FAILED
            allocation.notes = "No blood banks with sufficient compatible stock found"
            allocation.save()
            return {
                'success': False,
                'error': 'No blood banks with sufficient stock',
                'allocation_id': allocation.id
            }
        
        # Calculate distances and sort by nearest
        for bank_info in available_banks:
            bank = bank_info['blood_bank']
            distance = cls.haversine_distance(
                hospital.latitude, hospital.longitude,
                bank.latitude, bank.longitude
            )
            bank_info['distance_km'] = distance
            bank_info['travel_time'] = cls.estimate_travel_time(distance)
        
        # Sort by distance
        available_banks.sort(key=lambda x: x['distance_km'])
        
        # Try allocation from nearest banks
        remaining_units = units_required
        allocated_units = 0
        allocated_from = []
        
        for bank_info in available_banks:
            if remaining_units <= 0:
                break
            
            bank = bank_info['blood_bank']
            inventory_items = bank_info['inventory_items']
            
            # Try to allocate from this bank (FIFO by expiry date)
            for item in inventory_items:
                if remaining_units <= 0:
                    break
                
                if item.is_available():
                    units_to_take = min(item.units_available, remaining_units)
                    
                    # Create allocation detail
                    detail = AllocationDetail.objects.create(
                        emergency_allocation=allocation,
                        inventory=item,
                        units_allocated=units_to_take
                    )
                    
                    allocated_from.append({
                        'blood_bank': bank.name,
                        'blood_bank_id': bank.id,
                        'inventory_id': item.id,
                        'units': units_to_take,
                        'batch_number': item.batch_number,
                        'expiry_date': item.expiry_date
                    })
                    
                    allocated_units += units_to_take
                    remaining_units -= units_to_take
                    
                    # Update allocation
                    allocation.blood_bank = bank
                    allocation.blood_bank_lat = bank.latitude
                    allocation.blood_bank_lon = bank.longitude
                    allocation.units_allocated = allocated_units
                    allocation.distance_km = bank_info['distance_km']
                    allocation.estimated_time_minutes = bank_info['travel_time']
        
        # Update allocation status
        if allocated_units >= units_required:
            allocation.status = AllocationStatus.ALLOCATED
            allocation.completed_time = timezone.now()
            message = "Fully allocated"
        elif allocated_units > 0:
            allocation.status = AllocationStatus.PARTIALLY_ALLOCATED
            message = f"Partially allocated ({allocated_units}/{units_required} units)"
        else:
            allocation.status = AllocationStatus.FAILED
            message = "No allocation possible"
        
        allocation.response_time = timezone.now()
        allocation.save()
        
        # Create demand history record
        demand = DemandHistory.objects.create(
            hospital=hospital,
            blood_type=blood_type,
            units_requested=units_required,
            units_fulfilled=allocated_units,
            required_by_date=kwargs.get('required_by_date', timezone.now().date()),
            status=cls._get_demand_status(allocated_units, units_required),
            priority=kwargs.get('priority', 3),
            purpose=kwargs.get('purpose', ''),
            allocated_from=allocation
        )
        
        allocation.demand_record = demand
        allocation.save()
        
        return {
            'success': True,
            'message': message,
            'allocation_id': allocation.id,
            'demand_id': demand.id,
            'units_requested': units_required,
            'units_allocated': allocated_units,
            'status': allocation.status,
            'allocations': allocated_from,
            'hospital_location': {
                'lat': float(hospital.latitude),
                'lon': float(hospital.longitude)
            }
        }
    
    @staticmethod
    def _get_demand_status(allocated: int, required: int) -> str:
        if allocated >= required:
            return RequestStatus.COMPLETED
        elif allocated > 0:
            return RequestStatus.PARTIALLY_FILLED
        else:
            return RequestStatus.PENDING