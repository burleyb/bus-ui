import React from 'react';
import { useData } from '../../../stores/DataContext';


export default function WorkflowSideBar() {
  const { refreshData } = useData();
  
  return (
    <div className="flex justify-between items-center">
      Workflow SideBar
    </div>
  );
}
