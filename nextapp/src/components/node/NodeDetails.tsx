"use client";

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import numeral from 'numeral';

interface NodeDetailsProps {
  selectedBot: string;
}

export default function NodeDetails({ selectedBot }: NodeDetailsProps) {
  const { state } = useAppContext();
  
  // Get node details based on the selectedBot
  const nodeDetails = selectedBot && state.nodes 
    ? state.nodes[selectedBot] 
    : null;
  
  if (state.updatingStats && Object.keys(state.nodes).length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!selectedBot) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Select a bot to view details</p>
      </div>
    );
  }

  if (!nodeDetails) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No details available for the selected bot</p>
      </div>
    );
  }

  // Format stats for display
  const eventCount = numeral(nodeDetails.eventCount || 0).format('0,0');
  const errorCount = numeral(nodeDetails.errorCount || 0).format('0,0');
  const processingTime = numeral(nodeDetails.processingTime || 0).format('0.00');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{nodeDetails.id || selectedBot}</h3>
        {nodeDetails.type && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Type: {nodeDetails.type}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Events Processed</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{eventCount}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
          <p className={`text-xl font-semibold mt-1 ${
            Number(errorCount) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
          }`}>
            {errorCount}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Processing Time</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">{processingTime}ms</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <div className="flex items-center mt-1">
            <span className={`inline-block h-3 w-3 rounded-full mr-2 ${
              nodeDetails.status === 'active' ? 'bg-green-500' : 
              nodeDetails.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            <p className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
              {nodeDetails.status || 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {nodeDetails.description && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Description</h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm">{nodeDetails.description}</p>
        </div>
      )}

      {nodeDetails.connections && nodeDetails.connections.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Connections</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {nodeDetails.connections.map((connection, index) => (
              <li key={index} className="flex items-center">
                <span className="text-gray-400">→</span>
                <span className="ml-2">{connection}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 