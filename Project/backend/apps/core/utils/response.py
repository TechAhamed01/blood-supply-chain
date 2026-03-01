# apps/core/utils/response.py

from rest_framework.response import Response
from rest_framework import status
from typing import Any, Dict, Optional, List, Union
from datetime import datetime

class APIResponse:
    """
    Standardized API response structure
    
    Success Response:
    {
        "status": "success",
        "code": 200,
        "message": "Operation successful",
        "data": {...},
        "meta": {
            "timestamp": "2024-01-01T12:00:00Z",
            "api_version": "v1"
        }
    }
    
    Error Response:
    {
        "status": "error",
        "code": 400,
        "message": "Validation failed",
        "errors": {
            "field": ["error message"]
        },
        "meta": {
            "timestamp": "2024-01-01T12:00:00Z",
            "api_version": "v1"
        }
    }
    
    Paginated Response:
    {
        "status": "success",
        "code": 200,
        "message": "Data retrieved successfully",
        "data": [...],
        "meta": {
            "timestamp": "2024-01-01T12:00:00Z",
            "api_version": "v1",
            "pagination": {
                "page": 1,
                "page_size": 20,
                "total_pages": 5,
                "total_count": 100,
                "has_next": true,
                "has_previous": false
            }
        }
    }
    """
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Operation successful",
        code: int = status.HTTP_200_OK,
        meta: Optional[Dict] = None,
        pagination: Optional[Dict] = None
    ) -> Response:
        """
        Generate success response
        """
        response_data = {
            "status": "success",
            "code": code,
            "message": message,
            "data": data,
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "api_version": "v1",
                **(meta or {})
            }
        }
        
        if pagination:
            response_data["meta"]["pagination"] = pagination
        
        return Response(response_data, status=code)
    
    @staticmethod
    def error(
        message: str = "Operation failed",
        code: int = status.HTTP_400_BAD_REQUEST,
        errors: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """
        Generate error response
        """
        response_data = {
            "status": "error",
            "code": code,
            "message": message,
            "errors": errors or {},
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "api_version": "v1",
                **(meta or {})
            }
        }
        
        return Response(response_data, status=code)
    
    @staticmethod
    def created(
        data: Any = None,
        message: str = "Resource created successfully",
        meta: Optional[Dict] = None
    ) -> Response:
        """201 Created response"""
        return APIResponse.success(
            data=data,
            message=message,
            code=status.HTTP_201_CREATED,
            meta=meta
        )
    
    @staticmethod
    def accepted(
        data: Any = None,
        message: str = "Request accepted for processing",
        meta: Optional[Dict] = None
    ) -> Response:
        """202 Accepted response"""
        return APIResponse.success(
            data=data,
            message=message,
            code=status.HTTP_202_ACCEPTED,
            meta=meta
        )
    
    @staticmethod
    def no_content(
        message: str = "No content",
        meta: Optional[Dict] = None
    ) -> Response:
        """204 No Content response"""
        return APIResponse.success(
            data=None,
            message=message,
            code=status.HTTP_204_NO_CONTENT,
            meta=meta
        )
    
    @staticmethod
    def bad_request(
        message: str = "Bad request",
        errors: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """400 Bad Request response"""
        return APIResponse.error(
            message=message,
            code=status.HTTP_400_BAD_REQUEST,
            errors=errors,
            meta=meta
        )
    
    @staticmethod
    def unauthorized(
        message: str = "Authentication required",
        errors: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """401 Unauthorized response"""
        return APIResponse.error(
            message=message,
            code=status.HTTP_401_UNAUTHORIZED,
            errors=errors,
            meta=meta
        )
    
    @staticmethod
    def forbidden(
        message: str = "Permission denied",
        errors: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """403 Forbidden response"""
        return APIResponse.error(
            message=message,
            code=status.HTTP_403_FORBIDDEN,
            errors=errors,
            meta=meta
        )
    
    @staticmethod
    def not_found(
        message: str = "Resource not found",
        errors: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """404 Not Found response"""
        return APIResponse.error(
            message=message,
            code=status.HTTP_404_NOT_FOUND,
            errors=errors,
            meta=meta
        )
    
    @staticmethod
    def conflict(
        message: str = "Resource conflict",
        errors: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """409 Conflict response"""
        return APIResponse.error(
            message=message,
            code=status.HTTP_409_CONFLICT,
            errors=errors,
            meta=meta
        )
    
    @staticmethod
    def validation_error(
        errors: Dict,
        message: str = "Validation failed",
        meta: Optional[Dict] = None
    ) -> Response:
        """422 Unprocessable Entity for validation errors"""
        return APIResponse.error(
            message=message,
            code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            errors=errors,
            meta=meta
        )
    
    @staticmethod
    def server_error(
        message: str = "Internal server error",
        errors: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """500 Internal Server Error response"""
        return APIResponse.error(
            message=message,
            code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            errors=errors,
            meta=meta
        )


class PaginationMeta:
    """
    Helper class to generate pagination metadata
    """
    
    @staticmethod
    def from_queryset(paginator, page):
        """
        Generate pagination metadata from paginator and page
        """
        return {
            "page": page.number,
            "page_size": paginator.page_size,
            "total_pages": paginator.page.paginator.num_pages,
            "total_count": paginator.page.paginator.count,
            "has_next": page.has_next(),
            "has_previous": page.has_previous(),
            "next_page": page.next_page_number() if page.has_next() else None,
            "previous_page": page.previous_page_number() if page.has_previous() else None
        }