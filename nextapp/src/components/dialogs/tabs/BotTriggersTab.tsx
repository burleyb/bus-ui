"use client";

import React, { useState } from 'react';

interface BotTriggersTabProps {
  nodeData: any;
}

export default function BotTriggersTab({ nodeData }: BotTriggersTabProps) {
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const [newTriggerType, setNewTriggerType] = useState('cron');
  
  // Parse triggers from the API response
  const triggers = nodeData.triggers || [];
  
  // Helper function to format cron expressions in a human-readable way
  const formatCronExpression = (cronExpression: string) => {
    // This is a simplified formatter - a real implementation would be more comprehensive
    const parts = cronExpression.split(' ');
    if (parts.length === 5) {
      if (parts[0] === '*' && parts[1] === '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        return 'Every minute';
      } else if (parts[0] === '0' && parts[1] === '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        return 'Every hour at minute 0';
      } else if (parts[0] === '0' && parts[1] === '0' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        return 'Daily at midnight';
      }
    }
    return cronExpression;
  };
  
  // Helper function to get appropriate icon class based on trigger type
  const getTriggerIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cron':
        return 'fas fa-clock';
      case 'queue':
        return 'fas fa-list';
      case 'event':
        return 'fas fa-bolt';
      case 'http':
        return 'fas fa-globe';
      default:
        return 'fas fa-code';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Triggers</h3>
        <button
          onClick={() => setIsAddingTrigger(true)}
          className="px-3 py-1 text-xs rounded-md bg-blue-50 text-blue-700
                     dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30"
        >
          Add Trigger
        </button>
      </div>
      
      {isAddingTrigger ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trigger Type
              </label>
              <select
                value={newTriggerType}
                onChange={(e) => setNewTriggerType(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                          bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none 
                          focus:ring-2 focus:ring-blue-500"
              >
                <option value="cron">Scheduled (Cron)</option>
                <option value="queue">Queue</option>
                <option value="event">Event</option>
                <option value="http">HTTP Endpoint</option>
              </select>
            </div>
            
            {newTriggerType === 'cron' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cron Expression
                </label>
                <input
                  type="text"
                  placeholder="* * * * *"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none 
                            focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>
            )}
            
            {newTriggerType === 'queue' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Queue Name
                </label>
                <input
                  type="text"
                  placeholder="Enter queue name"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none 
                            focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {newTriggerType === 'event' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Type
                </label>
                <input
                  type="text"
                  placeholder="e.g., user.created"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none 
                            focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {newTriggerType === 'http' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HTTP Path
                </label>
                <input
                  type="text"
                  placeholder="/api/webhook/mybot"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none 
                            focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingTrigger(false)}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 
                          rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md 
                          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Trigger
              </button>
            </div>
          </div>
        </div>
      ) : triggers.length > 0 ? (
        <div className="space-y-4">
          {triggers.map((trigger: any, index: number) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-900 p-4 rounded-md border 
                        border-gray-200 dark:border-gray-700 flex items-start"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 
                            flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                <i className={getTriggerIcon(trigger.type)} />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {trigger.type.charAt(0).toUpperCase() + trigger.type.slice(1)} Trigger
                  </h4>
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                      <i className="fas fa-pencil-alt" />
                    </button>
                    <button className="text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                </div>
                
                {trigger.type === 'cron' && (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatCronExpression(trigger.expression)}
                    </p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                      {trigger.expression}
                    </code>
                  </>
                )}
                
                {trigger.type === 'queue' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Queue: <span className="font-mono">{trigger.queueName}</span>
                  </p>
                )}
                
                {trigger.type === 'event' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Event: <span className="font-mono">{trigger.eventType}</span>
                  </p>
                )}
                
                {trigger.type === 'http' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Path: <span className="font-mono">{trigger.path}</span>
                  </p>
                )}
                
                {/* Display trigger status */}
                <div className="mt-2 flex items-center">
                  <div 
                    className={`h-2 w-2 rounded-full ${
                      trigger.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    } mr-2`}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {trigger.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">No triggers configured</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Add a trigger to activate this bot automatically
          </p>
        </div>
      )}
    </div>
  );
} 