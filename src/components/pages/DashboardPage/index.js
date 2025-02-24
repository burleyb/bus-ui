import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '../../../stores/DataContext';
import DashboardHeader from './DashboardHeader.jsx';
import DashboardMetrics from './DashboardMetrics.jsx';
import DashboardFilters from './DashboardFilters.jsx';
import NodeGrid from './NodeGrid';

export default function DashboardPage() {
  const { fetchDashboardData } = useData();
  const [filters, setFilters] = useState({
    nodeType: 'all',
    status: 'all',
    tags: []
  });

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: () => fetchDashboardData(filters),
    refetchInterval: 30000
  });
  

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardHeader />
      <DashboardMetrics />
      <DashboardFilters filters={filters} onChange={setFilters} />
      <NodeGrid nodes={data?.nodes} isLoading={isLoading} />
    </div>
  );
}
