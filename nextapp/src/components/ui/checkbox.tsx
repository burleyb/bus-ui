"use client";

import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  className = '',
  disabled = false,
  ...props
}: CheckboxProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };

  return (
    <div className={`relative flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <div className={`h-4 w-4 rounded border border-gray-300 dark:border-gray-500 
                      flex items-center justify-center transition-colors
                      ${checked 
                        ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500' 
                        : 'bg-white dark:bg-gray-800'}`}>
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="white"
            className="h-3 w-3"
          >
            <path
              fillRule="evenodd"
              d="M11.996 5.21a.75.75 0 0 1 .044 1.06l-4.25 4.5a.75.75 0 0 1-1.08.025l-2.25-2.25a.75.75 0 0 1 1.06-1.06l1.733 1.732 3.687-3.91a.75.75 0 0 1 1.056-.097Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </div>
  );
} 