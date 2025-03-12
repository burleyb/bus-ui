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

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) return;
    // Explicitly call onCheckedChange to ensure the toggle state changes
    if (onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <label 
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={handleClick}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div 
        className={`relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 
                   peer-checked:after:translate-x-full peer-checked:after:border-white 
                   after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                   after:bg-white after:border-gray-300 after:border after:rounded-full 
                   after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                   ${checked ? 'bg-blue-600 dark:bg-blue-500' : ''}`}
        style={{ zIndex: 1 }}
      ></div>
    </label>
  );
} 