"use client";

import React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CatalogList from '@/components/catalog/CatalogList';
import CatalogSearch from '@/components/catalog/CatalogSearch';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import { useStats } from '@/context/ApiContext';

export default function CatalogPage() {
  // Use the useSearchParams hook instead of receiving as props
  const searchParams = useSearchParams();
  
  // Get query parameters
  const search = searchParams?.get('search') || '';
  const type = searchParams?.get('type') || '';
  const sort = searchParams?.get('sort') || 'id';
  const order = searchParams?.get('order') || 'asc';

  // Initialize stats polling on catalog page load
  useStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catalog</h1>
        <CatalogSearch initialSearch={search} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filters</h2>
            <CatalogFilters 
              activeType={type} 
              activeSort={sort}
              activeOrder={order as 'asc' | 'desc'}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
            <CatalogList
              search={search}
              type={type}
              sort={sort}
              order={order as 'asc' | 'desc'}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 