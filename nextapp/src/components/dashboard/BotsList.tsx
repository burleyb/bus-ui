"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useBots } from '@/context/ApiContext';
import { ClockIcon } from '@heroicons/react/24/solid';
import { useDialogs } from '@/hooks/useDialogs';

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'running':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircleIcon className="mr-1 h-3 w-3" />
          Active
        </span>
      );
    case 'idle':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          <ClockIcon className="mr-1 h-3 w-3" />
          Idle
        </span>
      );
    case 'paused':
    case 'inactive':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          <ClockIcon className="mr-1 h-3 w-3" />
          Paused
        </span>
      );
    case 'error':
    case 'alarmed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          <ExclamationTriangleIcon className="mr-1 h-3 w-3" />
          Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <XCircleIcon className="mr-1 h-3 w-3" />
          {status}
        </span>
      );
  }
}

interface BotsListProps {
  searchTerm: string;
  filterField?: string;
  filterValue?: string;
}

export default function BotsList({ searchTerm, filterField, filterValue }: BotsListProps) {
  const { state, dispatch } = useAppContext();
  const botsQuery = useBots();
  const { openNodeSettingsDialog } = useDialogs();
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // The data is already being refreshed by the useStats hook which polls every 10 seconds
  
  // Handle sort click
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  if (botsQuery.isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (botsQuery.isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
        <h3 className="text-red-800 dark:text-red-400 font-medium">Failed to load bots</h3>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
          An error occurred while fetching bot data
        </p>
      </div>
    );
  }
  
  // Filter out active/running bots - only show alerting bots
  const filteredBots = state.bots.filter(bot => {
    // Only include bots that are NOT running/active/idle
    if (bot.status?.toLowerCase() === 'active' || 
        bot.status?.toLowerCase() === 'running' || 
        bot.status?.toLowerCase() === 'idle') {
      return false;
    }
    
    // Apply search filter
    if (searchTerm && !bot.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply additional filters if provided
    if (filterField && filterValue) {
      const fieldValue = bot[filterField as keyof typeof bot];
      
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
      }
      
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(v => 
          typeof v === 'string' && v.toLowerCase().includes(filterValue.toLowerCase())
        );
      }
      
      return false;
    }
    
    return true;
  });
  
  // Sort bots
  const sortedBots = [...filteredBots].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    // Handle different types of values
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Handle numeric comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle array comparison (e.g., tags)
    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      const aStr = aValue.join(',');
      const bStr = bValue.join(',');
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    }
    
    return 0;
  });
  
  if (sortedBots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Systems Operational</h3>
        <p className="text-gray-600 dark:text-gray-300">
          All bots are currently running without issues. No alerts to display.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Alerts: Bots Requiring Attention
          <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
            Showing bots that are not active, running, or idle
          </div>
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {sortedBots.length} {sortedBots.length === 1 ? 'bot' : 'bots'} need attention
          </span>
          <button 
            onClick={() => botsQuery.refetch?.()}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label="Refresh"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center">
                  Bot ID
                  {sortField === 'id' && (
                    sortDirection === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
                      : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
                      : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('tags')}
              >
                <div className="flex items-center">
                  Tags
                  {sortField === 'tags' && (
                    sortDirection === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
                      : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBots.map((bot) => (
              <tr key={bot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{bot.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={bot.status || 'unknown'} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {bot.tags && bot.tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {(!bot.tags || bot.tags.length === 0) && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">No tags</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openNodeSettingsDialog(bot.id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      View
                    </button>
                    <Link
                      href={`/logs?bot=${bot.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Logs
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 