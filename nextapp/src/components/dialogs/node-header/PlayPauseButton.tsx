"use client";

import React from 'react';
import { Pause, Play } from 'lucide-react';
import { useBotActions } from '@/hooks/useBotActions';

interface PlayPauseButtonProps {
  nodeId: string;
  isPaused: boolean;
  onStatusChange?: (isPaused: boolean) => void;
}

export default function PlayPauseButton({ nodeId, isPaused, onStatusChange }: PlayPauseButtonProps) {
  const { toggleBotStatus, isLoading } = useBotActions();
  
  const handleToggle = async () => {
    if (!nodeId) return;
    
    try {
      await toggleBotStatus(nodeId, isPaused);
      if (onStatusChange) {
        onStatusChange(!isPaused);
      }
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
      // Error is already handled in the hook with toast notifications
    }
  };
  
  return (
    <button
      className={`p-2 rounded-full ${
        isLoading 
          ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
      }`}
      onClick={handleToggle}
      disabled={isLoading}
      title={isPaused ? "Resume" : "Pause"}
    >
      {isPaused ? <Play size={16} /> : <Pause size={16} />}
    </button>
  );
} 