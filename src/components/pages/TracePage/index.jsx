import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '../../../stores/DataContext';
import TraceTimeline from './TraceTimeline';
import TraceDetails from './TraceDetails';
import TraceFilters from './TraceFilters';

export default function TracePage() {
  const { fetchTraceData } = useData();
  const [filters, setFilters] = useState({
    startTime: null,
    endTime: null,
    status: 'all'
  });

  const { data, isLoading } = useQuery(
    ['trace', filters],
    () => fetchTraceData(filters),
    { 
      refetchInterval: 10000,
      keepPreviousData: true
    }
  );

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <TraceFilters filters={filters} onChange={setFilters} />
      <div className="flex-1 flex gap-4">
        <TraceTimeline data={data?.timeline} isLoading={isLoading} />
        <TraceDetails data={data?.details} isLoading={isLoading} />
      </div>
    </div>
  );
}
