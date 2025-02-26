"use client";

import React from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '@/context/AppContext';
import numeral from 'numeral';

interface DashboardStatsProps {
  totalBots: number;
  activeBots: number;
  alertingBots: number;
}

export default function DashboardStats({ totalBots, activeBots, alertingBots }: DashboardStatsProps) {
  const { state } = useAppContext();
  const activePercentage = totalBots > 0 ? Math.round((activeBots / totalBots) * 100) : 0;
  const alertingPercentage = totalBots > 0 ? Math.round((alertingBots / totalBots) * 100) : 0;
  
  // Format the total events number with commas
  const formattedTotalEvents = numeral(state.totalEvents || 0).format('0,0');
  
  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bots</div>
            <div className="text-3xl font-semibold text-gray-900 dark:text-white">{totalBots}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Bots</div>
            <div className="flex items-center">
              <div className="text-3xl font-semibold text-gray-900 dark:text-white">{activeBots}</div>
              <div className="ml-2 text-sm text-green-600 dark:text-green-400">
                {activePercentage}%
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded">
          <div 
            className="h-full bg-green-500 rounded" 
            style={{ width: `${activePercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mr-4">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Alerting Bots</div>
            <div className="flex items-center">
              <div className="text-3xl font-semibold text-gray-900 dark:text-white">{alertingBots}</div>
              <div className="ml-2 text-sm text-red-600 dark:text-red-400">
                {alertingPercentage}%
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded">
          <div 
            className="h-full bg-red-500 rounded" 
            style={{ width: `${alertingPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-4">
            <DocumentTextIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events Processed</div>
            <div className="text-3xl font-semibold text-gray-900 dark:text-white">{formattedTotalEvents}</div>
          </div>
        </div>
      </div>
    </>
  );
} 