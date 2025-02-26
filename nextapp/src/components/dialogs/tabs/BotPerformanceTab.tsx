"use client";

import React from 'react';

interface BotPerformanceTabProps {
  nodeData: any;
}

export default function BotPerformanceTab({ nodeData }: BotPerformanceTabProps) {
  // Extract performance data from nodeData
  const performance = nodeData.performance || {
    averageExecutionTime: 'N/A',
    p95ExecutionTime: 'N/A',
    memoryUsage: 'N/A',
    invocations: {
      total: 0,
      success: 0,
      error: 0
    }
  };

  // Calculate success rate
  const successRate = performance.invocations.total > 0 
    ? ((performance.invocations.success / performance.invocations.total) * 100).toFixed(2)
    : 'N/A';

  return (
    <div className="space-y-6">
      {/* Performance metrics cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Execution Time</h3>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Average</span>
              <span className="text-sm font-medium">{performance.averageExecutionTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">P95</span>
              <span className="text-sm font-medium">{performance.p95ExecutionTime}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resource Usage</h3>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Memory</span>
              <span className="text-sm font-medium">{performance.memoryUsage}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 col-span-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invocations</h3>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-sm font-medium">{performance.invocations.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Success</span>
              <span className="text-sm font-medium">{performance.invocations.success.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Errors</span>
              <span className="text-sm font-medium">{performance.invocations.error.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Success Rate</span>
              <span className={`text-sm font-medium ${
                parseFloat(successRate) >= 99 ? 'text-green-600 dark:text-green-400' :
                parseFloat(successRate) >= 95 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {successRate !== 'N/A' ? `${successRate}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Performance Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="memorySize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Memory Size (MB)
            </label>
            <select
              id="memorySize"
              name="memorySize"
              defaultValue={nodeData.memorySize || '128'}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                        focus:ring-2 focus:ring-blue-500"
            >
              <option value="128">128 MB</option>
              <option value="256">256 MB</option>
              <option value="512">512 MB</option>
              <option value="1024">1024 MB</option>
              <option value="2048">2048 MB</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Amount of memory allocated to the bot
            </p>
          </div>
          
          <div>
            <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timeout (seconds)
            </label>
            <input
              type="number"
              id="timeout"
              name="timeout"
              defaultValue={nodeData.timeout || 30}
              min={1}
              max={900}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                        focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum execution time before the bot is terminated
            </p>
          </div>
          
          <div>
            <label htmlFor="concurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Concurrency
            </label>
            <input
              type="number"
              id="concurrency"
              name="concurrency"
              defaultValue={nodeData.concurrency || 10}
              min={1}
              max={1000}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                        bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                        focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum number of concurrent executions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 