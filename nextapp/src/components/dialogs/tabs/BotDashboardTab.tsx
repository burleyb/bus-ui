"use client";

import React from 'react';
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

interface BotDashboardTabProps {
  nodeData: any;
}

export default function BotDashboardTab({ nodeData }: BotDashboardTabProps) {
  // Safeguard against null nodeData
  if (!nodeData) {
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
      time: formatDate(point.time),
      value: point.value || 0,
      formattedTime: new Date(point.time).toLocaleTimeString()
    }));
  };

  const executionData = prepareChartData(nodeData.executions || []);
  const errorData = prepareChartData(nodeData.errors || []);
  const durationData = prepareChartData(nodeData.duration || []);

  // Prepare queue data for events read and written tables
  const prepareQueueData = () => {
    const readQueues = nodeData.queues?.read || {};
    const writeQueues = nodeData.queues?.write || {};
    
    const readData = Object.entries(readQueues).map(([queueId, stats]: [string, any]) => ({
      queueId,
      eventsRead: stats.events || 0,
      lastRead: stats.lastRead || null,
      lagTime: stats.lagTime || 0,
      lagEvents: stats.lagEvents || 0
    }));
    
    const writeData = Object.entries(writeQueues).map(([queueId, stats]: [string, any]) => ({
      queueId,
      eventsWritten: stats.events || 0,
      lastWrite: stats.lastWrite || null
    }));
    
    return { readData, writeData };
  };
  
  const { readData, writeData } = prepareQueueData();

  return (
    <div className="space-y-6">
      
      {/* Events read and written by bot - side by side in md screens and larger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events read by bot */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
          <h3 className="text-lg font-medium mb-4">Events Read by Bot</h3>
          
          {readData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Queue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Read</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Read</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lag Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {readData.map((queue: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{queue.queueId}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{queue.eventsRead}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(queue.lastRead)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatTime(queue.lagTime)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{queue.lagEvents}</td>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Events Written</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Write</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {writeData.map((queue: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{queue.queueId}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{queue.eventsWritten}</td>
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

      {/* Performance charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Execution count chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Execution Count</CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={executionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedTime" 
                  tick={{ fontSize: 12 }} 
                  angle={-45}
                  textAnchor="end"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value} executions`, 'Count']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line type="monotone" dataKey="value" stroke="#22c55e" name="Executions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Error count chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Count</CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedTime" 
                  tick={{ fontSize: 12 }} 
                  angle={-45}
                  textAnchor="end"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value} errors`, 'Count']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line dataKey="value" fill="#ef4444" name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Execution time chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Execution Time (ms)</CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedTime" 
                  tick={{ fontSize: 12 }} 
                  angle={-45}
                  textAnchor="end"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value} ms`, 'Duration']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line type="monotone" dataKey="value" stroke="#22c55e" name="Duration" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Executions (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodeData.stats?.executions || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              Last run: {formatDate(nodeData.stats?.lastRun)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Errors (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nodeData.stats?.errors || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              Error rate: {nodeData.stats?.errorRate || 0}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(nodeData.stats?.avgDuration)}</div>
            <div className="text-xs text-gray-500 mt-1">
              Max: {formatTime(nodeData.stats?.maxDuration)}
            </div>
          </CardContent>
        </Card>
        
      </div>      

    </div>
  );
} 