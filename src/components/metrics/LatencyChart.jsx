import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatDuration } from '../../utils/format';

const LatencyChart = ({ data, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
        />
        <YAxis tickFormatter={(value) => formatDuration(value)} />
        <Tooltip
          formatter={(value) => formatDuration(value)}
          labelFormatter={(value) => new Date(value).toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey="sourceLag"
          stroke="#8884d8"
          name="Source Lag"
        />
        <Line
          type="monotone"
          dataKey="processLag"
          stroke="#82ca9d"
          name="Process Lag"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};