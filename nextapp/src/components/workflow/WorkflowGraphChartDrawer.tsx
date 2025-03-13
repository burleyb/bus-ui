"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useDialogs } from '@/hooks/useDialogs';
import { useMetricsData } from '@/context/ApiContext';
import { GraphData, Node, Link, TimePeriod } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { GitFork, ExternalLink } from 'lucide-react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import moment from 'moment';
import NodeIcon from '../node/NodeIcon';
import { formatTimeAgo } from '@/lib/utils';
import { formatChartTime, formatDate, formatDuration, calculateTimeRange } from '@/lib/chartUtils';

// Interface for the chart drawer props
interface WorkflowGraphChartDrawerProps {
  isOpen: boolean;
  selectedNode: string;
  graphData: GraphData;
  timePeriod?: TimePeriod;
  onClose: () => void;
}

// Interface for chart data
interface ChartData {
  time: string;
  formattedTime: string;
  value: number;
}

// Interface for tab data
interface NodeTab {
  id: string;
  label: string;
  type: string;
  relation: 'self' | 'read' | 'write';
  relatedNodeType?: string;
}

// Interface for time range window
interface TimeRangeWindow {
  start: string;
  end: string;
  percentStart: number;
  percentEnd: number;
}

export function WorkflowGraphChartDrawer({
  isOpen,
  selectedNode,
  graphData,
  timePeriod,
  onClose
}: WorkflowGraphChartDrawerProps) {
  // State
  const [activeTab, setActiveTab] = useState<string>('');
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]); // Percentage range for time slider
  const [actualTimeWindow, setActualTimeWindow] = useState<TimeRangeWindow>({
    start: '',
    end: '',
    percentStart: 0,
    percentEnd: 100
  });
  const [chartTimePeriod, setChartTimePeriod] = useState<string>(
    timePeriod?.interval ? 
    convertTimePeriodToString(timePeriod.interval) : 
    '15m'
  );
  
  // Context
  const { state } = useAppContext();
  const { openNodeSettingsDialog } = useDialogs();
  
  // Get available tabs based on node relationships
  const tabs = useMemo(() => {
    if (!selectedNode || !state.nodes) return [];
    
    // Initialize with selected node
    const nodeTabs: NodeTab[] = [];
    const selectedNodeData = state.nodes[selectedNode];
    
    if (selectedNodeData) {
      nodeTabs.push({
        id: selectedNode,
        label: selectedNodeData.label || selectedNode,
        type: selectedNodeData.type || 'bot',
        relation: 'self'
      });
      
      // Add child nodes using link_to.children
      if (selectedNodeData.link_to?.children) {
        Object.keys(selectedNodeData.link_to.children).forEach(childId => {
          const childNode = state.nodes[childId];
          if (childNode && !nodeTabs.some(tab => tab.id === childId) && 
              childNode.status !== 'archived' && !childNode.archived) {
            
            // Determine relationship type: bot->queue/system = write
            let relation: 'read' | 'write' = 'write';
            if ((selectedNodeData.type === 'queue' || selectedNodeData.type === 'system') && 
                childNode.type === 'bot') {
              relation = 'read';
            }
            
            nodeTabs.push({
              id: childId,
              label: childNode.label || childId,
              type: childNode.type || 'bot',
              relation: relation,
              relatedNodeType: childNode.type
            });
          }
        });
      }
      
      // Add parent nodes using link_to.parent
      if (selectedNodeData.link_to?.parent) {
        Object.keys(selectedNodeData.link_to.parent).forEach(parentId => {
          const parentNode = state.nodes[parentId];
          if (parentNode && !nodeTabs.some(tab => tab.id === parentId) &&
              parentNode.status !== 'archived' && !parentNode.archived) {
            
            // Determine relationship type: queue/system->bot = read
            let relation: 'read' | 'write' = 'read';
            if (selectedNodeData.type === 'bot' && 
                (parentNode.type === 'queue' || parentNode.type === 'system')) {
              relation = 'write';
            }
            
            nodeTabs.push({
              id: parentId,
              label: parentNode.label || parentId,
              type: parentNode.type || 'bot',
              relation: relation,
              relatedNodeType: parentNode.type
            });
          }
        });
      }
    }
    
    return nodeTabs;
  }, [selectedNode, state.nodes]);
  
  // Set active tab to selected node when tabs change
  useEffect(() => {
    if (tabs.length > 0 && (!activeTab || !tabs.some(tab => tab.id === activeTab))) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);
  
  // Update chart time period when time period prop changes
  useEffect(() => {
    if (timePeriod?.interval) {
      setChartTimePeriod(convertTimePeriodToString(timePeriod.interval));
    }
  }, [timePeriod]);
  
  // Convert time period to string format
  function convertTimePeriodToString(interval: string): string {
    const timePeriods: Record<string, string> = { 
      'minute_15': '15m', 
      'hour': '1h', 
      'hour_6': '6h', 
      'day': '1d', 
      'week': '1w' 
    };
    return timePeriods[interval] || '15m';
  }
  
  // Calculate full time range based on timePeriod or default to current time minus 3:30 hours
  const calculateFullTimeRange = (metricsData: any): { start: string, end: string } => {
    if (metricsData && metricsData.timeStart && metricsData.timeEnd) {
      return {
        start: metricsData.timeStart,
        end: metricsData.timeEnd
      };
    }
    
    // Default to current time minus 3:30 hours if no timePeriod is provided
    const end = moment();
    const start = moment().subtract(3, 'hours').subtract(30, 'minutes');
    
    return {
      start: start.format(),
      end: end.format()
    };
  };
  
  // Calculate initial 45-minute window position within the full time range
  const calculateInitialWindow = (fullTimeRange: { start: string, end: string }): TimeRangeWindow => {
    const startTime = moment(fullTimeRange.start);
    const endTime = moment(fullTimeRange.end);
    const fullDuration = endTime.diff(startTime);
    
    // Default to 45 minutes for the window size
    const windowDuration = 45 * 60 * 1000; // 45 minutes in milliseconds
    
    // If the full time range is less than 45 minutes, use the full range
    if (fullDuration <= windowDuration) {
      return {
        start: fullTimeRange.start,
        end: fullTimeRange.end,
        percentStart: 0,
        percentEnd: 100
      };
    }
    
    // Position the 45-minute window at the end of the full range
    const windowStart = moment(endTime).subtract(45, 'minutes');
    
    // Calculate percentages
    const percentStart = Math.max(0, (windowStart.valueOf() - startTime.valueOf()) / fullDuration * 100);
    const percentEnd = 100;
    
    return {
      start: windowStart.format(),
      end: endTime.format(),
      percentStart,
      percentEnd
    };
  };
  
  // Convert time range slider values to actual time period
  const handleTimeRangeChange = (values: [number, number], metricsData: any) => {
    // Enforce minimum window size of 45 minutes (as percentage of total range)
    const fullTimeRange = calculateFullTimeRange(metricsData);
    const startTime = moment(fullTimeRange.start).valueOf();
    const endTime = moment(fullTimeRange.end).valueOf();
    const fullDuration = endTime - startTime;
    const minWindowSize = Math.min(100, (45 * 60 * 1000) / fullDuration * 100); // 45 minutes as percentage
    
    // If window is too small, adjust the end value
    let [start, end] = values;
    if (end - start < minWindowSize) {
      end = Math.min(100, start + minWindowSize);
      
      // If end went over 100%, adjust start instead
      if (end > 100) {
        end = 100;
        start = Math.max(0, end - minWindowSize);
      }
      
      values = [start, end];
    }
    
    setTimeRange(values);
    
    // Calculate the actual time window based on slider positions
    const { start: startDate, end: endDate } = calculateTimeRange(values, fullTimeRange.start, fullTimeRange.end);
    
    setActualTimeWindow({
      start: startDate,
      end: endDate,
      percentStart: values[0],
      percentEnd: values[1]
    });
  };
  
  // Calculate window duration in human-readable format
  const formatWindowDuration = (start: string, end: string): string => {
    if (!start || !end) return '45m';
    
    const startTime = moment(start);
    const endTime = moment(end);
    const durationMs = endTime.diff(startTime);
    const durationMinutes = Math.round(durationMs / (60 * 1000));
    
    if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    } else if (durationMinutes % 60 === 0) {
      return `${durationMinutes / 60}h`;
    } else {
      return `${durationMinutes}m`;
    }
  };
  
  // Format time with 12-hour AM/PM
  const formatTime12Hour = (timestamp: string): string => {
    if (!timestamp) return 'N/A';
    return moment(timestamp).format('MMM D, YYYY h:mm A');
  };
  
  // Navigate to node settings dialog for queue events
  const openQueueEventsWithCheckpoint = (queueId: string, checkpoint: string) => {
    // openNodeSettingsDialog expects just the node ID
    // the 'events' tab and checkpoint will be handled by the DialogContext
    // We need to make sure we're passing the proper queue ID format
    if (!queueId.startsWith('queue:')) {
      queueId = `queue:${queueId}`;
    }
    openNodeSettingsDialog(queueId);
    
    // Note: The DialogContext will need to be updated to handle the checkpoint parameter
    // This requires a different approach outside of this component
  };
  
  // If drawer is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className={`fixed inset-y-[10%] right-0 h-[80%] bg-white dark:bg-gray-800 shadow-lg z-10 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
         style={{ width: '800px' }}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <NodeChartHeader nodeId={selectedNode} />
        <Button variant="ghost" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-4 h-[calc(100%-64px)] overflow-y-auto">
        {tabs.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex">
            {/* Vertical tab list on the left side */}
            <TabsList className="flex-shrink-0 flex-col h-auto mr-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center w-full p-2 mb-1 justify-start gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <NodeIcon node={{ type: tab.type }} className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <span className="truncate max-w-[120px] text-xs">{tab.label}</span>
                    <Badge variant={
                      tab.relation === 'self' ? 'default' :
                      tab.relation === 'write' ? 'secondary' :
                      'outline'
                    } className="mt-1 text-[10px] py-0 px-1">
                      {tab.relation === 'self' ? 'selected' : tab.relation}
                    </Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Content area for the selected tab */}
            <div className="flex-grow">
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-0">
                  <NodeChartContent
                    nodeId={tab.id}
                    nodeType={tab.type}
                    timePeriod={chartTimePeriod}
                    timeRange={timeRange}
                    actualTimeWindow={actualTimeWindow}
                    onTimeRangeChange={handleTimeRangeChange}
                    onOpenQueueEvents={openQueueEventsWithCheckpoint}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No node selected or no data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for rendering the appropriate charts based on node type
