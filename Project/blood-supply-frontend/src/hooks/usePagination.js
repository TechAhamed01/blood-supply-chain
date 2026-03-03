import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialPageSize = 10) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    pageSize: initialPageSize,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const setPaginationData = useCallback((data) => {
    setPagination({
      page: data.page || 1,
      pageSize: data.page_size || 10,
      totalPages: data.total_pages || 1,
      totalCount: data.total_count || 0,
      hasNext: data.has_next || false,
      hasPrevious: data.has_previous || false,
    });
  }, []);

  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);

  const previousPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: prev.page - 1,
    }));
  }, []);

  return {
    pagination,
    setPaginationData,
    goToPage,
    nextPage,
    previousPage,
  };
};