"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useEventDetails } from '@/context/ApiContext';
import { 
  ClockIcon, 
  DocumentTextIcon, 
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface TraceDetailsProps {
  queueId: string;
  eventId: string;
}

interface TraceNode {
  id: string;
  label: string;
  timestamp: string;
  checkpoint: string;
  children: TraceNode[];
  processed: boolean;
  time?: number;
}

export default function TraceDetails({
  queueId,
  eventId
}: TraceDetailsProps) {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState<'trace' | 'payload' | 'schema'>('trace');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // For a real application, this would use a Tanstack Query hook to fetch event details
  const eventDetailsQuery = useEventDetails(queueId, eventId);
  
  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };
  
  // Format processing time
  const formatProcessingTime = (time?: number) => {
    if (!time) return 'N/A';
    
    if (time < 1000) {
      return `${time}ms`;
    } else {
      return `${(time / 1000).toFixed(2)}s`;
    }
  };
  
  // Recursive function to render trace tree
  const renderTraceTree = (node: TraceNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="mb-2">
        <div 
          className={`flex items-start rounded-md p-2 ${
            depth === 0 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : node.processed 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-yellow-50 dark:bg-yellow-900/20'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.id)} 
              className="mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {isExpanded 
                ? <ChevronDownIcon className="h-5 w-5" /> 
                : <ChevronRightIcon className="h-5 w-5" />
              }
            </button>
          )}
          
          {!hasChildren && <div className="w-7"></div>}
          
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-medium text-gray-900 dark:text-white">{node.label || node.id}</span>
              {node.time !== undefined && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatProcessingTime(node.time)}
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatTime(node.timestamp)}
            </div>
            
            {node.checkpoint && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Checkpoint: {node.checkpoint}
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children.map(child => renderTraceTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  if (!queueId || !eventId) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
        <InformationCircleIcon className="h-12 w-12 mb-4" />
        <p>Select an event to view details</p>
      </div>
    );
  }
  
  if (eventDetailsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <ArrowPathIcon className="h-10 w-10 text-gray-400 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading event details...</p>
      </div>
    );
  }
  
  if (eventDetailsQuery.isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
        <h3 className="text-red-800 dark:text-red-400 font-medium">Failed to load event details</h3>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
          {eventDetailsQuery.error instanceof Error ? eventDetailsQuery.error.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }
  
  const eventData = eventDetailsQuery.data;
  
  if (!eventData) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
        <InformationCircleIcon className="h-12 w-12 mb-4" />
        <p>No data available for this event</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Event Header */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{eventData.id}</h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatTime(eventData.timestamp)}
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            eventData.status === 'success'
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}>
            {eventData.status}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('trace')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trace'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Trace Flow
          </button>
          
          <button
            onClick={() => setActiveTab('payload')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payload'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Payload
          </button>
          
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schema'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Schema
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="pb-2">
        {activeTab === 'trace' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {eventData.trace && renderTraceTree(eventData.trace)}
              
              {(!eventData.trace || !eventData.trace.children || eventData.trace.children.length === 0) && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No trace data available for this event
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'payload' && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-[500px]">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {JSON.stringify(eventData.payload, null, 2)}
            </pre>
          </div>
        )}
        
        {activeTab === 'schema' && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-[500px]">
            {eventData.schema ? (
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {JSON.stringify(eventData.schema, null, 2)}
              </pre>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No schema available for this event
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 