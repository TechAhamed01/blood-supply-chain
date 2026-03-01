# apps/core/models/demand_history.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from .base import TimeStampedModel
from .hospital import Hospital
from .inventory import BloodType

class RequestStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    PARTIALLY_FILLED = 'PARTIALLY_FILLED', 'Partially Filled'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    REJECTED = 'REJECTED', 'Rejected'

class DemandHistory(TimeStampedModel):
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='demand_history'
    )
    blood_type = models.CharField(max_length=3, choices=BloodType.choices)
    units_requested = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    units_fulfilled = models.PositiveIntegerField(default=0)
    request_date = models.DateTimeField(default=timezone.now, db_index=True)
    required_by_date = models.DateField()
    status = models.CharField(
        max_length=20, 
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING,
        db_index=True
    )
    priority = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1=Low, 5=Critical"
    )
    purpose = models.TextField(blank=True)
    
    # Allocation tracking
    allocated_from = models.ForeignKey(
        'EmergencyAllocation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_requests'
    )
    
    class Meta:
        db_table = 'demand_history'
        indexes = [
            models.Index(fields=['hospital', 'request_date']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['required_by_date']),
        ]
        verbose_name_plural = 'Demand History'
    
    def __str__(self):
        return f"{self.hospital.name} - {self.blood_type}: {self.units_requested} units"
    
    def is_fulfilled(self):
        return self.units_fulfilled >= self.units_requested
    
    def get_remaining_units(self):
        return max(0, self.units_requested - self.units_fulfilled)