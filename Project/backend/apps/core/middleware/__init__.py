# apps/core/middleware/__init__.py

import logging
import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

logger = logging.getLogger('api')

class RequestLogMiddleware(MiddlewareMixin):
    """
    Middleware to log all requests and responses
    """
    
    def process_request(self, request):
        request.start_time = time.time()
        
        # Log request
        log_data = {
            'method': request.method,
            'path': request.path,
            'user': str(request.user) if request.user.is_authenticated else 'Anonymous',
            'ip': self.get_client_ip(request),
        }
        
        # Log request body for non-GET requests
        if request.method not in ['GET', 'HEAD'] and request.body:
            try:
                body = json.loads(request.body)
                # Mask sensitive data
                if 'password' in body:
                    body['password'] = '********'
                if 'refresh' in body:
                    body['refresh'] = '********'
                log_data['body'] = body
            except:
                log_data['body'] = 'Unable to parse body'
        
        logger.info(f"Request: {json.dumps(log_data)}")
    
    def process_response(self, request, response):
        # Calculate response time
        if hasattr(request, 'start_time'):
            response_time = time.time() - request.start_time
            
            # Log response
            log_data = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'response_time_ms': round(response_time * 1000, 2)
            }
            
            logger.info(f"Response: {json.dumps(log_data)}")
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class ExceptionLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log unhandled exceptions
    """
    
    def process_exception(self, request, exception):
        logger.error(
            f"Unhandled exception: {str(exception)}",
            exc_info=True,
            extra={
                'request_path': request.path,
                'request_method': request.method,
                'user': str(request.user) if request.user.is_authenticated else 'Anonymous'
            }
        )
        return None

__all__ = ['RequestLogMiddleware', 'ExceptionLoggingMiddleware']
