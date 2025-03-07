"use client";

import { useState } from 'react';
import { awsNativeFetch } from '@/lib/authUtils';
import { useToast } from '@/components/ui/toast';

interface BotActionsResult {
  isLoading: boolean;
  forceRunBot: (botId: string) => Promise<void>;
  changeCheckpoint: (nodeId: string, checkpoint: string) => Promise<void>;
  toggleBotStatus: (botId: string, isPaused: boolean) => Promise<void>;
  error: string | null;
}

export function useBotActions(): BotActionsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const forceRunBot = async (botId: string): Promise<void> => {
    if (!botId) {
      setError("Bot ID is required");
      addToast({
        title: "Error",
        description: "Bot ID is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await awsNativeFetch('https://rstreams.symmatiq.com/dev/api/cron/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: botId,
          executeNow: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to force run bot: ${response.status}`);
      }

      const data = await response.json();
      addToast({
        title: "Success",
        description: "Bot force run triggered successfully",
        variant: "default"
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      addToast({
        title: "Error",
        description: `Error forcing bot run: ${errorMessage}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changeCheckpoint = async (nodeId: string, checkpoint: string): Promise<void> => {
    if (!nodeId || !checkpoint) {
      setError("Node ID and checkpoint are required");
      addToast({
        title: "Error",
        description: "Node ID and checkpoint are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This is a placeholder implementation. In a real app, you'd call an actual API endpoint
      const response = await awsNativeFetch(`/api/nodes/${nodeId}/checkpoint`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          checkpoint
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to change checkpoint: ${response.status}`);
      }

      const data = await response.json();
      addToast({
        title: "Success",
        description: "Checkpoint updated successfully",
        variant: "default"
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      addToast({
        title: "Error",
        description: `Error changing checkpoint: ${errorMessage}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBotStatus = async (botId: string, isPaused: boolean): Promise<void> => {
    if (!botId) {
      setError("Bot ID is required");
      addToast({
        title: "Error",
        description: "Bot ID is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This is a placeholder implementation. In a real app, you'd call an actual API endpoint
      const response = await awsNativeFetch(`/api/bots/${botId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: isPaused ? 'RUNNING' : 'PAUSED'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle bot status: ${response.status}`);
      }

      const data = await response.json();
      addToast({
        title: "Success",
        description: `Bot ${isPaused ? 'resumed' : 'paused'} successfully`,
        variant: "default"
      });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      addToast({
        title: "Error",
        description: `Error toggling bot status: ${errorMessage}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    forceRunBot,
    changeCheckpoint,
    toggleBotStatus,
    error
  };
} 