"use client";

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// React Dialog components that use standard HTML elements
// This avoids TypeScript compatibility issues with the Radix UI components

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ 
  open = false, 
  onOpenChange, 
  children 
}) => {
  // Create a ref to track mounted state
  const mounted = React.useRef(false);
  
  // Use useEffect to set mounted ref
  React.useEffect(() => {
    mounted.current = true;
    
    return () => {
      mounted.current = false;
    };
  }, []);
  
  // Always render the component structure, but hide it when not open
  // This avoids the conditional rendering that breaks React hooks
  
  // Listen for escape key to close dialog
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onOpenChange) {
        onOpenChange(false);
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onOpenChange, open]);
  
  // Render children wrapped in a context provider even when closed
  // But make sure the UI elements are hidden
  return (
    <div className={open ? '' : 'hidden'}>
      {children}
    </div>
  );
};

// Trigger is just a button that opens the dialog
export const DialogTrigger: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ children, onClick }) => {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
};

// Portal is just a wrapper for children
export const DialogPortal: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};

// Close button that calls onOpenChange
export const DialogClose: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}> = ({ children, onClick }) => {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
};

// Overlay creates the backdrop
export const DialogOverlay: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        className
      )}
    />
  );
};

// Content contains dialog content with styling
export const DialogContent: React.FC<{
  className?: string;
  children: React.ReactNode;
  onInteractOutside?: (e: React.MouseEvent) => void;
}> = ({ className, children, onInteractOutside }) => {
  // Create a ref to detect clicks outside the content
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Handle clicking outside the content
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node) && onInteractOutside) {
        onInteractOutside(e as unknown as React.MouseEvent);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onInteractOutside]);
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        ref={contentRef}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-slate-800 dark:bg-slate-950",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-slate-950 dark:focus:ring-slate-300"
          onClick={(e) => {
            e.stopPropagation();
            if (onInteractOutside) {
              onInteractOutside(e);
            }
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </DialogPortal>
  );
};

// Header component for the dialog
export const DialogHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
    >
      {children}
    </div>
  );
};

// Footer component for the dialog
export const DialogFooter: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
    >
      {children}
    </div>
  );
};

// Title component for the dialog
export const DialogTitle: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h2>
  );
};

// Description component for the dialog
export const DialogDescription: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <p
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
    >
      {children}
    </p>
  );
}; 