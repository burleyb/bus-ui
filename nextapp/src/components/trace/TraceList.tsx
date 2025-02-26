"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { useTraceEvents } from '@/context/ApiContext';
import { ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TraceListProps {
  queueId: string;
  eventId: string;
  startTime: string;
  endTime: string;
}

interface TraceEvent {
  id: string;
  queue: string;
  timestamp: string;
  status: string;
  type: string;
}

export default function TraceList({
  queueId,
  eventId,
  startTime,
  endTime
}: TraceListProps) {
  const router = useRouter();
  const { state } = useAppContext();
  const [selectedEvent, setSelectedEvent] = useState(eventId);
  
  // For a real application, this would use a Tanstack Query hook to fetch trace events
  // For now, we'll use a mock implementation
  const traceEventsQuery = useTraceEvents(queueId, startTime, endTime);
  
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const handleEventSelect = (event: TraceEvent) => {
    setSelectedEvent(event.id);
    
    // Navigate to the same page but with event ID in the URL
    const params = new URLSearchParams(window.location.search);
    params.set('event', event.id);
    
    router.push(`/trace?${params.toString()}`);
  };
  
  if (traceEventsQuery.isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-md"></div>
        ))}
      </div>
    );
  }
  
  if (traceEventsQuery.isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
        <h3 className="text-red-800 dark:text-red-400 font-medium">Failed to load events</h3>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
          {traceEventsQuery.error instanceof Error ? traceEventsQuery.error.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }
  
  if (!queueId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Please select a queue to view events</p>
      </div>
    );
  }
  
  if (traceEventsQuery.data?.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No events found for the selected criteria</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {traceEventsQuery.data?.map((event: TraceEvent) => (
        <div
          key={event.id}
          onClick={() => handleEventSelect(event)}
          className={`cursor-pointer rounded-lg border p-3 transition-colors ${
            selectedEvent === event.id 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="font-medium text-gray-900 dark:text-white truncate flex-1">
              {event.id}
            </div>
            {selectedEvent === event.id && (
              <ChevronRightIcon className="h-5 w-5 text-blue-500" />
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2">
            <ClockIcon className="h-4 w-4" />
            <span>{formatTime(event.timestamp)}</span>
          </div>
          
          <div className="flex justify-between mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              event.status === 'success' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
            }`}>
              {event.status}
            </span>
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {event.type}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
} 