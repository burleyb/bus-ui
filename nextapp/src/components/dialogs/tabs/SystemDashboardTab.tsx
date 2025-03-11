"use client";

import React, { useEffect, useState, useRef } from 'react';
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
  Legend,
  ReferenceLine
} from 'recharts';
import { formatTimeAgo } from '@/lib/utils';
import NodeIcon from '../../node/NodeIcon';
import { useRouter } from 'next/navigation';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { useMetricsData, useNodeDetailsData } from '@/context/ApiContext';
import { useWorkflowGraph } from '@/hooks/useWorkflowGraph';
import moment from 'moment';
import { useDialogs } from '@/hooks/useDialogs';

interface SystemDashboardTabProps {
  nodeData: any;
  timePeriod: string;
  onClose?: () => void;
}

// Add interfaces for history items
interface BotHistoryItem {
  time: string;
  count: number;
}

// Add this interface for historical data points
interface HistoricalDataPoint {
  metrics?: {
    read?: Record<string, any>;
    write?: Record<string, any>;
  };
  bots?: {
    read?: Record<string, any>;
    write?: Record<string, any>;
  };
}

// Define an interface for the sparkline data
interface SparklineDataPoint {
  time: string;
  value: number;
}

// Define a type for the reference line
interface ReferenceLineProps {
  timestamp: string;
  color?: string;
}

