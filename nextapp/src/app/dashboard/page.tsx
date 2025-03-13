"use client";

import React, { useState, useEffect } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import BotsList from '@/components/dashboard/BotsList';
import { QuickActions } from '@/components/dashboard/QuickActions';
import TimePeriodSelector, { TimePeriod } from '@/components/dashboard/TimePeriodSelector';
import DashboardDrawer from '@/components/dashboard/DashboardDrawer';
import { Search, PanelRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { state } = useAppContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>({
    interval: 'minute_15',
    begin: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    end: new Date().toISOString() // current time
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Count alarmed bots based on the new definition
  const alarmedBots = state.bots.filter(bot => 
    bot.status?.toLowerCase() === 'blocked' || 
    bot.status?.toLowerCase() === 'danger' || 
    bot.status?.toLowerCase() === 'rogue'
  ).length;

  // Calculate total events by summing read and write counts
  const totalEvents = state.nodes ? Object.values(state.nodes).reduce((sum, node) => {
    const readCount = node.queues?.read?.count || 0;
    const writeCount = node.queues?.write?.count || 0;
    return sum + readCount + writeCount;
  }, 0) : 0;

  // Handle time period changes
  const handleTimePeriodChange = (newTimePeriod: TimePeriod) => {
    setTimePeriod(newTimePeriod);
    // Here you would fetch new data based on the time period if needed
  };

  // Handle node click to navigate to workflow
  const handleNodeClick = (nodeId: string) => {
    const urlObj = { node: nodeId };
    router.push(`/workflow#${encodeURIComponent(JSON.stringify(urlObj))}`);
  };

  return (
    <div className={`container ml-0 px-4 py-8 transition-all duration-300 ${isDrawerOpen ? 'lg:mr-80' : ''}`}>
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
              placeholder="Search by node name or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          <TimePeriodSelector 
            initialTimePeriod={timePeriod}
            onTimePeriodChange={handleTimePeriodChange}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DashboardStats 
          totalBots={state.bots.length}
          alarmedBots={alarmedBots}
          totalEvents={totalEvents}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BotsList 
            searchTerm={searchTerm} 
            onNodeClick={handleNodeClick}
          />
          {alarmedBots === 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
              <p className="text-blue-800 dark:text-blue-400 text-sm">
                All bots are operating normally. No alarmed bots to display.
              </p>
            </div>
          )}
        </div>
        
        <div>
          <QuickActions />
        </div>
      </div>
      
      {/* Drawer open button - visible only when drawer is closed */}
      {!isDrawerOpen && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed right-4 top-20 z-40 p-2 bg-white dark:bg-gray-800 shadow-md rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open drawer"
        >
          <PanelRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}
      
      {/* Dashboard Drawer */}
      <DashboardDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
} 