"use client";

import React, { useState, useRef, useEffect } from 'react';

// Context approach was causing TypeScript issues - rewriting with a simpler implementation

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  align?: 'start' | 'center' | 'end';
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <div className="relative inline-block text-left">
      {children}
    </div>
  );
}

export function DropdownMenuTrigger({ asChild = false, children }: DropdownMenuTriggerProps) {
  const [open, setOpen] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
    
    // Propagate the open state to the DropdownMenuContent
    const event = new CustomEvent('dropdown-toggle', { 
      detail: { open: !open },
      bubbles: true 
    });
    e.currentTarget.dispatchEvent(event);
  };
  
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': true,
    });
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="true"
      className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ 
  align = 'start', 
  children, 
  className = '' 
}: DropdownMenuContentProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShow(customEvent.detail.open);
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    
    document.addEventListener('dropdown-toggle', handleToggle);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('dropdown-toggle', handleToggle);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!show) return null;
  
  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  };
  
  return (
    <div
      ref={ref}
      className={`absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses[align]} ${className}`}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabIndex={-1}
    >
      <div className="py-1" role="none">
        {children}
      </div>
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  className = '', 
  onClick, 
  disabled = false 
}: DropdownMenuItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick();
    }
    
    // Close the dropdown after clicking
    const event = new CustomEvent('dropdown-toggle', { 
      detail: { open: false },
      bubbles: true 
    });
    e.currentTarget.dispatchEvent(event);
  };
  
  return (
    <button
      className={`text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white block w-full text-left px-4 py-2 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
      disabled={disabled}
    >
      <div className="flex items-center">
        {children}
      </div>
    </button>
  );
} 