"use client";

import React, { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBotActions } from '@/hooks/useBotActions';

interface CheckpointControlProps {
  nodeId: string;
  checkpoint: string;
  onCheckpointChange?: (checkpoint: string) => void;
}

export default function CheckpointControl({ nodeId, checkpoint, onCheckpointChange }: CheckpointControlProps) {
  const [isChangeCheckpointOpen, setIsChangeCheckpointOpen] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { forceRunBot, changeCheckpoint, isLoading, error } = useBotActions();
  
  // Function to handle copy checkpoint
  const handleCopyCheckpoint = () => {
    if (!checkpoint) return;
    
    navigator.clipboard.writeText(checkpoint);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  // Function to open change checkpoint dialog
  const handleOpenChangeDialog = () => {
    setNewCheckpoint(checkpoint);
    setIsChangeCheckpointOpen(true);
  };
  
  // Function to submit checkpoint change
  const handleSubmitCheckpoint = async () => {
    if (!newCheckpoint || !nodeId) return;
    
    try {
      await changeCheckpoint(nodeId, newCheckpoint);
      if (onCheckpointChange) {
        onCheckpointChange(newCheckpoint);
      }
      setIsChangeCheckpointOpen(false);
    } catch (error) {
      console.error('Failed to change checkpoint:', error);
      // Error is already handled in the hook with toast notifications
    }
  };
  
  // Function to handle force run
  const handleForceRun = async () => {
    if (!nodeId) return;
    
    try {
      await forceRunBot(nodeId);
    } catch (error) {
      console.error('Failed to force run bot:', error);
      // Error is already handled in the hook with toast notifications
    }
  };

  return (
    <>
      <div className="flex items-center">
        <div className="max-w-[240px] truncate bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-l-md text-sm">
          {checkpoint || 'No checkpoint'}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2 py-1 rounded-r-md border-l border-gray-300 dark:border-gray-600"
              disabled={isLoading}
            >
              <div className="flex items-center">
                <Settings size={14} />
                <ChevronDown size={14} />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenChangeDialog}>
              Change Checkpoint
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyCheckpoint}>
              Copy Checkpoint
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleForceRun}>
              Force Run
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Checkpoint change modal */}
      {isChangeCheckpointOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-medium mb-4">Change Checkpoint</h3>
            <Input
              value={newCheckpoint}
              onChange={(e) => setNewCheckpoint(e.target.value)}
              placeholder="Enter new checkpoint value"
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsChangeCheckpointOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitCheckpoint}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 