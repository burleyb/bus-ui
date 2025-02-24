import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '../../stores/DataContext';
import AlertBadge from './AlertBadge';

const SystemStatus = () => {
  const { fetchSystemStatus } = useData();

  const { data: status, isLoading } = useQuery(
    ['systemStatus'],
    fetchSystemStatus,
    {
      refetchInterval: 10000
    }
  );

  if (isLoading) {
    return (
      <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">System Status</h2>
        <div className="flex space-x-2">
          <AlertBadge
            count={status.errors}
            severity="high"
            onClick={() => {/* Handle click */}}
          />
          <AlertBadge
            count={status.warnings}
            severity="medium"
            onClick={() => {/* Handle click */}}
          />
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-semibold text-green-500">
            {status.healthy}
          </div>
          <div className="text-sm text-gray-500">Healthy</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-yellow-500">
            {status.warnings}
          </div>
          <div className="text-sm text-gray-500">Warnings</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-red-500">
            {status.errors}
          </div>
          <div className="text-sm text-gray-500">Errors</div>
        </div>
      </div>
    </div>
  );
};