function NodeChartContent({
  nodeId,
  nodeType,
  timePeriod,
  timeRange,
  actualTimeWindow,
  onTimeRangeChange,
  onOpenQueueEvents
}: {
  nodeId: string;
  nodeType: string;
  timePeriod: string;
  timeRange: [number, number];
  actualTimeWindow?: TimeRangeWindow;
  onTimeRangeChange: (values: [number, number], metricsData: any) => void;
  onOpenQueueEvents: (queueId: string, checkpoint: string) => void;
}) {
  // Fetch metrics data for the node
  const { data: metricsData, isLoading, error } = useMetricsData(nodeId, timePeriod);
  const { state } = useAppContext();
  
  // Checkpoint info for queues
  const [checkpoint, setCheckpoint] = useState<string>('');
  
  // Helper function to calculate full time range
  const calculateFullTimeRange = (metricsData: any): { start: string, end: string } => {
    if (metricsData && metricsData.timeStart && metricsData.timeEnd) {
      return {
        start: metricsData.timeStart,
        end: metricsData.timeEnd
      };
    }
    
    // Default to current time minus 3:30 hours if no timePeriod is provided
    const end = moment();
    const start = moment().subtract(3, 'hours').subtract(30, 'minutes');
    
    return {
      start: start.format(),
      end: end.format()
    };
  };
  
  // Calculate window duration in human-readable format
  const formatWindowDuration = (start: string, end: string): string => {
    if (!start || !end) return '45m';
    
    const startTime = moment(start);
    const endTime = moment(end);
    const durationMs = endTime.diff(startTime);
    const durationMinutes = Math.round(durationMs / (60 * 1000));
    
    if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    } else if (durationMinutes % 60 === 0) {
      return `${durationMinutes / 60}h`;
    } else {
      return `${durationMinutes}m`;
    }
  };
  
  // Calculate initial 45-minute window position within the full time range
  const calculateInitialWindow = (fullTimeRange: { start: string, end: string }): TimeRangeWindow => {
    const startTime = moment(fullTimeRange.start);
    const endTime = moment(fullTimeRange.end);
    const fullDuration = endTime.diff(startTime);
    
    // Default to 45 minutes for the window size
    const windowDuration = 45 * 60 * 1000; // 45 minutes in milliseconds
    
    // If the full time range is less than 45 minutes, use the full range
    if (fullDuration <= windowDuration) {
      return {
        start: fullTimeRange.start,
        end: fullTimeRange.end,
        percentStart: 0,
        percentEnd: 100
      };
    }
    
    // Position the 45-minute window at the end of the full range
    const windowStart = moment(endTime).subtract(45, 'minutes');
    
    // Calculate percentages
    const percentStart = Math.max(0, (windowStart.valueOf() - startTime.valueOf()) / fullDuration * 100);
    const percentEnd = 100;
    
    return {
      start: windowStart.format(),
      end: endTime.format(),
      percentStart,
      percentEnd
    };
  };
  
  // Initialize the time window when metrics data is loaded
  useEffect(() => {
    if (metricsData && metricsData.timeStart && metricsData.timeEnd) {
      // Calculate full time range
      const fullTimeRange = {
        start: metricsData.timeStart,
        end: metricsData.timeEnd
      };
      
      // Calculate the initial 45-minute window
      const initialWindow = calculateInitialWindow(fullTimeRange);
      
      // Calculate and set the slider percentages based on the initial window
      const startTime = moment(fullTimeRange.start).valueOf();
      const endTime = moment(fullTimeRange.end).valueOf();
      const windowStart = moment(initialWindow.start).valueOf();
      const windowEnd = moment(initialWindow.end).valueOf();
      
      if (endTime > startTime) {
        const percentStart = ((windowStart - startTime) / (endTime - startTime)) * 100;
        const percentEnd = ((windowEnd - startTime) / (endTime - startTime)) * 100;
        
        onTimeRangeChange([percentStart, percentEnd], metricsData);
      }
    }
  }, [metricsData, onTimeRangeChange]);
  
  // Update checkpoint when metrics data changes
  useEffect(() => {
    if (metricsData?.checkpoint) {
      setCheckpoint(metricsData.checkpoint);
    }
  }, [metricsData]);
  
  // Prepare chart data
  const prepareChartData = (data: any[], key: string = 'value'): ChartData[] => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => {
      // Make sure we have a valid time value
      const timeValue = moment(item.time);
      return {
        time: item.time,
        formattedTime: timeValue.isValid() ? timeValue.format('h:mm A') : '', // Use 12-hour AM/PM format with validation
        value: item[key] || 0
      };
    });
  };
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If error, show error state
  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 text-center my-8">
        Error loading chart data. Please try again later.
      </div>
    );
  }
  
  // If no data, show empty state
  if (!metricsData) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-center my-8">
        No chart data available.
      </div>
    );
  }
  
  // Time slider component
  const TimeSlider = () => {
    // Get full time range
    const fullTimeRange = calculateFullTimeRange(metricsData);
    
    // Format actual dates based on the time window
    const startDate = actualTimeWindow?.start || metricsData.timeStart;
    const endDate = actualTimeWindow?.end || metricsData.timeEnd;
    
    // Calculate window duration
    const windowDuration = formatWindowDuration(startDate, endDate);
    
    return (
      <div className="pt-4 pb-6">
        <div className="mb-2 flex justify-between items-center">
          <h4 className="text-sm font-medium">Time Range</h4>
          <div className="flex space-x-2 items-center">
            <span className="text-xs text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Window: {windowDuration}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTimeRangeChange([0, 100], metricsData)}
              className="h-7 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
        <Slider
          defaultValue={timeRange}
          min={0}
          max={100}
          step={1}
          value={timeRange}
          onValueChange={(values) => onTimeRangeChange(values as [number, number], metricsData)}
          className="my-4"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Start: {moment(fullTimeRange.start).format('MMM D, YYYY h:mm A')}</span>
          <span>End: {moment(fullTimeRange.end).format('MMM D, YYYY h:mm A')}</span>
        </div>
      </div>
    );
  };
  
  // Bot charts
  if (nodeType === 'bot') {
    const executionData = prepareChartData(metricsData.executions || []);
    const errorData = prepareChartData(metricsData.errors || []);
    const durationData = prepareChartData(metricsData.duration || []);
    
    // Filter chart data based on the time window if one exists
    const filterDataByTimeWindow = (data: any[]) => {
      if (!actualTimeWindow?.start || !actualTimeWindow?.end) return data;
      
      const startTime = moment(actualTimeWindow.start).valueOf();
      const endTime = moment(actualTimeWindow.end).valueOf();
      
      return data.filter(item => {
        const itemTime = moment(item.time).valueOf();
        return itemTime >= startTime && itemTime <= endTime;
      });
    };
    
    // Apply time window filtering
    const filteredExecutionData = filterDataByTimeWindow(executionData);
    const filteredErrorData = filterDataByTimeWindow(errorData);
    const filteredDurationData = filterDataByTimeWindow(durationData);
    
    return (
      <>
        <TimeSlider />
        
        {/* Execution Count Chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Execution Count</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{filteredExecutionData.reduce((sum, point) => sum + point.value, 0) || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last run:<br/>{formatTimeAgo(metricsData.stats?.lastRun)}
                </div>
              </div>
              <div className="col-span-3 h-[220px] pb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={filteredExecutionData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      tickMargin={20}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} executions`, 'Count']}
                      labelFormatter={(label) => {
                        // Handle when label is the formatted time
                        if (typeof label === 'string' && label.includes('M')) {
                          return `Time: ${label}`;
                        }
                        // Handle when label is a timestamp
                        const timeValue = moment(label);
                        return `Time: ${timeValue.isValid() ? timeValue.format('MMM D, YYYY h:mm A') : 'Unknown'}`;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#22c55e" 
                      name="Executions" 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Error Count Chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Count</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{filteredErrorData.reduce((sum, point) => sum + point.value, 0) || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Error rate:<br/>{metricsData.stats?.errorRate || 0}%
                </div>
              </div>
              <div className="col-span-3 h-[220px] pb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={filteredErrorData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      tickMargin={20}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} errors`, 'Count']}
                      labelFormatter={(label) => {
                        // Handle when label is the formatted time
                        if (typeof label === 'string' && label.includes('M')) {
                          return `Time: ${label}`;
                        }
                        // Handle when label is a timestamp
                        const timeValue = moment(label);
                        return `Time: ${timeValue.isValid() ? timeValue.format('MMM D, YYYY h:mm A') : 'Unknown'}`;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      name="Errors" 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Execution Time Chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Execution Time (ms)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-between">
                <div>
                  <div className="text-sm text-gray-500">Average:</div>
                  <div className="text-lg font-bold">
                    {filteredDurationData.length > 0 
                      ? formatDuration(filteredDurationData.reduce((sum, point) => sum + point.value, 0) / filteredDurationData.length) 
                      : formatDuration(0)}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-500">Max:</div>
                  <div className="text-lg font-bold">
                    {filteredDurationData.length > 0 
                      ? formatDuration(Math.max(...filteredDurationData.map(d => d.value))) 
                      : formatDuration(0)}
                  </div>
                </div>
              </div>
              <div className="col-span-3 h-[220px] pb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={filteredDurationData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      tickMargin={20}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${formatDuration(value)}`, 'Duration']}
                      labelFormatter={(label) => {
                        // Handle when label is the formatted time
                        if (typeof label === 'string' && label.includes('M')) {
                          return `Time: ${label}`;
                        }
                        // Handle when label is a timestamp
                        const timeValue = moment(label);
                        return `Time: ${timeValue.isValid() ? timeValue.format('MMM D, YYYY h:mm A') : 'Unknown'}`;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      name="Duration" 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }
  
  // Queue charts
  if (nodeType === 'queue') {
    const eventsInQueueData = prepareChartData(metricsData.writes || []);
    const eventsReadData = prepareChartData(metricsData.reads || []);
    const lagData = prepareChartData(metricsData.read_lag || []);
    
    // Filter chart data based on the time window if one exists
    const filterDataByTimeWindow = (data: any[]) => {
      if (!actualTimeWindow?.start || !actualTimeWindow?.end) return data;
      
      const startTime = moment(actualTimeWindow.start).valueOf();
      const endTime = moment(actualTimeWindow.end).valueOf();
      
      return data.filter(item => {
        const itemTime = moment(item.time).valueOf();
        return itemTime >= startTime && itemTime <= endTime;
      });
    };
    
    // Apply time window filtering
    const filteredEventsInQueueData = filterDataByTimeWindow(eventsInQueueData);
    const filteredEventsReadData = filterDataByTimeWindow(eventsReadData);
    const filteredLagData = filterDataByTimeWindow(lagData);
    
    return (
      <>
        <TimeSlider />
        
        {/* Current Checkpoint information */}
        {checkpoint && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm">Current Checkpoint:</div>
              <Button 
                variant="outline" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => onOpenQueueEvents(nodeId, checkpoint)}
              >
                <span className="font-mono text-xs truncate max-w-[250px]">{checkpoint}</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Events in Queue Chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events in Queue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{filteredEventsInQueueData.reduce((sum, point) => sum + point.value, 0) || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last write:<br/>{formatTimeAgo(metricsData?.lastWrite)}
                </div>
              </div>
              <div className="col-span-3 h-[220px] pb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={filteredEventsInQueueData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      tickMargin={20}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} events`, 'Count']}
                      labelFormatter={(label) => {
                        // Handle when label is the formatted time
                        if (typeof label === 'string' && label.includes('M')) {
                          return `Time: ${label}`;
                        }
                        // Handle when label is a timestamp
                        const timeValue = moment(label);
                        return `Time: ${timeValue.isValid() ? timeValue.format('MMM D, YYYY h:mm A') : 'Unknown'}`;
                      }}
                    />
                    {metricsData.lastReadPosition && (
                      <ReferenceLine 
                        x={metricsData.lastReadPosition}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        label={{ value: 'Last Read', position: 'top', fill: '#f59e0b', fontSize: 10 }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#22c55e" 
                      name="Events" 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Events Read Chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events Read</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{filteredEventsReadData.reduce((sum, point) => sum + point.value, 0) || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last read:<br/>{formatTimeAgo(metricsData.stats?.lastRead)}
                </div>
              </div>
              <div className="col-span-3 h-[220px] pb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={filteredEventsReadData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      tickMargin={20}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} events`, 'Count']}
                      labelFormatter={(label) => {
                        // Handle when label is the formatted time
                        if (typeof label === 'string' && label.includes('M')) {
                          return `Time: ${label}`;
                        }
                        // Handle when label is a timestamp
                        const timeValue = moment(label);
                        return `Time: ${timeValue.isValid() ? timeValue.format('MMM D, YYYY h:mm A') : 'Unknown'}`;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      name="Events Read" 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Lag Chart */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lag</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{filteredLagData.length > 0 
                  ? Math.round(filteredLagData.reduce((sum, point) => sum + point.value, 0) / filteredLagData.length) 
                  : 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Events behind:<br/>{filteredEventsInQueueData.length > 0 ? filteredEventsInQueueData[filteredEventsInQueueData.length - 1].value : 0}
                </div>
              </div>
              <div className="col-span-3 h-[220px] pb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={filteredLagData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      tickMargin={20}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${formatDuration(value)}`, 'Lag']}
                      labelFormatter={(label) => {
                        // Handle when label is the formatted time
                        if (typeof label === 'string' && label.includes('M')) {
                          return `Time: ${label}`;
                        }
                        // Handle when label is a timestamp
                        const timeValue = moment(label);
                        return `Time: ${timeValue.isValid() ? timeValue.format('MMM D, YYYY h:mm A') : 'Unknown'}`;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#f59e0b" 
                      name="Lag" 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }
  
  // Default fallback for other node types
  return (
    <div className="text-gray-500 dark:text-gray-400 text-center my-8">
      Charts not available for this node type.
    </div>
  );
}

function NodeChartHeader({ nodeId }: { nodeId: string }) {
  const { state } = useAppContext();
  
  // Get node info from context
  const nodeData = state.nodes?.[nodeId];
  
  if (!nodeData) {
    return <h2 className="text-lg font-semibold">Node Charts</h2>;
  }
  
  return (
    <div className="flex items-center gap-2">
      <NodeIcon node={{ type: nodeData.type }} className="w-5 h-5" />
      <h2 className="text-lg font-semibold">{nodeData.label || nodeId}</h2>
      <Badge variant="outline" className="ml-2 text-xs">
        {nodeData.type}
      </Badge>
    </div>
  );
} 