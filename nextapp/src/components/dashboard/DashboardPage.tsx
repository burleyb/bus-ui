'use client'
import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useDashboard, useStats } from '@/hooks/useQueries';
import moment from 'moment';
import numeral from 'numeral';

// Dashboard Card Component
const DashboardCard = ({ title, value, change, icon }: { title: string; value: string | number; change?: number; icon?: React.ReactNode }) => {
  const changeColor = change && change > 0 ? 'text-green-500' : change && change < 0 ? 'text-red-500' : 'text-gray-500';
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {change !== undefined && (
            <p className={`mt-1 text-sm ${changeColor} flex items-center`}>
              {change > 0 ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : change < 0 ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              )}
              {Math.abs(change)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-100 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// Bot Status Table Component
const BotStatusTable = ({ bots }: { bots: any[] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium">Bot Status</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bot
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Run
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Events
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bots.map((bot) => (
              <tr key={bot.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-2.5 w-2.5 rounded-full mr-2 ${bot.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="text-sm font-medium text-gray-900">{bot.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    bot.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {bot.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {bot.lastRun ? moment(bot.lastRun).fromNow() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {numeral(bot.events || 0).format('0,0')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { timePeriod } = useData();
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: stats, isLoading: statsLoading } = useStats();
  const [timeRange, setTimeRange] = useState('day');

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // Here you would typically update the timePeriod in the DataContext
  };

  if (dashboardLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Mock data for demonstration
  const mockStats = {
    activeBots: stats?.activeBots || 15,
    totalEvents: stats?.totalEvents || 1250000,
    alarmedBots: stats?.alarmedBots || 3,
    avgProcessingTime: stats?.avgProcessingTime || 120,
  };

  const mockBots = stats?.bots || Array(10).fill(null).map((_, i) => ({
    id: `bot-${i}`,
    name: `Bot ${i + 1}`,
    status: i % 3 === 0 ? 'inactive' : 'active',
    lastRun: i % 2 === 0 ? moment().subtract(i, 'hours').toISOString() : moment().subtract(i, 'days').toISOString(),
    events: Math.floor(Math.random() * 100000),
  }));

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleTimeRangeChange('day')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => handleTimeRangeChange('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Active Bots"
          value={mockStats.activeBots}
          change={5}
          icon={
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <DashboardCard
          title="Total Events"
          value={numeral(mockStats.totalEvents).format('0.0a')}
          change={12}
          icon={
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <DashboardCard
          title="Alarmed Bots"
          value={mockStats.alarmedBots}
          change={-2}
          icon={
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <DashboardCard
          title="Avg. Processing Time"
          value={`${mockStats.avgProcessingTime} ms`}
          change={0}
          icon={
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="mb-8">
        <BotStatusTable bots={mockBots} />
      </div>

      {/* Additional dashboard sections would go here */}
    </div>
  );
} 