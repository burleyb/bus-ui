"use client";

import React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TraceSearch from '@/components/trace/TraceSearch';
import TraceList from '@/components/trace/TraceList';
import TraceDetails from '@/components/trace/TraceDetails';

export default function TracePage() {
  // Use the useSearchParams hook instead of receiving as props
  const searchParams = useSearchParams();
  
  // Get query parameters with defaults
  const queueId = searchParams?.get('queue') || '';
  const eventId = searchParams?.get('event') || '';
  const startTime = searchParams?.get('start') || '';
  const endTime = searchParams?.get('end') || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Trace</h1>
        <TraceSearch 
          initialQueue={queueId} 
          initialEvent={eventId}
          initialStartTime={startTime}
          initialEndTime={endTime}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Events</h2>
          <Suspense fallback={<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
            <TraceList
              queueId={queueId}
              eventId={eventId}
              startTime={startTime}
              endTime={endTime}
            />
          </Suspense>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Event Details</h2>
          <Suspense fallback={<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
            <TraceDetails
              queueId={queueId}
              eventId={eventId}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 