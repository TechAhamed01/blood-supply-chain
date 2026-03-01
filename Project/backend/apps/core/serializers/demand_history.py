# apps/core/serializers/demand_history.py
from rest_framework import serializers
from apps.core.models.demand_history import DemandHistory, RequestStatus
from .hospital import HospitalSerializer

class DemandHistorySerializer(serializers.ModelSerializer):
    hospital_details = HospitalSerializer(source='hospital', read_only=True)
    remaining_units = serializers.IntegerField(read_only=True)
    is_fulfilled = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DemandHistory
        fields = '__all__'
        read_only_fields = ['id', 'request_date', 'created_at', 'updated_at', 
                           'units_fulfilled']
    
    def validate_units_requested(self, value):
        if value <= 0:
            raise serializers.ValidationError("Units requested must be positive")
        return value
    
    def validate_priority(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Priority must be between 1 and 5")
        return value
    
    def validate_required_by_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Required by date must be in the future")
        return value