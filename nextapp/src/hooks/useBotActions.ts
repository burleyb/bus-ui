"use client";

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { API } from '@/context/ApiContext';
import { useQueryClient } from '@tanstack/react-query';

interface UseBotActionsResult {
  isLoading: boolean;
  error: Error | null;
  forceRunBot: (botId: string) => Promise<void>;
  toggleBotStatus: (botId: string, isPaused?: boolean) => Promise<void>;
  changeCheckpoint: (botId: string, checkpoint: string) => Promise<void>;
}

/**
 * Custom hook for bot actions like force run, toggle status, change checkpoint
 */
export function useBotActions(): UseBotActionsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Force run a bot
   */
  const forceRunBot = async (botId: string): Promise<void> => {
    if (!botId) {
      const error = new Error('Bot ID is required for force run');
      setError(error);
      throw error;
    }

    try {
      setIsLoading(true);
      setError(null);

      await API.saveCron({
        id: botId,
        forceRun: true
      });

      // Invalidate queries related to this bot
      queryClient.invalidateQueries({ queryKey: ['botDetails', botId] });
      queryClient.invalidateQueries({ queryKey: ['bot-logs', botId] });

      toast({
        title: 'Success',
        description: 'Bot is now running',
        variant: 'success',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to force run bot');
      setError(error);
      console.error('Error forcing bot run:', error);
      
      toast({
        title: 'Error',
        description: `Failed to run bot: ${error.message}`,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle a bot's paused status
   */
  const toggleBotStatus = async (botId: string, isPaused?: boolean): Promise<void> => {
    if (!botId) {
      const error = new Error('Bot ID is required for toggle status');
      setError(error);
      throw error;
    }

    try {
      setIsLoading(true);
      setError(null);

      // If isPaused is provided, use it directly; otherwise, get the current bot details
      // and toggle the paused status
      let newPausedStatus: boolean;
      
      if (typeof isPaused === 'boolean') {
        newPausedStatus = isPaused;
      } else {
        // Get current bot details to determine current paused state
        const botDetailsResponse = await fetch(`/api/cron/${botId}`);
        if (!botDetailsResponse.ok) {
          throw new Error(`Failed to get bot details: ${botDetailsResponse.statusText}`);
        }
        const botDetails = await botDetailsResponse.json();
        newPausedStatus = !botDetails.paused;
      }

      await API.saveCron({
        id: botId,
        paused: newPausedStatus
      });

      // Invalidate queries related to this bot
      queryClient.invalidateQueries({ queryKey: ['botDetails', botId] });

      toast({
        title: 'Success',
        description: newPausedStatus ? 'Bot paused' : 'Bot resumed',
        variant: 'success',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle bot status');
      setError(error);
      console.error('Error toggling bot status:', error);
      
      toast({
        title: 'Error',
        description: `Failed to toggle bot status: ${error.message}`,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Change a bot's checkpoint
   */
  const changeCheckpoint = async (botId: string, checkpoint: string): Promise<void> => {
    if (!botId) {
      const error = new Error('Bot ID is required for changing checkpoint');
      setError(error);
      throw error;
    }

    if (!checkpoint) {
      const error = new Error('Checkpoint value is required');
      setError(error);
      throw error;
    }

    try {
      setIsLoading(true);
      setError(null);

      await API.saveCron({
        id: botId,
        checkpoint
      });

      // Invalidate queries related to this bot
      queryClient.invalidateQueries({ queryKey: ['botDetails', botId] });

      toast({
        title: 'Success',
        description: 'Checkpoint updated successfully',
        variant: 'success',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to change checkpoint');
      setError(error);
      console.error('Error changing checkpoint:', error);
      
      toast({
        title: 'Error',
        description: `Failed to change checkpoint: ${error.message}`,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    forceRunBot,
    toggleBotStatus,
    changeCheckpoint
  };
} 