# apps/core/services/inventory_service.py
from django.db.models import Q, Sum
from django.utils import timezone
from typing import List, Dict
from apps.core.models import Inventory, BloodBank, BloodType

class InventoryService:
    """Service layer for inventory management logic"""
    
    @staticmethod
    def check_shortages(blood_bank_id: int = None) -> List[Dict]:
        """
        Check for inventory shortages based on demand predictions
        Returns list of blood types that are below threshold
        """
        threshold = 10  # Minimum units before alert
        
        if blood_bank_id:
            banks = BloodBank.objects.filter(id=blood_bank_id)
        else:
            banks = BloodBank.objects.filter(is_active=True)
        
        shortages = []
        
        for bank in banks:
            # Get current stock levels by blood type
            stock_levels = Inventory.objects.filter(
                blood_bank=bank,
                expiry_date__gt=timezone.now().date(),
                is_quarantined=False,
                quality_check_passed=True
            ).values('blood_type').annotate(
                total_units=Sum('units_available')
            )
            
            stock_dict = {item['blood_type']: item['total_units'] for item in stock_levels}
            
            # Check each blood type against threshold
            for blood_type, _ in BloodType.choices:
                current = stock_dict.get(blood_type, 0)
                if current < threshold:
                    shortages.append({
                        'blood_bank_id': bank.id,
                        'blood_bank_name': bank.name,
                        'blood_type': blood_type,
                        'current_units': current,
                        'threshold': threshold,
                        'deficit': threshold - current,
                        'severity': 'HIGH' if current == 0 else 'MEDIUM' if current < threshold/2 else 'LOW'
                    })
        
        return shortages
    
    @staticmethod
    def get_expiring_soon(days: int = 3) -> List[Dict]:
        """
        Get inventory items expiring within specified days
        """
        expiry_threshold = timezone.now().date() + timezone.timedelta(days=days)
        
        expiring_items = Inventory.objects.filter(
            expiry_date__lte=expiry_threshold,
            expiry_date__gt=timezone.now().date(),
            units_available__gt=0,
            is_quarantined=False,
            quality_check_passed=True
        ).select_related('blood_bank').order_by('expiry_date')
        
        result = []
        for item in expiring_items:
            result.append({
                'inventory_id': item.id,
                'blood_bank_id': item.blood_bank.id,
                'blood_bank_name': item.blood_bank.name,
                'blood_type': item.blood_type,
                'units_available': item.units_available,
                'expiry_date': item.expiry_date,
                'days_until_expiry': (item.expiry_date - timezone.now().date()).days,
                'batch_number': item.batch_number
            })
        
        return result
    
    @staticmethod
    def suggest_transfers(blood_bank_id: int = None) -> List[Dict]:
        """
        Suggest transferring expiring stock to hospitals with demand
        """
        expiring_items = InventoryService.get_expiring_soon(days=3)
        suggestions = []
        
        for item in expiring_items:
            # Find hospitals with recent demand for this blood type
            from apps.core.models import DemandHistory
            
            recent_demand = DemandHistory.objects.filter(
                blood_type=item['blood_type'],
                request_date__gte=timezone.now() - timezone.timedelta(days=7),
                status__in=['PENDING', 'PARTIALLY_FILLED']
            ).select_related('hospital').distinct('hospital')
            
            for demand in recent_demand[:3]:  # Top 3 hospitals
                suggestions.append({
                    'inventory_id': item['inventory_id'],
                    'blood_bank': item['blood_bank_name'],
                    'blood_type': item['blood_type'],
                    'units_available': item['units_available'],
                    'expiry_date': item['expiry_date'],
                    'suggested_hospital': demand.hospital.name,
                    'hospital_id': demand.hospital.id,
                    'distance': None,  # Would calculate distance here
                    'priority': 'HIGH' if item['days_until_expiry'] <= 1 else 'MEDIUM'
                })
        
        return suggestions