"use client";

import React, { useState, useRef, useEffect } from 'react';

// Context approach was causing TypeScript issues - rewriting with a simpler implementation

export interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <div className="relative inline-block text-left">
      {children}
    </div>
  );
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function DropdownMenuTrigger({ children, onClick }: DropdownMenuTriggerProps) {
  // Just passing through the children and onClick handler
  return (
    <div onClick={onClick} className="inline-flex">
      {children}
    </div>
  );
}

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  align?: 'start' | 'end' | 'center';
}

export function DropdownMenuContent({ 
  children, 
  isOpen, 
  onClose, 
  align = 'end' 
}: DropdownMenuContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate alignment classes
  let alignClass = 'left-0';
  if (align === 'end') alignClass = 'right-0';
  if (align === 'center') alignClass = 'left-1/2 -translate-x-1/2';

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 
                bg-white shadow-md dark:border-gray-800 dark:bg-gray-900 ${alignClass}`}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

export interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  disabled = false,
  className = ''
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none 
                focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 
                dark:focus:bg-gray-800 dark:focus:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      role="menuitem"
    >
      {children}
    </button>
  );
} 