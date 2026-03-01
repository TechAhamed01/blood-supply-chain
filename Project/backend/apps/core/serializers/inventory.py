# apps/core/serializers/inventory.py
from rest_framework import serializers
from django.utils import timezone
from apps.core.models.inventory import Inventory, BloodType
from .blood_bank import BloodBankSerializer

class InventorySerializer(serializers.ModelSerializer):
    blood_bank_details = BloodBankSerializer(source='blood_bank', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_expiring_soon = serializers.BooleanField(read_only=True)
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Inventory
        fields = '__all__'
        read_only_fields = ['id', 'received_date', 'created_at', 'updated_at']
    
    def get_status(self, obj):
        if obj.is_expired():
            return 'EXPIRED'
        elif obj.is_quarantined:
            return 'QUARANTINED'
        elif not obj.quality_check_passed:
            return 'QUALITY_FAILED'
        elif obj.is_expiring_soon():
            return 'EXPIRING_SOON'
        else:
            return 'AVAILABLE'
    
    def validate_expiry_date(self, value):
        if value <= timezone.now().date():
            raise serializers.ValidationError("Expiry date must be in the future")
        return value
    
    def validate_donation_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Donation date cannot be in the future")
        return value
    
    def validate(self, data):
        if data.get('expiry_date') and data.get('donation_date'):
            if data['expiry_date'] <= data['donation_date']:
                raise serializers.ValidationError(
                    "Expiry date must be after donation date"
                )
        return data