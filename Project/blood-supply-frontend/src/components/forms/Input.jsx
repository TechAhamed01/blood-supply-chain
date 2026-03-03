import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon,
  helper,
  required,
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
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            ${Icon ? 'pl-10' : 'pl-3'}
            pr-3 py-2 w-full border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            disabled:bg-gray-50 disabled:text-gray-500
            ${className}
          `}
          required={required}
          {...props}
        />
      </div>
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;