# scripts/load_dummy_data.py

#!/usr/bin/env python
"""
Dummy data loader for Blood Supply Chain System
Run: python scripts/load_dummy_data.py

This script creates:
- Admin user
- 3 Hospital users with their profiles
- 3 Blood Bank users with their profiles
- Realistic inventory for blood banks
- Sample demand history for hospitals
- Emergency allocation records
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

# Django models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.core.models import (
    Hospital, BloodBank, Inventory, DemandHistory, 
    EmergencyAllocation, AllocationDetail, BloodType,
    RequestStatus, AllocationStatus
)
from apps.authentication.models import User

# Configure logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DummyDataLoader:
    """
    Load dummy data for demonstration purposes
    """
    
    # Static coordinates for NYC area
    LOCATIONS = {
        'hospitals': [
            {
                'name': 'NYC General Hospital',
                'address': '100 Broadway, New York, NY 10001',
                'city': 'New York',
                'state': 'NY',
                'zip': '10001',
                'lat': 40.7128,
                'lon': -74.0060,
                'bed_capacity': 500,
                'emergency_contact': '+1-212-555-0101'
            },
            {
                'name': 'Brooklyn Medical Center',
                'address': '200 Atlantic Ave, Brooklyn, NY 11201',
                'city': 'Brooklyn',
                'state': 'NY',
                'zip': '11201',
                'lat': 40.6782,
                'lon': -73.9442,
                'bed_capacity': 350,
                'emergency_contact': '+1-718-555-0102'
            },
            {
                'name': 'Queens University Hospital',
                'address': '300 Queens Blvd, Queens, NY 11101',
                'city': 'Queens',
                'state': 'NY',
                'zip': '11101',
                'lat': 40.7282,
                'lon': -73.7949,
                'bed_capacity': 450,
                'emergency_contact': '+1-718-555-0103'
            }
        ],
        'blood_banks': [
            {
                'name': 'Manhattan Blood Center',
                'address': '400 E 34th St, New York, NY 10016',
                'city': 'New York',
                'state': 'NY',
                'zip': '10016',
                'lat': 40.7431,
                'lon': -73.9734,
                'bank_type': 'RED_CROSS',
                'max_storage': 2000,
                'contact': '+1-212-555-0201'
            },
            {
                'name': 'Brooklyn Community Blood Bank',
                'address': '500 Fulton St, Brooklyn, NY 11201',
                'city': 'Brooklyn',
                'state': 'NY',
                'zip': '11201',
                'lat': 40.6911,
                'lon': -73.9836,
                'bank_type': 'NGO',
                'max_storage': 1500,
                'contact': '+1-718-555-0202'
            },
            {
                'name': 'Queens Regional Blood Services',
                'address': '600 Queens Plaza, Queens, NY 11377',
                'city': 'Queens',
                'state': 'NY',
                'zip': '11377',
                'lat': 40.7492,
                'lon': -73.8866,
                'bank_type': 'GOVT',
                'max_storage': 1800,
                'contact': '+1-718-555-0203'
            }
        ]
    }
    
    # Blood type distribution percentages (for realistic inventory)
    BLOOD_TYPE_DISTRIBUTION = {
        'O+': 38,
        'O-': 7,
        'A+': 34,
        'A-': 6,
        'B+': 9,
        'B-': 2,
        'AB+': 3,
        'AB-': 1
    }
    
    def __init__(self):
        self.admin_user = None
        self.hospital_users = []
        self.hospitals = []
        self.blood_bank_users = []
        self.blood_banks = []
        self.inventory_items = []
    
    def clear_existing_data(self):
        """Clear existing dummy data"""
        logger.info("Clearing existing data...")
        
        # Delete in reverse order of dependencies
        AllocationDetail.objects.all().delete()
        EmergencyAllocation.objects.all().delete()
        DemandHistory.objects.all().delete()
        Inventory.objects.all().delete()
        Hospital.objects.all().delete()
        BloodBank.objects.all().delete()
        
        # Delete users with specific emails (dummy data)
        dummy_emails = [
            'admin@bloodchain.com',
            'hospital1@example.com',
            'hospital2@example.com',
            'hospital3@example.com',
            'bloodbank1@example.com',
            'bloodbank2@example.com',
            'bloodbank3@example.com'
        ]
        User.objects.filter(email__in=dummy_emails).delete()
        
        logger.info("Existing data cleared successfully")
    
    def create_admin_user(self):
        """Create admin user"""
        logger.info("Creating admin user...")
        
        admin_data = {
            'email': 'admin@bloodchain.com',
            'name': 'System Administrator',
            'phone': '+1-212-555-0000',
            'role': User.Role.ADMIN,
            'password': 'Admin@123',  # Will be hashed
            'is_staff': True,
            'is_superuser': True
        }
        
        self.admin_user = User.objects.create_user(
            email=admin_data['email'],
            password=admin_data['password'],
            name=admin_data['name'],
            phone=admin_data['phone'],
            role=admin_data['role'],
            is_staff=admin_data['is_staff'],
            is_superuser=admin_data['is_superuser']
        )
        
        logger.info(f"Admin user created: {self.admin_user.email}")
        return self.admin_user
    
    def create_hospital_users_and_profiles(self):
        """Create hospital users and their profiles"""
        logger.info("Creating hospital users and profiles...")
        
        for i, location in enumerate(self.LOCATIONS['hospitals'], 1):
            # Create user
            user_data = {
                'email': f'hospital{i}@example.com',
                'name': f"{location['name']} Admin",
                'phone': location['emergency_contact'],
                'role': User.Role.HOSPITAL,
                'password': 'Hospital@123'
            }
            
            user = User.objects.create_user(
                email=user_data['email'],
                password=user_data['password'],
                name=user_data['name'],
                phone=user_data['phone'],
                role=user_data['role']
            )
            self.hospital_users.append(user)
            
            # Create hospital profile
            hospital = Hospital.objects.create(
                user=user,
                name=location['name'],
                license_number=f"HOSP-2024-{1000 + i}",
                emergency_contact=location['emergency_contact'],
                bed_capacity=location['bed_capacity'],
                address=location['address'],
                city=location['city'],
                state=location['state'],
                zip_code=location['zip'],
                latitude=location['lat'],
                longitude=location['lon'],
                opening_time="08:00:00",
                closing_time="20:00:00",
                has_emergency_ward=True,
                is_active=True
            )
            self.hospitals.append(hospital)
            
            logger.info(f"Hospital created: {hospital.name}")
    
    def create_blood_bank_users_and_profiles(self):
        """Create blood bank users and their profiles"""
        logger.info("Creating blood bank users and profiles...")
        
        for i, location in enumerate(self.LOCATIONS['blood_banks'], 1):
            # Create user
            user_data = {
                'email': f'bloodbank{i}@example.com',
                'name': f"{location['name']} Manager",
                'phone': location['contact'],
                'role': User.Role.BLOOD_BANK,
                'password': 'Bloodbank@123'
            }
            
            user = User.objects.create_user(
                email=user_data['email'],
                password=user_data['password'],
                name=user_data['name'],
                phone=user_data['phone'],
                role=user_data['role']
            )
            self.blood_bank_users.append(user)
            
            # Create blood bank profile
            blood_bank = BloodBank.objects.create(
                user=user,
                name=location['name'],
                license_number=f"BB-2024-{2000 + i}",
                bank_type=location['bank_type'],
                contact_number=location['contact'],
                emergency_contact=location['contact'],
                max_storage_capacity=location['max_storage'],
                address=location['address'],
                city=location['city'],
                state=location['state'],
                zip_code=location['zip'],
                latitude=location['lat'],
                longitude=location['lon'],
                certification_date=timezone.now().date() - timedelta(days=180),
                certification_expiry=timezone.now().date() + timedelta(days=545),
                is_active=True
            )
            self.blood_banks.append(blood_bank)
            
            logger.info(f"Blood Bank created: {blood_bank.name}")
    
    def create_inventory(self):
        """Create realistic inventory for blood banks"""
        logger.info("Creating inventory items...")
        
        # Batch numbers
        batch_counter = 1
        
        for blood_bank in self.blood_banks:
            # Create 3-5 batches per blood type
            for blood_type, percentage in self.BLOOD_TYPE_DISTRIBUTION.items():
                # Number of batches for this blood type (1-3)
                num_batches = random.randint(1, 3)
                
                for batch in range(num_batches):
                    # Units based on percentage of max storage
                    max_units = int(blood_bank.max_storage_capacity * (percentage / 100) / num_batches)
                    units = random.randint(max(5, max_units // 2), max_units)
                    
                    # Expiry date: 20-45 days from now
                    expiry_days = random.randint(20, 45)
                    expiry_date = timezone.now().date() + timedelta(days=expiry_days)
                    
                    # Donation date: 1-30 days ago
                    donation_days = random.randint(1, 30)
                    donation_date = timezone.now().date() - timedelta(days=donation_days)
                    
                    # Create inventory item
                    inventory = Inventory.objects.create(
                        blood_bank=blood_bank,
                        blood_type=blood_type,
                        units_available=units,
                        expiry_date=expiry_date,
                        batch_number=f"BATCH-{blood_bank.id}-{batch_counter:04d}",
                        donation_date=donation_date,
                        cost_per_unit=random.uniform(150, 250),  # $150-$250 per unit
                        is_quarantined=False,
                        quality_check_passed=True,
                        notes=f"Regular blood donation batch"
                    )
                    
                    self.inventory_items.append(inventory)
                    batch_counter += 1
            
            # Add some expiring soon items (3-7 days)
            for blood_type in ['O+', 'A+', 'B+']:
                inventory = Inventory.objects.create(
                    blood_bank=blood_bank,
                    blood_type=blood_type,
                    units_available=random.randint(5, 15),
                    expiry_date=timezone.now().date() + timedelta(days=random.randint(3, 7)),
                    batch_number=f"BATCH-EXP-{blood_bank.id}-{batch_counter:04d}",
                    donation_date=timezone.now().date() - timedelta(days=random.randint(30, 35)),
                    cost_per_unit=random.uniform(150, 250),
                    is_quarantined=False,
                    quality_check_passed=True,
                    notes="Expiring soon - prioritize usage"
                )
                self.inventory_items.append(inventory)
                batch_counter += 1
            
            logger.info(f"Created {batch_counter-1} inventory items for {blood_bank.name}")
    
    def create_demand_history(self):
        """Create sample demand history for hospitals"""
        logger.info("Creating demand history...")
        
        blood_types = [bt[0] for bt in BloodType.choices]
        
        for hospital in self.hospitals:
            # Create demand for last 90 days
            for days_ago in range(90, 0, -5):  # Every 5 days
                request_date = timezone.now() - timedelta(days=days_ago)
                
                # Random number of requests per day (1-3)
                for _ in range(random.randint(1, 3)):
                    blood_type = random.choice(blood_types)
                    
                    # Units requested based on blood type prevalence
                    if blood_type in ['O+', 'A+']:
                        units = random.randint(5, 20)
                    elif blood_type in ['B+', 'O-']:
                        units = random.randint(3, 15)
                    else:
                        units = random.randint(1, 10)
                    
                    # Determine status based on date
                    if days_ago < 7:  # Recent requests
                        status = random.choice([
                            RequestStatus.PENDING,
                            RequestStatus.PARTIALLY_FILLED,
                            RequestStatus.COMPLETED
                        ])
                    elif days_ago < 30:  # Medium age
                        status = random.choice([
                            RequestStatus.COMPLETED,
                            RequestStatus.CANCELLED
                        ])
                    else:  # Old requests
                        status = RequestStatus.COMPLETED
                    
                    # Units fulfilled
                    if status == RequestStatus.COMPLETED:
                        fulfilled = units
                    elif status == RequestStatus.PARTIALLY_FILLED:
                        fulfilled = random.randint(1, units - 1)
                    else:
                        fulfilled = 0
                    
                    # Required by date (1-3 days after request)
                    required_by = request_date.date() + timedelta(days=random.randint(1, 3))
                    
                    DemandHistory.objects.create(
                        hospital=hospital,
                        blood_type=blood_type,
                        units_requested=units,
                        units_fulfilled=fulfilled,
                        request_date=request_date,
                        required_by_date=required_by,
                        status=status,
                        priority=random.randint(1, 5),
                        purpose=random.choice([
                            "Emergency surgery",
                            "Regular transfusion",
                            "Accident victim",
                            "Scheduled procedure",
                            "ICU patient"
                        ])
                    )
            
            logger.info(f"Created demand history for {hospital.name}")
    
    def create_emergency_allocations(self):
        """Create sample emergency allocations"""
        logger.info("Creating emergency allocations...")
        
        for hospital in self.hospitals:
            # Create 3-5 emergency requests
            for _ in range(random.randint(3, 5)):
                blood_type = random.choice([bt[0] for bt in BloodType.choices])
                units_required = random.randint(2, 10)
                
                # Find a blood bank with this blood type
                available_inventory = Inventory.objects.filter(
                    blood_type=blood_type,
                    units_available__gte=units_required,
                    expiry_date__gt=timezone.now().date()
                ).first()
                
                if available_inventory:
                    blood_bank = available_inventory.blood_bank
                    
                    # Only allocate what's actually available
                    units_to_allocate = min(units_required, available_inventory.units_available)
                    
                    # Calculate distance (simplified)
                    from math import radians, sin, cos, sqrt, atan2
                    lat1, lon1 = float(hospital.latitude), float(hospital.longitude)
                    lat2, lon2 = float(blood_bank.latitude), float(blood_bank.longitude)
                    
                    R = 6371  # Earth's radius in km
                    dlat = radians(lat2 - lat1)
                    dlon = radians(lon2 - lon1)
                    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
                    c = 2 * atan2(sqrt(a), sqrt(1-a))
                    distance = R * c
                    
                    # Create allocation
                    allocation = EmergencyAllocation.objects.create(
                        hospital=hospital,
                        blood_bank=blood_bank,
                        blood_type=blood_type,
                        units_required=units_required,
                        units_allocated=units_to_allocate,
                        hospital_lat=hospital.latitude,
                        hospital_lon=hospital.longitude,
                        blood_bank_lat=blood_bank.latitude,
                        blood_bank_lon=blood_bank.longitude,
                        distance_km=round(distance, 2),
                        estimated_time_minutes=int(distance * 1.5),  # Rough estimate
                        status=AllocationStatus.ALLOCATED,
                        request_time=timezone.now() - timedelta(hours=random.randint(1, 48)),
                        response_time=timezone.now() - timedelta(hours=random.randint(1, 47)),
                        completed_time=timezone.now() - timedelta(hours=random.randint(1, 46))
                    )
                    
                    # Create allocation detail
                    AllocationDetail.objects.create(
                        emergency_allocation=allocation,
                        inventory=available_inventory,
                        units_allocated=units_to_allocate
                    )
                    
                    # Update inventory - ensure it doesn't go below 0
                    available_inventory.units_available = max(0, available_inventory.units_available - units_to_allocate)
                    available_inventory.save()
                    
                    logger.info(f"Created emergency allocation: {hospital.name} -> {blood_bank.name}")
    
    def print_summary(self):
        """Print summary of created data"""
        logger.info("\n" + "="*50)
        logger.info("DATA LOADING SUMMARY")
        logger.info("="*50)
        
        logger.info(f"Admin User: {self.admin_user.email}")
        logger.info(f"Hospital Users: {len(self.hospital_users)}")
        logger.info(f"Hospitals: {len(self.hospitals)}")
        logger.info(f"Blood Bank Users: {len(self.blood_bank_users)}")
        logger.info(f"Blood Banks: {len(self.blood_banks)}")
        logger.info(f"Inventory Items: {len(self.inventory_items)}")
        logger.info(f"Demand History: {DemandHistory.objects.count()}")
        logger.info(f"Emergency Allocations: {EmergencyAllocation.objects.count()}")
        
        logger.info("\n" + "="*50)
        logger.info("LOGIN CREDENTIALS")
        logger.info("="*50)
        logger.info("Admin:")
        logger.info(f"  Email: admin@bloodchain.com")
        logger.info(f"  Password: Admin@123")
        logger.info("\nHospitals:")
        for i, user in enumerate(self.hospital_users, 1):
            logger.info(f"  Hospital {i}: {user.email} / Hospital@123")
        logger.info("\nBlood Banks:")
        for i, user in enumerate(self.blood_bank_users, 1):
            logger.info(f"  Blood Bank {i}: {user.email} / Bloodbank@123")
    
    def run(self):
        """Execute data loading"""
        logger.info("Starting dummy data loading...")
        
        self.clear_existing_data()
        self.create_admin_user()
        self.create_hospital_users_and_profiles()
        self.create_blood_bank_users_and_profiles()
        self.create_inventory()
        self.create_demand_history()
        self.create_emergency_allocations()
        
        self.print_summary()
        logger.info("\nDummy data loading completed successfully!")

if __name__ == "__main__":
    loader = DummyDataLoader()
    loader.run()