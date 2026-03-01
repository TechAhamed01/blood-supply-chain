# apps/core/utils/exceptions.py

import logging
import traceback
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
    PermissionDenied,
    ObjectDoesNotExist
)
from django.db import IntegrityError
from django.http import Http404
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied as DRFPermissionDenied,
    NotFound,
    MethodNotAllowed,
    Throttled,
    ValidationError as DRFValidationError
)
from rest_framework import status
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .response import APIResponse

logger = logging.getLogger('api')

def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF
    """
    # Get the standard DRF response first
    response = exception_handler(exc, context)
    
    # Get request details for logging
    request = context.get('request')
    user = str(request.user) if request and request.user.is_authenticated else 'Anonymous'
    path = request.path if request else 'Unknown'
    method = request.method if request else 'Unknown'
    
    # Log the exception
    logger.error(
        f"Exception occurred: {exc.__class__.__name__}: {str(exc)}",
        exc_info=True,
        extra={
            'user': user,
            'path': path,
            'method': method
        }
    )
    
    # Handle custom exceptions
    if isinstance(exc, DjangoValidationError):
        return handle_django_validation_error(exc)
    
    if isinstance(exc, IntegrityError):
        return handle_integrity_error(exc)
    
    if isinstance(exc, ObjectDoesNotExist):
        return handle_object_not_found(exc)
    
    if isinstance(exc, Http404):
        return APIResponse.not_found(
            message="Resource not found",
            meta={'detail': str(exc)}
        )
    
    if isinstance(exc, AuthenticationFailed):
        return APIResponse.unauthorized(
            message="Authentication failed",
            errors={'detail': str(exc)}
        )
    
    if isinstance(exc, NotAuthenticated):
        return APIResponse.unauthorized(
            message="Authentication credentials were not provided",
            errors={'detail': str(exc)}
        )
    
    if isinstance(exc, DRFPermissionDenied):
        return APIResponse.forbidden(
            message="Permission denied",
            errors={'detail': str(exc)}
        )
    
    if isinstance(exc, PermissionDenied):
        return APIResponse.forbidden(
            message="Permission denied",
            errors={'detail': str(exc)}
        )
    
    if isinstance(exc, NotFound):
        return APIResponse.not_found(
            message="Resource not found",
            errors={'detail': str(exc)}
        )
    
    if isinstance(exc, MethodNotAllowed):
        return APIResponse.error(
            message="Method not allowed",
            code=status.HTTP_405_METHOD_NOT_ALLOWED,
            errors={'detail': str(exc)}
        )
    
    if isinstance(exc, Throttled):
        return handle_throttled_exception(exc)
    
    if isinstance(exc, DRFValidationError):
        return handle_drf_validation_error(exc)
    
    if isinstance(exc, InvalidToken):
        return APIResponse.unauthorized(
            message="Invalid token",
            errors={'token': 'The provided token is invalid'}
        )
    
    if isinstance(exc, TokenError):
        return APIResponse.unauthorized(
            message="Token error",
            errors={'token': str(exc)}
        )
    
    if isinstance(exc, APIException):
        return handle_api_exception(exc)
    
    # Handle unhandled exceptions
    return handle_unhandled_exception(exc, context)


def handle_django_validation_error(exc):
    """Handle Django validation errors"""
    if hasattr(exc, 'message_dict'):
        errors = exc.message_dict
    elif hasattr(exc, 'messages'):
        errors = {'non_field_errors': exc.messages}
    else:
        errors = {'non_field_errors': [str(exc)]}
    
    return APIResponse.validation_error(
        message="Validation error",
        errors=errors
    )


def handle_integrity_error(exc):
    """Handle database integrity errors"""
    error_msg = str(exc)
    
    # Check for unique constraint violations
    if 'unique constraint' in error_msg.lower() or 'duplicate key' in error_msg.lower():
        return APIResponse.conflict(
            message="Duplicate entry",
            errors={'detail': 'A record with this information already exists'}
        )
    
    # Check for foreign key violations
    if 'foreign key' in error_msg.lower():
        return APIResponse.bad_request(
            message="Referenced record does not exist",
            errors={'detail': 'The referenced record could not be found'}
        )
    
    return APIResponse.bad_request(
        message="Database integrity error",
        errors={'detail': error_msg}
    )


def handle_object_not_found(exc):
    """Handle object not found errors"""
    model_name = str(exc).split(' matching query')[0]
    return APIResponse.not_found(
        message=f"{model_name} not found",
        errors={'detail': str(exc)}
    )


def handle_throttled_exception(exc):
    """Handle rate limiting exceptions"""
    return APIResponse.error(
        message="Rate limit exceeded",
        code=status.HTTP_429_TOO_MANY_REQUESTS,
        errors={'detail': str(exc)},
        meta={
            'available_in': f"{exc.wait} seconds" if hasattr(exc, 'wait') else 'Unknown'
        }
    )


def handle_drf_validation_error(exc):
    """Handle DRF validation errors"""
    errors = {}
    
    # Format validation errors
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, list):
            errors['non_field_errors'] = exc.detail
        elif isinstance(exc.detail, dict):
            for field, field_errors in exc.detail.items():
                if isinstance(field_errors, list):
                    errors[field] = [str(e) for e in field_errors]
                else:
                    errors[field] = [str(field_errors)]
        else:
            errors['non_field_errors'] = [str(exc.detail)]
    
    return APIResponse.validation_error(
        message="Validation failed",
        errors=errors
    )


def handle_api_exception(exc):
    """Handle DRF API exceptions"""
    return APIResponse.error(
        message=exc.detail if hasattr(exc, 'detail') else str(exc),
        code=exc.status_code if hasattr(exc, 'status_code') else status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def handle_unhandled_exception(exc, context):
    """Handle unhandled exceptions"""
    request = context.get('request')
    
    # Log full traceback for debugging
    logger.error(
        f"Unhandled exception: {exc.__class__.__name__}: {str(exc)}\n"
        f"Traceback: {traceback.format_exc()}\n"
        f"Request: {request.method} {request.path}\n"
        f"User: {request.user}"
    )
    
    # In production, don't expose internal error details
    if not settings.DEBUG:
        return APIResponse.server_error(
            message="An unexpected error occurred. Our team has been notified."
        )
    
    # In development, show error details
    return APIResponse.server_error(
        message=str(exc),
        errors={
            'type': exc.__class__.__name__,
            'traceback': traceback.format_exc().split('\n')
        }
    )