'use client'
import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useCatalog } from '@/hooks/useQueries';
import moment from 'moment';

export default function CatalogPage() {
  const { selected, changeSelected } = useData();
  const { data: catalog, isLoading } = useCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter(item => item !== id)
      : [...selected, id];
    
    changeSelected(newSelected);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Filter and sort the catalog items
  const filteredItems = catalog?.items?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];
    
    // Handle special cases for sorting
    if (sortField === 'lastUpdated') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Catalog</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort('name')}>
                    Name
                    {sortField === 'name' && (
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort('type')}>
                    Type
                    {sortField === 'type' && (
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort('lastUpdated')}>
                    Last Updated
                    {sortField === 'lastUpdated' && (
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 cursor-pointer ${selected.includes(item.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelect(item.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lastUpdated ? moment(item.lastUpdated).fromNow() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {item.description || 'No description'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Selected Items</h2>
          <div className="flex flex-wrap gap-2">
            {selected.map(id => {
              const item = catalog?.items?.find(i => i.id === id);
              return (
                <div key={id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center">
                  <span className="mr-1">{item?.name || id}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(id);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 