# apps/core/models/emergency_allocation.py
from django.db import models
from django.core.validators import MinValueValidator
from .base import TimeStampedModel
from .hospital import Hospital
from .blood_bank import BloodBank
from .inventory import BloodType, Inventory
from .demand_history import DemandHistory, RequestStatus

class AllocationStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PROCESSING = 'PROCESSING', 'Processing'
    ALLOCATED = 'ALLOCATED', 'Allocated'
    PARTIALLY_ALLOCATED = 'PARTIALLY_ALLOCATED', 'Partially Allocated'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class EmergencyAllocation(TimeStampedModel):
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='emergency_requests'
    )
    blood_bank = models.ForeignKey(
        BloodBank,
        on_delete=models.CASCADE,
        related_name='emergency_allocations',
        null=True,
        blank=True
    )
    blood_type = models.CharField(max_length=3, choices=BloodType.choices)
    units_required = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    units_allocated = models.PositiveIntegerField(default=0)
    
    # Location tracking at time of request
    hospital_lat = models.DecimalField(max_digits=9, decimal_places=6)
    hospital_lon = models.DecimalField(max_digits=9, decimal_places=6)
    blood_bank_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    blood_bank_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Allocation details
    distance_km = models.FloatField(null=True, blank=True)
    estimated_time_minutes = models.IntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AllocationStatus.choices,
        default=AllocationStatus.PENDING,
        db_index=True
    )
    
    # Inventory items used
    allocated_inventory = models.ManyToManyField(
        Inventory,
        through='AllocationDetail',
        related_name='emergency_uses'
    )
    
    # Related demand record
    demand_record = models.OneToOneField(
        DemandHistory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='emergency_allocation'
    )
    
    # Metadata
    request_time = models.DateTimeField(auto_now_add=True)
    response_time = models.DateTimeField(null=True, blank=True)
    completed_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'emergency_allocations'
        indexes = [
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['blood_bank', 'status']),
            models.Index(fields=['request_time']),
        ]
        ordering = ['-request_time']
    
    def __str__(self):
        return f"Emergency: {self.hospital.name} - {self.blood_type} ({self.units_required} units)"
    
    def get_remaining_units(self):
        return max(0, self.units_required - self.units_allocated)
    
    def is_fulfilled(self):
        return self.units_allocated >= self.units_required
    
    def update_status(self):
        if self.is_fulfilled():
            self.status = AllocationStatus.ALLOCATED
        elif self.units_allocated > 0:
            self.status = AllocationStatus.PARTIALLY_ALLOCATED
        self.save()

class AllocationDetail(TimeStampedModel):
    emergency_allocation = models.ForeignKey(
        EmergencyAllocation,
        on_delete=models.CASCADE,
        related_name='allocation_details'
    )
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='allocation_details'
    )
    units_allocated = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    allocated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'allocation_details'
        indexes = [
            models.Index(fields=['emergency_allocation', 'inventory']),
        ]
        unique_together = ['emergency_allocation', 'inventory']
    
    def __str__(self):
        return f"Allocation: {self.units_allocated} units from {self.inventory.batch_number}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Reduce inventory when allocation is created
        self.inventory.reduce_units(self.units_allocated)