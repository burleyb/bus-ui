"use client";

import React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NodeGraph from '@/components/node/NodeGraph';
import NodeDetails from '@/components/node/NodeDetails';
import NodeFilters from '@/components/node/NodeFilters';
import { useStats } from '@/context/ApiContext';

export default function NodeViewPage() {
  // Use the useSearchParams hook instead of receiving as props
  const searchParams = useSearchParams();
  
  // Get bot from query parameters if available
  const selectedBot = searchParams?.get('bot') || '';

  // Initialize stats polling on node page load
  useStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Node View</h1>
        <NodeFilters selectedBot={selectedBot} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Event Flow</h2>
          <Suspense fallback={<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
            <NodeGraph selectedBot={selectedBot} />
          </Suspense>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Node Details</h2>
          <Suspense fallback={<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
            <NodeDetails selectedBot={selectedBot} />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 