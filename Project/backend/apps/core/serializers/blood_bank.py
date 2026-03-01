# apps/core/serializers/blood_bank.py
from rest_framework import serializers
from apps.core.models.blood_bank import BloodBank
from apps.authentication.serializers import UserSerializer

class BloodBankSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    current_stock = serializers.SerializerMethodField()
    expiring_soon = serializers.SerializerMethodField()
    
    class Meta:
        model = BloodBank
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_stock(self, obj):
        return obj.get_current_stock_count()
    
    def get_expiring_soon(self, obj):
        return obj.get_expiring_soon_count()
    
    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value