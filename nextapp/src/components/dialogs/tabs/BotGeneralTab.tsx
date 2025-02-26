"use client";

import React from 'react';

interface BotGeneralTabProps {
  nodeData: any;
}

export default function BotGeneralTab({ nodeData }: BotGeneralTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="botName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bot Name
        </label>
        <input
          type="text"
          id="botName"
          name="name"
          defaultValue={nodeData.name || nodeData.id}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="botDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="botDescription"
          name="description"
          rows={3}
          defaultValue={nodeData.description || ''}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a description for this bot"
        />
      </div>

      <div>
        <label htmlFor="botExecutionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Execution Type
        </label>
        <select
          id="botExecutionType"
          name="executionType"
          defaultValue={nodeData.executionType || 'lambda'}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        >
          <option value="lambda">Lambda Function</option>
          <option value="container">Container</option>
          <option value="ec2">EC2 Instance</option>
        </select>
      </div>

      {nodeData.executionType === 'lambda' && (
        <div>
          <label htmlFor="lambdaName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Lambda Function
          </label>
          <input
            type="text"
            id="lambdaName"
            name="lambdaName"
            defaultValue={nodeData.lambdaName}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                      focus:ring-2 focus:ring-blue-500"
            placeholder="Enter lambda function name"
          />
        </div>
      )}

      <div>
        <label htmlFor="botStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          id="botStatus"
          name="status"
          defaultValue={nodeData.status || 'inactive'}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label htmlFor="botTags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>
        <input
          type="text"
          id="botTags"
          name="tags"
          defaultValue={(nodeData.tags || []).join(', ')}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                    focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., processing, data-sync, prod (comma separated)"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Comma-separated list of tags
        </p>
      </div>

      {/* Health status information */}
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
                {nodeData.health.status.charAt(0).toUpperCase() + nodeData.health.status.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Checked</p>
              <p className="text-sm">
                {new Date(nodeData.health.lastCheck).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 