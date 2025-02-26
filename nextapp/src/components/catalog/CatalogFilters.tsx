"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  FunnelIcon 
} from '@heroicons/react/24/outline';

const typeFilters = [
  { id: '', label: 'All Types' },
  { id: 'bot', label: 'Bots' },
  { id: 'queue', label: 'Queues' },
  { id: 'system', label: 'Systems' },
];

const sortOptions = [
  { id: 'id', label: 'ID' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'lastUpdated', label: 'Last Updated' },
];

interface CatalogFiltersProps {
  activeType: string;
  activeSort: string;
  activeOrder: 'asc' | 'desc';
}

export default function CatalogFilters({ 
  activeType = '', 
  activeSort = 'id', 
  activeOrder = 'asc' 
}: CatalogFiltersProps) {
  const router = useRouter();
  
  // Helper to generate URL with updated query params
  const createUrl = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Update searchParams with new values
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });
    
    return `/catalog?${searchParams.toString()}`;
  };
  
  return (
    <div className="space-y-6">
      {/* Type Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
          <FunnelIcon className="h-4 w-4 mr-1" />
          Filter by Type
        </h3>
        <div className="space-y-2">
          {typeFilters.map((type) => (
            <Link
              key={type.id}
              href={createUrl({ type: type.id })}
              className={`block px-3 py-2 text-sm rounded-md ${
                activeType === type.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {type.label}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Sort Options */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sort By</h3>
        <div className="space-y-2">
          {sortOptions.map((option) => {
            // For the active sort, we toggle the order when clicked again
            const newOrder = 
              activeSort === option.id && activeOrder === 'asc' 
                ? 'desc' 
                : 'asc';
            
            return (
              <Link
                key={option.id}
                href={createUrl({ sort: option.id, order: newOrder })}
                className={`flex items-center justify-between px-3 py-2 text-sm rounded-md ${
                  activeSort === option.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{option.label}</span>
                {activeSort === option.id && (
                  activeOrder === 'asc' 
                    ? <ArrowUpIcon className="h-4 w-4" /> 
                    : <ArrowDownIcon className="h-4 w-4" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Reset Button */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset Filters
        </Link>
      </div>
    </div>
  );
} 