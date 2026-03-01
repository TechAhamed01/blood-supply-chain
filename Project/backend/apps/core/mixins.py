# apps/core/mixins.py

from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.core.utils.response import APIResponse
import logging

logger = logging.getLogger('api')

class ToggleActiveMixin:
    """
    Mixin to add activate/deactivate actions
    """
    
    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        """
        Activate resource
        """
        instance = self.get_object()
        if hasattr(instance, 'is_active'):
            instance.is_active = True
            instance.save()
            logger.info(f"Activated {instance._meta.model.__name__}: {instance.id}")
            return APIResponse.success(
                data={'is_active': True},
                message=f"{instance._meta.verbose_name} activated successfully"
            )
        return APIResponse.bad_request(message="This resource doesn't support activation")
    
    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        """
        Deactivate resource
        """
        instance = self.get_object()
        if hasattr(instance, 'is_active'):
            instance.is_active = False
            instance.save()
            logger.info(f"Deactivated {instance._meta.model.__name__}: {instance.id}")
            return APIResponse.success(
                data={'is_active': False},
                message=f"{instance._meta.verbose_name} deactivated successfully"
            )
        return APIResponse.bad_request(message="This resource doesn't support deactivation")


class BulkDeleteMixin:
    """
    Mixin to add bulk delete action
    """
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """
        Bulk delete resources by IDs
        """
        ids = request.data.get('ids', [])
        if not ids:
            return APIResponse.bad_request(message="No IDs provided")
        
        queryset = self.get_queryset().filter(id__in=ids)
        count = queryset.count()
        queryset.delete()
        
        logger.info(f"Bulk deleted {count} {self.get_queryset().model._meta.verbose_name_plural}")
        
        return APIResponse.success(
            data={'deleted_count': count},
            message=f"{count} items deleted successfully"
        )


class ExportMixin:
    """
    Mixin to add export functionality
    """
    
    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """
        Export data in CSV or JSON format
        """
        export_format = request.query_params.get('format', 'json')
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        
        if export_format == 'csv':
            # Return CSV response
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="export_{self.get_queryset().model._meta.model_name}.csv"'
            
            writer = csv.DictWriter(response, fieldnames=serializer.data[0].keys())
            writer.writeheader()
            writer.writerows(serializer.data)
            
            return response
        else:
            # Return JSON response
            return APIResponse.success(
                data=serializer.data,
                message=f"Export successful"
            )