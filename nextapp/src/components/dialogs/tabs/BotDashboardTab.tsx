"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitFork } from 'lucide-react';
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
import NodeIcon from '../../node/NodeIcon';
import { useRouter } from 'next/navigation';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { useMetricsData } from '@/context/ApiContext';
import { useWorkflowGraph } from '@/hooks/useWorkflowGraph';
import moment from 'moment';

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

// Add this interface at the top of the file, with the other interfaces
interface HistoricalDataPoint {
  metrics?: {
    read?: Record<string, any>;
    write?: Record<string, any>;
  };
  queues?: {
    read?: Record<string, any>;
    write?: Record<string, any>;
  };
}

export default function BotDashboardTab({ nodeData, timePeriod, onClose }: BotDashboardTabProps) {
  const router = useRouter();
  
  // Use the workflow graph hook to get access to graph state methods
  const { updateGraphState } = useWorkflowGraph();
  
  // Use the metrics data hook with auto-refresh interval of 10 seconds
  const { 
    data: metricsData, 
    isLoading, 
    error,
    dataUpdatedAt 
  } = useMetricsData(nodeData?.id, timePeriod, 10000);
  
  // Last updated time from the query
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();
  
  // Use a combined data object with original node data and metrics data
  const activeData = React.useMemo(() => {
    if (!metricsData) return nodeData;
    
    return {
      ...nodeData,
      ...metricsData,
      // Preserve original node ID and metadata
      id: nodeData.id,
      name: nodeData.name,
      type: nodeData.type
    };
  }, [nodeData, metricsData]);

  // Function to navigate to a node in the workflow view
  const navigateToNode = (nodeId: string) => {
    if (onClose) {
      onClose();
    }
    
    // Update graph state to focus on the node
    updateGraphState({ 
      focusNode: nodeId,
      offset: [0, 0] // Center the graph around the node
    });
  };

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

  // Format lag time to show in human-readable format with "ago"
  const formatLagTime = (duration: number | undefined | string): string => {
    if (!duration) return '';
    
    // Convert to a number if it's a string
    const durationValue = typeof duration === 'string' ? parseInt(duration, 10) : duration;
    
    // If we can't parse it or it's 0, return empty
    if (isNaN(durationValue) || durationValue === 0) return '';
    
    // Use moment.js to format the duration
    const formattedTime = moment.duration(durationValue).humanize() + " ago";
    
    // Replace "a few" with empty string as in the original code
    return formattedTime.replace("a few ", "");
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
    // Get time period labels for history
    const getTimePeriodLabels = (): string[] => {
      let periodLabel = "";
      
      if (timePeriod.endsWith('m')) {
        const minutes = parseInt(timePeriod.replace('m', ''), 10);
        periodLabel = `${minutes*3} minutes`;
      } else if (timePeriod.endsWith('hr')) {
        const hours = parseInt(timePeriod.replace('hr', ''), 10);
        periodLabel = hours === 1 ? "1 hour" : `${hours*3} hours`;
      } else if (timePeriod.endsWith('d')) {
        const days = parseInt(timePeriod.replace('d', ''), 10);
        periodLabel = days === 1 ? "1 day" : `${days*3} days`;
      } else if (timePeriod.endsWith('w')) {
        const weeks = parseInt(timePeriod.replace('w', ''), 10);
        periodLabel = weeks === 1 ? "1 week" : `${weeks*3} weeks`;
      }
      
      // Generate generic labels that show relative periods
      // The exact timestamps will be in the API data
      return [
        `Previous ${periodLabel}`,
        `Previous ${periodLabel}`,
        `Current ${periodLabel}`
      ];
    };
    
    const timeLabels = getTimePeriodLabels();

    // Handle metrics for read queues
    
    // Handle metrics for write queues
    
    return { timeLabels };
  };
  
  const { timeLabels } = prepareQueueData();

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
            
            {nodeData && nodeData.queues?.read && Object.keys(nodeData.queues.read).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Queue</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Read</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Read</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Events</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {nodeData && nodeData.queues?.read && Object.keys(nodeData.queues.read).map((queueId: string, index: number) => {
                      const readqueue = nodeData.queues.read[queueId];
                      return (
                        <tr key={queueId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center space-x-2">
                            <NodeIcon node={{ type: 'queue' }} className="w-4 h-4" />
                            <span className="truncate max-w-[500px]">{readqueue.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigateToNode(readqueue.id)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title="View in workflow"
                          >
                            <div style={{ transform: 'rotate(90deg)' }}>
                              <GitFork size={26} />
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 w-24 mx-auto">
                            {readqueue.values && readqueue.values.length > 0 ? (
                              <div className="flex flex-col items-center">
                                <Sparklines data={readqueue.values.map((value: any) => value.value)} height={70} margin={2}>
                                  <SparklinesLine color="#3b82f6" style={{ fill: "none" }} />
                                  <SparklinesSpots size={4} spotColors={{ '-1': '#ef4444', '0': '#22c55e', '1': '#3b82f6' }} />
                                </Sparklines>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-center">No data</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{readqueue.values?.reduce(function(total: number, read: any) {
												return total + (read.value || 0)
											}, 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatLagTime(readqueue.last_read_lag)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatLagTime(readqueue.last_event_source_timestamp_lag)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{readqueue.lagEvents.toLocaleString()}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No read connections found</div>
            )}

            {/* Add explanation below read queue table */}
            {nodeData && nodeData.queues?.read && Object.keys(nodeData.queues.read).length > 0 && (
              <div className="mt-2 text-xs text-gray-500 italic">
                * Activity charts show historical event counts. Hover over numbers for more details.
              </div>
            )}
          </div>
          
          {/* Events written by bot */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
            <h3 className="text-lg font-medium mb-4">Events Written by Bot</h3>
            
            {nodeData && nodeData.queues?.write && Object.keys(nodeData.queues.write).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Queue</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Written</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Write</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {nodeData && nodeData.queues?.write && Object.keys(nodeData.queues.write).map((queueId: string, index: number) => {
                      const writequeue = nodeData.queues.write[queueId];
                      return (
                        <tr key={queueId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center space-x-2">
                            <NodeIcon node={{ type: 'queue' }} className="w-4 h-4" />
                            <span className="truncate max-w-[500px]">{writequeue.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigateToNode(writequeue.id)}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title="View in workflow"
                          >
                            <div style={{ transform: 'rotate(90deg)' }}>
                              <GitFork size={26} />
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 w-24 mx-auto">
                            {writequeue.values && writequeue.values.length > 0 ? (
                              <div className="flex flex-col items-center">
                                <Sparklines data={writequeue.values.map((value: any) => value.value)} height={70} margin={2}>
                                  <SparklinesLine color="#3b82f6" style={{ fill: "none" }} />
                                  <SparklinesSpots size={4} spotColors={{ '-1': '#ef4444', '0': '#22c55e', '1': '#3b82f6' }} />
                                </Sparklines>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-center">No data</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{writequeue.values?.reduce(function(total: number, write: any) {
												return total + (write.value || 0)
											}, 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatLagTime(writequeue.last_write_lag)}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No write connections found</div>
            )}

            {/* Add explanation below write queue table */}
            {nodeData && nodeData.queues?.write && Object.keys(nodeData.queues.write).length > 0 && (
              <div className="mt-2 text-xs text-gray-500 italic">
                * Activity charts show historical event counts. Hover over numbers for more details.
              </div>
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
                <div className="text-3xl font-bold">{nodeData.stats?.executions || 0}</div>
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