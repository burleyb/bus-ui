import { useQuery } from '@tanstack/react-query';
import { useData } from '../stores/DataContext';

export default function useMetrics(nodeId, timeRange) {
  const { fetchNodeMetrics } = useData();

  return useQuery(
    ['metrics', nodeId, timeRange],
    () => fetchNodeMetrics(nodeId, timeRange),
    {
      refetchInterval: 30000,
      keepPreviousData: true,
      select: (data) => ({
        ...data,
        trend: data.trend.map(point => ({
          ...point,
          timestamp: new Date(point.timestamp)
        }))
      })
    }
  );
}