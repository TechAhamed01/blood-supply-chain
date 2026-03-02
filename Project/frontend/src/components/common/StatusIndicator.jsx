// src/components/common/StatusIndicator.jsx
import React from 'react';
import clsx from 'clsx';

const StatusIndicator = ({ status, size = 'md', showLabel = true, pulse = false }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'available':
      case 'active':
      case 'completed':
        return {
          color: 'bg-green-500',
          bg: 'bg-green-100',
          text: 'text-green-700',
          label: 'Available',
        };
      case 'warning':
      case 'expiring':
      case 'partial':
      case 'pending':
        return {
          color: 'bg-yellow-500',
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          label: 'Expiring Soon',
        };
      case 'danger':
      case 'critical':
      case 'expired':
      case 'shortage':
        return {
          color: 'bg-red-500',
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: 'Critical',
        };
      case 'info':
      case 'low':
        return {
          color: 'bg-blue-500',
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          label: 'Low Stock',
        };
      default:
        return {
          color: 'bg-gray-500',
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          label: status || 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="relative flex">
        <span
          className={clsx(
            sizeClasses[size],
            config.color,
            'rounded-full',
            pulse && 'animate-ping absolute inline-flex',
            !pulse && 'inline-block'
          )}
        />
        {pulse && (
          <span className={clsx(sizeClasses[size], config.color, 'rounded-full inline-block')} />
        )}
      </span>
      {showLabel && <span className={clsx('text-sm font-medium', config.text)}>{config.label}</span>}
    </div>
  );
};

export default StatusIndicator;