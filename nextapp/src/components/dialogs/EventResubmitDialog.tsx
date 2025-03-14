import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEventResubmit } from '@/context/ApiContext';
import { useToast } from '@/components/ui/toast';
import JSONEditorComponent from '@/components/json/JSONEditorComponent';

// Interface for Resubmit Dialog
interface EventResubmitDialogProps {
  open: boolean;
  onClose: () => void;
  queueId: string;
  eventId: string;
  event?: any;
}

// Event Resubmit Dialog Component
const EventResubmitDialog: React.FC<EventResubmitDialogProps> = ({ 
  open, 
  onClose, 
  queueId, 
  eventId,
  event = null // Provide a default value
}) => {
  // Use useRef instead of useState to avoid re-rendering the editor unnecessarily
  const payloadDataRef = useRef<any>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [editorMode, setEditorMode] = useState<'tree' | 'code' | 'view'>('code');
  const resubmitMutation = useEventResubmit();
  const { addToast } = useToast();

  // Initialize payload when dialog opens
  useEffect(() => {
    if (event && event.payload) {
      try {
        // Add the original event ID to the payload
        const enhancedPayload = {
          ...event.payload,
          original_eid: eventId
        };
        payloadDataRef.current = enhancedPayload;
        setIsValid(true);
        setErrorMessage('');
      } catch (error) {
        console.error('Error formatting payload:', error);
        payloadDataRef.current = event.payload || {};
      }
    } else {
      // If there's no event or payload, initialize with an empty object
      payloadDataRef.current = {};
    }
  }, [event, eventId]);

  // Handle payload change
  const handlePayloadChange = (data: any) => {
    payloadDataRef.current = data;
    setIsValid(true);
    setErrorMessage('');
  };

  // Handle editor errors
  const handleEditorError = (error: Error) => {
    setIsValid(false);
    setErrorMessage(error.message);
  };

  const handleResubmit = async () => {
    if (!isValid || !payloadDataRef.current) return;
    
    try {
      // Extract botId from queueId
      const botIdPart = queueId.split(':')[1];
      const botId = botIdPart ? `bot:${botIdPart}` : '';
      
      const data = {
        botId: botId,
        queue: queueId,
        payload: payloadDataRef.current
      };
      
      console.log('Resubmitting with data:', data);
      
      // Use the mutation hook from ApiContext
      await resubmitMutation.mutateAsync(data);
      
      addToast({
        title: 'Event resubmitted',
        description: `Event has been resubmitted to queue ${queueId}`,
        type: 'success'
      });
      
      onClose();
    } catch (error) {
      console.error('Error resubmitting event:', error);
      
      addToast({
        title: 'Failed to resubmit event',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resubmit Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              You are about to resubmit event <span className="font-mono font-medium">{eventId}</span> to queue <span className="font-mono font-medium">{queueId}</span>.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              You can modify the payload before resubmitting:
            </p>
          </div>
          
          <div className="flex flex-col h-[450px]">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="payload-editor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Payload
              </label>
              {/* Editor Mode Selector */}
              <div className="flex space-x-1">
                {['code', 'view', 'text'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setEditorMode(m as any)}
                    className={`text-xs px-2 py-0.5 rounded ${
                      editorMode === m
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-md overflow-hidden border border-gray-300 dark:border-gray-700">
              
              <JSONEditorComponent 
                data={payloadDataRef.current}
                mode={editorMode}
                height="100%"
                onChange={handlePayloadChange}
                onError={handleEditorError}
              />
            </div>
            {!isValid && (
              <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
            )}
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> Resubmitting an event creates a new copy. Make sure to update any IDs/timestamps to avoid duplicates.
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
              onClick={handleResubmit}
              disabled={!isValid}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                      font-medium text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                      disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              Resubmit Event
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventResubmitDialog; 