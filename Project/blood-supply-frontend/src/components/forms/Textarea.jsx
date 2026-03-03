import React, { forwardRef } from 'react';

const Textarea = forwardRef(({ 
  label, 
  error, 
  helper,
  required,
  rows = 4,
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          disabled:bg-gray-50 disabled:text-gray-500
          resize-y min-h-[100px]
          ${className}
        `}
        required={required}
        {...props}
      />
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;