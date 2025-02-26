"use client";

import React, { useState, useEffect } from 'react';

interface LogsTabProps {
  nodeId: string;
  nodeType: 'bot' | 'queue' | 'system' | 'unknown';
}

export default function LogsTab({ nodeId, nodeType }: LogsTabProps) {
  // Mock logs - in a real implementation, these would be fetched from an API
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching logs
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // For now, we'll generate fake logs based on the node data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const mockLogs = Array(10).fill(null).map((_, index) => ({
          id: `log-${Date.now()}-${index}`,
          timestamp: new Date(Date.now() - index * 3600000).toISOString(),
          level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
          message: [
            `Processed event for ${nodeId}`,
            `Connection established with dependency services`,
            `Received new configuration update`,
            `Idle timeout reached, checking for new events`,
            `Memory usage at ${Math.floor(Math.random() * 50) + 30}%`,
            `Successfully processed batch of ${Math.floor(Math.random() * 10) + 1} events`,
            `Error while processing event: timeout`,
            `Warning: approaching rate limit threshold`,
            `System notification received`
          ][Math.floor(Math.random() * 9)],
          details: {
            eventId: Math.random().toString(36).substring(2, 15),
            duration: `${Math.floor(Math.random() * 500) + 10}ms`,
            source: nodeId
          }
        }));
        
        setLogs(mockLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (nodeId) {
      fetchLogs();
    }
  }, [nodeId]);

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Logs</h3>
        <div className="flex gap-2">
          <select 
            className="text-xs rounded-md border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-800 px-2 py-1 focus:outline-none 
                      focus:ring-2 focus:ring-blue-500"
            defaultValue="all"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button
            className="text-xs rounded-md border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-800 px-2 py-1 focus:outline-none 
                      hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeClass(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">
                      {log.message}
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Event ID: {log.details.eventId} | Duration: {log.details.duration}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">No logs available</p>
        </div>
      )}

      <div className="text-right">
        <button
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          View All Logs
        </button>
      </div>
    </div>
  );
} 