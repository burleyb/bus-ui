import React from 'react';
import { useData } from '../../../stores/DataContext';
import SearchBar from '../../../components/common/SearchBar';

export default function DashboardHeader() {
  const { refreshData } = useData();
  
  return (
    <div className="flex justify-between items-center">
      <SearchBar />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
