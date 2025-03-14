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
import { 
  useSearchSystemEvents,
  useEventReplay,
  useEventResubmit
} from '@/context/ApiContext';
import { useToast } from '@/components/ui/toast';
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

interface SystemEventsTabProps {
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
                         bg-white dark:bg-gray-800 shadow-sm px-4 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
              >
                {botOptions.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name || bot.id}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-amber-500 dark:text-amber-400">
                No bots are configured to process events from this queue.
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                     rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleReplay}
            disabled={!selectedBotId || botOptions.length === 0}
            className="ml-3 px-4 py-2 text-sm font-medium text-white
                     bg-blue-600 border border-transparent rounded-md shadow-sm
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Replay Event
          </button>
        </DialogFooter>
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
  const [editorMode, setEditorMode] = useState<'tree' | 'code' | 'text' | 'view'>('code');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const payloadDataRef = useRef<any>(event?.payload || {});
  const resubmitMutation = useEventResubmit();
  const { addToast } = useToast();

  // Initialize payload data when event changes
  useEffect(() => {
    if (event && eventId) {
      try {
        // If payload is a string that contains JSON, parse it
        let enhancedPayload = event.payload;
        if (typeof event.payload === 'string') {
          try {
            enhancedPayload = JSON.parse(event.payload);
          } catch (e) {
            // Keep as string if not valid JSON
            enhancedPayload = event.payload;
          }
        }
        
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
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                     rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleResubmit}
            disabled={!isValid}
            className="ml-3 px-4 py-2 text-sm font-medium text-white
                     bg-blue-600 border border-transparent rounded-md shadow-sm
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resubmit Event
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SystemEventsTab: React.FC<SystemEventsTabProps> = ({ nodeData }) => {
  // State for events data
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eid, setEid] = useState<string>('');
  const [resumptionToken, setResumptionToken] = useState<string | null>(null);
  const [queueId, setQueueId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1h');
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lastQueryFailed, setLastQueryFailed] = useState<boolean>(false);
  
  // State for dialogs
  const [showReplayDialog, setShowReplayDialog] = useState<boolean>(false);
  const [showResubmitDialog, setShowResubmitDialog] = useState<boolean>(false);
  const [dialogEventId, setDialogEventId] = useState<string>('');
  const [botOptions, setBotOptions] = useState<Array<{id: string, name: string}>>([]);
  
  // JSON editor state
  const [jsonEditorMode, setJsonEditorMode] = useState<'tree' | 'code' | 'text' | 'view'>('code');
  const editorRef = useRef<JSONEditorHandle>(null);
  
  // Refs for keyboard navigation
  const eventRowsRef = useRef<Record<string, HTMLTableRowElement>>({});
  const loadingMoreRef = useRef<boolean>(false);
  
  // Extract queue ID from node data
  useEffect(() => {
    if (nodeData && nodeData.id) {
      setQueueId(nodeData.id);
    }
  }, [nodeData]);
  
  // Initialize with default time range (1 hour ago)
  useEffect(() => {
    if (queueId) {
      const defaultEid = getEidForTimeRange(TIME_RANGES['1h']);
      setEid(defaultEid);
    }
  }, [queueId]);
  
  // Set up the query with React Query
  const { 
    data: response, 
    isLoading, 
    isError, 
    refetch,
    isFetching
  } = useSearchSystemEvents(
    queueId,
    eid,
    searchText || undefined,
    100
  );
  
  // First useEffect to handle initial results
  useEffect(() => {
    if (response) {
      // Check if we have results
      if (response.results && response.results.length > 0) {
        setEvents(response.results);
        setLastQueryFailed(false);
      } else {
        // No results returned
        setLastQueryFailed(true);
      }
    }
  }, [response]);
  
  // Second useEffect to handle resumption token
  useEffect(() => {
    if (response && response.resumptionToken) {
      setResumptionToken(response.resumptionToken);
    }
  }, [response]);
  
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
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedEventId || events.length === 0) return;
      
      // Find the index of the currently selected event
      const currentIndex = events.findIndex(
        event => (event.eventId || event.eid) === selectedEventId
      );
      
      if (currentIndex === -1) return;
      
      let newIndex = currentIndex;
      
      // Handle arrow keys
      if (e.key === 'ArrowDown' && currentIndex < events.length - 1) {
        newIndex = currentIndex + 1;
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }
      
      // If index changed, update selection
      if (newIndex !== currentIndex) {
        const newEventId = events[newIndex].eventId || events[newIndex].eid;
        setSelectedEventId(newEventId);
        
        // Focus and scroll the row into view
        const row = eventRowsRef.current[newEventId];
        if (row) {
          row.focus();
          row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEventId, events]);
  
  // Find the selected event object
  const selectedEvent = useMemo(() => {
    return events.find(e => (e.eventId || e.eid) === selectedEventId) || null;
  }, [events, selectedEventId]);
  
  // Handle selecting an event
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    // Event object is found via the selectedEvent memo
  };
  
  // Handle refresh button
  const handleRefresh = () => {
    setIsSearching(true);
    setSelectedEventId(null); // Clear selection
    refetch().finally(() => {
      setIsSearching(false);
    });
  };
  
  // Load more events using the resumption token
  const loadMoreEvents = useCallback(() => {
    if (!resumptionToken || loadingMoreRef.current) return;
    
    loadingMoreRef.current = true;
    
    // Use requestAnimationFrame to avoid state updates being batched
    requestAnimationFrame(() => {
      // Only use the resumption token if it matches what we expect
      if (resumptionToken) {
        setEid(resumptionToken);
      }
    });
  }, [resumptionToken]);
  
  // Helper function to format date to just show time
  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
  
  const handleTimeRangeChange = (range: string) => {
    setSelectedTimeRange(range);
    setCustomDate(null);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
    
    if (range === 'custom') {
      // For custom, we'll use the date picker
      setShowDatePicker(true);
      return;
    }
    
    // Calculate EID based on time range
    const minutes = TIME_RANGES[range as keyof typeof TIME_RANGES] || 0;
    const newEid = getEidForTimeRange(minutes);
    
    // Update EID for query
    setEid(newEid);
    // Clear resumption token to start fresh
    setResumptionToken(null);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date | null) => {
    setCustomDate(date);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
    
    if (date) {
      const newEid = formatDateToEid(date);
      setEid(newEid);
      // Clear resumption token to start fresh
      setResumptionToken(null);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Search controls */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        {/* Left side - Search box, time range */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search input */}
          <div className="relative flex-grow max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search events..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-800 text-sm shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
            />
          </div>
          
          {/* Time range selector */}
          <div className="relative inline-block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock size={16} className="text-gray-400" />
            </div>
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-800 text-sm shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="30s">Last 30 seconds</option>
              <option value="1m">Last 1 minute</option>
              <option value="5m">Last 5 minutes</option>
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="1d">Last 1 day</option>
              <option value="1w">Last 1 week</option>
              <option value="custom">Custom date</option>
            </select>
          </div>
          
          {/* Date picker - only show if custom time range */}
          {showDatePicker && (
            <div className="relative inline-block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              {/* @ts-ignore */}
              <DatePicker
                selected={customDate}
                onChange={handleDateSelect}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-md bg-white dark:bg-gray-800 text-sm shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholderText="Select date and time"
              />
            </div>
          )}
        </div>
        
        {/* Right side - Refresh button */}
        <div className="flex items-center">
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                     rounded-md text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={`mr-1 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} />
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
          {isLoading || isFetching ? (
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
                      ref={(el) => {
                        if (el) eventRowsRef.current[eventId] = el;
                      }}
                      tabIndex={0}
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
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400 w-[100px]">
                        <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          {/* Trace button */}
                          <button
                            onClick={() => handleTraceEvent(eventId)}
                            className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                            title="Trace Event"
                          >
                            <Target size={16} />
                          </button>
                          
                          {/* Replay button */}
                          <button
                            onClick={() => handleReplayEvent(eventId)}
                            className="p-1 text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400"
                            title="Replay Event"
                          >
                            <RotateCw size={16} />
                          </button>
                          
                          {/* Resubmit button */}
                          <button
                            onClick={() => handleResubmitEvent(eventId)}
                            className="p-1 text-gray-400 hover:text-amber-500 dark:text-gray-500 dark:hover:text-amber-400"
                            title="Resubmit Event"
                          >
                            <Zap size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
                  
          {/* "Load More" button shown if resumptionToken is available */}
          {resumptionToken && (
            <div className="p-2 text-center">
              <button
                onClick={loadMoreEvents}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                         rounded-md text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Load More
              </button>
            </div>
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
              
              {/* Event details section */}
              <div className="mb-2 bg-white dark:bg-gray-900 p-2 rounded text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">ID: </span>
                    <span className="font-mono">{selectedEvent.eventId || selectedEvent.eid}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created: </span>
                    <span>{formatDateTime(selectedEvent.timestamp)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Source Time: </span>
                    <span>{formatDateTime(selectedEvent.event_source_timestamp)}</span>
                  </div>
                  {selectedEvent.source && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Source: </span>
                      <span>{selectedEvent.source}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* JSON Editor */}
              <div className="flex-1 mt-2 custom-json-editor">
                <JSONEditorComponent
                  ref={editorRef}
                  key={selectedEventId} // Important: re-render when event changes
                  data={selectedEvent.payload}
                  mode={jsonEditorMode}
                  height="100%"
                  showMainMenu={false}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>Select an event to view details</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Dialog for replaying events */}
      {showReplayDialog && selectedEvent && (
        <EventReplayDialog
          open={showReplayDialog}
          onClose={() => setShowReplayDialog(false)}
          queueId={queueId}
          eventId={dialogEventId}
          event={selectedEvent}
          botOptions={botOptions}
        />
      )}
      
      {/* Dialog for resubmitting events */}
      {showResubmitDialog && selectedEvent && (
        <EventResubmitDialog
          open={showResubmitDialog}
          onClose={() => setShowResubmitDialog(false)}
          queueId={queueId}
          eventId={dialogEventId}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default SystemEventsTab; 