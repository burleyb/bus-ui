"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  Search, 
  Calendar,
  Clock
} from 'lucide-react';
import { useSearchSystemEvents } from '@/context/ApiContext';
import { 
  formatDateToEid, 
  getEidForTimeRange, 
  TIME_RANGES, 
  isEid,
  formatDateTime
} from '@/lib/dateUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SystemEventsTabProps {
  nodeData: any;
}

const SystemEventsTab: React.FC<SystemEventsTabProps> = ({ nodeData }) => {
  // State for events data
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eid, setEid] = useState<string>('');
  const [resumptionToken, setResumptionToken] = useState<string | null>(null);
  const [queueId, setQueueId] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [lastQueryFailed, setLastQueryFailed] = useState<boolean>(false);
  
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
    data, 
    isLoading, 
    isError, 
    refetch,
    isFetching: isSearching
  } = useSearchSystemEvents(
    queueId,
    eid,
    searchText || undefined,
    100
  );
  
  // Process data when it arrives
  useEffect(() => {
    if (data) {
      // Check if we have results
      if (data.results && data.results.length > 0) {
        setEvents(data.results);
        setResumptionToken(data.resumptionToken || null);
        setLastQueryFailed(false);
      } else {
        // No results returned
        setLastQueryFailed(true);
      }
    }
  }, [data]);
  
  // Handle selecting an event
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    // Find the event object to display details
    const selectedEvent = events.find(e => e.eventId === eventId || e.eid === eventId);
    setSelectedEvent(selectedEvent || null);
  };
  
  // Handle refresh button
  const refreshEvents = () => {
    refetch();
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    
    if (range === 'custom') {
      // For custom, we'll use the date picker
      return;
    }
    
    // Calculate EID based on time range
    const minutes = TIME_RANGES[range as keyof typeof TIME_RANGES] || 0;
    const newEid = getEidForTimeRange(minutes);
    
    // Update EID for query
    setEid(newEid);
    // Clear resumption token to start fresh
    setResumptionToken(null);
    // Clear selected event
    setSelectedEventId(null);
    setSelectedEvent(null);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const newEid = formatDateToEid(date);
      setEid(newEid);
      // Clear resumption token to start fresh
      setResumptionToken(null);
      // Clear selected event
      setSelectedEventId(null);
      setSelectedEvent(null);
    }
  };
  
  // Load more events using the resumption token
  const loadMoreEvents = () => {
    if (resumptionToken) {
      // Update EID with resumption token to get next batch
      setEid(resumptionToken);
    }
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
  
  // State for selected event details
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  // Format the selected event payload for display
  const formattedPayload = useMemo(() => {
    if (!selectedEvent) return '';
    
    try {
      // Format the payload for display
      if (typeof selectedEvent.payload === 'object') {
        return JSON.stringify(selectedEvent.payload, null, 2);
      }
      
      // If it's a string that might be JSON, try to parse and pretty-print it
      if (typeof selectedEvent.payload === 'string') {
        try {
          const obj = JSON.parse(selectedEvent.payload);
          return JSON.stringify(obj, null, 2);
        } catch (e) {
          // Not valid JSON, return as is
          return selectedEvent.payload;
        }
      }
      
      // Fallback
      return JSON.stringify(selectedEvent.payload, null, 2);
    } catch (error) {
      console.error('Error formatting payload', error);
      return 'Error formatting payload';
    }
  }, [selectedEvent]);
  
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
              onKeyDown={(e) => e.key === 'Enter' && refreshEvents()}
            />
          </div>
          
          {/* Time range selector */}
          <div className="relative inline-block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock size={16} className="text-gray-400" />
            </div>
            <select
              value={timeRange}
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
          {timeRange === 'custom' && (
            <div className="relative inline-block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              {/* @ts-ignore */}
              <DatePicker
                selected={selectedDate}
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
            onClick={refreshEvents}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                     rounded-md text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
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
        
        {/* Right half - Event details */}
        <div className="w-1/2 overflow-auto">
          {selectedEvent ? (
            <div className="p-4 h-full flex flex-col">
              {/* Event details header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Event Details</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  ID: <span className="font-mono">{selectedEvent.eventId || selectedEvent.eid}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Created: <span>{formatDateTime(selectedEvent.timestamp)}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Source Time: <span>{formatDateTime(selectedEvent.event_source_timestamp)}</span>
                </div>
                {selectedEvent.source && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Source: <span>{selectedEvent.source}</span>
                  </div>
                )}
              </div>
              
              {/* Event payload */}
              <div className="mb-4 flex-grow overflow-auto">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Payload</h4>
                <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-auto h-[calc(100vh-500px)] min-h-[200px]">
                  {formattedPayload}
                </pre>
              </div>
              
              {/* Event metadata if available */}
              {selectedEvent.metadata && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Metadata</h4>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>Select an event to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemEventsTab; 