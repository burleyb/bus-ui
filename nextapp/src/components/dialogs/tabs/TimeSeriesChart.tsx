"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';

export interface TimeSeriesDataPoint {
  time: string; // ISO string
  value: number;
}

interface TimeSeriesChartProps {
  title: string;
  data: TimeSeriesDataPoint[];
  color?: string;
  yAxisLabel?: string;
  isLoading?: boolean;
  className?: string;
}

export default function TimeSeriesChart({
  title,
  data,
  color = "#3b82f6",
  yAxisLabel,
  isLoading = false,
  className = "",
}: TimeSeriesChartProps) {
  // Transform data for display, adding proper time formatting
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      // Store the original time for tooltip
      originalTime: point.time,
      // Format the time for display
      formattedTime: format(new Date(point.time), 'HH:mm:ss')
    }));
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="text-sm font-medium">{format(new Date(data.originalTime), 'MMM dd, yyyy HH:mm:ss')}</p>
          <p className="text-sm">{`${yAxisLabel || 'Value'}: ${data.value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No data available
          </div>
        ) : (
          <div className="h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  dataKey="formattedTime" 
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 10 }}
                  interval="preserveEnd"
                  minTickGap={30}
                />
                <YAxis 
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 10 }}
                  width={40}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 