"use client";

import React from 'react';

interface QueueDashboardTabProps {
  nodeData: any;
}

const QueueDashboardTab: React.FC<QueueDashboardTabProps> = ({ nodeData }) => {
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
          defaultValue={nodeData.name || ''}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          placeholder="Enter queue name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          defaultValue={nodeData.description || ''}
          rows={3}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          placeholder="Enter queue description"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          defaultValue={nodeData.status || 'active'}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Queue Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">Current Length</span>
            <div className="mt-1">
              <span className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {nodeData.length || 0}
              </span>
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">events</span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">Oldest Event</span>
            <div className="mt-1">
              <span className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {nodeData.oldestEventAge ? Math.round(nodeData.oldestEventAge / 60) : 0}
              </span>
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">min</span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <span className="text-xs text-gray-500 dark:text-gray-400">Throughput (24h)</span>
            <div className="mt-1">
              <span className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {nodeData.throughput24h || 0}
              </span>
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">events</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Retention Period (seconds)
        </label>
        <input
          type="number"
          defaultValue={nodeData.retentionPeriod || 86400}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          min={60}
          step={60}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Time in seconds before events are automatically removed from the queue
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Queue Type
        </label>
        <select
          defaultValue={nodeData.queueType || 'standard'}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        >
          <option value="standard">Standard</option>
          <option value="fifo">FIFO (First In, First Out)</option>
          <option value="priority">Priority</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Determines how events are ordered and processed
        </p>
      </div>
    </div>
  );
};

export default QueueDashboardTab; 