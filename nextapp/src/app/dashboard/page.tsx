"use client";

import React, { useState } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import BotsList from '@/components/dashboard/BotsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { state } = useAppContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your event bus system
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          <button
            onClick={() => router.push('/create')}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Create New Bot
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardStats 
          totalBots={state.bots.length}
          activeBots={state.bots.filter(b => b.status === 'active' || b.status === 'running' || b.status === 'idle').length}
          alertingBots={state.bots.filter(b => b.status !== 'active' && b.status !== 'running' && b.status !== 'idle').length}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BotsList searchTerm={searchTerm} />
        </div>
        
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
} 