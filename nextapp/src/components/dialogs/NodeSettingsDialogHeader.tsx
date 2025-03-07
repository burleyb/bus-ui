"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDialogs } from '@/hooks/useDialogs';
import { useRouter } from 'next/navigation';
import { NodeData } from '@/types/node';

// Import our new components
import NodeInfo from './node-header/NodeInfo';
import CheckpointControl from './node-header/CheckpointControl';
import NodeNavigation from './node-header/NodeNavigation';
import PlayPauseButton from './node-header/PlayPauseButton';

// Time period type
type TimePeriod = '15m' | '1hr' | '6hr' | '1d' | '1w' | 'custom';

interface NodeSettingsDialogHeaderProps {
  nodeData: NodeData;
  onClose?: () => void;
  timePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
  onCustomPeriodClick?: () => void;
}

export default function NodeSettingsDialogHeader({ 
  nodeData, 
  onClose,
  timePeriod = '15m',
  onTimePeriodChange,
  onCustomPeriodClick
}: NodeSettingsDialogHeaderProps) {
  const { openNodeSettingsDialog } = useDialogs();
  const router = useRouter();
  const [localCheckpoint, setLocalCheckpoint] = useState<string>('');
  const [localIsPaused, setLocalIsPaused] = useState<boolean>(false);
  
  // Safely handle the node data
  const nodeId = nodeData?.id || '';
  const parentNodes = nodeData?.parentNodes || [];
  const childNodes = nodeData?.childNodes || [];
  
  // Check if the node is paused/stopped
  const isPaused = localIsPaused || nodeData?.status === 'PAUSED' || nodeData?.status === 'STOPPED';
  
  // Get the checkpoint from the first read queue
  const getFirstCheckpoint = () => {
    if (localCheckpoint) return localCheckpoint;
    
    if (!nodeData?.queues?.read) return '';
    
    const readQueues = nodeData.queues.read;
    const firstQueueId = Object.keys(readQueues)[0];
    
    if (!firstQueueId || !readQueues[firstQueueId]) return '';
    
    return readQueues[firstQueueId].checkpoint || '';
  };
  
  const checkpoint = getFirstCheckpoint();

  // Function to handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Function to navigate to workflow view
  const handleViewInWorkflow = () => {
    if (!nodeData?.id) return;
    
    // Close the dialog
    if (onClose) {
      onClose();
    }
    
    // Navigate to the workflow view with this node as primary
    router.push(`/workflow?primaryNode=${nodeData.id}`);
  };
  
  // Function to navigate to a parent node
  const handleNavigateToParent = (parentNodeId: string) => {
    if (parentNodeId) {
      if (onClose) {
        onClose();
      }
      openNodeSettingsDialog(parentNodeId);
    }
  };
  
  // Function to navigate to a child node
  const handleNavigateToChild = (childNodeId: string) => {
    if (childNodeId) {
      if (onClose) {
        onClose();
      }
      openNodeSettingsDialog(childNodeId);
    }
  };
  
  // Function to handle checkpoint change
  const handleCheckpointChange = (newCheckpoint: string) => {
    setLocalCheckpoint(newCheckpoint);
    // Here you would typically update the parent component or global state
  };
  
  // Function to handle status change
  const handleStatusChange = (newIsPaused: boolean) => {
    setLocalIsPaused(newIsPaused);
    // Here you would typically update the parent component or global state
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
      {/* Left section with bot logo, name, and ID */}
      <div className="flex items-center space-x-4">
        <NodeInfo 
          nodeData={nodeData} 
          onViewInWorkflow={handleViewInWorkflow} 
        />
        
        {/* Node navigation controls - moved to left side near node info */}
        <div className="ml-4">
          <NodeNavigation 
            parentNodes={parentNodes}
            childNodes={childNodes}
            onNavigateToParent={handleNavigateToParent}
            onNavigateToChild={handleNavigateToChild}
          />
        </div>
      </div>
      
      {/* Right section with controls */}
      <div className="flex items-center space-x-4">
        {/* Play/Pause button */}
        <PlayPauseButton 
          nodeId={nodeId}
          isPaused={isPaused}
          onStatusChange={handleStatusChange}
        />
        
        {/* Checkpoint display with dropdown */}
        <CheckpointControl 
          nodeId={nodeId}
          checkpoint={checkpoint}
          onCheckpointChange={handleCheckpointChange}
        />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
} 