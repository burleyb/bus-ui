"use client";

import React, { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const TooltipSimple = ({
  content,
  children,
  className,
  contentClassName,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute z-50 p-2 text-sm bg-black text-white rounded shadow-lg",
          "mt-1 transform -translate-x-1/2 left-1/2",
          contentClassName
        )}>
          {content}
        </div>
      )}
    </div>
  );
};

export { TooltipSimple }; 