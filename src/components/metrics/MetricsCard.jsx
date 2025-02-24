import React from 'react';
import { Line } from 'recharts';
import { formatNumber } from '../../utils/format';

const MetricsCard = ({ title, value, trend, change, type = 'number' }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 text-2xl font-semibold">
            {type === 'number' ? formatNumber(value) : value}
          </div>
        </div>
        <div className={`flex items-center ${
          change > 0 ? 'text-green-500' : 
          change < 0 ? 'text-red-500' : 
          'text-gray-500'
        }`}>
          {change !== 0 && (
            <span className="text-sm font-medium">
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
      {trend && trend.length > 0 && (
        <div className="h-10 mt-3">
          <Line
            data={trend}
            type="monotone"
            dataKey="value"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
          />
        </div>
      )}
    </div>
  );
};