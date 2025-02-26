"use client";

import React from 'react';
import Link from 'next/link';
import { 
  PlusCircleIcon, 
  ClockIcon, 
  AdjustmentsHorizontalIcon, 
  DocumentTextIcon,
  TableCellsIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '@/context/AppContext';
import { useBots } from '@/context/ApiContext';

export function QuickActions() {
  const { state } = useAppContext();
  const botsQuery = useBots();
  
  const refreshData = () => {
    botsQuery.refetch();
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          <Link 
            href="/create" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <PlusCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">New Bot</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Create a new bot</p>
            </div>
          </Link>
          
          <Link 
            href="/catalog" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TableCellsIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Catalog</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View all components</p>
            </div>
          </Link>
          
          <Link 
            href="/logs" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Logs</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">View system logs</p>
            </div>
          </Link>
          
          <Link 
            href="/settings" 
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <AdjustmentsHorizontalIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Settings</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Configure system settings</p>
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
                {botsQuery.isFetching ? 'Refreshing...' : 'Update dashboard data'}
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