export default function SystemDashboardTab({ nodeData, timePeriod, onClose }: SystemDashboardTabProps) {
  const router = useRouter();
  
  // Add useDialogs hook to access openNodeSettingsDialog
  const { openNodeSettingsDialog } = useDialogs();
  
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
  
  // Use the new useNodeDetailsData hook to get details data
  const { 
    data: detailsData, 
    isLoading: isDetailsLoading, 
    error: detailsError 
  } = useNodeDetailsData(nodeData?.id, 'system', timePeriod, 60000);
  
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
    updateGraphState({ focusNode: nodeId });
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
  const prepareChartData = (timeSeriesData: any[], preserveTotal: boolean = false) => {
    if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
      return [];
    }

    return timeSeriesData.map(point => ({
      time: point.time,
      value: point.value || point.count || 0,
      // Preserve total duration for correct average calculations
      ...(preserveTotal && point.total !== undefined ? { total: point.total } : {}),
      formattedTime: new Date(point.time).toLocaleTimeString()
    }));
  };

  // Log metrics data when it changes
  useEffect(() => {
    if (metricsData) {
      console.log('[SystemDashboardTab] Raw metrics data:', metricsData);
      
      // Check if we have the expected event data properties
      if (metricsData.eventsWritten) {
        console.log('[SystemDashboardTab] Events written data found, length:', metricsData.eventsWritten.length);
      } else {
        console.log('[SystemDashboardTab] No eventsWritten property found in metrics data');
        // Check for alternative property names
        const possibleKeys = Object.keys(metricsData).filter(key => 
          key.toLowerCase().includes('write') || 
          key.toLowerCase().includes('written') ||
          key.toLowerCase().includes('event')
        );
        if (possibleKeys.length > 0) {
          console.log('[SystemDashboardTab] Possible alternative keys:', possibleKeys);
        }
      }
      
      if (metricsData.eventsRead) {
        console.log('[SystemDashboardTab] Events read data found, length:', metricsData.eventsRead.length);
      } else {
        console.log('[SystemDashboardTab] No eventsRead property found in metrics data');
      }
      
      if (metricsData.lag) {
        console.log('[SystemDashboardTab] Lag data found, length:', metricsData.lag.length);
      } else {
        console.log('[SystemDashboardTab] No lag property found in metrics data');
      }
    }
  }, [metricsData]);
  
  // Log active data when it changes
  useEffect(() => {
    if (activeData) {
      console.log('[SystemDashboardTab] Active data keys:', Object.keys(activeData));
      
      // Try to find any arrays that might be time series data
      Object.keys(activeData).forEach(key => {
        if (Array.isArray(activeData[key]) && activeData[key].length > 0) {
          console.log(`[SystemDashboardTab] Found array data in key '${key}':`, activeData[key][0]);
        }
      });
    }
  }, [activeData]);
  
  // Function to find data by checking multiple possible property names
  const findTimeSeriesData = (data: any, possibleKeys: string[]): any[] => {
    // First check the top level
    for (const key of possibleKeys) {
      if (data[key] && Array.isArray(data[key]) && data[key].length > 0) {
        console.log(`[SystemDashboardTab] Found data in top-level property '${key}'`);
        return data[key];
      }
    }
    
    // Check common nested objects
    const nestedObjects = ['metrics', 'data', 'history', 'stats', 'timeSeries', 'time_series'];
    for (const nestedKey of nestedObjects) {
      if (data[nestedKey] && typeof data[nestedKey] === 'object') {
        const nestedData = data[nestedKey];
        
        // Check for arrays directly in the nested object
        for (const key of possibleKeys) {
          if (nestedData[key] && Array.isArray(nestedData[key]) && nestedData[key].length > 0) {
            console.log(`[SystemDashboardTab] Found data in nested property '${nestedKey}.${key}'`);
            return nestedData[key];
          }
        }
      }
    }
    
    // Look for data in executions, duration arrays - specific to certain properties
    if (possibleKeys.includes('eventsWritten') && data.executions && Array.isArray(data.executions)) {
      console.log(`[SystemDashboardTab] Using 'executions' data for events written`);
      return data.executions;
    }
    
    if (possibleKeys.includes('lag') && data.duration && Array.isArray(data.duration)) {
      console.log(`[SystemDashboardTab] Using 'duration' data for lag`);
      return data.duration;
    }
    
    // Check for time series data in nested bot structures for specific data types
    const botSections = ['bots', 'nodes', 'connections'];
    for (const section of botSections) {
      if (data[section] && typeof data[section] === 'object') {
        // Check read/write sections for relevant data
        const directions = ['read', 'write', 'written', 'reads', 'writes'];
        
        for (const direction of directions) {
          if (data[section][direction] && typeof data[section][direction] === 'object') {
            // For each bot
            for (const botId in data[section][direction]) {
              const bot = data[section][direction][botId];
              
              // Check if this bot has values we can use
              if (bot.values && Array.isArray(bot.values) && bot.values.length > 0) {
                if ((possibleKeys.includes('eventsWritten') && direction.includes('write')) || 
                    (possibleKeys.includes('eventsRead') && direction.includes('read'))) {
                  console.log(`[SystemDashboardTab] Found data in bot '${botId}' in direction '${direction}'`);
                  return bot.values;
                }
              }
            }
          }
        }
      }
    }
    
    // If we get here, we couldn't find the data
    console.log(`[SystemDashboardTab] Could not find data for keys: ${possibleKeys.join(', ')}`);
    return [];
  };

  const eventsWrittenData = prepareChartData(
    findTimeSeriesData(activeData, [
      'eventsWritten', 
      'events_written', 
      'written_events', 
      'writeEvents', 
      'write_events', 
      'write', 
      'written',
      'executions'
    ])
  );
  
  const eventsReadData = prepareChartData(
    findTimeSeriesData(activeData, [
      'eventsRead', 
      'events_read', 
      'read_events', 
      'readEvents', 
      'read', 
      'reads'
    ])
  );
  
  const lagData = prepareChartData(
    findTimeSeriesData(activeData, [
      'lag', 
      'lag_time', 
      'lag_seconds', 
      'lagTime', 
      'lagSeconds', 
      'delay', 
      'latency'
    ]),
    true
  );

  // Prepare bot data for events read and written tables
  const prepareBotData = () => {
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

    // Handle metrics for bots that write to this system
    
    // Handle metrics for bots that read from this system
    
    return { timeLabels };
  };
  
  const { timeLabels } = prepareBotData();

  // Helper function to calculate reference line position
  const calculateReferenceLinePosition = (lastReadTimestamp: string, dataPoints: any[]): number => {
    // If no data points or timestamp, default to left edge
    if (!dataPoints || dataPoints.length === 0 || !lastReadTimestamp) {
      return 0;
    }

    const lastReadTime = new Date(lastReadTimestamp).getTime();
    
    // Get time range of the sparkline data
    const timeValues = dataPoints.map(point => new Date(point.time).getTime());
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    
    // If last read time is before the range, show at left edge
    if (lastReadTime <= minTime) {
      return 0;
    }
    
    // If last read time is after the range, show at right edge
    if (lastReadTime >= maxTime) {
      return 100;
    }
    
    // Calculate position as percentage within the time range
    const position = ((lastReadTime - minTime) / (maxTime - minTime)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Better sparkline using Recharts that matches the Performance Charts styling
  const SparklineChart = ({ 
    data, 
    referenceLine,
    height = 50
  }: { 
    data: SparklineDataPoint[];
    referenceLine?: ReferenceLineProps;
    height?: number;
  }) => {
    // Memoize the data to prevent unnecessary re-renders
    const memoizedData = React.useMemo(() => {
      // Handle empty data case
      if (!data || data.length === 0) {
        return [{ time: new Date().toISOString(), value: 0 }];
      }
      
      // Format the data for better display
      return data.map(point => ({
        ...point,
        formattedTime: new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    }, [data]);

    // Handle empty data case
    const isEmpty = !data || data.length === 0;
    
    // Memoize the reference line props to prevent unnecessary re-renders
    const referenceLineProps = React.useMemo(() => {
      if (!referenceLine || !referenceLine.timestamp) return null;
      
      return {
        x: isEmpty ? 0 : referenceLine.timestamp,
        stroke: referenceLine.color || "#ef4444",
        strokeWidth: 2,
        strokeDasharray: "3 3",
        // Use proper types for label position
        label: {
          value: 'Last read',
          position: 'top' as const,
          fill: referenceLine.color || "#ef4444",
          fontSize: 9
        }
      };
    }, [referenceLine, isEmpty]);
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart 
          data={memoizedData} 
          margin={{ top: 20, right: 5, left: 5, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="time" 
            hide={true}
          />
          <YAxis 
            hide={true}
          />
          <Tooltip 
            formatter={(value: any) => [`${value} events`, 'Count']}
            labelFormatter={(label) => {
              const date = new Date(label);
              return `Time: ${date.toLocaleString()}`;
            }}
            contentStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: '6px 8px',
              fontSize: '12px'
            }}
            // Position tooltip above the chart instead of on top of it
            wrapperStyle={{ 
              top: -80, 
              zIndex: 100 
            }}
            cursor={{ 
              stroke: '#9ca3af', 
              strokeWidth: 1, 
              strokeDasharray: '3 3' 
            }}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
            name="Events" 
          />
          {referenceLine && referenceLine.timestamp && referenceLineProps && (
            <ReferenceLine 
              {...referenceLineProps}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 240px)" }}>
      {/* Auto-refresh indicator */}
      <div className="flex justify-end mb-2 text-xs text-gray-500">
        Data refreshes every 10s • Last updated: {lastUpdated.toLocaleTimeString()}
        {isLoading && <span className="ml-2">• Refreshing...</span>}
      </div>
      
      {/* Main content area - Using flex column with flex-grow for top content and mt-auto for bottom */}
      <div className="flex flex-col h-full">
        {/* Top section with tables - This will take available space but allow bottom section to be at the bottom */}
        <div className="flex-grow">
          {/* Events written to and read from system - side by side in md screens and larger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Events written by bots to this system */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Events Written By Bots To This System</h3>
              
              {nodeData && nodeData.bots?.write && Object.keys(nodeData.bots.write).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bot</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Written</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Write</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {nodeData && nodeData.bots?.write && Object.keys(nodeData.bots.write).map((botId: string, index: number) => {
                        const writeBot = nodeData.bots.write[botId];
                        return (
                          <tr key={botId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex items-center space-x-2">
                              <NodeIcon node={{ type: 'bot' }} className="w-4 h-4" />
                              <span 
                                className="truncate max-w-[500px] hover:text-blue-500 cursor-pointer"
                                onClick={() => openNodeSettingsDialog(writeBot.id)}
                                title="Open bot settings"
                              >
                                {writeBot.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => navigateToNode(writeBot.id)}
                              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                              title="View in workflow"
                            >
                              <div style={{ transform: 'rotate(90deg)' }}>
                                <GitFork size={26} />
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-10 w-32 mx-auto">
                              {writeBot.values && writeBot.values.length > 0 ? (
                                <SparklineChart 
                                  data={writeBot.values}
                                  height={50}
                                />
                              ) : (
                                <SparklineChart 
                                  data={[]}
                                  height={50}
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{writeBot.values?.reduce(function(total: number, write: any) {
                            return total + (write.value || 0)
                          }, 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatLagTime(writeBot.last_write_lag)}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No bots writing to this system</div>
              )}

              {/* Add explanation below write bot table */}
              {nodeData && nodeData.bots?.write && Object.keys(nodeData.bots.write).length > 0 && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  * Activity charts show historical event counts. Hover over numbers for more details.
                </div>
              )}
            </div>
            
            {/* Events read by bots from this system */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Events Read By Bots From This System</h3>
              
              {nodeData && nodeData.bots?.read && Object.keys(nodeData.bots.read).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bot</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Read</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Read</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Events</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {nodeData && nodeData.bots?.read && Object.keys(nodeData.bots.read).map((botId: string, index: number) => {
                        const readBot = nodeData.bots.read[botId];
                        return (
                          <tr key={botId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <div className="flex items-center space-x-2">
                              <NodeIcon node={{ type: 'bot' }} className="w-4 h-4" />
                              <span 
                                className="truncate max-w-[500px] hover:text-blue-500 cursor-pointer"
                                onClick={() => openNodeSettingsDialog(readBot.id)}
                                title="Open bot settings"
                              >
                                {readBot.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => navigateToNode(readBot.id)}
                              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                              title="View in workflow"
                            >
                              <div style={{ transform: 'rotate(90deg)' }}>
                                <GitFork size={26} />
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-10 w-32 mx-auto">
                              {readBot.values && readBot.values.length > 0 ? (
                                <SparklineChart 
                                  data={readBot.values}
                                  referenceLine={readBot.last_read_event_timestamp ? {
                                    timestamp: readBot.last_read_event_timestamp,
                                    color: "#ef4444"
                                  } : undefined}
                                  height={50}
                                />
                              ) : (
                                <SparklineChart 
                                  data={[]}
                                  referenceLine={readBot.last_read_event_timestamp ? {
                                    timestamp: readBot.last_read_event_timestamp,
                                    color: "#ef4444"
                                  } : undefined}
                                  height={50}
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{readBot.values?.reduce(function(total: number, read: any) {
                            return total + (read.value || 0)
                          }, 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatLagTime(readBot.last_read_lag)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatLagTime(readBot.last_event_source_timestamp_lag)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{readBot.lagEvents.toLocaleString()}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No bots reading from this system</div>
              )}

              {/* Add explanation below read bot table */}
              {nodeData && nodeData.bots?.read && Object.keys(nodeData.bots.read).length > 0 && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  * Activity charts show historical event counts. Hover over numbers for more details.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Performance charts section - Using mt-auto to push to bottom */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-auto">
          <h3 className="text-lg font-medium mb-4">System Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Events Written Chart */}
            <Card className="flex flex-col min-h-[280px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Events Written</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow grid grid-cols-3 gap-4">
                {/* Left side: Metrics */}
                <div className="col-span-1 flex flex-col justify-center">
                  <div className="text-3xl font-bold">
                    {eventsWrittenData.reduce((sum, point) => sum + (point.value || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Total events written by all bots in this time period
                  </div>
                </div>
                
                {/* Right side: Chart */}
                <div className="col-span-2 h-full">
                  {eventsWrittenData && eventsWrittenData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={eventsWrittenData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="time"
                          tickFormatter={(time) => {
                            const date = new Date(time);
                            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: any) => [`${value} events`, 'Count']}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return `Time: ${date.toLocaleString()}`;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                          name="Events Written"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Events Read Chart */}
            <Card className="flex flex-col min-h-[280px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Events Read</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow grid grid-cols-3 gap-4">
                {/* Left side: Metrics */}
                <div className="col-span-1 flex flex-col justify-center">
                  <div className="text-3xl font-bold">
                    {eventsReadData.reduce((sum, point) => sum + (point.value || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Total events read by all bots in this time period
                  </div>
                </div>
                
                {/* Right side: Chart */}
                <div className="col-span-2 h-full">
                  {eventsReadData && eventsReadData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={eventsReadData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="time"
                          tickFormatter={(time) => {
                            const date = new Date(time);
                            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: any) => [`${value} events`, 'Count']}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return `Time: ${date.toLocaleString()}`;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={false}
                          name="Events Read"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Lag In Seconds Chart */}
            <Card className="flex flex-col min-h-[280px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Lag In Seconds</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow grid grid-cols-3 gap-4">
                {/* Left side: Metrics */}
                <div className="col-span-1 flex flex-col justify-center">
                  <div className="text-3xl font-bold">
                    {lagData.length > 0 
                      ? Math.round(lagData.reduce((sum, point) => sum + (point.value || 0), 0) / lagData.length)
                      : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Average age of events read by bots at the time they were read
                  </div>
                </div>
                
                {/* Right side: Chart */}
                <div className="col-span-2 h-full">
                  {lagData && lagData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={lagData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="time"
                          tickFormatter={(time) => {
                            const date = new Date(time);
                            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: any) => [`${value} seconds`, 'Lag']}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return `Time: ${date.toLocaleString()}`;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          dot={false}
                          name="Lag"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </div>
  );
} 