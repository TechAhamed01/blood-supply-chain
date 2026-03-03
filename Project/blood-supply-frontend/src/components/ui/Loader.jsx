import React from 'react';

const Loader = ({ size = 'md', fullPage = false }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const loader = (
    <div className="flex justify-center items-center">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-primary-200 border-t-primary-600`}></div>
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