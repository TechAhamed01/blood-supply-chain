# apps/core/views/demand_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import logging

from apps.core.models.demand_history import DemandHistory
from apps.core.serializers.demand_history import DemandHistorySerializer
from apps.core.utils.response import APIResponse
from apps.core.pagination import StandardResultsSetPagination

logger = logging.getLogger('api')

class DemandHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Blood Demand History (Requests)
    Handles blood request tracking and history
    """
    queryset = DemandHistory.objects.all()
    serializer_class = DemandHistorySerializer
    filter_backends = [DjangoFilterBackend]
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def list(self, request, *args, **kwargs):
        """
        List all blood requests with pagination
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Blood requests retrieved successfully"
        )
    
    def create(self, request, *args, **kwargs):
        """
        Create a new blood request
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return APIResponse.created(
                data=serializer.data,
                message="Blood request created successfully"
            )
        return APIResponse.bad_request(
            errors=serializer.errors,
            message="Failed to create blood request"
        )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific blood request
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Blood request retrieved successfully"
        )
    
    def update(self, request, *args, **kwargs):
        """
        Update blood request
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            return APIResponse.success(
                data=serializer.data,
                message="Blood request updated successfully"
            )
        return APIResponse.bad_request(
            errors=serializer.errors,
            message="Failed to update blood request"
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete blood request
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return APIResponse.no_content(
            message="Blood request deleted successfully"
        )
    
    @action(detail=False, methods=['get'])
    def by_hospital(self, request):
        """
        Get all blood requests from a specific hospital
        """
        hospital_id = request.query_params.get('hospital_id')
        if not hospital_id:
            return APIResponse.bad_request(
                message="hospital_id parameter is required"
            )
        
        queryset = self.get_queryset().filter(hospital_id=hospital_id)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Hospital blood requests retrieved successfully"
        )
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """
        Get blood requests filtered by status
        """
        request_status = request.query_params.get('status')
        if not request_status:
            return APIResponse.bad_request(
                message="status parameter is required"
            )
        
        queryset = self.get_queryset().filter(status=request_status)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message=f"Blood requests with status '{request_status}' retrieved successfully"
        )
    
    @action(detail=True, methods=['post'])
    def mark_fulfilled(self, request, pk=None):
        """
        Mark a blood request as fulfilled
        """
        instance = self.get_object()
        instance.status = 'COMPLETED'
        instance.save()
        
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Blood request marked as completed"
        )
    
    @action(detail=True, methods=['post'])
    def mark_pending(self, request, pk=None):
        """
        Mark a blood request as pending
        """
        instance = self.get_object()
        instance.status = 'PENDING'
        instance.save()
        
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Blood request marked as pending"
        )
