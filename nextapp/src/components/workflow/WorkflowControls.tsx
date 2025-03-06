"use client";

import React, { useState, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Hourglass, 
  Bookmark, 
  Share2, 
  Copy, 
  Check, 
  ChevronDown,
  Pause,
  Play 
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';

interface WorkflowControlsProps {
  selectedNode: string;
}

// Type for saved bookmarks
interface SavedBookmark {
  name: string;
  url: string;
}

export default function WorkflowControls({ selectedNode }: WorkflowControlsProps) {
  // Dialog states
  const [isBookmarkDialogOpen, setIsBookmarkDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [isBookmarkDropdownOpen, setIsBookmarkDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(true);
  const [isPollingPaused, setIsPollingPaused] = useState(false);
  
  const queryClient = useQueryClient();
  const { state, dispatch } = useAppContext();
  
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
  
  // Load bookmarks from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedBookmarks = localStorage.getItem('workflowBookmarks');
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    }
  }, []);
  
  // Check current state of stats when component mounts or hash changes
  useEffect(() => {
    const updateStatsStatus = () => {
      const currentParams = getUrlParams();
      setStatsEnabled(Boolean(currentParams.stats));
      
      // Also check for polling state in URL hash
      const pollingParam = currentParams.statsPolling;
      if (pollingParam !== undefined) {
        setIsPollingPaused(!pollingParam); // Note: we store statsPolling as true when NOT paused
      }
    };
    
    // Update initially
    updateStatsStatus();
    
    // Listen for hash changes
    window.addEventListener('hashchange', updateStatsStatus);
    
    return () => {
      window.removeEventListener('hashchange', updateStatsStatus);
    };
  }, []);

  // Effect for monitoring polling state changes
  useEffect(() => {
    // Log current polling state for debugging
    console.log(`Polling state: ${isPollingPaused ? 'paused' : 'active'}`);
    
    // This effect now primarily serves for logging and potential future enhancements
    
    // Clean up any queries when component unmounts
    return () => {
      if (isPollingPaused) {
        // Resume polling if we're unmounting while paused to avoid leaving the app in a bad state
        dispatch({ 
          type: 'UPDATE_STATE', 
          payload: { statsPollingPaused: false } 
        });
      }
    };
  }, [isPollingPaused, dispatch]);
  
  // Handle zoom in
  const handleZoomIn = () => {
    const currentParams = getUrlParams();
    const currentZoom = currentParams.zoom || 1;
    updateUrlHash({ zoom: currentZoom * 1.25 });
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    const currentParams = getUrlParams();
    const currentZoom = currentParams.zoom || 1;
    updateUrlHash({ zoom: currentZoom / 1.25 });
  };
  
  // Handle center
  const handleCenter = () => {
    updateUrlHash({ offset: [0, 0] });
  };
  
  // Handle stats toggle
  const handleStatsToggle = () => {
    const currentParams = getUrlParams();
    const currentStats = currentParams.stats || false;
    
    // Preserve collapsed and expanded state
    const collapsed = currentParams.collapsed || { left: [], right: [] };
    const expanded = currentParams.expanded || { left: [], right: [] };
    
    // Update with new stats value while preserving other state
    updateUrlHash({ 
      stats: !currentStats,
      collapsed,
      expanded
    });
  };

  // Handle polling toggle
  const handlePollingToggle = () => {
    // Toggle the local state first
    const newPausedState = !isPollingPaused;
    setIsPollingPaused(newPausedState);
    
    // Update the global app state
    dispatch({
      type: 'UPDATE_STATE',
      payload: { statsPollingPaused: newPausedState }
    });
    
    // Force an immediate query cancellation if pausing
    if (newPausedState) {
      queryClient.cancelQueries({ queryKey: ['stats'] });
    } else {
      // Force an immediate refetch if resuming
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
    
    // Store the polling state in URL hash to persist it across page refreshes
    const currentParams = getUrlParams();
    updateUrlHash({ 
      ...currentParams,
      statsPolling: !newPausedState // We store statsPolling as true when NOT paused
    });
    
    console.log(`Stats polling ${newPausedState ? 'paused' : 'resumed'}`);
  };
  
  // Save bookmark
  const saveBookmark = () => {
    if (!bookmarkName.trim()) return;
    
    const newBookmark: SavedBookmark = {
      name: bookmarkName.trim(),
      url: window.location.hash
    };
    
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    
    // Save to localStorage
    localStorage.setItem('workflowBookmarks', JSON.stringify(updatedBookmarks));
    
    // Close dialog and reset form
    setIsBookmarkDialogOpen(false);
    setBookmarkName('');
  };
  
  // Load bookmark
  const loadBookmark = (bookmark: SavedBookmark) => {
    if (typeof window !== 'undefined') {
      window.location.hash = bookmark.url.startsWith('#') 
        ? bookmark.url.substring(1) 
        : bookmark.url;
    }
    setIsBookmarkDropdownOpen(false);
  };
  
  // Copy URL to clipboard
  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
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
  
  return (
    <div className="flex items-center space-x-2 mr-4">
      {/* Zoom Controls */}
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
        <button
          title="Zoom In"
          className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={handleZoomIn}
        >
          <ZoomIn size={16} />
        </button>
        <button
          title="Center"
          className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={handleCenter}
        >
          <Crosshair size={16} />
        </button>
        <button
          title="Zoom Out"
          className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          onClick={handleZoomOut}
        >
          <ZoomOut size={16} />
        </button>
      </div>
      
      {/* Stats Toggle */}
      <button
        title="Toggle Statistics"
        className={`p-1 rounded ${
          statsEnabled 
            ? "bg-blue-500 text-white hover:bg-blue-600" 
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
        onClick={handleStatsToggle}
      >
        <Hourglass size={16} />
      </button>

      {/* Polling Toggle */}
      <button
        title={isPollingPaused ? "Resume Stats Polling" : "Pause Stats Polling"}
        className={`p-1 rounded ${
          isPollingPaused 
            ? "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" 
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
        onClick={handlePollingToggle}
      >
        {isPollingPaused ? <Play size={16} /> : <Pause size={16} />}
      </button>
      
      {/* Bookmark Controls */}
      <div className="relative">
        <div className="flex items-center space-x-1">
          <button
            title="Save Workflow"
            className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            onClick={() => setIsBookmarkDialogOpen(true)}
          >
            <Bookmark size={16} />
          </button>
          <button
            title="Load Saved Workflow"
            className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            onClick={() => setIsBookmarkDropdownOpen(!isBookmarkDropdownOpen)}
          >
            <ChevronDown size={16} />
          </button>
        </div>
        
        {/* Bookmark Dropdown */}
        {isBookmarkDropdownOpen && (
          <div className="absolute z-10 top-full mt-1 right-0 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 min-w-[150px]">
            {bookmarks.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No saved bookmarks
              </div>
            ) : (
              <ul className="py-1">
                {bookmarks.map((bookmark, index) => (
                  <li key={index}>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => loadBookmark(bookmark)}
                    >
                      {bookmark.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      
      {/* Share Button */}
      <button
        title="Share Workflow"
        className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        onClick={() => setIsShareDialogOpen(true)}
      >
        <Share2 size={16} />
      </button>
      
      {/* Save Bookmark Dialog */}
      <Dialog
        open={isBookmarkDialogOpen}
        onClose={() => setIsBookmarkDialogOpen(false)}
        title="Save Workflow"
        size="sm"
      >
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="bookmark-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter workflow name
            </label>
            <input
              id="bookmark-name"
              type="text"
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="My Workflow"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => setIsBookmarkDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              onClick={saveBookmark}
              disabled={!bookmarkName.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </Dialog>
      
      {/* Share URL Dialog */}
      <Dialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        title="Share Workflow"
        size="md"
      >
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="share-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workflow URL
            </label>
            <div className="relative">
              <textarea
                id="share-url"
                readOnly
                className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                value={typeof window !== 'undefined' ? window.location.href : ''}
              />
              <button 
                className="absolute right-2 top-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => setIsShareDialogOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 