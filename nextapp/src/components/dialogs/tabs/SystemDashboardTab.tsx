"use client";

import React from 'react';

interface SystemDashboardTabProps {
  nodeData: any;
}

const SystemDashboardTab: React.FC<SystemDashboardTabProps> = ({ nodeData }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          ID
        </label>
        <input
          type="text"
          value={nodeData.id || ''}
          readOnly
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={nodeData.name || ''}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          placeholder="Enter system name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={nodeData.description || ''}
          rows={3}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          placeholder="Enter system description"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          value={nodeData.status || 'active'}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          System Type
        </label>
        <select
          value={nodeData.systemType || 'database'}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        >
          <option value="database">Database</option>
          <option value="api">External API</option>
          <option value="message_broker">Message Broker</option>
          <option value="file_storage">File Storage</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">System Health</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
            <div className="mt-1 flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                nodeData.health === 'healthy' ? 'bg-green-500' : 
                nodeData.health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium capitalize">{nodeData.health || 'unknown'}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">Uptime</span>
            <div className="mt-1">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {nodeData.uptime ? formatUptime(nodeData.uptime) : '0s'}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">Response Time</span>
            <div className="mt-1">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {nodeData.responseTime || 0}
              </span>
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">ms</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Endpoint URL
        </label>
        <input
          type="text"
          value={nodeData.endpoint || ''}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/api"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          URL for connecting to this system
        </p>
      </div>
    </div>
  );
};

// Helper function to format uptime in a human-readable format
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default SystemDashboardTab; 