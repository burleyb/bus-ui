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
  const { state } = useAppContext();
  
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
    queueId, // queueId to search
    '5m',    // default time range
    null,    // no initial custom date
    ''       // no initial search text
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
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
  };
  
  // Handle date select
  const handleDateSelect = (date: Date | null) => {
    setCustomDate(date);
    setShowDatePicker(false);
    setSelectedEventId(null); // Clear selection
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