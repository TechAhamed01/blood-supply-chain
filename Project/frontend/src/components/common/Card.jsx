// src/components/common/Card.jsx
import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className, padding = true, bordered = false }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm transition-all',
        bordered && 'border border-gray-200',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
};

// Card Header Component
Card.Header = ({ children, className }) => (
  <div className={clsx('border-b border-gray-200 pb-4 mb-4', className)}>
    {children}
  </div>
);

// Card Title Component
Card.Title = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>
    {children}
  </h3>
);

// Card Body Component
Card.Body = ({ children, className }) => (
  <div className={className}>{children}</div>
);

// Card Footer Component
Card.Footer = ({ children, className }) => (
  <div className={clsx('border-t border-gray-200 pt-4 mt-4', className)}>
    {children}
  </div>
);

export default Card;