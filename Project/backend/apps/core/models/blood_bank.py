# apps/core/models/blood_bank.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .base import TimeStampedModel, BaseLocation
from apps.authentication.models import User

class BloodBank(TimeStampedModel, BaseLocation):
    class BankType(models.TextChoices):
        GOVERNMENT = 'GOVT', 'Government'
        PRIVATE = 'PRIVATE', 'Private'
        NGO = 'NGO', 'Non-Profit'
        RED_CROSS = 'RED_CROSS', 'Red Cross'
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='bloodbank_profile',
        limit_choices_to={'role': User.Role.BLOOD_BANK}
    )
    name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True)
    bank_type = models.CharField(max_length=20, choices=BankType.choices)
    contact_number = models.CharField(max_length=20)
    emergency_contact = models.CharField(max_length=20)
    max_storage_capacity = models.PositiveIntegerField(
        help_text="Maximum units the bank can store",
        validators=[MinValueValidator(1)]
    )
    is_active = models.BooleanField(default=True)
    
    # Certification details
    certification_date = models.DateField(null=True, blank=True)
    certification_expiry = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'blood_banks'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['bank_type']),
            models.Index(fields=['city', 'state']),
        ]
        verbose_name_plural = 'Blood Banks'
    
    def __str__(self):
        return f"{self.name} ({self.get_bank_type_display()})"
    
    def get_current_stock_count(self):
        return self.inventory_items.aggregate(
            total=models.Sum('units_available')
        )['total'] or 0
    
    def get_expiring_soon_count(self, days=3):
        from django.utils import timezone
        expiry_threshold = timezone.now().date() + timezone.timedelta(days=days)
        return self.inventory_items.filter(
            expiry_date__lte=expiry_threshold,
            units_available__gt=0
        ).count()