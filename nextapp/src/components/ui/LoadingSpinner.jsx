import React from 'react';

const sizes = {
  xs: 'h-4 w-4 border-2',
  sm: 'h-6 w-6 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

const variants = {
  primary: 'border-primary-200 border-t-primary-600',
  secondary: 'border-gray-200 border-t-gray-600',
  white: 'border-white/30 border-t-white',
};

const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  className = '',
  fullScreen = false,
}) => {
  const spinner = (
    <div
      className={`
        inline-block animate-spin rounded-full
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;