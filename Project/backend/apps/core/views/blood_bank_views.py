# apps/core/views/blood_bank_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q
from django.utils import timezone
import logging

from apps.core.models import BloodBank, Inventory, EmergencyAllocation
from apps.core.serializers import (
    BloodBankSerializer, InventorySerializer, 
    EmergencyAllocationSerializer
)
from apps.core.permissions import IsBloodBankUser, IsBloodBankOwner, IsAdminUser
from apps.core.services.inventory_service import InventoryService
# from apps.core.filters import BloodBankFilter, InventoryFilter

logger = logging.getLogger('api')

class BloodBankViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Blood Bank operations
    """
    queryset = BloodBank.objects.all()
    serializer_class = BloodBankSerializer
    filter_backends = [DjangoFilterBackend]
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Assign permissions based on action
        """
        if self.action in ['create']:
            # Only admin can create blood banks
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only owner or admin can modify
            self.permission_classes = [IsAuthenticated, IsBloodBankOwner]
        elif self.action in ['list', 'retrieve']:
            # Authenticated users can view
            self.permission_classes = [IsAuthenticated]
        elif self.action in ['my_bank', 'add_inventory', 'shortages', 'expiring']:
            # Only blood bank users
            self.permission_classes = [IsAuthenticated, IsBloodBankUser]
        
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Filter queryset based on user role
        """
        queryset = BloodBank.objects.all()
        user = self.request.user
        
        # Admin sees all
        if user.role == 'ADMIN':
            return queryset
        
        # Blood bank users only see their own bank
        if user.role == 'BLOOD_BANK':
            return queryset.filter(user=user)
        
        # Hospitals see all active blood banks
        if user.role == 'HOSPITAL':
            return queryset.filter(is_active=True)
        
        return queryset.none()
    
    @action(detail=False, methods=['get'], url_path='my-bank')
    def my_bank(self, request):
        """
        Get the blood bank profile of the logged-in blood bank user
        """
        try:
            bank = BloodBank.objects.get(user=request.user)
            serializer = self.get_serializer(bank)
            return Response({
                'status': 'success',
                'data': serializer.data
            })
        except BloodBank.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Blood bank profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'], url_path='inventory')
    def inventory(self, request, pk=None):
        """
        Get inventory for a specific blood bank
        """
        blood_bank = self.get_object()
        
        # Check permission
        if not (request.user.role == 'ADMIN' or 
                (request.user.role == 'BLOOD_BANK' and blood_bank.user == request.user) or
                request.user.role == 'HOSPITAL'):
            return Response({
                'status': 'error',
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Apply filters
        inventory = Inventory.objects.filter(blood_bank=blood_bank)
        filtered_inventory = InventoryFilter(request.GET, queryset=inventory)
        
        page = self.paginate_queryset(filtered_inventory.qs)
        if page is not None:
            serializer = InventorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = InventorySerializer(filtered_inventory.qs, many=True)
        return Response({
            'status': 'success',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='add-inventory')
    def add_inventory(self, request, pk=None):
        """
        Add inventory items to blood bank
        """
        blood_bank = self.get_object()
        
        # Only blood bank owner or admin can add inventory
        if request.user.role != 'ADMIN' and blood_bank.user != request.user:
            return Response({
                'status': 'error',
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Support single item or bulk add
        if isinstance(request.data, list):
            serializer = InventorySerializer(data=request.data, many=True)
        else:
            serializer = InventorySerializer(data=request.data)
        
        if serializer.is_valid():
            # Add blood bank to validated data
            if isinstance(serializer.validated_data, list):
                for item in serializer.validated_data:
                    item['blood_bank'] = blood_bank
                serializer.save()
            else:
                serializer.save(blood_bank=blood_bank)
            
            logger.info(f"Inventory added to blood bank {blood_bank.id}")
            
            return Response({
                'status': 'success',
                'message': 'Inventory added successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'error',
            'message': 'Invalid inventory data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], url_path='shortages')
    def check_shortages(self, request, pk=None):
        """
        Check for inventory shortages
        """
        blood_bank = self.get_object()
        
        shortages = InventoryService.check_shortages(blood_bank_id=blood_bank.id)
        
        return Response({
            'status': 'success',
            'data': shortages
        })
    
    @action(detail=True, methods=['get'], url_path='expiring')
    def expiring_soon(self, request, pk=None):
        """
        Get inventory items expiring soon
        """
        blood_bank = self.get_object()
        days = int(request.query_params.get('days', 3))
        
        expiring = Inventory.objects.filter(
            blood_bank=blood_bank,
            expiry_date__lte=timezone.now().date() + timezone.timedelta(days=days),
            expiry_date__gt=timezone.now().date(),
            units_available__gt=0
        ).order_by('expiry_date')
        
        serializer = InventorySerializer(expiring, many=True)
        
        return Response({
            'status': 'success',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['get'], url_path='allocations')
    def allocations(self, request, pk=None):
        """
        Get emergency allocations from this blood bank
        """
        blood_bank = self.get_object()
        
        allocations = EmergencyAllocation.objects.filter(
            blood_bank=blood_bank
        ).order_by('-request_time')
        
        page = self.paginate_queryset(allocations)
        if page is not None:
            serializer = EmergencyAllocationSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = EmergencyAllocationSerializer(allocations, many=True)
        return Response({
            'status': 'success',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='all-shortages')
    def global_shortages(self, request):
        """
        Check shortages across all blood banks (admin only)
        """
        if request.user.role != 'ADMIN':
            return Response({
                'status': 'error',
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        shortages = InventoryService.check_shortages()
        
        return Response({
            'status': 'success',
            'data': shortages
        })
    
    @action(detail=False, methods=['get'], url_path='all-expiring')
    def global_expiring(self, request):
        """
        Get all expiring inventory across all blood banks (admin only)
        """
        if request.user.role != 'ADMIN':
            return Response({
                'status': 'error',
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        days = int(request.query_params.get('days', 3))
        expiring = InventoryService.get_expiring_soon(days=days)
        
        return Response({
            'status': 'success',
            'data': expiring
        })