"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { 
  LayoutGrid, 
  BookmarkIcon, 
  Bookmark, 
  Calendar, 
  X, 
  Check,
  ChevronDown,
  Copy,
  FilterIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CatalogSearch from './CatalogSearch';
import { SavedBookmark, TimePeriod, Interval } from '@/types/catalog';
import { format, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import type { DatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Icons for the filter buttons
import { FaRobot, FaArchive, FaPause } from 'react-icons/fa';
import { BsInboxFill } from 'react-icons/bs';
import { MdStorage } from 'react-icons/md';

// Filter button component with type-specific colors when active
const FilterButton = ({ 
  icon, 
  label, 
  isActive, 
  onClick,
  type = "default"
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  type?: "queue" | "bot" | "system" | "archive" | "pause" | "default";
}) => {
  // Define colors based on button type
  const getActiveClasses = () => {
    switch (type) {
      case "queue":
        return "border-purple-400 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:border-purple-700 dark:bg-purple-900/60 dark:hover:bg-purple-900 dark:text-purple-300";
      case "bot":
        return "border-blue-400 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:border-blue-700 dark:bg-blue-900/60 dark:hover:bg-blue-900 dark:text-blue-300";
      case "system":
        return "border-green-400 bg-green-100 hover:bg-green-200 text-green-700 dark:border-green-700 dark:bg-green-900/60 dark:hover:bg-green-900 dark:text-green-300";
      case "archive":
        return "border-amber-400 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:border-amber-700 dark:bg-amber-900/60 dark:hover:bg-amber-900 dark:text-amber-300";
      case "pause":
        return "border-orange-400 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:border-orange-700 dark:bg-orange-900/60 dark:hover:bg-orange-900 dark:text-orange-300";
      default:
        return "border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary";
    }
  };

  return (
    <Button
      variant={isActive ? "outline" : "default"}
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-1 ${isActive ? getActiveClasses() : "text-primary-foreground"}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
};

interface CatalogToolbarProps {
  searchText: string;
  showQueues: boolean;
  showBots: boolean;
  showSystems: boolean;
  showArchived: boolean;
  pauseFilter: 'all' | 'paused' | 'unpaused';
  timePeriod?: TimePeriod;
  onSearchChange: (search: string) => void;
  onShowQueuesChange: (show: boolean) => void;
  onShowBotsChange: (show: boolean) => void;
  onShowSystemsChange: (show: boolean) => void;
  onShowArchivedChange: (show: boolean) => void;
  onPauseFilterChange: (filter: 'all' | 'paused' | 'unpaused') => void;
  onTimePeriodChange: (timePeriod: TimePeriod) => void;
}

export default function CatalogToolbar({
  searchText,
  showQueues = true,
  showBots = true,
  showSystems = true,
  showArchived = false,
  pauseFilter = 'all',
  timePeriod,
  onSearchChange,
  onShowQueuesChange,
  onShowBotsChange,
  onShowSystemsChange,
  onShowArchivedChange,
  onPauseFilterChange,
  onTimePeriodChange
}: CatalogToolbarProps) {
  // Bookmark dialog state
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [isBookmarkDropdownOpen, setIsBookmarkDropdownOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [copied, setCopied] = useState(false);
  
  // Calendar dialog state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<Interval>(timePeriod?.interval || 'minute_15');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Add this function to handle opening the bookmark dialog
  const openBookmarkDialog = () => {
    console.log('Opening bookmark dialog');
    setBookmarkName(''); // Ensure the input is clear
    setIsBookmarkDialogOpen(true);
    setIsBookmarkDropdownOpen(false);
  };
  
  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    try {
      console.log('Loading bookmarks from localStorage');
      const savedBookmarks = localStorage.getItem('catalogBookmarks');
      if (savedBookmarks) {
        const parsedBookmarks = JSON.parse(savedBookmarks);
        console.log('Loaded bookmarks:', parsedBookmarks);
        setBookmarks(parsedBookmarks);
      } else {
        console.log('No saved bookmarks found in localStorage');
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBookmarkDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get current URL hash parameters
  const getUrlParams = (): Record<string, any> => {
    if (typeof window === 'undefined') return {};
    
    try {
      if (window.location.hash && window.location.hash.length > 1) {
        // Get hash and remove the # character
        let hashStr = window.location.hash.substring(1);
        
        // Decode the URL-encoded hash
        try {
          hashStr = decodeURIComponent(hashStr);
        } catch (decodeError) {
          console.error('Error decoding hash:', decodeError);
          return {}; // If we can't decode, return empty object
        }
        
        // Parse the hash as JSON
        if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
          return JSON.parse(hashStr);
        }
      }
    } catch (error) {
      console.error('Error parsing hash:', error);
    }
    
    return {};
  };
  
  // Update URL hash with new parameters
  const updateUrlHash = (newParams: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get current parameters
      const currentParams = getUrlParams();
      
      // Merge with new parameters - create a new object to avoid modifying the current one
      const updatedParams = { ...currentParams, ...newParams };
      
      // Ensure we're not losing any existing parameters
      for (const key in currentParams) {
        if (!(key in newParams)) {
          updatedParams[key] = currentParams[key];
        }
      }
      
      // Convert to JSON string, encode, and update URL hash
      const hashStr = JSON.stringify(updatedParams);
      window.location.hash = encodeURIComponent(hashStr);
    } catch (error) {
      console.error('Error updating URL hash:', error);
    }
  };
  
  // Save bookmark
  const saveBookmark = () => {
    if (!bookmarkName.trim()) {
      console.log('Bookmark name is empty, not saving');
      return;
    }
    
    try {
      console.log('Saving bookmark with name:', bookmarkName.trim());
      
      const newBookmark: SavedBookmark = {
        name: bookmarkName.trim(),
        url: window.location.hash
      };
      
      console.log('Bookmark details:', newBookmark);
      
      const updatedBookmarks = [...bookmarks, newBookmark];
      setBookmarks(updatedBookmarks);
      
      // Save to localStorage
      try {
        localStorage.setItem('catalogBookmarks', JSON.stringify(updatedBookmarks));
        console.log('Bookmarks saved to localStorage', updatedBookmarks);
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      // Reset state and close dialog
      setBookmarkName('');
      setIsBookmarkDialogOpen(false);
      
      // Show feedback that bookmark was saved successfully
      console.log('Bookmark saved successfully');
    } catch (error) {
      console.error('Error in saveBookmark function:', error);
    }
  };
  
  // Load bookmark
  const loadBookmark = (bookmark: SavedBookmark) => {
    try {
      console.log('Loading bookmark:', bookmark);
      if (typeof window !== 'undefined') {
        // Check if bookmark URL is valid
        if (!bookmark.url) {
          console.error('Bookmark URL is empty or invalid');
          return;
        }
        
        window.location.hash = bookmark.url;
        console.log('Hash updated to:', bookmark.url);
        setIsBookmarkDropdownOpen(false);
      }
    } catch (error) {
      console.error('Error loading bookmark:', error);
    }
  };

  // Delete bookmark
  const deleteBookmark = (bookmarkIndex: number) => {
    const updatedBookmarks = bookmarks.filter((_, index) => index !== bookmarkIndex);
    setBookmarks(updatedBookmarks);
    localStorage.setItem('catalogBookmarks', JSON.stringify(updatedBookmarks));
  };
  
  // Copy current URL to clipboard
  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy URL: ', err);
        });
    }
  };
  
  // Format time period for display
  const formatTimePeriod = (tp: TimePeriod): string => {
    if (!tp) return 'Real-time';
    
    // If we have begin and end dates, use the exact selected time period
    if (tp.begin && tp.end) {
      const endDate = parseISO(tp.end);
      
      // Format based on the interval
      switch (tp.interval) {
        case 'minute_15':
          return `Last 15m`;
        case 'hour':
          return `Last 1h`;
        case 'hour_6':
          return `Last 6h`;
        case 'day':
          return `Last 24h`;
        case 'week': {
          return `Last 7d`;
        }
        default:
          return `${format(endDate, 'MMM d, h:mm a')}`;
      }
    } else {
      // Real-time mode with interval
      return `${tp.interval === 'minute_15' ? 'Last 15m' : 
             tp.interval === 'hour' ? 'Last 1h' : 
             tp.interval === 'hour_6' ? 'Last 6h' : 
             tp.interval === 'day' ? 'Last 24h' : 'Last 7d'}`;
    }
  };
  
  // Apply date selection
  const applyDateSelection = () => {
    if (!selectedDate) return;
    
    // Create the time period object based on the selected interval and date
    const now = new Date(selectedDate);
    let beginDate: Date;
    let endDate: Date = now;
    
    switch (selectedInterval) {
      case 'minute_15':
        beginDate = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case 'hour':
        beginDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'hour_6':
        beginDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case 'day':
        beginDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        beginDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        beginDate = new Date(now.getTime() - 15 * 60 * 1000);
    }
    
    const newTimePeriod: TimePeriod = {
      begin: beginDate.toISOString(),
      end: endDate.toISOString(),
      interval: selectedInterval
    };
    
    onTimePeriodChange(newTimePeriod);
    setIsCalendarOpen(false);
  };
  
  // Set to real-time
  const setRealTime = () => {
    const newTimePeriod: TimePeriod = {
      interval: 'minute_15'
    };
    onTimePeriodChange(newTimePeriod);
    setIsCalendarOpen(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search and filters on the same line */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="min-w-64 w-full sm:w-auto">
            <CatalogSearch 
              initialSearch={searchText} 
              onSearchChange={onSearchChange} 
              nodeTypes={[
                ...(showQueues ? ['queue'] : []),
                ...(showBots ? ['bot'] : []),
                ...(showSystems ? ['system'] : [])
              ]}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <FilterButton
              icon={<BsInboxFill size={16} />}
              label="Queues"
              isActive={showQueues}
              onClick={() => onShowQueuesChange(!showQueues)}
              type="queue"
            />
            
            <FilterButton
              icon={<FaRobot size={16} />}
              label="Bots"
              isActive={showBots}
              onClick={() => onShowBotsChange(!showBots)}
              type="bot"
            />
            
            <FilterButton
              icon={<MdStorage size={16} />}
              label="Systems"
              isActive={showSystems}
              onClick={() => onShowSystemsChange(!showSystems)}
              type="system"
            />
            
            <FilterButton
              icon={<FaArchive size={16} />}
              label="Archived"
              isActive={showArchived}
              onClick={() => onShowArchivedChange(!showArchived)}
              type="archive"
            />
            
            <FilterButton
              icon={<FaPause size={16} />}
              label={pauseFilter === 'all' ? 'Paused' : pauseFilter === 'paused' ? 'Paused' : 'Unpaused'}
              isActive={pauseFilter !== 'all'}
              onClick={() => {
                // Toggle between all, paused, and unpaused
                const nextFilter = pauseFilter === 'all' 
                  ? 'paused' 
                  : pauseFilter === 'paused' 
                    ? 'unpaused' 
                    : 'all';
                onPauseFilterChange(nextFilter);
              }}
              type="pause"
            />
            
            <div className="relative" ref={dropdownRef}>
              <Popover open={isBookmarkDropdownOpen} onOpenChange={setIsBookmarkDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <BookmarkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Bookmarks</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-1">
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        console.log('Save Current View button clicked');
                        openBookmarkDialog();
                      }}
                    >
                      Save Current View
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="justify-start"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <span className="flex items-center">
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </span>
                      )}
                    </Button>
                    
                    {bookmarks.length > 0 ? (
                      <>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        
                        <div className="text-xs text-muted-foreground px-2 py-1">
                          Saved Bookmarks ({bookmarks.length})
                        </div>
                        
                        {bookmarks.map((bookmark, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start w-[85%] text-left overflow-hidden whitespace-nowrap overflow-ellipsis"
                              onClick={() => loadBookmark(bookmark)}
                              title={bookmark.name}
                            >
                              {bookmark.name}
                            </Button>
                            <button 
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                deleteBookmark(index);
                              }}
                              title="Delete bookmark"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <div className="text-xs text-muted-foreground p-2 text-center italic">
                          No saved bookmarks yet
                        </div>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* Date selector */}
        <div className="flex items-center space-x-2">
          {/* Left arrow - move back in time */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!timePeriod) return;
              
              // If we're in real-time mode, generate begin/end times
              if (!timePeriod.begin || !timePeriod.end) {
                const now = new Date();
                let beginDate: Date;
                
                // Calculate begin date based on interval
                switch (timePeriod.interval) {
                  case 'minute_15':
                    beginDate = new Date(now.getTime() - 15 * 60 * 1000);
                    break;
                  case 'hour':
                    beginDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                  case 'hour_6': 
                    beginDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                    break;
                  case 'day':
                    beginDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                  case 'week':
                    beginDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                  default:
                    beginDate = new Date(now.getTime() - 15 * 60 * 1000);
                }
                
                // Move back one interval
                const intervalMillis = now.getTime() - beginDate.getTime();
                const newEnd = beginDate;
                const newBegin = new Date(beginDate.getTime() - intervalMillis);
                
                // Update time period
                const newTimePeriod: TimePeriod = {
                  begin: newBegin.toISOString(),
                  end: newEnd.toISOString(),
                  interval: timePeriod.interval
                };
                
                onTimePeriodChange(newTimePeriod);
              } else {
                // We have begin/end dates, simply move back one interval
                const beginDate = parseISO(timePeriod.begin);
                const endDate = parseISO(timePeriod.end);
                const intervalMillis = endDate.getTime() - beginDate.getTime();
                
                const newBegin = new Date(beginDate.getTime() - intervalMillis);
                const newEnd = new Date(endDate.getTime() - intervalMillis);
                
                const newTimePeriod: TimePeriod = {
                  begin: newBegin.toISOString(),
                  end: newEnd.toISOString(),
                  interval: timePeriod.interval
                };
                
                onTimePeriodChange(newTimePeriod);
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
          
          {/* Time period display */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 min-w-32"
            onClick={() => setIsCalendarOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-1" />
            {timePeriod ? formatTimePeriod(timePeriod) : 'Real-time'}
          </Button>
          
          {/* Calendar popup */}
          <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <DialogContent className="p-0 max-w-[370px]">
              <div className="p-4 space-y-4">
                <div className="flex flex-col">
                  {React.createElement(DatePicker as any, {
                    selected: selectedDate,
                    onChange: (date: Date | null) => setSelectedDate(date),
                    showTimeSelect: true,
                    timeFormat: "h:mm aa",
                    timeIntervals: 15,
                    dateFormat: "MMMM d, yyyy h:mm aa",
                    inline: true
                  })}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(['minute_15', 'hour', 'hour_6', 'day', 'week'] as Interval[]).map((interval) => (
                    <Button
                      key={interval}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInterval(interval);
                        // Also update the date based on selected interval
                        if (selectedDate) {
                          const now = selectedDate;
                          let beginDate: Date;
                          
                          switch (interval) {
                            case 'minute_15':
                              beginDate = new Date(now.getTime() - 15 * 60 * 1000);
                              break;
                            case 'hour':
                              beginDate = new Date(now.getTime() - 60 * 60 * 1000);
                              break;
                            case 'hour_6':
                              beginDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                              break;
                            case 'day':
                              beginDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                              break;
                            case 'week':
                              beginDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                              break;
                            default:
                              beginDate = new Date(now.getTime() - 15 * 60 * 1000);
                          }
                        }
                      }}
                    >
                      {interval === 'minute_15' ? 'Last 15m' : 
                        interval === 'hour' ? 'Last 1h' : 
                        interval === 'hour_6' ? 'Last 6h' : 
                        interval === 'day' ? 'Last 1d' : 'Last 7d'}
                    </Button>
                  ))}
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={setRealTime}
                  >
                    Real-time
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCalendarOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyDateSelection}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Right arrow - move forward in time */}
          <Button
            variant="ghost" 
            size="icon"
            onClick={() => {
              if (!timePeriod) return;
              
              // If we're in real-time mode, return without action
              if (!timePeriod.begin || !timePeriod.end) {
                return;
              }
              
              // We have begin/end dates, move forward one interval
              const beginDate = parseISO(timePeriod.begin);
              const endDate = parseISO(timePeriod.end);
              const intervalMillis = endDate.getTime() - beginDate.getTime();
              
              const newBegin = new Date(beginDate.getTime() + intervalMillis);
              const newEnd = new Date(endDate.getTime() + intervalMillis);
              
              // Don't allow going into the future
              const now = new Date();
              if (newEnd > now) {
                return;
              }
              
              const newTimePeriod: TimePeriod = {
                begin: newBegin.toISOString(),
                end: newEnd.toISOString(),
                interval: timePeriod.interval
              };
              
              onTimePeriodChange(newTimePeriod);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Button>
          
          {/* Interval quick selector */}
          <div className="bg-muted rounded-md p-0.5 flex space-x-0.5">
            {(['minute_15', 'hour', 'hour_6', 'day', 'week'] as Interval[]).map((interval) => {
              const isActive = timePeriod?.interval === interval;
              // Colors based on time interval
              const getActiveClasses = () => {
                if (!isActive) return "";
                switch (interval) {
                  case 'minute_15':
                    return "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-700";
                  case 'hour':
                    return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700";
                  case 'hour_6':
                    return "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/60 dark:text-cyan-300 dark:border-cyan-700";
                  case 'day':
                    return "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/60 dark:text-teal-300 dark:border-teal-700";
                  case 'week':
                    return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700";
                  default:
                    return "";
                }
              };
              
              return (
                <Button
                  key={interval}
                  variant={isActive ? "outline" : "ghost"}
                  size="sm"
                  className={`text-xs px-2 h-7 ${getActiveClasses()}`}
                  onClick={() => {
                    // Update the interval, generate new begin/end if in real-time mode
                    const now = new Date();
                    let beginDate: Date;
                    
                    switch (interval) {
                      case 'minute_15':
                        beginDate = new Date(now.getTime() - 15 * 60 * 1000);
                        break;
                      case 'hour':
                        beginDate = new Date(now.getTime() - 60 * 60 * 1000);
                        break;
                      case 'hour_6':
                        beginDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                        break;
                      case 'day':
                        beginDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                      case 'week':
                        beginDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                      default:
                        beginDate = new Date(now.getTime() - 15 * 60 * 1000);
                    }
                    
                    // If we're not in real-time mode, keep the existing end date and adjust begin date
                    const newTimePeriod: TimePeriod = {
                      interval,
                      ...(timePeriod?.begin && timePeriod?.end ? {
                        begin: beginDate.toISOString(),
                        end: now.toISOString()
                      } : {})
                    };
                    
                    onTimePeriodChange(newTimePeriod);
                  }}
                >
                  {interval === 'minute_15' ? '15m' : 
                    interval === 'hour' ? '1h' : 
                    interval === 'hour_6' ? '6h' : 
                    interval === 'day' ? '1d' : '1w'}
                </Button>
              );
            })}
          </div>
          
          {/* Now button with gradient */}
          <Button
            size="sm"
            onClick={() => {
              // Set to real-time mode (no begin/end dates)
              const realtimeTimePeriod: TimePeriod = {
                interval: timePeriod?.interval || 'minute_15'
              };
              
              onTimePeriodChange(realtimeTimePeriod);
            }}
            className={`bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 
              ${!timePeriod?.begin && !timePeriod?.end ? 'ring-2 ring-offset-2 ring-violet-500/50' : ''}`}
          >
            Now
          </Button>
        </div>
      </div>
      
      {/* Bookmark Dialog */}
      <Dialog 
        open={isBookmarkDialogOpen} 
        onOpenChange={(open) => {
          console.log('Dialog open state changing to:', open);
          setIsBookmarkDialogOpen(open);
          if (!open) {
            setBookmarkName(''); // Clear input when dialog closes
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Bookmark</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="bookmarkName" className="block text-sm font-medium mb-1">
              Bookmark Name
            </label>
            <input
              type="text"
              id="bookmarkName"
              className="w-full px-3 py-2 border border-input rounded-md"
              value={bookmarkName}
              onChange={(e) => {
                console.log('Bookmark name changed:', e.target.value);
                setBookmarkName(e.target.value);
              }}
              placeholder="My Catalog View"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && bookmarkName.trim()) {
                  console.log('Enter key pressed, saving bookmark');
                  saveBookmark();
                }
              }}
            />
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                console.log('Cancel button clicked');
                setIsBookmarkDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('Save button clicked');
                saveBookmark();
              }}
              disabled={!bookmarkName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 