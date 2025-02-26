"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CatalogSearchProps {
  initialSearch: string;
}

export default function CatalogSearch({ initialSearch = '' }: CatalogSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Navigate to URL with search param (preserving other query params)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchTerm) {
      searchParams.set('search', searchTerm);
    } else {
      searchParams.delete('search');
    }
    
    router.push(`/catalog?${searchParams.toString()}`);
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative flex-grow max-w-md">
      <input
        type="text"
        className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Search catalog..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button 
        type="submit"
        className="absolute inset-y-0 left-0 pl-3 flex items-center"
      >
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </button>
    </form>
  );
} 