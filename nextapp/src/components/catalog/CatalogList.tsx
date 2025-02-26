"use client";

import React from 'react';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { useBots } from '@/context/ApiContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Define status badge component
function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  
  let bgColor = 'bg-gray-100 dark:bg-gray-800';
  let textColor = 'text-gray-800 dark:text-gray-200';
  let icon = null;
  
  switch (status.toLowerCase()) {
    case 'active':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-400';
      icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'inactive':
    case 'stopped':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-400';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'warning':
    case 'alarmed':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      icon = <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
}

interface CatalogItemProps {
  id: string;
  type: string;
  status?: string;
  description?: string;
  lastUpdated?: string;
}

function CatalogItem({ id, type, status, description, lastUpdated }: CatalogItemProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{id}</h3>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            {type}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>
      
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{description}</p>
      )}
      
      <div className="flex items-center justify-between">
        {lastUpdated && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Updated: {lastUpdated}
          </span>
        )}
        
        <Link
          href={`/node?bot=${id}`}
          className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          View Details
          <ChevronRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

interface CatalogListProps {
  search: string;
  type: string;
  sort: string;
  order: 'asc' | 'desc';
}

export default function CatalogList({ search, type, sort, order }: CatalogListProps) {
  const { state } = useAppContext();
  const botsQuery = useBots();
  
  const isLoading = botsQuery.isLoading || state.updatingStats;
  const isError = botsQuery.isError;
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg animate-pulse"></div>
        ))}
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
  
  // Combine bots and nodes into a single catalog
  const catalogItems: CatalogItemProps[] = [
    ...state.bots.map(bot => ({
      id: bot.id,
      type: 'bot',
      status: bot.status,
      description: bot.description,
      lastUpdated: bot.lastUpdated
    })),
    ...state.queues.map(queue => ({
      id: queue.id,
      type: 'queue',
      status: queue.status,
      description: queue.description,
      lastUpdated: queue.lastUpdated
    }))
  ];
  
  // Apply filters
  const filteredItems = catalogItems.filter(item => {
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
  
  // Apply sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aValue = a[sort as keyof CatalogItemProps] || '';
    const bValue = b[sort as keyof CatalogItemProps] || '';
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return order === 'asc' ? comparison : -comparison;
  });
  
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedItems.map(item => (
        <CatalogItem 
          key={`${item.type}-${item.id}`}
          id={item.id}
          type={item.type}
          status={item.status}
          description={item.description}
          lastUpdated={item.lastUpdated}
        />
      ))}
    </div>
  );
} 