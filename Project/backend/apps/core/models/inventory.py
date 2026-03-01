# apps/core/models/inventory.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from .base import TimeStampedModel
from .blood_bank import BloodBank

class BloodType(models.TextChoices):
    A_POSITIVE = 'A+', 'A Positive'
    A_NEGATIVE = 'A-', 'A Negative'
    B_POSITIVE = 'B+', 'B Positive'
    B_NEGATIVE = 'B-', 'B Negative'
    AB_POSITIVE = 'AB+', 'AB Positive'
    AB_NEGATIVE = 'AB-', 'AB Negative'
    O_POSITIVE = 'O+', 'O Positive'
    O_NEGATIVE = 'O-', 'O Negative'

class Inventory(TimeStampedModel):
    blood_bank = models.ForeignKey(
        BloodBank,
        on_delete=models.CASCADE,
        related_name='inventory_items'
    )
    blood_type = models.CharField(max_length=3, choices=BloodType.choices, db_index=True)
    units_available = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        default=0
    )
    expiry_date = models.DateField(db_index=True)
    batch_number = models.CharField(max_length=100, unique=True)
    donation_date = models.DateField()
    received_date = models.DateField(auto_now_add=True)
    cost_per_unit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Quality metrics
    is_quarantined = models.BooleanField(default=False)
    quality_check_passed = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'inventory'
        indexes = [
            models.Index(fields=['blood_bank', 'blood_type']),
            models.Index(fields=['expiry_date', 'units_available']),
            models.Index(fields=['batch_number']),
        ]
        unique_together = ['blood_bank', 'batch_number']
        verbose_name_plural = 'Inventory'
    
    def __str__(self):
        return f"{self.blood_bank.name} - {self.blood_type}: {self.units_available} units"
    
    def is_expired(self):
        return self.expiry_date < timezone.now().date()
    
    def is_expiring_soon(self, days=3):
        expiry_threshold = timezone.now().date() + timezone.timedelta(days=days)
        return self.expiry_date <= expiry_threshold and not self.is_expired()
    
    def is_available(self):
        return (self.units_available > 0 and 
                not self.is_expired() and 
                not self.is_quarantined and 
                self.quality_check_passed)
    
    def reduce_units(self, units):
        if units > self.units_available:
            raise ValueError(f"Cannot reduce {units} units. Only {self.units_available} available")
        self.units_available -= units
        self.save()