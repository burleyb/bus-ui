"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { formatTimeAgo } from '@/lib/utils';
import { awsNativeFetch } from '@/lib/authUtils';
import NodeIcon from '../../node/NodeIcon';
import { useRouter } from 'next/navigation';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

interface BotDashboardTabProps {
  nodeData: any;
  timePeriod: string;
  onClose?: () => void;
}

// Add interfaces for history items
interface QueueHistoryItem {
  time: string;
  count: number;
}

export default function BotDashboardTab({ nodeData, timePeriod, onClose }: BotDashboardTabProps) {
  // Add state for metrics data and loading state
  const [metricsData, setMetricsData] = useState<any>(nodeData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const router = useRouter();

  // Setup refresh interval for metrics data
  useEffect(() => {
    // Function to fetch the latest metrics data
    const fetchMetricsData = async () => {
      if (!nodeData?.id) return;

      setIsLoading(true);
      
      try {
        // Generate current timestamp for the API call
        const timestamp = new Date().toISOString();
        
        // Extract range and count from timePeriod
        // This assumes timePeriod is in format like "15m", "1hr", etc.
        let range = 'minute';
        let count = 15;
        
        if (timePeriod) {
          if (timePeriod.endsWith('m')) {
            range = 'minute';
            count = parseInt(timePeriod.replace('m', ''), 10);
          } else if (timePeriod.endsWith('hr')) {
            range = 'hour';
            count = parseInt(timePeriod.replace('hr', ''), 10);
          } else if (timePeriod.endsWith('d')) {
            range = 'day';
            count = parseInt(timePeriod.replace('d', ''), 10);
          } else if (timePeriod.endsWith('w')) {
            range = 'week';
            count = parseInt(timePeriod.replace('w', ''), 10);
          }
        }

        // Build API URL
        const apiUrl = `/api/dashboard/${nodeData.id}?range=${range}&count=${count}&timestamp=${encodeURIComponent(timestamp)}`;
        
        // Fetch the data using authenticated request
        const response = await awsNativeFetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and merge the new data with existing data structure
        const updatedData = {
          ...nodeData,
          ...data,
          // Preserve original node ID and metadata
          id: nodeData.id,
          name: nodeData.name,
          type: nodeData.type
        };
        
        setMetricsData(updatedData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching metrics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Immediately fetch data on mount
    fetchMetricsData();
    
    // Set up interval to refresh every 10 seconds
    const intervalId = setInterval(fetchMetricsData, 10000);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [nodeData?.id, timePeriod]);
  
  // Use the merged data instead of directly using nodeData
  const activeData = metricsData || nodeData;

  // Safeguard against null nodeData
  if (!activeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Format last run date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format time for display
  const formatTime = (value: number | undefined): string => {
    if (value === undefined) return '0s';
    if (value === 0) return '0s';
    
    if (value < 1000) {
      return `${value}ms`;
    } else {
      const seconds = Math.round(value / 1000);
      return `${seconds}s`;
    }
  };

  // Transform time series data for charts
  const prepareChartData = (timeSeriesData: any[]) => {
    if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
      return [];
    }

    return timeSeriesData.map(point => ({
      time: point.time,
      value: point.value || point.count || 0,
      formattedTime: new Date(point.time).toLocaleTimeString()
    }));
  };

  const executionData = prepareChartData(activeData.executions || []);
  const errorData = prepareChartData(activeData.errors || []);
  const durationData = prepareChartData(activeData.duration || []);

  // Prepare queue data for events read and written tables
  const prepareQueueData = () => {
    // Handle metrics for read queues
    const readMetrics = activeData.metrics?.read || {};
    const readQueues = activeData.queues?.read || {};
    const readHistory = activeData.readHistory || {};
    
    const readData = Object.entries(readQueues).map(([queueId, queueInfo]: [string, any]) => {
      const metrics = readMetrics[queueId] || {};
      
      // Get historical counts for this queue
      // If we don't have history data, create an array with the current count
      const queueHistory = readHistory[queueId] || [];
      
      // Extract event counts from the last 3 time periods
      // If we have history, use it; otherwise, use the current count 3 times
      const historicalCounts = queueHistory.length ? 
        queueHistory.slice(-3).map((item: QueueHistoryItem) => item.count || 0) :
        Array(3).fill(metrics.totalEvents || queueInfo.events || 0);
      
      return {
        queueId,
        queueName: queueInfo.name || queueId,
        eventsRead: metrics.totalEvents || queueInfo.events || 0,
        lastRead: metrics.lastEventTimestamp || queueInfo.lastRead || null,
        lagTime: metrics.lagTime || queueInfo.lagTime || 0,
        lagEvents: metrics.lagEvents || queueInfo.lagEvents || 0,
        historicalCounts: historicalCounts
      };
    });
    
    // Handle metrics for write queues
    const writeMetrics = activeData.metrics?.write || {};
    const writeQueues = activeData.queues?.write || {};
    const writeHistory = activeData.writeHistory || {};
    
    const writeData = Object.entries(writeQueues).map(([queueId, queueInfo]: [string, any]) => {
      const metrics = writeMetrics[queueId] || {};
      
      // Get historical counts for this queue
      const queueHistory = writeHistory[queueId] || [];
      
      // Extract event counts from the last 3 time periods
      const historicalCounts = queueHistory.length ?
        queueHistory.slice(-3).map((item: QueueHistoryItem) => item.count || 0) :
        Array(3).fill(metrics.totalEvents || queueInfo.events || 0);
      
      return {
        queueId,
        queueName: queueInfo.name || queueId,
        eventsWritten: metrics.totalEvents || queueInfo.events || 0,
        lastWrite: metrics.lastEventTimestamp || queueInfo.lastWrite || null,
        historicalCounts: historicalCounts
      };
    });
    
    return { readData, writeData };
  };
  
  const { readData, writeData } = prepareQueueData();

  // First, add a method to navigate to a queue in the workflow
  const navigateToNode = (nodeId: string, type: string = 'queue') => {
    if (onClose) {
      onClose();
    }
    // Navigate to workflow view with the node as primary
    router.push(`/workflow?primaryNode=${type}:${nodeId}`);
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 240px)" }}>
      {/* Auto-refresh indicator */}
      <div className="flex justify-end mb-2 text-xs text-gray-500">
        Data refreshes every 10s • Last updated: {lastUpdated.toLocaleTimeString()}
        {isLoading && <span className="ml-2">• Refreshing...</span>}
      </div>
      
      {/* Top section with events read/written - takes available space */}
      <div className="flex-grow">
        {/* Events read and written by bot - side by side in md screens and larger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Events read by bot */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
            <h3 className="text-lg font-medium mb-4">Events Read by Bot</h3>
            
            {readData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Queue</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">View</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Read</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Read</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Events</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {readData.map((queue: any, index: number) => (
                      <tr key={queue.queueId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center space-x-2">
                            <NodeIcon node={{ type: 'queue' }} className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{queue.queueName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigateToNode(queue.queueId)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title="View in workflow"
                          >
                            <NodeIcon node={{ type: 'queue' }} className="w-4 h-4 inline" />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 w-16 mx-auto">
                            {queue.historicalCounts && queue.historicalCounts.length > 0 ? (
                              <Sparklines data={queue.historicalCounts} height={20} margin={2}>
                                <SparklinesLine color="#3b82f6" />
                                <SparklinesSpots size={2} spotColors={{ '-1': '#ef4444', '0': '#22c55e', '1': '#3b82f6' }} />
                              </Sparklines>
                            ) : (
                              <div className="text-gray-400 text-center">No data</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{queue.eventsRead.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(queue.lastRead)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatTime(queue.lagTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{queue.lagEvents.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No read connections found</div>
            )}
          </div>
          
          {/* Events written by bot */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
            <h3 className="text-lg font-medium mb-4">Events Written by Bot</h3>
            
            {writeData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Queue</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">View</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Written</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Write</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {writeData.map((queue: any, index: number) => (
                      <tr key={queue.queueId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center space-x-2">
                            <NodeIcon node={{ type: 'queue' }} className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{queue.queueName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigateToNode(queue.queueId)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title="View in workflow"
                          >
                            <NodeIcon node={{ type: 'queue' }} className="w-4 h-4 inline" />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 w-16 mx-auto">
                            {queue.historicalCounts && queue.historicalCounts.length > 0 ? (
                              <Sparklines data={queue.historicalCounts} height={20} margin={2}>
                                <SparklinesLine color="#3b82f6" />
                                <SparklinesSpots size={2} spotColors={{ '-1': '#ef4444', '0': '#22c55e', '1': '#3b82f6' }} />
                              </Sparklines>
                            ) : (
                              <div className="text-gray-400 text-center">No data</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{queue.eventsWritten.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(queue.lastWrite)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No write connections found</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section with charts - fixed at the bottom */}
      <div className="mt-auto">
        <h3 className="text-lg font-medium mb-4">Performance Charts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[280px]">
          {/* Combined Execution count and metrics card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Execution Count</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-3 gap-4">
              {/* Left side: Metrics */}
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-3xl font-bold">{activeData.stats?.executions || 0}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Last run:<br/>{formatDate(activeData.stats?.lastRun)}
                </div>
              </div>
              
              {/* Right side: Chart */}
              <div className="col-span-2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={executionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} executions`, 'Count']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" name="Executions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Combined Error count and metrics card */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Count</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-3 gap-4">
              {/* Left side: Metrics */}
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-3xl font-bold">{activeData.stats?.errors || 0}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Error rate:<br/>{activeData.stats?.errorRate || 0}%
                </div>
              </div>
              
              {/* Right side: Chart */}
              <div className="col-span-2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={errorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} errors`, 'Count']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" name="Errors" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Combined Duration metrics and execution time chart */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Execution Time (ms)</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow grid grid-cols-3 gap-4">
              {/* Left side: Metrics */}
              <div className="col-span-1 flex flex-col justify-center">
                <div>
                  <div className="text-sm text-gray-500">Average:</div>
                  <div className="text-xl font-bold">{formatTime(activeData.stats?.avgDuration)}</div>
                </div>
                <div className="mt-3">
                  <div className="text-sm text-gray-500">Max:</div>
                  <div className="text-xl font-bold">{formatTime(activeData.stats?.maxDuration)}</div>
                </div>
              </div>
              
              {/* Right side: Chart */}
              <div className="col-span-2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} ms`, 'Duration']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Duration" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 