"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  RefreshCw, 
  Search, 
  Calendar,
  Clock,
  Zap
} from 'lucide-react';
import { useTraceSearch } from '@/hooks/useTraceActions';
import { 
  TIME_RANGES, 
  isEid,
  formatDateTime
} from '@/lib/dateUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppContext } from '@/context/AppContext';
import JSONEditorComponent, { JSONEditorHandle } from '@/components/json/JSONEditorComponent';
import CatalogSearch from '@/components/catalog/CatalogSearch';
import TraceDialog from '@/components/dialogs/TraceDialog';

export default function TracePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useAppContext();
  
  // Get query parameters with defaults
  const initialQueueId = searchParams?.get('queue') || '';
  const initialEventId = searchParams?.get('event') || '';
  
  // State for queue search
  const [queueId, setQueueId] = useState<string>(initialQueueId);
  
  // State for event selection and display
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const editorRef = useRef<JSONEditorHandle>(null);
  const [jsonEditorMode, setJsonEditorMode] = useState<'tree' | 'view' | 'code'>('code');
  
  // State for trace dialog
  const [showTraceDialog, setShowTraceDialog] = useState(false);
  const [traceQueueId, setTraceQueueId] = useState<string>('');
  const [traceEventId, setTraceEventId] = useState<string>('');
  
  // Refs for event list and keyboard navigation
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const eventRowsRef = useRef<{ [id: string]: HTMLTableRowElement }>({});
  
  // Ref to track if we're manually updating the hash
  const isUpdatingHashRef = useRef(false);
  
  // Helper function to get URL hash parameters
  const getUrlHash = useCallback((): Record<string, any> => {
    if (typeof window === 'undefined') return {};
    
    try {
      if (window.location.hash && window.location.hash.length > 1) {
        // Get hash and remove the # character
        let hashStr = window.location.hash.substring(1);
        
        // Decode the URL-encoded hash
        try {
          hashStr = decodeURIComponent(hashStr);
        } catch (decodeError) {
          console.error('Error decoding hash:', decodeError);
          return {}; // If we can't decode, return empty object
        }
        
        // Parse the hash as JSON
        if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
          return JSON.parse(hashStr);
        }
      }
    } catch (error) {
      console.error('Error parsing hash:', error);
    }
    
    return {};
  }, []);
  
  // Helper function to update URL hash - use history.replaceState to avoid
  // triggering hashchange events when we're the ones updating the hash
  const updateUrlHash = useCallback((newParams: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get current parameters
      const currentParams = getUrlHash();
      
      // Merge with new parameters
      const updatedParams = { ...currentParams, ...newParams };
      
      // Mark that we're updating the hash
      isUpdatingHashRef.current = true;
      
      // Convert to JSON string, encode, and update URL hash using history.replaceState
      const hashStr = JSON.stringify(updatedParams);
      const newUrl = window.location.pathname + window.location.search + '#' + encodeURIComponent(hashStr);
      window.history.replaceState(null, '', newUrl);
      
      // Update AppContext state without triggering another URL update
      if (newParams.timePeriod) {
        dispatch({
          type: 'CHANGE_TIME_PERIOD',
          payload: newParams.timePeriod
        });
      }
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingHashRef.current = false;
      }, 50);
    } catch (error) {
      console.error('Error updating URL hash:', error);
      isUpdatingHashRef.current = false;
    }
  }, [getUrlHash, dispatch]);
  
  // Get initial time settings from URL hash or use defaults
  const getInitialTimeSettings = useCallback(() => {
    const hashParams = getUrlHash();
    let initialTimeRange = '5m';  // Default time range
    let initialCustomDate: Date | null = null;
    
    if (hashParams.timePeriod) {
      if (hashParams.timePeriod.interval) {
        // Extract the time range - we need to convert from the app context format (like "hour_6") 
        // to our local format (like "6h")
        const interval = hashParams.timePeriod.interval;
        
        if (interval.includes('_')) {
          const [unit, value] = interval.split('_');
          if (unit === 'minute' && value === '15') initialTimeRange = '15m';
          else if (unit === 'hour' && value === '1') initialTimeRange = '1h';
          else if (unit === 'hour' && value === '6') initialTimeRange = '6h';
          else if (unit === 'day' && value === '1') initialTimeRange = '1d';
          else if (unit === 'day' && value === '7') initialTimeRange = '1w';
          else if (unit === 'week' && value === '1') initialTimeRange = '1w'; // Support week_1 format
        }
        
        console.log(`Initial interval from hash: ${interval}, converted to: ${initialTimeRange}`);
      }
      
      // If we have begin or end times, use them for custom date
      if (hashParams.timePeriod.end) {
        try {
          initialCustomDate = new Date(hashParams.timePeriod.end);
          initialTimeRange = ''; // Clear time range if we have a custom date
        } catch (e) {
          console.error('Error parsing custom date from hash:', e);
        }
      }
    }
    
    return { initialTimeRange, initialCustomDate };
  }, [getUrlHash]);
  
  const { initialTimeRange, initialCustomDate } = getInitialTimeSettings();
  
  // Use the trace search hook to handle searching and filtering
  const { 
    events,
    isLoading,
    isError,
    timeRange,
    customDate,
    searchText,
    setSearchText,
    setTimeRange,
    setCustomDate,
    refetch: refreshEvents
  } = useTraceSearch(
    queueId,                // queueId to search
    initialTimeRange,       // time range from URL hash or default
    initialCustomDate,      // custom date from URL hash or null
    ''                      // no initial search text
  );
  
  // Track whether events are being loaded
  const [lastQueryFailed, setLastQueryFailed] = useState(false);
  
  // Memoize the selected event for more efficient rendering
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((event: any) => event.eventId === selectedEventId || event.eid === selectedEventId);
  }, [selectedEventId, events]);
  
  // Handle queue search change
  const handleQueueSearchChange = (search: string) => {
    // Extract queue ID from search
    const queuePrefix = 'queue:';
    const queueIdValue = search.startsWith(queuePrefix) 
      ? search 
      : `${queuePrefix}${search}`;
    
    setQueueId(queueIdValue);
    setSelectedEventId(null);
    
    // Update URL
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('queue', queueIdValue);
    params.delete('event');
    router.push(`/trace?${params.toString()}`);
  };
  
  // Select an event to view details
  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEventId(prevId => eventId === prevId ? null : eventId);
    
    // Update URL
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('event', eventId);
    router.push(`/trace?${params.toString()}`);
    
    // Focus the selected row and scroll it into view
    setTimeout(() => {
      const row = eventRowsRef.current[eventId];
      if (row) {
        row.focus();
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }, [router, searchParams]);
  
  // Handle trace event
  const handleTraceEvent = (eventId: string) => {
    // Save the queue ID and event ID for the trace dialog
    setTraceQueueId(queueId);
    setTraceEventId(eventId);
    setShowTraceDialog(true);
  };
  
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
  
  // Handle time range change with URL hash update
  const handleTimeRangeChange = (range: string) => {
    console.log(`Time range selected: ${range}`);
    setTimeRange(range);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
    
    // Update URL hash - convert our time ranges to format used in the rest of the app
    let interval = 'minute_15'; // Default
    
    switch(range) {
      case '30s':
        interval = 'minute_1'; // Approximate equivalent
        break;
      case '1m':
        interval = 'minute_1';
        break;
      case '5m':
        interval = 'minute_5';
        break;
      case '15m':
        interval = 'minute_15';
        break;
      case '1h':
        interval = 'hour_1';
        break;
      case '6h':
        interval = 'hour_6';
        break;
      case '1d':
        interval = 'day_1';
        break;
      case '1w':
        // Use week_1 instead of day_7 for consistency with other parts of the app
        interval = 'week_1';
        break;
    }
    
    console.log(`Converting ${range} to interval format: ${interval}`);
    
    // Update URL hash for persistence (this will also update AppContext via our updateUrlHash function)
    updateUrlHash({ 
      timePeriod: { 
        interval,
        begin: undefined,
        end: undefined
      } 
    });
  };
  
  // Handle date select with URL hash update
  const handleDateSelect = (date: Date | null) => {
    setCustomDate(date);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
    
    if (date) {
      // For custom date, calculate a time range around the selected date
      // Using a 15-minute window centered on the selected time
      const begin = new Date(date.getTime() - 7.5 * 60 * 1000); // 7.5 minutes before
      const end = new Date(date.getTime() + 7.5 * 60 * 1000);   // 7.5 minutes after
      
      // Update URL hash (this will also update AppContext via our updateUrlHash function)
      updateUrlHash({ 
        timePeriod: { 
          interval: 'minute_15',
          begin: begin.toISOString(),
          end: end.toISOString()
        } 
      });
    } else {
      // If date is null, reset to default time range
      handleTimeRangeChange('5m');
    }
  };
  
  // Helper function to format time
  const formatTimeOnly = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  // Auto-select first event when events load
  useEffect(() => {
    // Only if we don't already have a selection and we're not searching
    if (events.length > 0 && !selectedEventId && !isLoading) {
      const firstEventId = events[0].eventId || events[0].eid;
      setSelectedEventId(firstEventId);
      
      // Update URL
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('event', firstEventId);
      router.push(`/trace?${params.toString()}`);
      
      // Focus and scroll to the first row
      setTimeout(() => {
        const firstRow = eventRowsRef.current[firstEventId];
        if (firstRow) {
          firstRow.focus();
          firstRow.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
      }, 100);
    }
  }, [events, selectedEventId, isLoading, router, searchParams]);
  
  // Update state based on events data
  useEffect(() => {
    setLastQueryFailed(events.length === 0);
  }, [events.length]);
  
  // Listen for hash changes from other components
  useEffect(() => {
    const handleHashChange = () => {
      // Skip if we're the ones who just updated the hash
      if (isUpdatingHashRef.current) return;
      
      // Parse the hash to get the new time period
      const hashParams = getUrlHash();
      if (hashParams.timePeriod) {
        // Only update if the time period has actually changed
        const currentTimePeriod = state.urlObj.timePeriod || {};
        const hashTimePeriod = hashParams.timePeriod;
        
        // Compare the values to see if anything's changed
        const hasIntervalChanged = currentTimePeriod.interval !== hashTimePeriod.interval;
        const hasBeginChanged = (currentTimePeriod as any).begin !== hashTimePeriod.begin;
        const hasEndChanged = (currentTimePeriod as any).end !== hashTimePeriod.end;
        
        if (hasIntervalChanged || hasBeginChanged || hasEndChanged) {
          console.log('Hash changed, updating time settings from hash:', hashTimePeriod);
          
          // Update time range or custom date based on the hash values
          if (hashTimePeriod.interval) {
            const interval = hashTimePeriod.interval;
            let newTimeRange = '';
            
            console.log(`Converting from interval format: ${interval}`);
            
            // Convert from app format to our format
            if (interval === 'minute_1') newTimeRange = '1m';
            else if (interval === 'minute_5') newTimeRange = '5m';
            else if (interval === 'minute_15') newTimeRange = '15m';
            else if (interval === 'hour_1') newTimeRange = '1h';
            else if (interval === 'hour_6') newTimeRange = '6h';
            else if (interval === 'day_1') newTimeRange = '1d';
            else if (interval === 'day_7') newTimeRange = '1w';
            else if (interval === 'week_1') newTimeRange = '1w'; // Also support week_1 format
            
            console.log(`Converted to local format: ${newTimeRange}`);
            
            // If we have begin/end times, treat it as a custom date
            if (hashTimePeriod.end) {
              try {
                const date = new Date(hashTimePeriod.end);
                setCustomDate(date);
                setTimeRange('');
              } catch (e) {
                console.error('Error parsing custom date from hash:', e);
                setTimeRange(newTimeRange || '5m');
              }
            } else {
              // Otherwise just set the time range
              setCustomDate(null);
              setTimeRange(newTimeRange || '5m');
            }
          }
        }
      }
    };
    
    // Add event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Clean up
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [getUrlHash, state.urlObj.timePeriod]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Trace</h1>
      </div>
      
      {/* Queue Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="mb-4">
          <label htmlFor="queue-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Queue
          </label>
          <CatalogSearch 
            initialSearch={queueId.replace('queue:', '')} 
            onSearchChange={handleQueueSearchChange}
          />
        </div>
        
        {/* Time Range and Search Controls */}
        <div className="flex flex-wrap items-end space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Time range selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Time:</span>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              {Object.entries(TIME_RANGES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleTimeRangeChange(key)}
                  disabled={isLoading}
                  className={`px-2 py-1 text-xs ${
                    timeRange === key
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${(isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                disabled={isLoading}
                className={`px-2 py-1 text-xs flex items-center ${
                  customDate
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${(isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {customDate ? formatDateTime(customDate) : 'Custom'}
              </button>
            </div>
            
            {/* Date picker popover */}
            {showDatePicker && !isLoading && (
              <div className="absolute mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                {(DatePicker as any)({
                  selected: customDate,
                  onChange: handleDateSelect,
                  showTimeSelect: true,
                  timeFormat: "HH:mm",
                  timeIntervals: 15,
                  dateFormat: "MMMM d, yyyy h:mm aa",
                  inline: true
                })}
              </div>
            )}
          </div>
          
          {/* Search input */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search events or enter EID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={refreshEvents}
            disabled={isLoading}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Events and D3 Graph */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-400px)] min-h-[500px] gap-4">
        {/* Left panel - Events table */}
        <div className="lg:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Events</h2>
          
          <div 
            className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md"
            ref={eventsContainerRef}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {isLoading ? (
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[60px]">
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
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-[60px] text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTraceEvent(eventId);
                            }}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Trace Event"
                          >
                            <Zap size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Right panel - D3 Graph Visualization */}
        <div className="lg:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Event Details</h2>
            
            {/* JSON Editor Controls */}
            <div className="flex space-x-2 items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search JSON..."
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded w-32
                            bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                            focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onChange={(e) => {
                    if (editorRef.current) {
                      try {
                        editorRef.current.search(e.target.value);
                      } catch (err) {
                        console.error('Error searching JSON:', err);
                      }
                    }
                  }}
                />
                <Search className="absolute right-2 top-1 h-3 w-3 text-gray-400 dark:text-gray-500" />
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => editorRef.current?.expandAll()}
                  className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs"
                  title="Expand All"
                >
                  Expand
                </button>
                <button
                  onClick={() => editorRef.current?.collapseAll()}
                  className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs"
                  title="Collapse All"
                >
                  Collapse
                </button>
              </div>
              
              {/* View modes */}
              <div className="flex space-x-1">
                {['tree', 'code', 'view'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setJsonEditorMode(m as any)}
                    className={`p-1 rounded-md ${
                      jsonEditorMode === m
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    } text-xs`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden border border-gray-200 dark:border-gray-700 rounded-md relative">
            {selectedEvent ? (
              <JSONEditorComponent 
                data={selectedEvent.payload}
                height="100%"
                width="100%"
                mode={jsonEditorMode}
                ref={editorRef}
                className="h-full"
                showMainMenu={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>Select an event to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Trace Dialog */}
      <TraceDialog
        open={showTraceDialog}
        onClose={() => setShowTraceDialog(false)}
        queueId={traceQueueId}
        eventId={traceEventId}
      />
    </div>
  );
} 