"use client";

import * as React from 'react';
import { X } from 'lucide-react';

/**
 * A simplified dialog component that avoids TypeScript compatibility issues
 */
export const SimpleDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  // Handle Escape key to close dialog
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [onOpenChange]);

  // Prevent scrolling of background content when dialog is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" 
      onClick={(e) => {
        // Close dialog when clicking overlay (not content)
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[85vh] overflow-auto relative">
        <div className="relative p-6">
          <button 
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" 
            onClick={() => onOpenChange(false)}
          >
            <X size={16} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export const SimpleDialogContent: React.FC<{
  className?: string;
  children: React.ReactNode;
  onInteractOutside?: (e: React.MouseEvent) => void;
}> = ({ className, children, onInteractOutside }) => (
  <div 
    className={className || ''} 
    onClick={onInteractOutside}
  >
    {children}
  </div>
);

export const SimpleDialogHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <div className={`mb-4 ${className || ''}`}>{children}</div>
);

export const SimpleDialogTitle: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

export const SimpleDialogFooter: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <div className={`mt-4 flex justify-end space-x-2 ${className || ''}`}>{children}</div>
);

export const SimpleDialogClose: React.FC<{
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ children, onClick }) => (
  <div onClick={onClick}>{children}</div>
); 