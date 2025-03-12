"use client";

import React from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Switch({
  checked = false,
  onCheckedChange,
  className = '',
  disabled = false,
  ...props
}: SwitchProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };

  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div 
        className={`
          relative w-11 h-6 rounded-full peer transition-colors duration-200 ease-in-out
          ${checked 
            ? 'bg-blue-500 dark:bg-blue-400' 
            : 'bg-gray-200 dark:bg-gray-700'
          }
        `}
      >
        <span 
          className={`
            absolute top-[2px] left-[2px] bg-white border border-gray-300 dark:border-gray-600 rounded-full h-5 w-5 
            transition-transform duration-200 ease-in-out
            ${checked 
              ? 'transform translate-x-5 border-white' 
              : ''
            }
          `}
        />
      </div>
    </label>
  );
} 