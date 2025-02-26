"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Dialog({ 
  open, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press to close dialog
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    // Disable body scroll when dialog is open
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [open, onClose]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && 
          !dialogRef.current.contains(event.target as Node) && 
          open) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  // Sizing classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  if (!open) return null;

  // Only render in the browser
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Dialog position wrapper */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Dialog panel */}
        <div 
          ref={dialogRef}
          className={`${sizeClasses[size]} w-full transform overflow-hidden rounded-lg 
                    bg-white dark:bg-gray-900 text-left align-middle shadow-xl transition-all`}
        >
          {/* Header */}
          {title && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-500 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          
          {/* Body */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 