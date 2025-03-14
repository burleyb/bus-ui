"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEventReplay } from '@/context/ApiContext';
import { useToast } from '@/components/ui/toast';

// Interface for Replay Dialog
interface EventReplayDialogProps {
  open: boolean;
  onClose: () => void;
  queueId: string;
  eventId: string;
  event: any;
  botOptions?: Array<{id: string, name: string}>;
}

// Event Replay Dialog Component
const EventReplayDialog: React.FC<EventReplayDialogProps> = ({ 
  open, 
  onClose, 
  queueId, 
  eventId,
  event,
  botOptions = [] // Provide a default empty array
}) => {
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const replayMutation = useEventReplay();
  const { addToast } = useToast();
  
  // Select first bot when options load or change
  useEffect(() => {
    if (botOptions && botOptions.length > 0) {
      setSelectedBotId(botOptions[0].id);
    } else {
      setSelectedBotId('');
    }
  }, [botOptions]);

  const handleReplay = async () => {
    if (!selectedBotId) return;
    
    try {
      console.log(`Replaying event ${eventId} from queue ${queueId} to bot ${selectedBotId}`);
      
      // Use the mutation hook from ApiContext
      await replayMutation.mutateAsync({
        botId: selectedBotId,
        queueId: queueId,
        eventId: eventId
      });
      
      addToast({
        title: 'Event replayed',
        description: `Event will be replayed to ${selectedBotId}`,
        type: 'success'
      });
      
      onClose();
    } catch (error) {
      console.error('Error replaying event:', error);
      
      addToast({
        title: 'Failed to replay event',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error'
      });
    }
  };

  // Ensure botOptions is an array
  const safeBotOptions = Array.isArray(botOptions) ? botOptions : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replay Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
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
            {safeBotOptions.length > 0 ? (
              <select
                id="bot-select"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                        focus:ring-2 focus:ring-blue-500"
                value={selectedBotId.split(':').pop()}
                onChange={(e) => setSelectedBotId(e.target.value)}
              >
                {safeBotOptions.map((bot) => (
                  <option key={bot.id.split(':').pop()} value={bot.id.split(':').pop()}>
                    {bot.name.split(':').pop()}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  No bots that read from this queue were found. Only bots that are connected to this queue can replay events from it.
                </p>
              </div>
            )}
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
              disabled={!selectedBotId || safeBotOptions.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                      font-medium text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              Replay Event
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventReplayDialog; 