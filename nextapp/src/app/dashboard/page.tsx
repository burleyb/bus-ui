"use client";

import React from 'react';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import BotsList from '@/components/dashboard/BotsList';
import TimeRangeSelector from '@/components/dashboard/TimeRangeSelector';
import { Suspense } from 'react';
import { useStats } from '@/context/ApiContext';

export default function DashboardPage() {
  // Initialize stats polling on dashboard load
  useStats();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <TimeRangeSelector />
      </div>
      
      <Suspense fallback={<div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
        <DashboardSummary />
      </Suspense>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Bots</h2>
        <Suspense fallback={<div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>}>
          <BotsList />
        </Suspense>
      </div>
    </div>
  );
} 