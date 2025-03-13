"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { 
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  RotateCw as ArrowPathIcon,
  GitFork as GitForkIcon
} from 'lucide-react';
import { useBots } from '@/context/ApiContext';
import { format, formatDistanceToNow } from 'date-fns';
import NodeIcon from '@/components/node/NodeIcon';
import numeral from 'numeral';

interface BotsListProps {
  searchTerm: string;
  filterField?: string;
  filterValue?: string;
  onNodeClick?: (nodeId: string) => void;
}

export default function BotsList({ searchTerm, filterField, filterValue, onNodeClick }: BotsListProps) {
  const { state, dispatch } = useAppContext();
  const botsQuery = useBots();
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Default thresholds from the API
  const defaultThresholds = {
    write_lag: 1000 * 60 * 1438560, // very large default
    source_lag: 1000 * 60 * 2.5,    // 2.5 minutes
    error_limit: 0.5,
    consecutive_errors: 2
  };

  // Format lag time in a human-readable format
  const formatLag = (lagMs: number) => {
    if (lagMs === null || lagMs === undefined) return 'N/A';
    
    if (lagMs < 1000) {
      return `${lagMs}ms`;
    } else if (lagMs < 60000) {
      return `${(lagMs / 1000).toFixed(1)}s`;
    } else if (lagMs < 3600000) {
      return `${Math.floor(lagMs / 60000)}m ${Math.floor((lagMs % 60000) / 1000)}s`;
    } else {
      return `${Math.floor(lagMs / 3600000)}h ${Math.floor((lagMs % 3600000) / 60000)}m`;
    }
  };

  // Format threshold in a human-readable format
  const formatThreshold = (thresholdMs: number) => {
    if (thresholdMs === null || thresholdMs === undefined) return 'N/A';
    
    if (thresholdMs < 60000) {
      return `${(thresholdMs / 1000).toFixed(1)}s`;
    } else if (thresholdMs < 3600000) {
      return `${Math.floor(thresholdMs / 60000)}m ${Math.floor((thresholdMs % 60000) / 1000)}s`;
    } else {
      return `${Math.floor(thresholdMs / 3600000)}h ${Math.floor((thresholdMs % 3600000) / 60000)}m`;
    }
  };

  // Check if a bot is alarmed based on the new definition
  const isAlarmed = (bot: any) => {
    return (
      bot.status?.toLowerCase() === 'blocked' || 
      bot.status?.toLowerCase() === 'danger' || 
      bot.status?.toLowerCase() === 'rogue'
    );
  };

  // Check if a specific metric is alarmed
  const isMetricAlarmed = (bot: any, metricType: 'source_lag' | 'write_lag' | 'error') => {
    // Get bot-specific thresholds if available, otherwise use defaults
    const botThresholds = bot.health || {};
    
    switch (metricType) {
      case 'source_lag':
        const sourceLagThreshold = botThresholds.source_lag !== undefined ? 
          botThresholds.source_lag : defaultThresholds.source_lag;
        return bot.source_lag && bot.source_lag > sourceLagThreshold;

      case 'write_lag':
        const writeLagThreshold = botThresholds.write_lag !== undefined ? 
          botThresholds.write_lag : defaultThresholds.write_lag;
        return bot.write_lag && bot.write_lag > writeLagThreshold;

      case 'error':
        const errorThreshold = botThresholds.error_limit !== undefined ? 
          botThresholds.error_limit : defaultThresholds.error_limit;
        return bot.errorCount && bot.errorCount > errorThreshold;

      default:
        return false;
    }
  };

  // Handle sort click
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Add callback to open node settings
  const handleNodeSettingsClick = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    // Open node settings by updating the selected node in context
    dispatch({ type: 'CHANGE_SELECTED', payload: [nodeId] });
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
  
  // Filter bots based on search
  const filteredBots = state.bots
    .filter(bot => isAlarmed(bot)) // First filter to only alarmed bots
    .filter(bot => {
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
    let aValue, bValue;
    
    // Handle special sort fields
    switch (sortField) {
      case 'name':
        aValue = a.id.split(':').pop() || a.id;
        bValue = b.id.split(':').pop() || b.id;
        break;
      case 'source_lag':
        aValue = a.source_lag || 0;
        bValue = b.source_lag || 0;
        break;
      case 'write_lag':
        aValue = a.write_lag || 0;
        bValue = b.write_lag || 0;
        break;
      case 'errors':
        aValue = a.errorCount || 0;
        bValue = b.errorCount || 0;
        break;
      default:
        aValue = a[sortField as keyof typeof a];
        bValue = b[sortField as keyof typeof b];
    }
    
    // Handle different types of values
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Handle numeric comparison
    if ((typeof aValue === 'number' && typeof bValue === 'number') ||
        (aValue !== undefined && bValue !== undefined)) {
      return sortDirection === 'asc' ? 
        (aValue || 0) - (bValue || 0) : 
        (bValue || 0) - (aValue || 0);
    }
    
    return 0;
  });
  
  if (sortedBots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Alarmed Bots Found</h3>
        <p className="text-gray-600 dark:text-gray-300">
          {searchTerm ? 
            "No alarmed bots match your search criteria." : 
            "There are currently no bots in an alarmed state."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Alarmed Bots
          <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
            Showing {sortedBots.length} {sortedBots.length === 1 ? 'alarmed bot' : 'alarmed bots'}
          </div>
        </h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => botsQuery && typeof botsQuery.refetch === 'function' ? botsQuery.refetch() : null}
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
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Node Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
                      : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                <div className="flex items-center">
                  Actions
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('source_lag')}
              >
                <div className="flex items-center">
                  Source Lag
                  {sortField === 'source_lag' && (
                    sortDirection === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
                      : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('write_lag')}
              >
                <div className="flex items-center">
                  Write Lag
                  {sortField === 'write_lag' && (
                    sortDirection === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
                      : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('errors')}
              >
                <div className="flex items-center">
                  Errors
                  {sortField === 'errors' && (
                    sortDirection === 'asc' 
                      ? <ChevronUpIcon className="h-4 w-4 ml-1" />
                      : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBots.map(bot => {
              // Extract the display name from the bot ID
              const displayName = bot.id.split(':').pop() || bot.id;
              
              // Get bot-specific thresholds if available
              const botThresholds = bot.health || {};
              const sourceLagThreshold = botThresholds.source_lag !== undefined ? 
                botThresholds.source_lag : defaultThresholds.source_lag;
              const writeLagThreshold = botThresholds.write_lag !== undefined ? 
                botThresholds.write_lag : defaultThresholds.write_lag;
              
              return (
                <tr key={bot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <NodeIcon node={bot} size={32} />
                      </div>
                      <div className="ml-3">
                        <div 
                          onClick={(e) => handleNodeSettingsClick(bot.id, e)}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          title="Click to open settings"
                        >
                          {displayName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/workflow#${encodeURIComponent(JSON.stringify({ node: bot.id }))}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNodeClick) onNodeClick(bot.id);
                      }}
                    >
                      <div style={{ transform: 'rotate(90deg)' }}>
                        <GitForkIcon className="h-5 w-5" />
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isMetricAlarmed(bot, 'source_lag') ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-200'}`}>
                      {formatLag(bot.source_lag)}
                    </div>
                    {isMetricAlarmed(bot, 'source_lag') && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Threshold: {formatThreshold(sourceLagThreshold)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isMetricAlarmed(bot, 'write_lag') ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-200'}`}>
                      {formatLag(bot.write_lag)}
                    </div>
                    {isMetricAlarmed(bot, 'write_lag') && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Threshold: {formatThreshold(writeLagThreshold)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isMetricAlarmed(bot, 'error') ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-200'}`}>
                      {bot.errorCount || 0}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 