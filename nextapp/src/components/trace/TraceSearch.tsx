"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '@/context/AppContext';

interface TraceSearchProps {
  initialQueue: string;
  initialEvent: string;
  initialStartTime: string;
  initialEndTime: string;
}

export default function TraceSearch({ 
  initialQueue = '', 
  initialEvent = '',
  initialStartTime = '',
  initialEndTime = ''
}: TraceSearchProps) {
  const router = useRouter();
  const { state } = useAppContext();
  
  const [queueId, setQueueId] = useState(initialQueue);
  const [eventId, setEventId] = useState(initialEvent);
  const [startTime, setStartTime] = useState(initialStartTime || getDefaultStartTime());
  const [endTime, setEndTime] = useState(initialEndTime || getDefaultEndTime());
  
  // Helper functions for default time values
  function getDefaultStartTime() {
    const date = new Date();
    date.setHours(date.getHours() - 24); // 24 hours ago
    return date.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  }
  
  function getDefaultEndTime() {
    return new Date().toISOString().slice(0, 16); // Current time
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query parameters
    const params = new URLSearchParams();
    if (queueId) params.set('queue', queueId);
    if (eventId) params.set('event', eventId);
    if (startTime) params.set('start', startTime);
    if (endTime) params.set('end', endTime);
    
    // Navigate to trace page with parameters
    router.push(`/trace?${params.toString()}`);
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="queue-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Queue
          </label>
          <div className="relative">
            <select
              id="queue-select"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
              value={queueId}
              onChange={(e) => setQueueId(e.target.value)}
            >
              <option value="">Select a queue</option>
              {state.nodes && Object.values(state.nodes)
                .filter(node => node.type === 'queue')
                .map(queue => (
                  <option key={queue.id} value={queue.id}>
                    {queue.id}
                  </option>
                ))
              }
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="event-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Event ID
          </label>
          <input
            type="text"
            id="event-id"
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter event ID"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Time
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="datetime-local"
              id="start-time"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md pl-10 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Time
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="datetime-local"
              id="end-time"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md pl-10 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
          Search
        </button>
      </div>
    </form>
  );
} 