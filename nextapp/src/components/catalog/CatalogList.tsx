"use client";

import React, { useMemo, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { useBots } from '@/context/ApiContext';
import { useDialogs } from '@/hooks/useDialogs';
import { NodeIcon } from '@/components/node';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Define status badge component
const StatusBadge = React.memo(({ status }: { status?: string }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Unknown
      </span>
    );
  }

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
          {status}
        </span>
      );
  }
});

interface CatalogItemProps {
  id: string;
  type: string;
  status?: string;
  description?: string;
  lastUpdated?: string;
}

interface CatalogListProps {
  search: string;
  type: string;
  sort: string;
  order: 'asc' | 'desc';
}

// Row component for better memoization with stable props
const CatalogRow = React.memo(({ item, openNodeSettingsDialog }: { 
  item: CatalogItemProps, 
  openNodeSettingsDialog: (id: string) => void 
}) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="mr-2">
          <NodeIcon 
            node={{ 
              id: item.id, 
              type: item.type, 
              status: item.status 
            }} 
            size={24} 
          />
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.id}</div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${item.type === 'bot' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          item.type === 'queue' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
      </span>
    </td>
    <td className="px-6 py-4">
      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
        {item.description || 'No description available'}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {item.lastUpdated || 'N/A'}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
      <button
        onClick={() => openNodeSettingsDialog(item.id)}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center"
      >
        View Details
        <ChevronRightIcon className="ml-1 h-4 w-4" />
      </button>
    </td>
  </tr>
));

// Immutable empty arrays to avoid reference changes when empty
const EMPTY_ARRAY: any[] = [];

// Main component with memoization
const CatalogList = ({ search, type, sort, order }: CatalogListProps) => {
  const { state } = useAppContext();
  const botsQuery = useBots();
  const { openNodeSettingsDialog } = useDialogs();
  
  // Use transition to avoid blocking UI updates during data changes
  const [isPending, startTransition] = useTransition();
  
  // Replace dynamic loading state with transition state
  const isLoading = botsQuery.isLoading || (state.updatingStats && isPending);
  const isError = botsQuery.isError;
  
  // Use stable references to empty arrays
  const bots = state.bots || EMPTY_ARRAY;
  const queues = state.queues || EMPTY_ARRAY;
  const systems = state.systems || EMPTY_ARRAY;
  
  // Memoize the catalog items to prevent recalculation on every render
  const catalogItems = useMemo(() => {
    // Don't use startTransition here - it's not allowed in render
    return [
      ...bots.map(bot => ({
        id: bot.id,
        type: 'bot',
        status: bot.status,
        description: bot.description,
        lastUpdated: bot.lastUpdated
      })),
      ...queues.map(queue => ({
        id: queue.id,
        type: 'queue',
        status: queue.status,
        description: queue.description,
        lastUpdated: queue.lastUpdated
      })),
      ...systems.map(system => ({
        id: system.id,
        type: 'system',
        status: system.status,
        description: system.description,
        lastUpdated: system.lastUpdated
      }))
    ];
  }, [bots, queues, systems]);
  
  // Memoize filtered items
  const filteredItems = useMemo(() => {
    // Regular computation without startTransition
    return catalogItems.filter(item => {
      // Apply search filter
      if (search && !item.id.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Apply type filter
      if (type && item.type !== type) {
        return false;
      }
      
      return true;
    });
  }, [catalogItems, search, type]);
  
  // Memoize sorted items
  const sortedItems = useMemo(() => {
    // Regular computation without startTransition
    return [...filteredItems].sort((a, b) => {
      const aValue = a[sort as keyof CatalogItemProps] || '';
      const bValue = b[sort as keyof CatalogItemProps] || '';
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return order === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sort, order]);
  
  // Use a transition effect to update derived state in a non-blocking way
  useEffect(() => {
    // Mark data processing as a transition to keep UI responsive
    startTransition(() => {
      // This is just a way to trigger the transition state
      // The actual computation is done in the useMemo hooks
    });
  }, [bots, queues, systems, search, type, sort, order]);
  
  // Memoize type counts
  const typeCounts = useMemo(() => ({
    bot: filteredItems.filter(item => item.type === 'bot').length,
    queue: filteredItems.filter(item => item.type === 'queue').length,
    system: filteredItems.filter(item => item.type === 'system').length,
  }), [filteredItems]);
  
  // Create a stable callback for opening node settings
  const handleOpenNodeSettings = React.useCallback((id: string) => {
    openNodeSettingsDialog(id);
  }, [openNodeSettingsDialog]);
  
  // IMPORTANT: Move the TableBody memo here, before conditional returns
  // Memorize the table body to prevent re-rendering when only status changes
  const TableBody = React.useMemo(() => (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {sortedItems.map((item) => (
        <CatalogRow 
          key={`${item.type}-${item.id}`}
          item={item} 
          openNodeSettingsDialog={handleOpenNodeSettings} 
        />
      ))}
    </tbody>
  ), [sortedItems, handleOpenNodeSettings]);
  
  if (isLoading) {
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
  
  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
        <h3 className="text-red-800 dark:text-red-400 font-medium">Failed to load catalog data</h3>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
          {botsQuery.error instanceof Error 
            ? botsQuery.error.message 
            : 'An unknown error occurred'
          }
        </p>
      </div>
    );
  }
  
  if (sortedItems.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No items found</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Summary bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium">{sortedItems.length}</span> of <span className="font-medium">{catalogItems.length}</span> items
          {type ? ` (filtered by type: ${type})` : ''}
        </div>
        <div className="flex ml-auto space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Bots: {typeCounts.bot}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
            Queues: {typeCounts.queue}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Systems: {typeCounts.system}
          </span>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          {TableBody}
        </table>
      </div>
    </div>
  );
}

// Use a deeper comparison for memoization
function areEqual(prevProps: CatalogListProps, nextProps: CatalogListProps) {
  return (
    prevProps.search === nextProps.search &&
    prevProps.type === nextProps.type &&
    prevProps.sort === nextProps.sort &&
    prevProps.order === nextProps.order
  );
}

export default React.memo(CatalogList, areEqual); 