import React from 'react';
import { useData } from '../../stores/DataContext';


export default function SearchBar() {
  const { refreshData } = useData();
  
  return (
    <div className="flex justify-between items-center">
      Search Bar
    </div>
  );
}
