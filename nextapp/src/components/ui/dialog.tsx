"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Dialog as DialogPrimitive, DialogPortal, DialogOverlay } from '@/components/ui/dialog';

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onInteractOutside?: (event: MouseEvent) => void;
}

// Add a new variant for fullscreen
const dialogVariants = cva(
  "...",
  {
    variants: {
      size: {
        default: "...",
        fullscreen: "w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh]"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
);

export function Dialog({ 
  open, 
  onOpenChange,
  children 
}: DialogProps) {
  if (!open) return null;

  // Only render in the browser
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      
      {/* Dialog position wrapper */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {children}
      </div>
    </div>,
    document.body
  );
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "default" | "fullscreen"
  }
>(({ className, children, size, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogVariants({ size }), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="...">
        <X className="..." />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
)); 