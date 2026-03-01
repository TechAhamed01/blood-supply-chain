

# Create your models here.
# apps/authentication/models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.core.validators import MinLengthValidator
import re

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', self.model.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        HOSPITAL = 'HOSPITAL', 'Hospital'
        BLOOD_BANK = 'BLOOD_BANK', 'Blood Bank'
        ADMIN = 'ADMIN', 'Admin'
    
    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, validators=[MinLengthValidator(10)])
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email', 'role']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"
    
    def clean(self):
        super().clean()
        if self.phone:
            # Remove non-numeric characters
            phone = re.sub(r'\D', '', self.phone)
            if len(phone) < 10:
                raise ValidationError('Phone number must have at least 10 digits')