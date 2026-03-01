# apps/core/serializers/emergency_allocation.py
from rest_framework import serializers
from django.utils import timezone
from apps.core.models.emergency_allocation import EmergencyAllocation, AllocationDetail
from apps.core.models.inventory import BloodType
from .hospital import HospitalSerializer
from .blood_bank import BloodBankSerializer
from .inventory import InventorySerializer

class AllocationDetailSerializer(serializers.ModelSerializer):
    inventory_details = InventorySerializer(source='inventory', read_only=True)
    
    class Meta:
        model = AllocationDetail
        fields = '__all__'
        read_only_fields = ['id', 'allocated_at']

class EmergencyAllocationSerializer(serializers.ModelSerializer):
    hospital_details = HospitalSerializer(source='hospital', read_only=True)
    blood_bank_details = BloodBankSerializer(source='blood_bank', read_only=True)
    allocation_details = AllocationDetailSerializer(many=True, read_only=True)
    remaining_units = serializers.IntegerField(read_only=True)
    is_fulfilled = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = EmergencyAllocation
        fields = '__all__'
        read_only_fields = ['id', 'request_time', 'created_at', 'updated_at']
    
    def validate_units_required(self, value):
        if value <= 0:
            raise serializers.ValidationError("Units required must be positive")
        return value
    
    def validate(self, data):
        # Auto-populate hospital location if not provided
        if 'hospital' in data and not data.get('hospital_lat'):
            hospital = data['hospital']
            data['hospital_lat'] = hospital.latitude
            data['hospital_lon'] = hospital.longitude
        return data

class EmergencyAllocationRequestSerializer(serializers.Serializer):
    hospital_id = serializers.IntegerField()
    blood_type = serializers.ChoiceField(choices=BloodType.choices)
    units_required = serializers.IntegerField(min_value=1)
    required_by_date = serializers.DateField()
    priority = serializers.IntegerField(min_value=1, max_value=5, default=3)
    purpose = serializers.CharField(required=False, allow_blank=True)
    
    def validate_required_by_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Required by date must be in the future")
        return value