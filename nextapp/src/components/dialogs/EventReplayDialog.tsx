"use client";

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useAppContext } from '@/context/AppContext';

export interface EventReplayDialogProps {
  open: boolean;
  onClose: () => void;
  queueId: string;
  eventId: string;
}

export default function EventReplayDialog({ 
  open, 
  onClose, 
  queueId, 
  eventId 
}: EventReplayDialogProps) {
  const { state } = useAppContext();
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [availableBots, setAvailableBots] = useState<{id: string; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load available bots for replay when dialog opens
  useEffect(() => {
    if (open && queueId) {
      setIsLoading(true);
      
      // Simulate loading available bots
      setTimeout(() => {
        // In a real implementation, you would fetch this from your API
        // For now, we'll use bots from the global state
        const bots = state.bots.map(bot => ({
          id: bot.id,
          name: bot.id
        }));
        
        setAvailableBots(bots);
        setSelectedBotId(bots.length > 0 ? bots[0].id : '');
        setIsLoading(false);
      }, 500);
    }
  }, [open, queueId, state.bots]);

  const handleReplay = () => {
    if (!selectedBotId) return;
    
    // In a real implementation, you would call your API to replay the event
    console.log(`Replaying event ${eventId} from queue ${queueId} to bot ${selectedBotId}`);
    
    // Show success message
    alert(`Event ${eventId} has been sent to ${selectedBotId} for replay processing.`);
    
    // Close the dialog
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Replay Event"
      size="md"
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              You are about to replay event <span className="font-mono font-medium">{eventId}</span> from queue <span className="font-mono font-medium">{queueId}</span>.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Select the bot that should process this event:
            </p>
          </div>
          
          <div>
            <label htmlFor="bot-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Bot
            </label>
            <select
              id="bot-select"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                      focus:ring-2 focus:ring-blue-500"
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
            >
              {availableBots.length === 0 && (
                <option value="">No bots available</option>
              )}
              {availableBots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> Replaying an event may cause duplicate processing. Make sure the target bot can handle this safely.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 
                      rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300
                      bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReplay}
              disabled={!selectedBotId}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                      font-medium text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              Replay Event
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
} 