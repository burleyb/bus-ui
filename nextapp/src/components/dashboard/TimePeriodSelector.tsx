"use client";

import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO, addMinutes, addHours, addDays, subMinutes, subHours, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { PiCalendarBlankDuotone } from 'react-icons/pi';

export type Interval = 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week';

export interface TimePeriod {
  begin?: string;
  end?: string;
  interval: Interval;
}

interface TimePeriodSelectorProps {
  initialTimePeriod?: TimePeriod;
  onTimePeriodChange: (timePeriod: TimePeriod) => void;
}

const intervals = {
  minute_15: '15m',
  hour: '1h',
  hour_6: '6h',
  day: '1d',
  week: '1w'
};

export default function TimePeriodSelector({ 
  initialTimePeriod = { interval: 'minute_15' },
  onTimePeriodChange 
}: TimePeriodSelectorProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(initialTimePeriod || {
    interval: 'minute_15',
    begin: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    end: new Date().toISOString() // current time
  });
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format the time period for display
  const formatTimePeriod = () => {
    // If we have begin and end dates, use the exact selected time period
    if (timePeriod.begin && timePeriod.end) {
      const endDate = parseISO(timePeriod.end);
      
      // Format the display based on the interval, exactly as specified
      switch (timePeriod.interval) {
        case 'minute_15': {
          // Find which 15-minute bucket contains the end time
          const minutes = endDate.getMinutes();
          const bucketIndex = Math.floor(minutes / 15);
          const bucketStart = bucketIndex * 15;
          
          const bucketStartTime = new Date(endDate);
          bucketStartTime.setMinutes(bucketStart, 0, 0);
          
          const bucketEndTime = new Date(bucketStartTime);
          bucketEndTime.setMinutes(bucketStart + 14, 59, 999);
          
          // Format: "6/27/2024 5:30 - 5:44 PM"
          return `${format(bucketStartTime, 'M/d/yyyy')} ${format(bucketStartTime, 'h:mm')} - ${format(bucketEndTime, 'h:mm')} ${format(bucketEndTime, 'a')}`;
        }
        
        case 'hour': {
          // 1 hour bucket: "6/27/2024 5:00-5:59 PM"
          const hourStart = new Date(endDate);
          hourStart.setMinutes(0, 0, 0);
          
          const hourEnd = new Date(hourStart);
          hourEnd.setMinutes(59, 59, 999);
          
          // Format: "6/27/2024 5:00-5:59 PM"
          return `${format(hourStart, 'M/d/yyyy')} ${format(hourStart, 'h:mm')}-${format(hourEnd, 'h:mm')} ${format(hourEnd, 'a')}`;
        }
        
        case 'hour_6': {
          // 6 hour bucket: "Jun 27, 2024 5:59 PM"
          const hourEnd = new Date(endDate);
          hourEnd.setMinutes(59, 59, 999);
          
          // Format: "Jun 27, 2024 5:59 PM"
          return `${format(hourEnd, 'MMM d, yyyy')} ${format(hourEnd, 'h:mm')} ${format(hourEnd, 'a')}`;
        }
        
        case 'day': {
          // 1 day bucket: "6/27/2024"
          return format(endDate, 'M/d/yyyy');
        }
        
        case 'week': {
          // For week interval, calculate the 7-day period ending on the selected date
          const weekEndDate = new Date(endDate);
          
          // Start date is 6 days before (to make a 7-day period)
          const weekStartDate = new Date(weekEndDate);
          weekStartDate.setDate(weekEndDate.getDate() - 6);
          
          // Format: "6/21/2024 - 6/27/2024"
          return `${format(weekStartDate, 'M/d/yyyy')} - ${format(weekEndDate, 'M/d/yyyy')}`;
        }
        
        default: {
          // For any other cases not explicitly handled
          return `${format(endDate, 'M/d/yyyy h:mm a')}`;
        }
      }
    } else {
      // In real-time mode (no begin/end times), show the current time bucket
      const now = new Date();
      
      // Format based on the current interval
      switch (timePeriod.interval) {
        case 'minute_15': {
          // Current 15-minute bucket
          const minutes = now.getMinutes();
          const bucketIndex = Math.floor(minutes / 15);
          const bucketStart = bucketIndex * 15;
          
          const bucketStartTime = new Date(now);
          bucketStartTime.setMinutes(bucketStart, 0, 0);
          
          const bucketEndTime = new Date(bucketStartTime);
          bucketEndTime.setMinutes(bucketStart + 14, 59, 999);
          
          // Format: "6/27/2024 5:30 - 5:44 PM (Now)"
          return `${format(bucketStartTime, 'M/d/yyyy')} ${format(bucketStartTime, 'h:mm')} - ${format(bucketEndTime, 'h:mm')} ${format(bucketEndTime, 'a')} (Now)`;
        }
        
        case 'hour': {
          // Current hour bucket
          const hourStart = new Date(now);
          hourStart.setMinutes(0, 0, 0);
          
          const hourEnd = new Date(hourStart);
          hourEnd.setMinutes(59, 59, 999);
          
          // Format: "6/27/2024 5:00-5:59 PM (Now)"
          return `${format(hourStart, 'M/d/yyyy')} ${format(hourStart, 'h:mm')}-${format(hourEnd, 'h:mm')} ${format(hourEnd, 'a')} (Now)`;
        }
        
        case 'hour_6': {
          // Current hour end for 6hr view
          const hourEnd = new Date(now);
          hourEnd.setMinutes(59, 59, 999);
          
          // Format: "Jun 27, 2024 5:59 PM (Now)"
          return `${format(hourEnd, 'MMM d, yyyy')} ${format(hourEnd, 'h:mm')} ${format(hourEnd, 'a')} (Now)`;
        }
        
        case 'day': {
          // Current day
          return `${format(now, 'M/d/yyyy')} (Today)`;
        }
        
        case 'week': {
          // Current week
          const weekEndDate = new Date(now);
          
          // Start date is 6 days before (to make a 7-day period)
          const weekStartDate = new Date(weekEndDate);
          weekStartDate.setDate(weekEndDate.getDate() - 6);
          
          // Format: "6/21/2024 - 6/27/2024 (This Week)"
          return `${format(weekStartDate, 'M/d/yyyy')} - ${format(weekEndDate, 'M/d/yyyy')} (This Week)`;
        }
        
        default: {
          return format(now, 'M/d/yyyy h:mm a');
        }
      }
    }
  };
  
  // Get time adjusters based on current interval
  const getTimeAdjusters = (interval: Interval) => {
    switch(interval) {
      case 'minute_15':
        return { forward: (date: Date) => addMinutes(date, 15), backward: (date: Date) => subMinutes(date, 15) };
      case 'hour':
        return { forward: (date: Date) => addHours(date, 1), backward: (date: Date) => subHours(date, 1) };
      case 'hour_6':
        return { forward: (date: Date) => addHours(date, 6), backward: (date: Date) => subHours(date, 6) };
      case 'day':
        return { forward: (date: Date) => addDays(date, 1), backward: (date: Date) => subDays(date, 1) };
      case 'week':
        return { forward: (date: Date) => addDays(date, 7), backward: (date: Date) => subDays(date, 7) };
      default:
        return { forward: (date: Date) => addHours(date, 1), backward: (date: Date) => subHours(date, 1) };
    }
  };
  
  // Handle moving time backward
  const handleBackward = () => {
    if (!timePeriod.begin || !timePeriod.end) return;
    
    try {
      const beginDate = parseISO(timePeriod.begin);
      const endDate = parseISO(timePeriod.end);
      const { backward } = getTimeAdjusters(timePeriod.interval);
      
      const newBegin = backward(beginDate).toISOString();
      const newEnd = backward(endDate).toISOString();
      
      updateTimePeriod({
        ...timePeriod,
        begin: newBegin,
        end: newEnd
      });
    } catch (error) {
      console.error('Error moving time backward:', error);
    }
  };
  
  // Handle moving time forward
  const handleForward = () => {
    if (!timePeriod.begin || !timePeriod.end) return;
    
    try {
      const beginDate = parseISO(timePeriod.begin);
      const endDate = parseISO(timePeriod.end);
      const { forward } = getTimeAdjusters(timePeriod.interval);
      
      const newBegin = forward(beginDate).toISOString();
      const newEnd = forward(endDate).toISOString();
      
      updateTimePeriod({
        ...timePeriod,
        begin: newBegin,
        end: newEnd
      });
    } catch (error) {
      console.error('Error moving time forward:', error);
    }
  };
  
  // Set time to now (realtime mode)
  const handleNow = () => {
    // Remove begin and end from timePeriod to enable realtime mode
    // Keep only the interval
    const realtimeTimePeriod = {
      interval: timePeriod.interval
    };
    
    updateTimePeriod(realtimeTimePeriod);
  };
  
  // Change the interval
  const handleIntervalChange = (interval: Interval) => {
    try {
      let beginDate = new Date();
      if (timePeriod.begin) {
        beginDate = parseISO(timePeriod.begin);
      }
      
      let endDate;
      switch (interval) {
        case 'minute_15':
          endDate = addMinutes(beginDate, 15);
          break;
        case 'hour':
          endDate = addHours(beginDate, 1);
          break;
        case 'hour_6':
          endDate = addHours(beginDate, 6);
          break;
        case 'day':
          endDate = addDays(beginDate, 1);
          break;
        case 'week':
          endDate = addDays(beginDate, 7);
          break;
        default:
          endDate = addHours(beginDate, 1);
      }
      
      updateTimePeriod({
        interval,
        begin: beginDate.toISOString(),
        end: endDate.toISOString()
      });
    } catch (error) {
      console.error('Error changing interval:', error);
    }
  };
  
  // Update the time period
  const updateTimePeriod = (newTimePeriod: TimePeriod) => {
    setTimePeriod(newTimePeriod);
    onTimePeriodChange(newTimePeriod);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
        <button
          onClick={handleBackward}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md border-r border-gray-200 dark:border-gray-700"
          aria-label="Previous time period"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none min-w-[180px] text-center">
            {formatTimePeriod()}
          </Menu.Button>
          
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {Object.entries(intervals).map(([key, label]) => (
                  <Menu.Item key={key}>
                    {({ active }) => (
                      <button
                        onClick={() => handleIntervalChange(key as Interval)}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                        } ${
                          timePeriod.interval === key ? 'font-medium' : ''
                        } block w-full text-left px-4 py-2 text-sm`}
                      >
                        {label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        
        <button
          onClick={handleForward}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md border-l border-gray-200 dark:border-gray-700"
          aria-label="Next time period"
          disabled={!timePeriod.end || new Date(timePeriod.end) >= new Date()}
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      <button
        onClick={handleNow}
        className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm flex items-center"
        aria-label="Set to current time"
      >
        <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">Now</span>
      </button>
    </div>
  );
} 