"use client";

import React from 'react';

interface BotErrorHandlingTabProps {
  nodeData: any;
}

export default function BotErrorHandlingTab({ nodeData }: BotErrorHandlingTabProps) {
  // Extract error handling related data from the nodeData
  const errorThreshold = nodeData.errorThreshold || 10;
  const retryDelay = nodeData.retryDelay || 300;
  const maxRetries = nodeData.maxRetries || 3;
  const errorHandling = nodeData.errorHandling || 'retry';
  const deadLetterQueue = nodeData.deadLetterQueue || '';
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="errorThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Error Threshold
        </label>
        <input
          type="number"
          id="errorThreshold"
          name="errorThreshold"
          defaultValue={errorThreshold}
          min={1}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Number of errors before node is automatically paused
        </p>
      </div>
      
      <div>
        <label htmlFor="retryDelay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Retry Delay (ms)
        </label>
        <input
          type="number"
          id="retryDelay"
          name="retryDelay"
          defaultValue={retryDelay}
          min={0}
          step={100}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Delay in milliseconds before retrying a failed event
        </p>
      </div>

      <div>
        <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Maximum Retries
        </label>
        <input
          type="number"
          id="maxRetries"
          name="maxRetries"
          defaultValue={maxRetries}
          min={0}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Maximum number of retry attempts
        </p>
      </div>

      <div>
        <label htmlFor="errorHandling" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Error Handling Strategy
        </label>
        <select
          id="errorHandling"
          name="errorHandling"
          defaultValue={errorHandling}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        >
          <option value="retry">Retry</option>
          <option value="dlq">Send to Dead Letter Queue</option>
          <option value="ignore">Ignore</option>
          <option value="fail">Fail</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          How to handle failed events
        </p>
      </div>

      {errorHandling === 'dlq' && (
        <div>
          <label htmlFor="deadLetterQueue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dead Letter Queue
          </label>
          <input
            type="text"
            id="deadLetterQueue"
            name="deadLetterQueue"
            defaultValue={deadLetterQueue}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                      focus:ring-2 focus:ring-blue-500"
            placeholder="Enter queue name"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Queue where failed events will be sent
          </p>
        </div>
      )}

      {/* Health information */}
      {nodeData.health && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Health Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className={`text-sm font-medium ${
                nodeData.health.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 
                nodeData.health.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 
                'text-red-600 dark:text-red-400'
              }`}>
                {nodeData.health.status ? (nodeData.health.status.charAt(0).toUpperCase() + nodeData.health.status.slice(1)) : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Error Rate</p>
              <p className="text-sm font-medium">{nodeData.health?.errorRate || '0%'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 