# apps/core/models/hospital.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .base import TimeStampedModel, BaseLocation
from apps.authentication.models import User

class Hospital(TimeStampedModel, BaseLocation):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='hospital_profile',
        limit_choices_to={'role': User.Role.HOSPITAL}
    )
    name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True)
    emergency_contact = models.CharField(max_length=20)
    bed_capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)
    
    # Operational details
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    has_emergency_ward = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'hospitals'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['city', 'state']),
            models.Index(fields=['is_active']),
        ]
        verbose_name_plural = 'Hospitals'
    
    def __str__(self):
        return f"{self.name} - {self.city}"
    
    def get_active_requests(self):
        return self.emergency_requests.filter(
            status__in=['PENDING', 'PARTIALLY_FILLED']
        ).count()