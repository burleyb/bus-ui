import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatNumber } from '../../../utils/format';

export default function DashboardMetrics() {

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => fetchMetrics(),
    refetchInterval: 30000
  });

  async function fetchMetrics() {
   return true;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const metrics = [
    { label: 'Active Nodes', value: data.activeNodes },
    { label: 'Events/Second', value: formatNumber(data.eventsPerSecond) },
    { label: 'Error Rate', value: `${data?.errorRate?.toFixed(2)}%` }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map(metric => (
        <div key={metric.label} className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{metric.label}</div>
          <div className="text-2xl font-semibold mt-1">{metric.value}</div>
        </div>
      ))}
    </div>
  );
}
