"use client";

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import numeral from 'numeral';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

function StatCard({ title, value, change, changeDirection = 'neutral', icon }: StatCardProps) {
  const changeColor = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {icon && <div className="text-blue-500">{icon}</div>}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${changeColor[changeDirection]}`}>
            {changeDirection === 'up' ? '↑' : changeDirection === 'down' ? '↓' : ''} {change}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardSummary() {
  const { state } = useAppContext();
  const { dashboard } = state;
  
  // Instead of calling useStats() directly, which will trigger another API call,
  // rely on the global state that's already updated by the useStats() hook
  // in another component
  const isLoading = !dashboard && state.updatingStats;

  // If no data is available yet, show placeholder
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  // Format dashboard data for display
  const activeBots = numeral(state.activeBotCount || 0).format('0,0');
  const totalQueues = numeral(state.queues?.length || 0).format('0,0');
  const alarmedBots = numeral(state.alarmedCount || 0).format('0,0');
  const eventsProcessed = numeral(state.totalEvents || 0).format('0,0');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Active Bots"
        value={activeBots}
        changeDirection="up"
      />
      <StatCard
        title="Total Queues"
        value={totalQueues}
        changeDirection="neutral"
      />
      <StatCard
        title="Alarmed Bots"
        value={alarmedBots}
        changeDirection={Number(alarmedBots) > 0 ? 'down' : 'neutral'}
      />
      <StatCard
        title="Events Processed"
        value={eventsProcessed}
        changeDirection="up"
      />
    </div>
  );
} 