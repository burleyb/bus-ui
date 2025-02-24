import React from 'react';
import { useData } from '../../stores/DataContext';


export default function TagsInput() {
  const { refreshData } = useData();
  
  return (
    <div className="flex justify-between items-center">
      Tags Input
    </div>
  );
}
