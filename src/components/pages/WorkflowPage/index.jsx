import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '../../../stores/DataContext';
import WorkflowGraph from './WorkflowGraph';
import WorkflowControls from './WorkflowControls';
import WorkflowSidebar from './WorkflowSidebar';

export default function WorkflowPage() {
  const { selectedNodeId, fetchWorkflowData, stats } = useData();

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        <WorkflowControls />
        <div className="flex-1 flex flex-col worfklow-graph-container">
            <WorkflowGraph 
            data={stats} 
            />
        </div>
      </div>
      <WorkflowSidebar nodeId={selectedNodeId} />
    </div>
  );
}
