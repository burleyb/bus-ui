import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '../../stores/DataContext';
import MetricsCard from './MetricsCard';

const NodeMetrics = ({ nodeId }) => {
  const { fetchNodeMetrics } = useData();

  const { data: metrics, isLoading } = useQuery(
    ['nodeMetrics', nodeId],
    () => fetchNodeMetrics(nodeId),
    {
      refetchInterval: 30000
    }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricsCard
        title="Events Processed"
        value={metrics.eventsProcessed}
        trend={metrics.eventsTrend}
        change={metrics.eventsChange}
      />
      <MetricsCard
        title="Average Latency"
        value={`${metrics.avgLatency}ms`}
        trend={metrics.latencyTrend}
        change={metrics.latencyChange}
        type="duration"
      />
      <MetricsCard
        title="Error Rate"
        value={`${metrics.errorRate}%`}
        trend={metrics.errorTrend}
        change={metrics.errorChange}
        type="percentage"
      />
    </div>
  );
};