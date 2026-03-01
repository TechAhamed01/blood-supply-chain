# apps/core/permissions.py

from rest_framework import permissions
from apps.authentication.models import User

class IsHospitalUser(permissions.BasePermission):
    """
    Permission check for Hospital users only
    """
    message = "Only hospital users can access this resource"
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.role == User.Role.HOSPITAL)

class IsBloodBankUser(permissions.BasePermission):
    """
    Permission check for Blood Bank users only
    """
    message = "Only blood bank users can access this resource"
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.role == User.Role.BLOOD_BANK)

class IsAdminUser(permissions.BasePermission):
    """
    Permission check for Admin users only
    """
    message = "Only admin users can access this resource"
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.role == User.Role.ADMIN)

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to allow owners or admins to edit
    """
    message = "You don't have permission to access this resource"
    
    def has_object_permission(self, request, view, obj):
        # Admin can access anything
        if request.user.role == User.Role.ADMIN:
            return True
        
        # Check if user is the owner (has user field or is the user)
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'hospital') and hasattr(obj.hospital, 'user'):
            return obj.hospital.user == request.user
        elif hasattr(obj, 'blood_bank') and hasattr(obj.blood_bank, 'user'):
            return obj.blood_bank.user == request.user
        
        return obj == request.user

class IsHospitalOwner(permissions.BasePermission):
    """
    Check if user owns the hospital profile
    """
    message = "You don't have permission to access this hospital"
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True
        return hasattr(obj, 'user') and obj.user == request.user

class IsBloodBankOwner(permissions.BasePermission):
    """
    Check if user owns the blood bank profile
    """
    message = "You don't have permission to access this blood bank"
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == User.Role.ADMIN:
            return True
        return hasattr(obj, 'user') and obj.user == request.user

class ReadOnly(permissions.BasePermission):
    """
    Read-only permission for unauthenticated users
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to allow owners to edit, others read-only
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin can edit anything
        if request.user.role == User.Role.ADMIN:
            return True
        
        # Check ownership
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'hospital') and hasattr(obj.hospital, 'user'):
            return obj.hospital.user == request.user
        elif hasattr(obj, 'blood_bank') and hasattr(obj.blood_bank, 'user'):
            return obj.blood_bank.user == request.user
        
        return False