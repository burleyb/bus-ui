"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  RefreshCw, 
  Search, 
  Calendar,
  Clock,
  Zap,
  RotateCw,
  Target,
  ChevronRightCircle
} from 'lucide-react';
import { useSearchQueueEvents } from '@/context/ApiContext';
import { 
  formatDateToEid, 
  getEidForTimeRange, 
  TIME_RANGES, 
  isEid,
  formatDateTime
} from '@/lib/dateUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { awsNativeFetch } from '@/lib/authUtils';
import JSONEditorComponent, { JSONEditorHandle } from '@/components/json/JSONEditorComponent';

interface QueueEventsTabProps {
  nodeData: any;
}

// Interface for Replay Dialog
interface ReplayDialogProps {
  open: boolean;
  onClose: () => void;
  queueId: string;
  eventId: string;
  event: any;
  botOptions: Array<{id: string, name: string}>;
}

// Interface for Resubmit Dialog
interface ResubmitDialogProps {
  open: boolean;
  onClose: () => void;
  queueId: string;
  eventId: string;
  event: any;
}

// Event Replay Dialog Component
const EventReplayDialog: React.FC<ReplayDialogProps> = ({ 
  open, 
  onClose, 
  queueId, 
  eventId,
  event,
  botOptions
}) => {
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  
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
      
      // Use existing checkpoint API
      const response = await awsNativeFetch(`/api/checkpoint/${selectedBotId}/${queueId}/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error setting checkpoint: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Checkpoint set successfully:', data);
      
      alert(`Event will be replayed to ${selectedBotId}`);
      onClose();
    } catch (error) {
      console.error('Error setting checkpoint:', error);
      alert(`Failed to set checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
            {botOptions.length > 0 ? (
              <select
                id="bot-select"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                        focus:ring-2 focus:ring-blue-500"
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
              >
                {botOptions.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
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
              disabled={!selectedBotId || botOptions.length === 0}
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

// Event Resubmit Dialog Component
const EventResubmitDialog: React.FC<ResubmitDialogProps> = ({ 
  open, 
  onClose, 
  queueId, 
  eventId,
  event
}) => {
  // Use useRef instead of useState to avoid re-rendering the editor unnecessarily
  const payloadDataRef = useRef<any>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [editorMode, setEditorMode] = useState<'tree' | 'code' | 'view'>('code');

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
      
      // Use the existing cron/save endpoint to resubmit
      const response = await awsNativeFetch('/api/cron/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Error resubmitting event: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Event resubmitted successfully:', responseData);
      
      alert(`Event has been resubmitted to queue ${queueId}`);
      onClose();
    } catch (error) {
      console.error('Error resubmitting event:', error);
      alert(`Failed to resubmit event: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

const QueueEventsTab: React.FC<QueueEventsTabProps> = ({ nodeData }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('5m');
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [lastQueryFailed, setLastQueryFailed] = useState(false);
  
  // Dialog state
  const [showReplayDialog, setShowReplayDialog] = useState(false);
  const [showResubmitDialog, setShowResubmitDialog] = useState(false);
  const [dialogEventId, setDialogEventId] = useState<string>('');
  const [botOptions, setBotOptions] = useState<Array<{id: string, name: string}>>([]);
  const [jsonEditorMode, setJsonEditorMode] = useState<'tree' | 'code' | 'view'>('code');
  const editorRef = useRef<JSONEditorHandle>(null);
  
  // Refs for event list and keyboard navigation
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const eventRowsRef = useRef<{ [id: string]: HTMLTableRowElement }>({});
  
  // Calculate the EID based on selected time range or custom date
  const eid = useMemo(() => {
    if (customDate) {
      return formatDateToEid(customDate);
    }
    
    // Check if search input is an EID
    if (searchInput.startsWith('z/')) {
      return searchInput;
    }
    
    // Use time range
    const minutes = TIME_RANGES[selectedTimeRange as keyof typeof TIME_RANGES];
    return getEidForTimeRange(minutes);
  }, [customDate, selectedTimeRange, searchInput]);

  // Determine if we're using the search text or EID
  const searchText = useMemo(() => {
    if (searchInput.startsWith('z/') && isEid(searchInput)) {
      return undefined; // If input is an EID, don't use as search text
    }
    return debouncedSearch;
  }, [debouncedSearch, searchInput]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Extract queue ID from nodeData
  const queueId = nodeData.id;
  
  // Fetch events using the hook
  const { 
    data: response = { results: [], resumptionToken: null }, 
    isLoading,
    isError,
    refetch
  } = useSearchQueueEvents(queueId, eid, searchText);
  
  // Process events to ensure they have consistent structure
  const events = useMemo(() => {
    if (!response.results || !Array.isArray(response.results)) {
      return [];
    }
    
    // Normalize event data to a consistent format
    return response.results.map((event: any) => {
      // Create a unique ID for the event
      const eventId = event.eventId || event.eid || event.id || (event.payload && event.payload.id) || Math.random().toString(36).substring(2, 9);
      
      // Ensure we have a timestamp
      const timestamp = event.timestamp || event.created_at || event.time || (event.payload && event.payload.timestamp) || new Date().toISOString();
      
      // Ensure we have a source timestamp
      const event_source_timestamp = event.event_source_timestamp || event.timestamp || event.created_at || new Date().toISOString();
      
      // Get the payload - could be directly on event or in a payload/data field
      const payload = event.payload || event.data || event;
      
      return {
        ...event,
        eventId,
        timestamp,
        event_source_timestamp,
        payload
      };
    });
  }, [response.results]);
  
  // Update event count and last query status based on events
  useEffect(() => {
    setEventCount(events.length);
    setLastQueryFailed(response.results && Array.isArray(response.results) 
      ? response.results.length === 0 
      : true);
  }, [events.length, response.results]);
  
  // Memoize the selected event for more efficient rendering
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((event: any) => event.eventId === selectedEventId || event.eid === selectedEventId);
  }, [selectedEventId, events]);

  // Create a stable version of handleJsonChange that won't change on every render
  const handleJsonChange = useCallback((data: any) => {
    // This would need to be updated to work directly with the response rather than cached events
    console.log('JSON editing is view-only until we implement direct API updates');
  }, []);
  
  // Select an event to view details
  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEventId(prevId => eventId === prevId ? null : eventId);
    
    // Focus the selected row and scroll it into view
    setTimeout(() => {
      const row = eventRowsRef.current[eventId];
      if (row) {
        row.focus();
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 0);
  }, []);
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!events.length || !selectedEventId) return;
    
    const currentIndex = events.findIndex((event: any) => 
      event.eventId === selectedEventId || event.eid === selectedEventId
    );
    
    if (currentIndex === -1) return;
    
    let newIndex;
    
    // Handle arrow key navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = Math.min(currentIndex + 1, events.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = Math.max(currentIndex - 1, 0);
    } else {
      return;
    }
    
    // If index changed, select the new event
    if (newIndex !== currentIndex) {
      const newEvent = events[newIndex];
      const newEventId = newEvent.eventId || newEvent.eid;
      handleSelectEvent(newEventId);
    }
  }, [events, selectedEventId, handleSelectEvent]);
  
  const refreshEvents = () => {
    setIsSearching(true);
    setSelectedEventId(null); // Clear selection
    refetch().finally(() => {
      setIsSearching(false);
    });
  };
  
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    setCustomDate(null);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
  };
  
  const handleDateSelect = (date: Date | null) => {
    setCustomDate(date);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
  };
  
  // Handle Trace Event
  const handleTraceEvent = (eventId: string) => {
    console.log(`Trace event: ${eventId}`);
    // Implementation would navigate to trace page with this event
    window.open(`/trace?queue=${queueId}&event=${eventId}`, '_blank');
  };
  
  // Handle Replay Event
  const handleReplayEvent = async (eventId: string) => {
    console.log(`Replay event: ${eventId}`);
    
    // Find the event
    const event = events.find((e: any) => e.eventId === eventId || e.eid === eventId);
    if (!event) {
      console.error('Event not found:', eventId);
      return;
    }
    
    setDialogEventId(eventId);
    
    // Get bots that read from this queue directly from nodeData
    const botOptionsFromNode: Array<{id: string, name: string}> = [];
    
    if (nodeData && nodeData.bots && nodeData.bots.read) {
      // Extract bot information from nodeData
      Object.entries(nodeData.bots.read).forEach(([botId, botData]: [string, any]) => {
        botOptionsFromNode.push({
          id: botId,
          name: (nodeData.nodes && nodeData.nodes[botId] && nodeData.nodes[botId].label) || botId
        });
      });
    }
    
    console.log(`Found ${botOptionsFromNode.length} bots that read from queue ${queueId}:`, botOptionsFromNode);
    setBotOptions(botOptionsFromNode);
    
    // Show replay dialog
    setShowReplayDialog(true);
  };
  
  // Handle Resubmit Event
  const handleResubmitEvent = (eventId: string) => {
    console.log(`Resubmit event: ${eventId}`);
    
    // Find the event
    const event = events.find((e: any) => e.eventId === eventId || e.eid === eventId);
    if (!event) {
      console.error('Event not found:', eventId);
      return;
    }
    
    setDialogEventId(eventId);
    
    // Show resubmit dialog
    setShowResubmitDialog(true);
  };
  
  // Helper function to format date to just show time
  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Ensure first event is selected when events load
  useEffect(() => {
    // Auto-select first event when events load as long as we're not actively searching
    if (events.length > 0 && !selectedEventId && !isSearching) {
      const firstEventId = events[0].eventId || events[0].eid;
      setSelectedEventId(firstEventId);
      
      // Focus and scroll to the first row after a brief delay to ensure rendering is complete
      setTimeout(() => {
        const firstRow = eventRowsRef.current[firstEventId];
        if (firstRow) {
          firstRow.focus();
          firstRow.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
      }, 100);
    }
  }, [events, selectedEventId, isSearching]);

  // Add tabIndex to document to enable keyboard navigation when component mounts
  useEffect(() => {
    // Make the events container focusable on mount
    if (eventsContainerRef.current) {
      eventsContainerRef.current.tabIndex = 0;
    }
    
    // Return cleanup function
    return () => {
      eventRowsRef.current = {};
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        {/* Search and Time range selector in same row */}
        <div className="flex items-center space-x-2">
          {/* Search input - now can grow to fill available space */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search events or enter EID (z/...)"
              className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-4 text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Time range selector - now right justified */}
          <div className="flex flex-wrap items-center gap-1 ml-auto">
            <div className="flex items-center">
              <Clock size={16} className="text-gray-500 dark:text-gray-400 mr-1" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Time range:</span>
            </div>
            
            {Object.keys(TIME_RANGES).map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`text-xs px-2 py-1 rounded-md ${
                  selectedTimeRange === range
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
            
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center text-xs px-2 py-1 rounded-md ${
                customDate
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar size={12} className="mr-1" />
              {customDate ? formatDateTime(customDate.toISOString()) : 'Custom'}
            </button>
          </div>
          
          <button
            onClick={refreshEvents}
            disabled={isLoading || isSearching}
            className="flex items-center px-3 py-2 text-sm font-medium 
                     rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200
                     dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={`mr-1 ${(isLoading || isSearching) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {showDatePicker && (
          <div className="absolute z-10 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 border border-gray-200 dark:border-gray-700 mt-8 right-32">
            {/* @ts-ignore */}
            <DatePicker
              selected={customDate}
              onChange={handleDateSelect}
              showTimeSelect
              dateFormat="yyyy-MM-dd HH:mm"
              timeFormat="HH:mm"
              timeIntervals={15}
              inline
            />
          </div>
        )}
      </div>
      
      {/* Debug information */}
      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
        <div>Searching queue: {queueId} | EID: {eid.substring(0, 20)}...{searchText && ` | Search: "${searchText}"`}</div>
        <div>Events found: {events.length}{response.resumptionToken && ' | More events available'}</div>
        {lastQueryFailed && <div className="text-amber-500">Last query returned no results. Try adjusting your search parameters.</div>}
      </div>
      
      {/* Split view layout */}
      <div className="flex h-[calc(100vh-300px)] min-h-[500px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        {/* Left half - Events table */}
        <div 
          className="w-1/2 overflow-auto border-r border-gray-200 dark:border-gray-700"
          ref={eventsContainerRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {isLoading || isSearching ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw size={24} className="animate-spin text-gray-400 dark:text-gray-600" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading events...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full text-red-500 dark:text-red-400">
              <p>Error loading events. Please try again.</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>{lastQueryFailed ? "Query returned no results. Try adjusting your search parameters." : "No events found."}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-auto flex-grow">
                    Event ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px] whitespace-nowrap">
                    Event Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px] whitespace-nowrap">
                    Source Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {events.map((event: any) => {
                  const eventId = event.eventId || event.eid;
                  return (
                    <tr 
                      key={eventId} 
                      data-event-id={eventId}
                      onClick={() => handleSelectEvent(eventId)}
                      ref={(el) => {
                        if (el) eventRowsRef.current[eventId] = el;
                      }}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedEventId === eventId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      tabIndex={0}
                      role="button"
                      aria-selected={selectedEventId === eventId}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-800 dark:text-gray-200 overflow-hidden text-ellipsis">
                        {eventId}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-[100px]">
                        {formatTimeOnly(event.timestamp)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-[100px]">
                        {formatTimeOnly(event.event_source_timestamp)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right w-[100px]">
                        <div className="flex space-x-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          <button 
                            title="Trace this event" 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            onClick={() => handleTraceEvent(eventId)}
                          >
                            <Zap size={16} />
                          </button>
                          <button
                            title="Replay from this event" 
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            onClick={() => handleReplayEvent(eventId)}
                          >
                            <RotateCw size={16} />
                          </button>
                          <button
                            title="Resubmit this event" 
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                            onClick={() => handleResubmitEvent(eventId)}
                          >
                            <Target size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Right half - Payload viewer */}
        <div className="w-1/2 overflow-auto bg-gray-50 dark:bg-gray-800">
          {selectedEvent ? (
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Event Payload
                </h3>
                {/* Mode Selector and Actions Row */}
                <div className="flex items-center space-x-3">
                  {/* Custom action buttons that would normally be in the main menu */}
                  <div className="custom-json-editor-buttons">
                    {/* Add search field */}
                    <div className="relative mr-1">
                      <input
                        type="text"
                        placeholder="Search JSON..."
                        className="text-xs px-2 py-0.5 border border-gray-200 dark:border-gray-700 rounded w-24
                                  bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                                  focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onChange={(e) => {
                          if (editorRef.current) {
                            try {
                              // Using the enhanced search method from our JSONEditorHandle
                              editorRef.current.search(e.target.value);
                            } catch (err) {
                              console.error('Error searching JSON:', err);
                              // No need to show an error to the user, just log it
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Make pressing Enter also trigger search
                          if (e.key === 'Enter' && editorRef.current) {
                            try {
                              editorRef.current.search((e.target as HTMLInputElement).value);
                            } catch (err) {
                              console.error('Error searching JSON:', err);
                            }
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
                        } catch (e) {
                          console.error('Error copying to clipboard:', e);
                        }
                      }}
                      className="custom-json-editor-button"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        try {
                          if (editorRef.current) {
                            editorRef.current.expandAll();
                          }
                        } catch (err) {
                          console.error('Error expanding JSON:', err);
                        }
                      }}
                      className="custom-json-editor-button"
                      title="Expand all fields"
                    >
                      Expand
                    </button>
                    <button
                      onClick={() => {
                        try {
                          if (editorRef.current) {
                            editorRef.current.collapseAll();
                          }
                        } catch (err) {
                          console.error('Error collapsing JSON:', err);
                        }
                      }}
                      className="custom-json-editor-button"
                      title="Collapse all fields"
                    >
                      Collapse
                    </button>
                  </div>
                  
                  {/* View mode toggles */}
                  <div className="flex space-x-1">
                    {['tree', 'code', 'view'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setJsonEditorMode(m as any)}
                        className={`text-xs px-2 py-0.5 rounded ${
                          jsonEditorMode === m
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 rounded-md overflow-hidden">
                <JSONEditorComponent 
                  data={selectedEvent.payload}
                  mode={jsonEditorMode}
                  height="100%"
                  onChange={handleJsonChange}
                  key={`json-editor-${selectedEventId}`}
                  showMainMenu={false}
                  className="custom-json-editor"
                  ref={editorRef}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>Select an event to view its payload</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Load more button */}
      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Showing {events.length} events
        </span>
        
        {response.resumptionToken && (
          <button
            onClick={() => {
              // Implement load more logic here
            }}
            className="ml-auto flex items-center px-3 py-1.5 text-xs font-medium 
                     rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100
                     dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightCircle size={14} className="mr-1" />
            Load More
          </button>
        )}
      </div>
      
      {/* Replay Dialog */}
      <EventReplayDialog
        open={showReplayDialog}
        onClose={() => setShowReplayDialog(false)}
        queueId={queueId}
        eventId={dialogEventId}
        event={selectedEvent}
        botOptions={botOptions}
      />
      
      {/* Resubmit Dialog */}
      <EventResubmitDialog
        open={showResubmitDialog}
        onClose={() => setShowResubmitDialog(false)}
        queueId={queueId}
        eventId={dialogEventId}
        event={selectedEvent}
      />
    </div>
  );
};

export default QueueEventsTab; 