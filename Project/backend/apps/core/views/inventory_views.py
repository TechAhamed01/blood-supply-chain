# apps/core/views/inventory_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import logging

from apps.core.models.inventory import Inventory
from apps.core.serializers.inventory import InventorySerializer
from apps.core.utils.response import APIResponse
from apps.core.pagination import StandardResultsSetPagination

logger = logging.getLogger('api')

class InventoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Inventory management
    Handles blood inventory tracking across blood banks
    """
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    filter_backends = [DjangoFilterBackend]
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        """
        Assign permissions based on action
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only blood bank staff can modify inventory
            self.permission_classes = [IsAuthenticated]
        
        return super().get_permissions()
    
    def list(self, request, *args, **kwargs):
        """
        List inventory items with filtering
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Inventory items retrieved successfully"
        )
    
    def create(self, request, *args, **kwargs):
        """
        Create new inventory entry
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return APIResponse.created(
                data=serializer.data,
                message="Inventory entry created successfully"
            )
        return APIResponse.bad_request(
            errors=serializer.errors,
            message="Failed to create inventory entry"
        )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve specific inventory item
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Inventory item retrieved successfully"
        )
    
    def update(self, request, *args, **kwargs):
        """
        Update inventory entry
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            return APIResponse.success(
                data=serializer.data,
                message="Inventory entry updated successfully"
            )
        return APIResponse.bad_request(
            errors=serializer.errors,
            message="Failed to update inventory entry"
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete inventory entry
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return APIResponse.no_content(
            message="Inventory entry deleted successfully"
        )
    
    @action(detail=False, methods=['get'])
    def by_blood_bank(self, request):
        """
        Get inventory for a specific blood bank
        """
        blood_bank_id = request.query_params.get('blood_bank_id')
        if not blood_bank_id:
            return APIResponse.bad_request(
                message="blood_bank_id parameter is required"
            )
        
        queryset = self.get_queryset().filter(blood_bank_id=blood_bank_id)
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Blood bank inventory retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """
        Get inventory items expiring soon
        """
        from django.utils import timezone
        from datetime import timedelta
        
        days = int(request.query_params.get('days', 7))
        cutoff_date = timezone.now() + timedelta(days=days)
        
        queryset = self.get_queryset().filter(
            expiry_date__lte=cutoff_date,
            expiry_date__gte=timezone.now()
        )
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message=f"Inventory expiring within {days} days retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get inventory items with low stock
        """
        min_units = int(request.query_params.get('min_units', 10))
        queryset = self.get_queryset().filter(units_available__lte=min_units)
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Low stock inventory items retrieved successfully"
        )
