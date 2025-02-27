"use client";

import React, { useMemo } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CatalogList from '@/components/catalog/CatalogList';
import CatalogSearch from '@/components/catalog/CatalogSearch';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import { useStats } from '@/context/ApiContext';

const CatalogPage = () => {
  // Use the useSearchParams hook instead of receiving as props
  const searchParams = useSearchParams();
  
  // Get query parameters with useMemo to prevent re-calculation on every render
  const search = useMemo(() => searchParams?.get('search') || '', [searchParams]);
  const type = useMemo(() => searchParams?.get('type') || '', [searchParams]);
  const sort = useMemo(() => searchParams?.get('sort') || 'id', [searchParams]);
  const order = useMemo(() => searchParams?.get('order') || 'asc', [searchParams]) as 'asc' | 'desc';

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
              activeOrder={order}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <Suspense fallback={<div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
            <CatalogList
              search={search}
              type={type}
              sort={sort}
              order={order}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CatalogPage); 