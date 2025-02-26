"use client";

import React from 'react';
import { useAppContext } from '@/context/AppContext';

const timeRangeOptions = [
  { label: '15 minutes', value: 'minute_15' },
  { label: '1 hour', value: 'hour_1' },
  { label: '4 hours', value: 'hour_4' },
  { label: '12 hours', value: 'hour_12' },
  { label: '24 hours', value: 'day_1' },
  { label: '7 days', value: 'day_7' },
];

export default function TimeRangeSelector() {
  const { state, dispatch } = useAppContext();
  const currentInterval = state.urlObj.timePeriod.interval;

  const handleIntervalChange = (interval: string) => {
    dispatch({
      type: 'CHANGE_TIME_PERIOD',
      payload: { interval },
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Time Range:</span>
      <div className="relative">
        <select
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
          value={currentInterval}
          onChange={(e) => handleIntervalChange(e.target.value)}
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg
            className="h-4 w-4 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
} 