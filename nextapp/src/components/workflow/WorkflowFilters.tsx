"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { NodeData } from '@/types/nodes';
import { NodeIcon } from '@/components/node';
import { format, parseISO, addMinutes, addHours, addDays, subMinutes, subHours, subDays, isToday, startOfMinute, endOfMinute, startOfHour, endOfHour, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import DatePicker from 'react-datepicker';
import type { DatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { PiCalendarBlankDuotone } from 'react-icons/pi';

interface WorkflowFiltersProps {
  selectedBot: string[];
  initialTimePeriod?: TimePeriod;
}

type Interval = 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week';

interface TimePeriod {
  begin?: string;
  end?: string;
  interval: Interval;
}

const intervals = {
  minute_15: '15m',
  hour: '1h',
  hour_6: '6h',
  day: '1d',
  week: '1w'
};

const WorkflowFilters = forwardRef(function WorkflowFilters({ 
  selectedBot,
  initialTimePeriod = { interval: 'minute_15' } 
}: WorkflowFiltersProps, ref) {
  const { state } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [nodeOptions, setNodeOptions] = useState<{ value: string; label: string; type: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Time period state - initialize with passed prop if available
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(initialTimePeriod || {
    interval: 'minute_15',
    begin: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    end: new Date().toISOString() // current time
  });
  
  // Get the primary selected node (first in array)
  const primarySelectedNode = selectedBot && selectedBot.length > 0 ? selectedBot[0] : '';
  
  // On component mount, parse time period from URL if available
  useEffect(() => {
    if (window.location.hash && window.location.hash.length > 1) {
      try {
        // Get hash and remove the # character
        let hashStr = window.location.hash.substring(1);
        
        // Decode the URL-encoded hash
        try {
          hashStr = decodeURIComponent(hashStr);
        } catch (decodeError) {
          console.error('Error decoding hash in init useEffect:', decodeError);
          return; // If we can't decode, don't proceed
        }
        
        // Validate hash format before parsing
        if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
          const hashData = JSON.parse(hashStr);
          if (hashData.timePeriod) {
            setTimePeriod(hashData.timePeriod);
          }
        }
      } catch (error) {
        console.error('Error parsing hash for time period:', error);
      }
    }
  }, []);
  
  // Prepare node options for the dropdown
  useEffect(() => {
    if (state.nodes && Object.keys(state.nodes).length > 0) {
      const options = Object.values(state.nodes)
        .map((node: NodeData) => ({
          value: node.id,
          label: stripPrefix(node.id),
          type: node.type || 'unknown'
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      
      setNodeOptions(options);
    }
  }, [state.nodes]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Function to strip the prefix (bot:, queue:, system:) from an ID
  const stripPrefix = (id: string): string => {
    const parts = id.split(':');
    return parts.length > 1 ? parts.slice(1).join(':') : id;
  };
  
  // Get the selected node data
  const selectedOption = primarySelectedNode ? nodeOptions.find(option => option.value === primarySelectedNode) : undefined;
  
  // Format the time period for display
  const formatTimePeriod = () => {
    if (timePeriod.begin && timePeriod.end) {
      const beginDate = parseISO(timePeriod.begin);
      const endDate = parseISO(timePeriod.end);
      
      // If dates are just a standard interval, show the interval name
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - endDate.getTime());
      
      // If end date is within the last minute (to account for processing time), 
      // this is likely a standard interval selection
      if (timeDiff < 60000) {
        if (isWithinMinutes(beginDate, endDate, 15)) {
          return 'Last 15m';
        }
        if (isWithinHours(beginDate, endDate, 1)) {
          return 'Last 1h';
        }
        if (isWithinHours(beginDate, endDate, 6)) {
          return 'Last 6h';
        }
        if (isWithinDays(beginDate, endDate, 1)) {
          return 'Last 1d';
        }
      }
      
      // Otherwise, show the date range
      const beginFormatted = format(beginDate, 'MMM d, HH:mm');
      const endFormatted = format(endDate, 'MMM d, HH:mm');
      return `${beginFormatted} to ${endFormatted}`;
    }
    
    return 'Select time period';
  };
  
  // Check if two dates are within a specific number of minutes
  const isWithinMinutes = (date1: Date, date2: Date, minutes: number) => {
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60) <= minutes + 1; // Add 1 minute buffer
  };
  
  // Check if two dates are within a specific number of hours
  const isWithinHours = (date1: Date, date2: Date, hours: number) => {
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60) <= hours + 0.1; // Add 0.1 hour buffer
  };
  
  // Check if two dates are within a specific number of days
  const isWithinDays = (date1: Date, date2: Date, days: number) => {
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24) <= days + 0.1; // Add 0.1 day buffer
  };
  
  // Get appropriate time adjustment functions based on interval
  const getTimeAdjusters = (interval: Interval): {
    forward: (date: Date) => Date;
    backward: (date: Date) => Date;
  } => {
    switch (interval) {
      case 'minute_15':
        return { forward: (date) => addMinutes(date, 15), backward: (date) => subMinutes(date, 15) };
      case 'hour':
        return { forward: (date) => addHours(date, 1), backward: (date) => subHours(date, 1) };
      case 'hour_6':
        return { forward: (date) => addHours(date, 6), backward: (date) => subHours(date, 6) };
      case 'day':
        return { forward: (date) => addDays(date, 1), backward: (date) => subDays(date, 1) };
      case 'week':
        return { forward: (date) => addDays(date, 7), backward: (date) => subDays(date, 7) };
      default:
        return { forward: (date) => addHours(date, 1), backward: (date) => subHours(date, 1) };
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
  
  // Set time to now based on current interval
  const handleNow = () => {
    const now = new Date();
    const { forward } = getTimeAdjusters(timePeriod.interval);
    
    updateTimePeriod({
      ...timePeriod,
      begin: now.toISOString(),
      end: forward(now).toISOString()
    });
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
  
  // Update the URL with new time period
  const updateTimePeriod = (newTimePeriod: TimePeriod) => {
    setTimePeriod(newTimePeriod);
    
    try {
      // Save current hash data if it exists
      let hashObj: any = {
        selected: selectedBot,
        view: "node",
        timePeriod: newTimePeriod,
        offset: [0, 0],
        node: primarySelectedNode || ""
      };
      
      // Try to preserve existing hash data
      if (window.location.hash && window.location.hash.length > 1) {
        // Remove the '#' and decode the hash string
        let hashStr = window.location.hash.substring(1);
        
        try {
          hashStr = decodeURIComponent(hashStr);
          console.debug('Decoded hash string in updateTimePeriod:', hashStr);
        } catch (decodeError) {
          console.error('Error decoding hash in updateTimePeriod:', decodeError);
          // Continue with creating a new hash object
        }
        
        // Only try to parse if it looks like valid JSON
        if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
          try {
            const hashData = JSON.parse(hashStr);
            
            // Verify the parsed result is an object
            if (hashData && typeof hashData === 'object' && !Array.isArray(hashData)) {
              // Update only the time period
              hashObj = {
                ...hashData,
                timePeriod: newTimePeriod
              };
            }
          } catch (parseError) {
            console.error('Error parsing hash in updateTimePeriod:', parseError);
            // Continue with the default hashObj
          }
        } else {
          console.warn('Hash string is not valid JSON format:', hashStr);
        }
      }
      
      // Convert to JSON, encode, and update the URL hash
      const hashStr = JSON.stringify(hashObj);
      window.location.hash = encodeURIComponent(hashStr);
    } catch (error) {
      console.error('Error updating hash with new time period:', error);
    }
  };
  
  // Filter node options based on search text
  const filteredOptions = searchText
    ? nodeOptions.filter(option => 
        option.label.toLowerCase().includes(searchText.toLowerCase()) || 
        option.value.toLowerCase().includes(searchText.toLowerCase()))
    : nodeOptions;

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    } else {
      setSearchText('');
      setHighlightedIndex(-1); // Reset highlighted index when dropdown closes
    }
  }, [isOpen]);
  
  // Handle keyboard navigation in the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prevIndex => {
          // Move to the first option if at the end or not selected
          if (prevIndex >= filteredOptions.length - 1 || prevIndex === -1) {
            return 0;
          }
          // Otherwise move to the next option
          return prevIndex + 1;
        });
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prevIndex => {
          // Move to the last option if at the beginning or not selected
          if (prevIndex <= 0) {
            return filteredOptions.length - 1;
          }
          // Otherwise move to the previous option
          return prevIndex - 1;
        });
        break;
        
      case 'Enter':
        e.preventDefault();
        // Select the highlighted option if there is one
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const selectedOption = filteredOptions[highlightedIndex];
          handleNodeChange(selectedOption.value);
        } else if (highlightedIndex === -1 && filteredOptions.length === 1) {
          // If only one option is available, select it even if not highlighted
          handleNodeChange(filteredOptions[0].value);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };
  
  // Ensure highlighted item is visible in the dropdown
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const dropdown = dropdownRef.current.querySelector('.dropdown-options');
      const option = dropdown?.children[highlightedIndex + 1]; // +1 for the "Clear selection" option
      
      if (option && dropdown) {
        const optionTop = option.getBoundingClientRect().top;
        const optionBottom = option.getBoundingClientRect().bottom;
        const dropdownTop = dropdown.getBoundingClientRect().top;
        const dropdownBottom = dropdown.getBoundingClientRect().bottom;
        
        // Scroll if the option is not fully visible
        if (optionTop < dropdownTop) {
          dropdown.scrollTop -= (dropdownTop - optionTop);
        } else if (optionBottom > dropdownBottom) {
          dropdown.scrollTop += (optionBottom - dropdownBottom);
        }
      }
    }
  }, [highlightedIndex]);
  
  // Handle node selection change
  const handleNodeChange = (value: string) => {
    // Get current hash data to preserve time period and other settings
    let hashObj = {
      selected: value ? [value] : [],
      view: "node",
      timePeriod: timePeriod,
      offset: [0, 0],
      node: value || ""
    };
    
    // Try to preserve existing hash data if available
    try {
      if (window.location.hash && window.location.hash.length > 1) {
        // Remove the '#' and handle any URL encoding
        let hashStr = window.location.hash.substring(1);
        
        // Attempt to decode the hash if it's URL encoded
        try {
          hashStr = decodeURIComponent(hashStr);
        } catch (decodeError) {
          console.warn('Error decoding hash:', decodeError);
          // Continue with the undecoded string
        }
        
        // Log the hash for debugging
        console.debug('Hash string before parsing:', hashStr);
        
        // Validate that the hash is a proper JSON string
        if (hashStr && 
            hashStr.trim().startsWith('{') && 
            hashStr.trim().endsWith('}')) {
          
          // Use a dedicated try/catch just for the JSON parsing
          try {
            const currentHash = JSON.parse(hashStr);
            
            // Verify that currentHash is an object before using it
            if (currentHash && typeof currentHash === 'object' && !Array.isArray(currentHash)) {
              hashObj = {
                ...currentHash,
                selected: value ? [value] : [],
                node: value || ""
              };
            } else {
              console.warn('Hash parsed but is not a valid object:', currentHash);
            }
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('JSON string that failed to parse:', hashStr);
            // Continue with the default hashObj
          }
        } else {
          console.warn('Hash string is not valid JSON format:', hashStr);
        }
      }
    } catch (error) {
      console.error('General error handling hash:', error);
      // Continue with default hashObj if parsing fails
    }
    
    // Convert to JSON and update the URL hash
    const hashStr = JSON.stringify(hashObj);
    window.location.hash = encodeURIComponent(hashStr);
    
    // Close the dropdown
    setIsOpen(false);
    setSearchText('');
  };
  
  // Get display label for the interval
  const getIntervalLabel = (interval: Interval): string => {
    switch (interval) {
      case 'minute_15': return '15m';
      case 'hour': return '1hr';
      case 'hour_6': return '6hr';
      case 'day': return '1d';
      case 'week': return '1w';
      default: return '1hr';
    }
  };
  
  // Calendar icon and date picker functionality
  const [hashDebouncer] = useState<NodeJS.Timeout | null>(null);
  const [calendarView, setCalendarView] = useState<'begin' | 'end'>('begin');
  const [tempBeginDate, setTempBeginDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState<boolean>(false);

  // Initialize temp dates when timePeriod changes
  useEffect(() => {
    if (timePeriod.begin) {
      setTempBeginDate(parseISO(timePeriod.begin));
    }
    if (timePeriod.end) {
      setTempEndDate(parseISO(timePeriod.end));
    }
  }, [timePeriod.begin, timePeriod.end]);

  // Handle temporary date selection
  const handleDateSelection = (calendarType: 'begin' | 'end', date: Date | null) => {
    if (!date) return;
    
    if (calendarType === 'begin') {
      setTempBeginDate(date);
      // If begin date is after end date, update end date
      if (tempEndDate && date > tempEndDate) {
        setTempEndDate(addHours(date, 1));
      }
    } else {
      setTempEndDate(date);
      // If end date is before begin date, update begin date
      if (tempBeginDate && date < tempBeginDate) {
        setTempBeginDate(subHours(date, 1));
      }
    }
  };

  // Handle quick interval selection
  const handleQuickInterval = (interval: 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week') => {
    const now = new Date();
    let beginDate: Date;
    
    switch (interval) {
      case 'minute_15':
        beginDate = subMinutes(now, 15);
        break;
      case 'hour':
        beginDate = subHours(now, 1);
        break;
      case 'hour_6':
        beginDate = subHours(now, 6);
        break;
      case 'day':
        beginDate = subDays(now, 1);
        break;
      case 'week':
        beginDate = subDays(now, 7);
        break;
      default:
        beginDate = subHours(now, 1);
    }
    
    setTempBeginDate(beginDate);
    setTempEndDate(now);
  };

  // Apply the selected date range
  const applyDateSelection = () => {
    if (tempBeginDate && tempEndDate) {
      updateTimePeriod({
        ...timePeriod,
        begin: tempBeginDate.toISOString(),
        end: tempEndDate.toISOString()
      });
    }
    setShowCalendarPicker(false);
    setCalendarView('begin');
  };

  // Cancel date selection
  const cancelDateSelection = () => {
    // Reset temp dates to current timePeriod
    if (timePeriod.begin) {
      setTempBeginDate(parseISO(timePeriod.begin));
    }
    if (timePeriod.end) {
      setTempEndDate(parseISO(timePeriod.end));
    }
    setCalendarView('begin');
  };

  // Expose methods through the ref
  useImperativeHandle(ref, () => ({
    openSearch: (initialChar?: string) => {
      setIsOpen(true);
      if (initialChar) {
        setSearchText(initialChar);
      }
      // Focus the search input after a short delay to ensure it's mounted
      setTimeout(() => {
        const inputElement = document.getElementById('node-search-input');
        if (inputElement) {
          inputElement.focus();
          if (initialChar) {
            // Place cursor at the end of the text
            const inputLength = initialChar.length;
            if (inputElement instanceof HTMLInputElement) {
              inputElement.setSelectionRange(inputLength, inputLength);
            }
          }
        }
      }, 10);
    }
  }));

  return (
    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
      {/* Node selector - now wider */}
      <div className="w-full md:w-80 relative" ref={dropdownRef}>
        {/* Custom dropdown button */}
        <button
          type="button"
          className="flex items-center w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {primarySelectedNode ? (
            <>
              <NodeIcon node={primarySelectedNode} size={20} className="mr-2" />
              <span className="truncate">{selectedOption?.label || stripPrefix(primarySelectedNode)}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select a node to focus on</span>
          )}
          <svg 
            className="ml-auto flex-shrink-0 h-4 w-4 fill-current text-gray-500 dark:text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Dropdown menu with search */}
        {isOpen && (
          <div 
            className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto dropdown-container"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                id="node-search-input"
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setHighlightedIndex(-1); // Reset on search change
                }}
                placeholder="Search nodes..."
                className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
              />
            </div>
            
            <div className="py-1 dropdown-options">
              {/* Empty option */}
              <button
                type="button"
                className={`flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 ${
                  highlightedIndex === -1 ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
                onClick={() => handleNodeChange('')}
                onMouseEnter={() => setHighlightedIndex(-1)}
              >
                <span className="ml-6">Clear selection</span>
              </button>
              
              {/* No results message */}
              {searchText && filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center italic">
                  No matching nodes found
                </div>
              )}
              
              {/* Node options - ensure text doesn't get cut off */}
              {filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex w-full items-center px-3 py-2 text-sm ${
                    option.value === primarySelectedNode 
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                      : highlightedIndex === index
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleNodeChange(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <NodeIcon node={option.value} size={20} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Date selector */}
      <div className="flex items-center space-x-2">
        {/* Left arrow - move back in time */}
        <button
          type="button"
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={handleBackward}
          aria-label="Previous time period"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Time period display */}
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-32 text-center">
          {formatTimePeriod()}
        </div>
        
        {/* Calendar icon and date picker dropdown */}
        <div className="relative" ref={calendarRef}>
          <button
            type="button"
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setShowCalendarPicker(!showCalendarPicker)}
            aria-label="Select date"
          >
            <Calendar className="h-4 w-4" />
          </button>
          
          {/* Enhanced Date Picker */}
          {showCalendarPicker && (
            <div className="absolute z-10 bg-white dark:bg-gray-800 shadow-lg rounded-md p-3 border border-gray-200 dark:border-gray-700 mt-2 right-0 min-w-[355px]">
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex space-x-3">
                    <button
                      className={`text-xs px-2 py-1 rounded ${calendarView === 'begin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}
                      onClick={() => setCalendarView('begin')}
                    >
                      Begin Time
                    </button>
                    <button
                      className={`text-xs px-2 py-1 rounded ${calendarView === 'end' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}
                      onClick={() => setCalendarView('end')}
                    >
                      End Time
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  {/* @ts-ignore */}
                  <DatePicker
                    selected={calendarView === 'begin' ? tempBeginDate : tempEndDate}
                    onChange={(date) => handleDateSelection(calendarView === 'begin' ? 'begin' : 'end', date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    inline
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <button 
                    className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => handleQuickInterval('minute_15')}
                  >
                    Last 15m
                  </button>
                  <button 
                    className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => handleQuickInterval('hour')}
                  >
                    Last 1h
                  </button>
                  <button 
                    className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => handleQuickInterval('hour_6')}
                  >
                    Last 6h
                  </button>
                  <button 
                    className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => handleQuickInterval('day')}
                  >
                    Last 1d
                  </button>
                  <button 
                    className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={() => handleQuickInterval('week')}
                  >
                    Last 1w
                  </button>
                </div>
                
                <div className="flex justify-between">
                  <div className="text-xs">
                    <div><span className="font-semibold">Begin:</span> {tempBeginDate ? format(tempBeginDate, 'MMM d, yyyy HH:mm') : 'Not set'}</div>
                    <div><span className="font-semibold">End:</span> {tempEndDate ? format(tempEndDate, 'MMM d, yyyy HH:mm') : 'Not set'}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={() => setShowCalendarPicker(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      onClick={applyDateSelection}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right arrow - move forward in time */}
        <button
          type="button"
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={handleForward}
          aria-label="Next time period"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Interval quick selector */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-0.5 flex space-x-0.5">
          <button
            className={`px-2 py-1 text-xs rounded ${timePeriod.interval === 'minute_15' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleIntervalChange('minute_15')}
          >
            15m
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${timePeriod.interval === 'hour' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleIntervalChange('hour')}
          >
            1hr
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${timePeriod.interval === 'hour_6' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleIntervalChange('hour_6')}
          >
            6hr
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${timePeriod.interval === 'day' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleIntervalChange('day')}
          >
            1d
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${timePeriod.interval === 'week' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => handleIntervalChange('week')}
          >
            1w
          </button>
        </div>
        
        {/* Now button */}
        <button
          type="button"
          className="px-3 py-1.5 text-xs rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium"
          onClick={handleNow}
        >
          Now
        </button>
      </div>
    </div>
  );
});

export default WorkflowFilters; 