import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination Component
 * Supports backend pagination format with meta.pagination structure
 */
const Pagination = ({ 
  pagination, 
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  className = '',
  size = 'md'
}) => {
  // Return null if no pagination data
  if (!pagination || !pagination.total_pages || pagination.total_pages <= 1) {
    return null;
  }

  const { 
    page = 1, 
    total_pages: totalPages = 1,
    has_next: hasNext = false,
    has_previous: hasPrevious = false,
    total_count: totalCount = 0,
    page_size: pageSize = 10
  } = pagination;

  // Calculate range of items being displayed
  const startItem = ((page - 1) * pageSize) + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show 5 pages at a time

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than max to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      const leftSiblingIndex = Math.max(page - siblingCount, 1);
      const rightSiblingIndex = Math.min(page + siblingCount, totalPages);
      const showLeftEllipsis = leftSiblingIndex > 2;
      const showRightEllipsis = rightSiblingIndex < totalPages - 1;

      if (!showLeftEllipsis && showRightEllipsis) {
        // Show first few pages and ellipsis at the end
        for (let i = 1; i < 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      } else if (showLeftEllipsis && !showRightEllipsis) {
        // Show ellipsis at the beginning and last few pages
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else if (showLeftEllipsis && showRightEllipsis) {
        // Show ellipsis on both sides
        pageNumbers.push(1);
        pageNumbers.push('ellipsis');
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      onPageChange(newPage);
    }
  };

  // Size classes for buttons
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const buttonBaseClass = `relative inline-flex items-center border border-gray-300 bg-white font-medium 
    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors`;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {/* Results info - visible on all screens */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">{startItem}</span> -{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalCount}</span> results
      </div>

      {/* Pagination controls */}
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        {/* First page button */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(1)}
            disabled={!hasPrevious}
            className={`${buttonBaseClass} rounded-l-md ${sizeClasses[size]}`}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First</span>
          </button>
        )}

        {/* Previous button */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!hasPrevious}
          className={`${buttonBaseClass} ${!showFirstLast ? 'rounded-l-md' : ''} ${sizeClasses[size]}`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((pageNum, index) => {
          if (pageNum === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className={`relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${sizeClasses[size]}`}
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              aria-current={page === pageNum ? 'page' : undefined}
              className={`relative inline-flex items-center border ${
                page === pageNum
                  ? 'z-10 border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              } ${sizeClasses[size]}`}
            >
              {pageNum}
              {page === pageNum && (
                <span className="sr-only">(current)</span>
              )}
            </button>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNext}
          className={`${buttonBaseClass} ${!showFirstLast ? 'rounded-r-md' : ''} ${sizeClasses[size]}`}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </button>

        {/* Last page button */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={!hasNext}
            className={`${buttonBaseClass} rounded-r-md ${sizeClasses[size]}`}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last</span>
          </button>
        )}
      </nav>

      {/* Page size selector - optional, can be added if needed */}
      <div className="hidden sm:flex items-center space-x-2">
        <span className="text-sm text-gray-700">Rows per page:</span>
        <select
          className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={pageSize}
          onChange={(e) => onPageChange(1, parseInt(e.target.value))}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
  );
};

// PropTypes validation (commented out as we're not using PropTypes, but can be added if needed)
/*
Pagination.propTypes = {
  pagination: PropTypes.shape({
    page: PropTypes.number,
    page_size: PropTypes.number,
    total_pages: PropTypes.number,
    total_count: PropTypes.number,
    has_next: PropTypes.bool,
    has_previous: PropTypes.bool
  }),
  onPageChange: PropTypes.func.isRequired,
  showFirstLast: PropTypes.bool,
  siblingCount: PropTypes.number,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};
*/

export default Pagination;