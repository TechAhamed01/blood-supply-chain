# apps/core/serializers/hospital.py
from rest_framework import serializers
from apps.core.models.hospital import Hospital
from apps.authentication.serializers import UserSerializer

class HospitalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Hospital
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value
    
    def validate_phone(self, value):
        import re
        if not re.match(r'^\+?1?\d{9,15}$', value):
            raise serializers.ValidationError("Invalid phone number format")
        return value