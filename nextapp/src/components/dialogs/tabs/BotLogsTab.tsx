"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { awsNativeFetch } from '@/lib/authUtils';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface BotLogsTabProps {
  nodeData: any;
}

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function BotLogsTab({ nodeData }: BotLogsTabProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { addToast } = useToast();
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Get the bot ID from nodeData
  const botId = nodeData?.id || '';
  
  // Safeguard against null nodeData
  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Use TanStack Query for fetching and polling logs
  const { isLoading, error, refetch } = useQuery({
    queryKey: ['bot-logs', botId],
    queryFn: async () => {
      if (!botId) return null;
      
      // Get current timestamp in milliseconds
      const startTime = Date.now();
      // Format the URL as specified in the user's request
      const url = `/api/logs/${botId}/all?start=${startTime}`;
      
      const response = await awsNativeFetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      
      try {
        const data = await response.json();
        
        // Process the response data into our logs format
        if (Array.isArray(data) && data.length > 0) {
          setLogs(prevLogs => {
            // Create a set of existing timestamps to filter out duplicates
            const existingTimestamps = new Set(prevLogs.map(log => log.timestamp));
            
            // Filter new logs to only include entries with timestamps not already in the existing logs
            const newLogs = data
              .filter((entry: any) => entry.timestamp && !existingTimestamps.has(entry.timestamp))
              .map((entry: any) => ({
                timestamp: entry.timestamp,
                message: entry.message || entry.toString()
              }));
            
            // Append new logs to existing logs
            return [...prevLogs, ...newLogs];
          });
        } else if (data && data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          setLogs(prevLogs => {
            const existingTimestamps = new Set(prevLogs.map(log => log.timestamp));
            
            const newLogs = data.logs
              .filter((entry: any) => entry.timestamp && !existingTimestamps.has(entry.timestamp))
              .map((entry: any) => ({
                timestamp: entry.timestamp,
                message: entry.message || entry.toString()
              }));
            
            return [...prevLogs, ...newLogs];
          });
        }
        
        return data;
      } catch (jsonError) {
        console.error('Error parsing logs JSON:', jsonError);
        throw new Error('Failed to parse logs data');
      }
    },
    enabled: !!botId,
    refetchInterval: 20000, // Refetch every 20 seconds
    refetchOnWindowFocus: false
  });

  // Scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Add an effect to handle errors
  useEffect(() => {
    if (error) {
      console.error('Error fetching logs:', error);
      addToast({
        title: 'Error fetching logs',
        description: error instanceof Error ? error.message : 'Failed to fetch logs',
        type: 'error',
      });
    }
  }, [error, addToast]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">
            {logs.length} log entries
          </span>
          {error && (
            <span className="text-sm text-red-500 ml-2">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </span>
          )}
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Bot Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={logContainerRef}
            className="h-[500px] overflow-auto"
          >
            {isLoading && logs.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : logs.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56">
                      Timestamp
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatDate(log.timestamp)}
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900 dark:text-gray-300 font-mono break-all whitespace-pre-wrap">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500 text-center py-8">
                No logs available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 