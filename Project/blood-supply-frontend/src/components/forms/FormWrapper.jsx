import React from 'react';

const FormWrapper = ({ 
  children, 
  onSubmit, 
  title,
  subtitle,
  actions,
  className = '',
  layout = 'vertical',
  spacing = 'normal',
}) => {
  const layoutStyles = {
    vertical: 'space-y-6',
    horizontal: 'space-y-0',
  };

  const spacingStyles = {
    compact: 'gap-4',
    normal: 'gap-6',
    relaxed: 'gap-8',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}

      <div className={`${layoutStyles[layout]} ${spacingStyles[spacing]}`}>
        {children}
      </div>

      {actions && (
        <div className="mt-8 flex items-center justify-end space-x-3">
          {actions}
        </div>
      )}
    </form>
  );
};

export default FormWrapper;