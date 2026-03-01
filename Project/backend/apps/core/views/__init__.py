# apps/core/views/__init__.py

from django.http import JsonResponse

def health_check(request):
    """
    Health check endpoint
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'Blood Supply Chain API',
        'version': '1.0.0'
    })