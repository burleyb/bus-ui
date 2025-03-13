"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Grid2X2 as Grid2X2Icon,
  GitFork as GitForkIcon, 
  RotateCw as ArrowPathIcon
} from 'lucide-react';
import { useBots } from '@/context/ApiContext';

export function QuickActions() {
  const botsQuery = useBots();
  
  const refreshData = () => {
    if (botsQuery && typeof botsQuery.refetch === 'function') {
      botsQuery.refetch();
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">          
          <Link 
            href="/catalog" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Grid2X2Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Catalog</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View all components</p>
            </div>
          </Link>
          
          <Link 
            href="/workflow" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <div style={{ transform: 'rotate(90deg)' }}>
                <GitForkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Workflows</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View system workflows</p>
            </div>
          </Link>
          
          <button 
            onClick={refreshData}
            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Refresh Data</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {botsQuery && botsQuery.isFetching ? 'Refreshing...' : 'Update dashboard data'}
              </p>
            </div>
          </button>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 text-xs text-center text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
} 