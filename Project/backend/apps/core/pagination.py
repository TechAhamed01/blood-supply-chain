# apps/core/pagination.py

from rest_framework.pagination import PageNumberPagination
from django.core.paginator import InvalidPage
from apps.core.utils.response import APIResponse, PaginationMeta


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class with configurable page size
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return paginated response in standard format
        """
        pagination_meta = PaginationMeta.from_queryset(self, self.page)
        
        return APIResponse.success(
            data=data,
            message="Data retrieved successfully",
            pagination=pagination_meta
        )
    
    def paginate_queryset(self, queryset, request, view=None):
        """
        Paginate queryset with proper error handling
        """
        try:
            return super().paginate_queryset(queryset, request, view)
        except InvalidPage:
            # Handle invalid page numbers gracefully
            self.page = self.page_class([], number=1, paginator=self)
            return []
