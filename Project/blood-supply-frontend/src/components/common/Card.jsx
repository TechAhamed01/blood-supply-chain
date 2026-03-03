import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  actions,
  className = '',
  padding = true,
  hoverable = false,
  bordered = true,
}) => {
  return (
    <div 
      className={`
        bg-white rounded-2xl 
        ${bordered ? 'border border-gray-100' : ''} 
        ${hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : 'shadow-sm'}
        ${padding ? 'p-6' : ''}
        ${className}
      `}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;