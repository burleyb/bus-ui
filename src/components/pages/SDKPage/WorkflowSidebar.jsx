import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '../../stores/DataContext';
import NodeMetrics from './NodeMetrics';
import NodeLogs from './NodeLogs';

export default function WorkflowSidebar({ nodeId }) {
  const { fetchNodeDetails } = useData();
  
  const { data: nodeDetails, isLoading } = useQuery(
    ['nodeDetails', nodeId],
    () => fetchNodeDetails(nodeId),
    { enabled: !!nodeId }
  );

  if (!nodeId) {
    return (
      <div className="w-96 border-l p-6 flex items-center justify-center text-gray-500">
        Select a node to view details
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-96 border-l p-6 animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-96 border-l overflow-auto">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium">{nodeDetails.label}</h2>
          <p className="text-sm text-gray-500">{nodeDetails.description}</p>
        </div>
        
        <NodeMetrics metrics={nodeDetails.metrics} />
        <NodeLogs logs={nodeDetails.logs} />

        <div className="border-t pt-6">
          <button
            onClick={() => {/* Handle node settings */}}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Node Settings
          </button>
        </div>
      </div>
    </div>
  );
}