import React from 'react';

const Loader = ({ size = 'md', fullPage = false, text = 'Loading...' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  const loader = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div 
        className={`
          ${sizes[size]} 
          animate-spin rounded-full border-primary-200 border-t-primary-600
        `}
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;