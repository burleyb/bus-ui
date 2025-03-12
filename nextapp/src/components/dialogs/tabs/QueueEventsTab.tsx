"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import JSONEditorComponent from '@/components/json/JSONEditorComponent';

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
            <select
              id="bot-select"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                      focus:ring-2 focus:ring-blue-500"
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
            >
              {botOptions.length === 0 && (
                <option value="">No bots available</option>
              )}
              {botOptions.map((bot) => (
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
  const [payloadData, setPayloadData] = useState<any>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [editorMode, setEditorMode] = useState<'tree' | 'code' | 'form' | 'text'>('code');

  // Initialize payload when dialog opens
  useEffect(() => {
    if (event && event.payload) {
      try {
        // Add the original event ID to the payload
        const enhancedPayload = {
          ...event.payload,
          original_eid: eventId
        };
        setPayloadData(enhancedPayload);
        setIsValid(true);
        setErrorMessage('');
      } catch (error) {
        console.error('Error formatting payload:', error);
        setPayloadData(event.payload || {});
      }
    }
  }, [event, eventId]);

  // Handle payload change
  const handlePayloadChange = (data: any) => {
    setPayloadData(data);
    setIsValid(true);
    setErrorMessage('');
  };

  // Handle editor errors
  const handleEditorError = (error: Error) => {
    setIsValid(false);
    setErrorMessage(error.message);
  };

  const handleResubmit = async () => {
    if (!isValid || !payloadData) return;
    
    try {
      // Extract botId from queueId
      const botIdPart = queueId.split(':')[1];
      const botId = botIdPart ? `bot:${botIdPart}` : '';
      
      const data = {
        botId: botId,
        queue: queueId,
        payload: payloadData
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
                {['code', 'tree', 'form', 'text'].map((m) => (
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
                data={payloadData}
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
  const [resumptionToken, setResumptionToken] = useState<string | null>(null);
  const [cachedEvents, setCachedEvents] = useState<any[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [lastQueryFailed, setLastQueryFailed] = useState(false);
  
  // Dialog state
  const [showReplayDialog, setShowReplayDialog] = useState(false);
  const [showResubmitDialog, setShowResubmitDialog] = useState(false);
  const [dialogEventId, setDialogEventId] = useState<string>('');
  const [botOptions, setBotOptions] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(false);
  const [jsonEditorMode, setJsonEditorMode] = useState<'tree' | 'code' | 'form' | 'view' | 'text'>('tree');

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
  
  // Get the current effective EID for querying (either from input or from resumptionToken)
  const currentEid = resumptionToken || eid;
  
  // Fetch events using the hook
  const { 
    data: response = { results: [], resumptionToken: null }, 
    isLoading,
    isError,
    refetch
  } = useSearchQueueEvents(queueId, currentEid, searchText);
  
  // Process the response data and update our cached events
  useEffect(() => {
    // Only update if we have a valid response and not searching
    if (response && !isSearching) {
      // Check if we have results
      if (response.results && Array.isArray(response.results)) {
        // For logging purposes
        console.log(`[QueueEventsTab] Received ${response.results.length} events from API`);
        
        // If this is the first batch or we're refreshing (no resumption token)
        if (!resumptionToken) {
          setCachedEvents(response.results);
          
          // Auto-select the first event if we have results
          if (response.results.length > 0) {
            const firstEvent = response.results[0];
            const eventId = firstEvent.eventId || firstEvent.eid || firstEvent.id;
            if (eventId) {
              setSelectedEventId(eventId);
            }
          }
        } else {
          // Append to existing cached events if using resumption token
          setCachedEvents(prev => [...prev, ...response.results]);
        }
        
        // Update event count
        setEventCount(response.results.length);
        
        // Mark that the query succeeded
        setLastQueryFailed(false);
      } else {
        console.warn('[QueueEventsTab] No results array in response:', response);
        
        // Only clear events if this is a fresh query, not when appending
        if (!resumptionToken) {
          setCachedEvents([]);
          setSelectedEventId(null);
        }
        
        // Mark that the query failed
        setLastQueryFailed(true);
      }
    }
    
    // Update resumption token when response changes
    if (response && response.resumptionToken) {
      setResumptionToken(response.resumptionToken);
    }
  }, [response, isSearching, resumptionToken]);
  
  // Get raw events array from response or our cached events
  const rawEvents = useMemo(() => {
    // Always use our cached events instead of directly using response.results
    return cachedEvents;
  }, [cachedEvents]);
  
  // Process the events to ensure they have consistent structure
  const events = useMemo(() => {
    console.log('Raw events data:', rawEvents);

    // Handle different possible response formats
    if (!rawEvents || !Array.isArray(rawEvents)) {
      console.warn('Events data is not an array:', rawEvents);
      return [];
    }

    // Normalize event data to a consistent format
    return rawEvents.map(event => {
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
  }, [rawEvents]);
  
  // Get the currently selected event
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(event => event.eventId === selectedEventId || event.eid === selectedEventId);
  }, [selectedEventId, events]);
  
  // Select an event to view details
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId === selectedEventId ? null : eventId);
  };
  
  const refreshEvents = () => {
    setIsSearching(true);
    setResumptionToken(null); // Clear resumption token to start fresh
    setSelectedEventId(null); // Clear selection
    setCachedEvents([]); // Clear cached events
    refetch().finally(() => {
      setIsSearching(false);
    });
  };
  
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    setCustomDate(null);
    setShowDatePicker(false);
    setResumptionToken(null); // Clear resumption token when changing time range
    setSelectedEventId(null); // Clear selection
  };
  
  const handleDateSelect = (date: Date | null) => {
    setCustomDate(date);
    setShowDatePicker(false);
    setResumptionToken(null); // Clear resumption token when selecting a custom date
    setSelectedEventId(null); // Clear selection
  };
  
  const loadMoreEvents = () => {
    if (resumptionToken) {
      setIsSearching(true);
      refetch().finally(() => {
        setIsSearching(false);
      });
    }
  };
  
  // Function to load bot options from the dashboard monitor API
  const loadBotOptions = async (queueId: string) => {
    setIsLoadingBots(true);
    
    try {
      // Get current time
      const timestamp = new Date().toISOString();
      
      // Construct URL with parameters
      const url = `/api/dashboard/monitor?range=minute&count=15&timestamp=${encodeURIComponent(timestamp)}`;
      console.log('Loading bot options from:', url);
      
      const response = await awsNativeFetch(url);
      
      if (!response.ok) {
        throw new Error(`Error loading bot options: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dashboard monitor response:', data);
      
      // Extract bots that read from this queue
      let bots: Array<{id: string, name: string}> = [];
      
      if (data && data.bots && data.bots.read) {
        // Map bot IDs to the format we need
        bots = Object.keys(data.bots.read).map(id => ({
          id: id,
          name: id
        }));
      }
      
      console.log('Extracted bot options:', bots);
      setBotOptions(bots);
    } catch (error) {
      console.error('Error loading bot options:', error);
      setBotOptions([]);
    } finally {
      setIsLoadingBots(false);
    }
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
    const event = events.find(e => e.eventId === eventId || e.eid === eventId);
    if (!event) {
      console.error('Event not found:', eventId);
      return;
    }
    
    setDialogEventId(eventId);
    
    // Load bot options
    await loadBotOptions(queueId);
    
    // Show replay dialog
    setShowReplayDialog(true);
  };
  
  // Handle Resubmit Event
  const handleResubmitEvent = (eventId: string) => {
    console.log(`Resubmit event: ${eventId}`);
    
    // Find the event
    const event = events.find(e => e.eventId === eventId || e.eid === eventId);
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
  
  const handleJsonChange = (data: any) => {
    // Handle JSON change in the editor
    if (!selectedEventId || !data) return;

    // Find and update the event in our cached events array
    const updatedEvents = cachedEvents.map(event => {
      if ((event.eventId === selectedEventId || event.eid === selectedEventId)) {
        return {
          ...event,
          payload: data
        };
      }
      return event;
    });

    // Update the cached events with the modified data
    setCachedEvents(updatedEvents);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        {/* Time range selector */}
        <div className="flex flex-wrap items-center gap-2">
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
          
          {showDatePicker && (
            <div className="absolute z-10 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 border border-gray-200 dark:border-gray-700 mt-8">
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
        
        <div className="flex items-center space-x-2">
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
          <button
            onClick={refreshEvents}
            disabled={isLoading || isSearching}
            className="ml-2 flex items-center px-3 py-2 text-sm font-medium 
                     rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200
                     dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={`mr-1 ${(isLoading || isSearching) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Debug information */}
      <div className="text-xs text-gray-500 dark:text-gray-400 italic">
        <div>Searching queue: {queueId} | EID: {resumptionToken || eid.substring(0, 20)}...{searchText && ` | Search: "${searchText}"`}</div>
        <div>Events found: {events.length}{resumptionToken && ' | More events available'}</div>
        {lastQueryFailed && <div className="text-amber-500">Last query returned no results. Try adjusting your search parameters.</div>}
      </div>
      
      {/* Split view layout */}
      <div className="flex h-[calc(100vh-300px)] min-h-[500px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        {/* Left half - Events table */}
        <div className="w-1/2 overflow-auto border-r border-gray-200 dark:border-gray-700">
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
                {events.map((event) => {
                  const eventId = event.eventId || event.eid;
                  return (
                    <tr 
                      key={eventId} 
                      onClick={() => handleSelectEvent(eventId)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedEventId === eventId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
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
                {/* Mode Selector */}
                <div className="flex space-x-1">
                  {['tree', 'code', 'form', 'view', 'text'].map((m) => (
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
              <div className="flex-1 rounded-md overflow-hidden">
                <JSONEditorComponent 
                  data={selectedEvent.payload}
                  mode={jsonEditorMode}
                  height="100%"
                  onChange={handleJsonChange}
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
        
        {resumptionToken && (
          <button
            onClick={loadMoreEvents}
            disabled={isLoading || isSearching}
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
        event={events.find(e => e.eventId === dialogEventId || e.eid === dialogEventId)}
        botOptions={botOptions}
      />
      
      {/* Resubmit Dialog */}
      <EventResubmitDialog
        open={showResubmitDialog}
        onClose={() => setShowResubmitDialog(false)}
        queueId={queueId}
        eventId={dialogEventId}
        event={events.find(e => e.eventId === dialogEventId || e.eid === dialogEventId)}
      />
    </div>
  );
};

export default QueueEventsTab; 