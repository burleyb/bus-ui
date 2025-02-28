"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Suspense } from 'react';
import WorkflowGraph from '@/components/workflow/WorkflowGraph';
import WorkflowFilters from '@/components/workflow/WorkflowFilters';
import WorkflowControls from '@/components/workflow/WorkflowControls';
import { useStats } from '@/context/ApiContext';

// Define TimePeriod interface for consistency
interface TimePeriod {
  begin?: string;
  end?: string;
  interval: 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week';
}

export default function WorkflowViewPage() {
  const [focusNodes, setFocusNodes] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>({
    interval: 'minute_15',
    begin: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    end: new Date().toISOString() // current time
  });
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<number[]>([0, 0]);
  const [showStats, setShowStats] = useState<boolean>(true);
  
  // Reference to the filters component for auto-search functionality
  const filtersRef = useRef<{ openSearch: (initialText: string) => void } | null>(null);
  
  // Initialize stats polling on workflow page load
  useStats();
  
  // Parse hash when it changes
  useEffect(() => {
    const parseHash = () => {
      try {
        if (window.location.hash && window.location.hash.length > 1) {
          // Remove the '#' character from the hash
          let hashStr = window.location.hash.substring(1);
          
          // Decode the URL-encoded hash
          try {
            hashStr = decodeURIComponent(hashStr);
            console.debug('Decoded hash string:', hashStr);
          } catch (decodeError) {
            console.error('Error decoding hash:', decodeError);
            // If we can't decode, we can't proceed with parsing
            setFocusNodes([]);
            return;
          }
          
          // Validate that the hash is a proper JSON string
          if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
            // Parse the JSON
            const hashData = JSON.parse(hashStr);
            
            // Set the focus nodes from the selected array in the hash
            if (hashData.selected && Array.isArray(hashData.selected) && hashData.selected.length > 0) {
              setFocusNodes(hashData.selected);
            } else if (hashData.node) {
              // Fallback to node property, adding as single item in array
              setFocusNodes([hashData.node]);
            } else {
              setFocusNodes([]);
            }
            
            // Set time period if available
            if (hashData.timePeriod) {
              setTimePeriod(hashData.timePeriod);
            }
            
            // Set zoom if available
            if (hashData.zoom !== undefined) {
              setZoom(Number(hashData.zoom));
            }
            
            // Set offset if available
            if (hashData.offset && Array.isArray(hashData.offset) && hashData.offset.length === 2) {
              setOffset(hashData.offset);
            }
            
            // Set stats toggle if available
            if (hashData.stats !== undefined) {
              setShowStats(Boolean(hashData.stats));
            }
          } else {
            console.warn('Hash string is not valid JSON format after decoding:', hashStr);
            setFocusNodes([]);
          }
        } else {
          setFocusNodes([]);
        }
      } catch (error) {
        console.error('Error parsing hash:', error);
        setFocusNodes([]);
      }
    };
    
    // Parse hash initially
    parseHash();
    
    // Add event listener for hash changes
    window.addEventListener('hashchange', parseHash);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('hashchange', parseHash);
    };
  }, []);
  
  // Auto-search when typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if any modifier keys are pressed or if an input element is focused
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' || 
          document.activeElement?.tagName === 'SELECT' ||
          document.activeElement?.getAttribute('role') === 'textbox' ||
          document.activeElement?.getAttribute('contenteditable') === 'true') {
        return;
      }
      
      // Skip navigation and special keys
      const ignoreKeys = ['Escape', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
      if (ignoreKeys.includes(e.key)) return;
      
      // Only react to printable characters
      if (e.key.length === 1) {
        // Trigger search box opening and set initial search text
        if (filtersRef.current && filtersRef.current.openSearch) {
          // @ts-ignore - TypeScript doesn't recognize the openSearch method from the useImperativeHandle
          filtersRef.current.openSearch(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Get primary selected node
  const primarySelectedNode = focusNodes.length > 0 ? focusNodes[0] : '';
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
      <div className="flex items-center justify-between flex-wrap">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mr-4">Event Flow</h1>
          <WorkflowControls selectedNode={primarySelectedNode} />
        </div>
        <WorkflowFilters 
          selectedBot={focusNodes} 
          initialTimePeriod={timePeriod} 
          ref={filtersRef}
        />
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-1 gap-6 min-h-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col h-full">
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div className="h-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>}>
              <WorkflowGraph 
                selectedBot={focusNodes} 
                timePeriod={timePeriod} 
                zoom={zoom} 
                offset={offset} 
                stats={showStats} 
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
} 