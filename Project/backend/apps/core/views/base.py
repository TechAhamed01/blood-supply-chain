# apps/core/views/base.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from apps.core.pagination import StandardResultsSetPagination
from apps.core.utils.exceptions import custom_exception_handler
from apps.core.utils.response import APIResponse
import logging

logger = logging.getLogger('api')


class BaseViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with standardized response handling
    All ViewSets should inherit from this
    """
    pagination_class = StandardResultsSetPagination
    
    def initialize_request(self, request, *args, **kwargs):
        """Initialize request with additional attributes"""
        self.action = kwargs.pop('action', None) or self.action_map.get(request.method.lower())
        return super().initialize_request(request, *args, **kwargs)
    
    def finalize_response(self, request, response, *args, **kwargs):
        """
        Ensure all responses are standardized
        """
        # If response is already an APIResponse, use it as is
        if isinstance(response, Response) and hasattr(response, 'data'):
            if response.data and isinstance(response.data, dict) and 'status' in response.data:
                return super().finalize_response(request, response, *args, **kwargs)
            
            # Convert regular DRF responses to APIResponse format
            if response.status_code >= 400:
                # Error response
                response = APIResponse.error(
                    message=response.data.get('detail', 'Error occurred'),
                    code=response.status_code,
                    errors=response.data
                )
            elif response.status_code == 201:
                # Created response
                response = APIResponse.created(
                    data=response.data,
                    message="Resource created successfully"
                )
            elif response.status_code == 204:
                # No content
                response = APIResponse.no_content()
            elif response.status_code == 202:
                # Accepted
                response = APIResponse.accepted(data=response.data)
            else:
                # Success response
                response = APIResponse.success(
                    data=response.data,
                    message="Request successful",
                    code=response.status_code
                )
        
        return super().finalize_response(request, response, *args, **kwargs)
    
    def handle_exception(self, exc):
        """
        Handle exceptions with custom handler
        """
        response = custom_exception_handler(exc, self.get_exception_handler_context())
        
        if response is not None:
            return response
        
        return super().handle_exception(exc)
    
    def get_success_headers(self, data):
        """
        Add Location header for created resources
        """
        headers = super().get_success_headers(data)
        
        # Add additional headers if needed
        if self.action == 'create' and hasattr(self, 'get_serializer'):
            instance = getattr(self, 'instance', None)
            if instance and hasattr(instance, 'id'):
                headers['X-Resource-ID'] = str(instance.id)
        
        return headers
    
    def list(self, request, *args, **kwargs):
        """
        List resources with pagination
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message=f"{self.get_queryset().model._meta.verbose_name_plural} retrieved successfully"
        )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve single resource
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message=f"{instance._meta.verbose_name} retrieved successfully"
        )
    
    def create(self, request, *args, **kwargs):
        """
        Create resource
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        logger.info(f"Created {serializer.Meta.model.__name__}: {serializer.data.get('id')}")
        
        return APIResponse.created(
            data=serializer.data,
            message=f"{serializer.Meta.model._meta.verbose_name} created successfully"
        )
    
    def update(self, request, *args, **kwargs):
        """
        Update resource
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        logger.info(f"Updated {serializer.Meta.model.__name__}: {instance.id}")
        
        return APIResponse.success(
            data=serializer.data,
            message=f"{serializer.Meta.model._meta.verbose_name} updated successfully"
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete resource
        """
        instance = self.get_object()
        instance_id = instance.id
        self.perform_destroy(instance)
        
        logger.info(f"Deleted {instance._meta.model.__name__}: {instance_id}")
        
        return APIResponse.no_content(
            message=f"{instance._meta.verbose_name} deleted successfully"
        )