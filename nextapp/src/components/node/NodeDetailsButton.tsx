"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useDialogContext } from '@/hooks/useDialogContext';

interface NodeDetailsButtonProps {
  nodeId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export default function NodeDetailsButton({
  nodeId,
  className = '',
  size = 'sm',
  variant = 'ghost',
  showIcon = true,
  children
}: NodeDetailsButtonProps) {
  const { openDialog } = useDialogContext();
  
  const handleClick = () => {
    if (openDialog) {
      openDialog({ nodeId });
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {showIcon && <Settings className="h-4 w-4 mr-2" />}
      {children || 'Node Details'}
    </Button>
  );
} 