"use client";

import React, { ReactNode } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface DonutChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  innerLabel?: {
    value: string | number | ReactNode;
    label: string;
  };
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function DonutChart({
  data,
  innerLabel,
  legendPosition = 'bottom',
  size = 160,
  strokeWidth = 20,
  className
}: DonutChartProps) {
  // Calculate inner and outer radius
  const outerRadius = size / 2;
  const innerRadius = outerRadius - strokeWidth;

  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {legendPosition === 'left' || legendPosition === 'right' ? (
              <Legend 
                layout="vertical"
                verticalAlign="middle"
                align={legendPosition}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-700 dark:text-gray-300">{value}</span>
                )}
              />
            ) : (
              <Legend 
                layout="horizontal"
                verticalAlign={legendPosition}
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-700 dark:text-gray-300">{value}</span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        
        {innerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              {typeof innerLabel.value === 'string' || typeof innerLabel.value === 'number' ? (
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {innerLabel.value}
                </div>
              ) : (
                innerLabel.value
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {innerLabel.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 