import React from 'react';

const ToggleSwitch = ({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const uniqueId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
  
  const sizes = {
    sm: {
      switch: 'w-9 h-5',
      dot: 'translate-x-4 h-3 w-3',
      translate: 'translate-x-0',
    },
    md: {
      switch: 'w-11 h-6',
      dot: 'translate-x-5 h-4 w-4',
      translate: 'translate-x-0',
    },
    lg: {
      switch: 'w-14 h-7',
      dot: 'translate-x-7 h-5 w-5',
      translate: 'translate-x-0',
    },
  };

  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          ${checked ? 'bg-primary-600' : 'bg-gray-200'} 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${sizes[size].switch}
        `}
        id={uniqueId}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span 
          className={`
            pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
            ${checked ? sizes[size].dot : sizes[size].translate}
            ${sizes[size].dot.split(' ').slice(1).join(' ')}
          `}
        />
      </button>
      
      {label && (
        <span 
          className={`ml-3 text-sm ${disabled ? 'text-gray-400' : 'text-gray-900'}`}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default ToggleSwitch;