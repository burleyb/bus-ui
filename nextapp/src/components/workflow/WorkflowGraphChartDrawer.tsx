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
  relation: 'self' | 'child' | 'parent';
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
            nodeTabs.push({
              id: childId,
              label: childNode.label || childId,
              type: childNode.type || 'bot',
              relation: 'child'
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
            nodeTabs.push({
              id: parentId,
              label: parentNode.label || parentId,
              type: parentNode.type || 'bot',
              relation: 'parent'
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
  
  // Convert time range slider values to actual time period
  const handleTimeRangeChange = (values: [number, number]) => {
    setTimeRange(values);
    // Here we would adjust the actual time window for the charts
    // This would involve calculating the actual start/end times based on slider positions
  };
  
  // Navigate to node settings dialog for queue events
  const openQueueEventsWithCheckpoint = (queueId: string, checkpoint: string) => {
    openNodeSettingsDialog(queueId, 'events', { checkpoint });
  };
  
  // If drawer is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-lg z-10 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
         style={{ width: '500px' }}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Node Charts</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
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
                      tab.relation === 'child' ? 'secondary' :
                      'outline'
                    } className="mt-1 text-[10px] py-0 px-1">
                      {tab.relation === 'self' ? 'selected' :
                       tab.relation === 'child' ? 'child' : 'parent'}
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
  onTimeRangeChange,
  onOpenQueueEvents
}: {
  nodeId: string;
  nodeType: string;
  timePeriod: string;
  timeRange: [number, number];
  onTimeRangeChange: (values: [number, number]) => void;
  onOpenQueueEvents: (queueId: string, checkpoint: string) => void;
}) {
  // Fetch metrics data for the node
  const { data: metricsData, isLoading, error } = useMetricsData(nodeId, timePeriod);
  const { state } = useAppContext();
  
  // Checkpoint info for queues
  const [checkpoint, setCheckpoint] = useState<string>('');
  
  // Update checkpoint when metrics data changes
  useEffect(() => {
    if (metricsData?.checkpoint) {
      setCheckpoint(metricsData.checkpoint);
    }
  }, [metricsData]);
  
  // Prepare chart data
  const prepareChartData = (data: any[], key: string = 'value'): ChartData[] => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      time: item.time,
      formattedTime: formatChartTime(item.time),
      value: item[key] || 0
    }));
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
  const TimeSlider = () => (
    <div className="pt-4 pb-6">
      <div className="mb-2 flex justify-between items-center">
        <h4 className="text-sm font-medium">Time Range</h4>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTimeRangeChange([0, 100])}
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
        onValueChange={onTimeRangeChange as any}
        className="my-4"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Start: {formatDate(metricsData.timeStart)}</span>
        <span>End: {formatDate(metricsData.timeEnd)}</span>
      </div>
    </div>
  );
  
  // Bot charts
  if (nodeType === 'bot') {
    const executionData = prepareChartData(metricsData.execution || []);
    const errorData = prepareChartData(metricsData.errors || []);
    const durationData = prepareChartData(metricsData.duration || []);
    
    return (
      <>
        <TimeSlider />
        
        {/* Execution Count Chart */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Execution Count</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{metricsData.stats?.executions || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last run:<br/>{formatTimeAgo(metricsData.stats?.lastRun)}
                </div>
              </div>
              <div className="col-span-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={executionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} executions`, 'Count']}
                      labelFormatter={(label) => `Time: ${label}`}
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
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Error Count</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{metricsData.stats?.errors || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Error rate:<br/>{metricsData.stats?.errorRate || 0}%
                </div>
              </div>
              <div className="col-span-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={errorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} errors`, 'Count']}
                      labelFormatter={(label) => `Time: ${label}`}
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
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Execution Time (ms)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-between">
                <div>
                  <div className="text-sm text-gray-500">Average:</div>
                  <div className="text-lg font-bold">{formatDuration(metricsData.stats?.avgDuration)}</div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-500">Max:</div>
                  <div className="text-lg font-bold">{formatDuration(metricsData.stats?.maxDuration)}</div>
                </div>
              </div>
              <div className="col-span-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${formatDuration(value)}`, 'Duration']}
                      labelFormatter={(label) => `Time: ${label}`}
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
    const eventsInQueueData = prepareChartData(metricsData.eventsInQueue || []);
    const eventsReadData = prepareChartData(metricsData.eventsRead || []);
    const lagData = prepareChartData(metricsData.lag || []);
    
    return (
      <>
        <TimeSlider />
        
        {/* Current Checkpoint information */}
        {checkpoint && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm">Current Checkpoint:</div>
              <Button 
                variant="link" 
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
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events in Queue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{metricsData.stats?.eventsInQueue || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last write:<br/>{formatTimeAgo(metricsData.stats?.lastWrite)}
                </div>
              </div>
              <div className="col-span-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eventsInQueueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} events`, 'Count']}
                      labelFormatter={(label) => `Time: ${label}`}
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
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events Read</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{metricsData.stats?.eventsRead || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Last read:<br/>{formatTimeAgo(metricsData.stats?.lastRead)}
                </div>
              </div>
              <div className="col-span-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eventsReadData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} events`, 'Count']}
                      labelFormatter={(label) => `Time: ${label}`}
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
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lag</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col justify-center">
                <div className="text-2xl font-bold">{metricsData.stats?.lag || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Events behind:<br/>{metricsData.stats?.eventsBehind || 0}
                </div>
              </div>
              <div className="col-span-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lagData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedTime" 
                      tick={{ fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${formatDuration(value)}`, 'Lag']}
                      labelFormatter={(label) => `Time: ${label}`}
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