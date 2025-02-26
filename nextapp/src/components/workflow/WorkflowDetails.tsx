"use client";

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import numeral from 'numeral';
import { useDialogs } from '@/hooks/useDialogs';

interface WorkflowDetailsProps {
  selectedBot: string;
}

export default function WorkflowDetails({ selectedBot }: WorkflowDetailsProps) {
  const { state } = useAppContext();
  const { openNodeSettingsDialog } = useDialogs();
  
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
        <p>Select a node to view details</p>
      </div>
    );
  }

  if (!nodeDetails) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No details available for the selected node</p>
      </div>
    );
  }

  // Format stats for display
  const eventCount = nodeDetails.eventCount || 0;
  const errorCount = nodeDetails.errorCount || 0;
  const processingTime = nodeDetails.processingTime || 0;
  const formattedTime = processingTime > 1000 
    ? `${numeral(processingTime / 1000).format('0,0.0')}s` 
    : `${numeral(processingTime).format('0,0')}ms`;
  
  const errorRate = eventCount > 0 
    ? (errorCount / eventCount) * 100 
    : 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${
            nodeDetails.status === 'active' ? 'bg-green-500' : 
            nodeDetails.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selectedBot}</h3>
        </div>
        
        <span className={`text-xs px-2 py-1 rounded-full ${
          nodeDetails.type === 'bot' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
          nodeDetails.type === 'queue' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
          {nodeDetails.type?.toUpperCase()}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {nodeDetails.description || 'No description available'}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Events Processed</div>
          <div className="text-xl font-semibold mt-1">{numeral(eventCount).format('0,0')}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Error Rate</div>
          <div className="text-xl font-semibold mt-1">
            <span className={errorRate > 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
              {numeral(errorRate / 100).format('0.0%')}
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg. Processing Time</div>
          <div className="text-xl font-semibold mt-1">{formattedTime}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
          <div className="text-xl font-semibold mt-1 capitalize">{nodeDetails.status || 'unknown'}</div>
        </div>
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => openNodeSettingsDialog(selectedBot)}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          View Settings
        </button>
      </div>
    </div>
  );
} 