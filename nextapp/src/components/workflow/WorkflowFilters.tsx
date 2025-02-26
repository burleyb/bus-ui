"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { useDialogs } from '@/hooks/useDialogs';

interface WorkflowFiltersProps {
  selectedBot: string;
}

export default function WorkflowFilters({ selectedBot }: WorkflowFiltersProps) {
  const router = useRouter();
  const { state } = useAppContext();
  const { openNodeSettingsDialog } = useDialogs();
  const [botId, setBotId] = useState(selectedBot);

  // Update local state when prop changes
  useEffect(() => {
    setBotId(selectedBot);
  }, [selectedBot]);

  const handleBotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBotId = e.target.value;
    setBotId(newBotId);

    if (newBotId) {
      // Open node settings dialog instead of navigating
      openNodeSettingsDialog(newBotId);
    } else {
      // If no bot selected, stay on current page but clear the query parameter
      router.push(`/workflow`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative">
        <label htmlFor="bot-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Node
        </label>
        <select
          id="bot-select"
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 w-full min-w-[200px]"
          value={botId}
          onChange={handleBotChange}
          disabled={state.updatingStats && state.bots.length === 0}
        >
          <option value="">All Nodes</option>
          {state.bots.map((bot) => (
            <option key={bot.id} value={bot.id}>
              {bot.id}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300 mt-6">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      
      <div>
        <label htmlFor="view-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          View Type
        </label>
        <select
          id="view-type"
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 w-full"
          defaultValue="graph"
        >
          <option value="graph">Graph View</option>
          <option value="list">List View</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300 mt-6">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
} 