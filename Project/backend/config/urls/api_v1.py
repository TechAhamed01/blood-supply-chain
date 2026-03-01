# config/urls/api_v1.py

from django.conf import settings
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.authentication.urls import urlpatterns as auth_urls
from apps.core.views.hospital_views import HospitalViewSet
from apps.core.views.blood_bank_views import BloodBankViewSet
from apps.core.views.inventory_views import InventoryViewSet
from apps.core.views.demand_views import DemandHistoryViewSet
# from apps.core.views.emergency_views import EmergencyAllocationViewSet
# from apps.ai_engine.views import DemandPredictionViewSet
# from apps.analytics.views import AnalyticsViewSet

# Create router
router = DefaultRouter()

# Register viewsets
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'bloodbanks', BloodBankViewSet, basename='bloodbank')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'requests', DemandHistoryViewSet, basename='request')
# router.register(r'emergency-allocations', EmergencyAllocationViewSet, basename='emergency')
# router.register(r'predictions', DemandPredictionViewSet, basename='prediction')
# router.register(r'analytics', AnalyticsViewSet, basename='analytics')

# Combine all URLs
urlpatterns = [
    # Authentication endpoints
    path('auth/', include(auth_urls)),
    
    # Router URLs
    path('', include(router.urls)),
    
    # Health check
    path('health/', include('apps.core.urls')),
]

# API documentation (if using drf-yasg or similar)
# if settings.DEBUG:
#     from rest_framework.documentation import include_docs_urls
#     urlpatterns += [
#         path('docs/', include_docs_urls(title='Blood Supply Chain API')),
#     ]