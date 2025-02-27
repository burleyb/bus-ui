"use client";

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  id?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  id, 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  required = false,
  helperText,
  leadingIcon,
  trailingIcon,
  ...props 
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative rounded-md shadow-sm">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leadingIcon}
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          className={`
            block w-full rounded-md shadow-sm sm:text-sm
            ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}
            ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
            ${leadingIcon ? 'pl-10' : ''}
            ${trailingIcon ? 'pr-10' : ''}
          `}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {trailingIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export { Input }; 