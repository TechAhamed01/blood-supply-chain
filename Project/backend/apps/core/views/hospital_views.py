# apps/core/views/hospital_views.py (Updated)

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.views.base import BaseViewSet
from apps.core.mixins import ToggleActiveMixin, BulkDeleteMixin
from apps.core.utils.response import APIResponse
from apps.core.models.hospital import Hospital
from apps.core.serializers.hospital import HospitalSerializer
from apps.core.services.allocation_service import AllocationService
import logging

logger = logging.getLogger('api')

class HospitalViewSet(BaseViewSet, ToggleActiveMixin, BulkDeleteMixin):
    """
    ViewSet for Hospital operations with standardized responses
    """
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    filter_backends = [DjangoFilterBackend]
    permission_classes = [IsAuthenticated]
    
    # ... (previous code remains the same, but responses updated to use APIResponse)
    
    @action(detail=False, methods=['get'], url_path='my-hospital')
    def my_hospital(self, request):
        """
        Get the hospital profile of the logged-in hospital user
        """
        try:
            hospital = Hospital.objects.get(user=request.user)
            serializer = self.get_serializer(hospital)
            return APIResponse.success(
                data=serializer.data,
                message="Hospital profile retrieved successfully"
            )
        except Hospital.DoesNotExist:
            return APIResponse.not_found(
                message="Hospital profile not found"
            )
    
    @action(detail=True, methods=['post'], url_path='request-blood')
    def request_blood(self, request, pk=None):
        """
        Request blood for emergency
        """
        hospital = self.get_object()
        
        # Validate hospital user
        if request.user.role == 'HOSPITAL' and hospital.user != request.user:
            return APIResponse.forbidden(
                message="You can only request blood for your own hospital"
            )
        
        # Validate request data
        blood_type = request.data.get('blood_type')
        units_required = request.data.get('units_required')
        required_by_date = request.data.get('required_by_date')
        priority = request.data.get('priority', 3)
        purpose = request.data.get('purpose', '')
        
        if not all([blood_type, units_required, required_by_date]):
            return APIResponse.bad_request(
                message="Missing required fields",
                errors={
                    'required': ['blood_type', 'units_required', 'required_by_date']
                }
            )
        
        try:
            result = AllocationService.allocate_emergency_request(
                hospital_id=hospital.id,
                blood_type=blood_type,
                units_required=int(units_required),
                required_by_date=required_by_date,
                priority=priority,
                purpose=purpose
            )
            
            if result['success']:
                logger.info(f"Blood request processed: Hospital {hospital.id}, {blood_type}, {units_required} units")
                return APIResponse.success(
                    data=result,
                    message=result['message'],
                    code=status.HTTP_200_OK
                )
            else:
                return APIResponse.bad_request(
                    message=result['error'],
                    errors={'allocation_id': result.get('allocation_id')}
                )
                
        except Exception as e:
            logger.error(f"Error processing blood request: {str(e)}")
            return APIResponse.server_error(
                message="Failed to process blood request"
            )