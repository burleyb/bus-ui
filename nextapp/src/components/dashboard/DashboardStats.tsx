"use client";

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import numeral from 'numeral';
import DonutChart from './DonutChart';
import NodeIcon from '@/components/node/NodeIcon';

interface DashboardStatsProps {
  totalBots: number;
  alarmedBots: number;
  totalEvents: number;
}

export default function DashboardStats({ totalBots, alarmedBots, totalEvents }: DashboardStatsProps) {
  const { state } = useAppContext();
  
  // Format the total events number with commas
  const formattedTotalEvents = numeral(totalEvents || 0).format('0,0');
  
  // Calculate not alarmed bots
  const notAlarmedBots = totalBots - alarmedBots;

  // Data for the donut chart
  const donutData = [
    { name: '', value: notAlarmedBots, color: 'rgb(22 163 74 / var(--tw-text-opacity, 1))' },
    { name: '', value: alarmedBots, color: '#ef4444' }
  ];
  
  return (
    <>
      {/* Total Events Card */}
      <div className="col-span-1 bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center justify-center" style={{ minHeight: "280px" }}>
        <div className="flex flex-col items-center text-center">
            <NodeIcon node={{ type: 'bot' }} size={72} />
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events Processed</div>
          <div className="text-3xl font-semibold text-green-600 dark:text-green-400">{formattedTotalEvents}</div>
        </div>
      </div>

      {/* Bots Status Donut Chart Card */}
      <div className="col-span-1 bg-white dark:bg-gray-800 shadow rounded-lg p-6" style={{ minHeight: "380px" }}>
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">Bots Status</div>
          <div className="mt-4">
            <DonutChart 
              data={donutData}
              innerLabel={{
                value: (
                  <div className="flex">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">{alarmedBots}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">/ {totalBots}</span>
                  </div>
                ),
                label: 'alarmed'
              }}
              size={190}
              strokeWidth={28}
            />
          </div>
        </div>
      </div>
    </>
  );
} 