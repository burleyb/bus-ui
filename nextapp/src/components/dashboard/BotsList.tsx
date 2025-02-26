"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function BotsList() {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const handleTagClick = (tag: string) => {
    dispatch({ type: 'SET_FILTER_BY_TAG', payload: tag });
  };

  const handleSortChange = (field: string) => {
    if (state.sortBy === field) {
      // Toggle sort direction if clicking on the same field
      dispatch({
        type: 'SET_SORT',
        payload: {
          sortBy: field,
          sortDir: state.sortDir === 'asc' ? 'desc' : 'asc'
        }
      });
    } else {
      // Set new sort field with default desc direction
      dispatch({
        type: 'SET_SORT',
        payload: {
          sortBy: field,
          sortDir: 'desc'
        }
      });
    }
  };

  if (state.updatingStats && state.bots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="animate-pulse flex space-x-4 p-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Apply filtering and sorting
  const filteredBots = state.bots.filter(bot => {
    // Apply tag filter if set
    if (state.filterByTag && !bot.tags?.includes(state.filterByTag)) {
      return false;
    }
    
    // Apply search filter if set
    if (searchTerm && !bot.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Sort bots
  const sortedBots = [...filteredBots].sort((a, b) => {
    const sortField = state.sortBy || 'id';
    const sortDir = state.sortDir;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === bValue) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    const comparison = aValue > bValue ? 1 : -1;
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Search and filter bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search bots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        
        {state.filterByTag && (
          <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            <span>Tag: {state.filterByTag}</span>
            <button 
              onClick={() => dispatch({ type: 'SET_FILTER_BY_TAG', payload: '' })}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              &times;
            </button>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortChange('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>Bot ID</span>
                  {state.sortBy === 'id' && (
                    state.sortDir === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4" /> 
                      : <ChevronDownIcon className="h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBots.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No bots found
                </td>
              </tr>
            ) : (
              sortedBots.map((bot) => (
                <tr key={bot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{bot.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {bot.status === 'active' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1.5" />
                      ) : bot.status === 'alarmed' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-1.5" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-1.5" />
                      )}
                      <span 
                        className={`text-sm ${
                          bot.status === 'active' 
                            ? 'text-green-800 dark:text-green-400' 
                            : bot.status === 'alarmed' 
                              ? 'text-yellow-800 dark:text-yellow-400' 
                              : 'text-red-800 dark:text-red-400'
                        }`}
                      >
                        {bot.status === 'active' ? 'Active' : bot.status === 'alarmed' ? 'Alarmed' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {bot.tags && bot.tags.map((tag: string) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <Link 
                      href={`/logs/${bot.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-3"
                    >
                      Logs
                    </Link>
                    <Link 
                      href={`/node?bot=${bot.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination placeholder if needed */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium">{sortedBots.length}</span> of <span className="font-medium">{state.bots.length}</span> bots
        </div>
      </div>
    </div>
  );
} 