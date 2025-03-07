"use client";

import React, { useState } from 'react';
import { X, Pause, Play, ChevronLeft, ChevronRight, Workflow, Settings, ChevronDown } from 'lucide-react';
import { useDialogs } from '@/hooks/useDialogs';
import { AWSLambdaIcon } from '../icons/AWSLambdaIcon';
import NodeIcon from '../node/NodeIcon';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { NodeData } from '@/types/node';

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
  const [isChangeCheckpointOpen, setIsChangeCheckpointOpen] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const [localCheckpoint, setLocalCheckpoint] = useState<string>('');
  const [localIsPaused, setLocalIsPaused] = useState<boolean>(false);
  
  // Safely handle the node data
  const nodeName = nodeData?.name || 'Loading...';
  const nodeType = nodeData?.type || 'unknown';
  const nodeFullId = nodeData?.id ? `${nodeType}:${nodeData.id}` : 'Loading...';
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
  
  // Function to handle play/pause click
  const handlePlayPause = () => {
    console.log(`Toggle pause state for node ${nodeData?.id}`);
    setLocalIsPaused(!isPaused);
    // In a real implementation, call an API to pause/resume the node
  };
  
  // Function to handle force run
  const handleForceRun = () => {
    if (!nodeData?.id) return;
    
    // In a real implementation, call an API to force run the bot
    console.log(`Force run for node ${nodeData.id}`);
  };
  
  // Function to handle copy checkpoint
  const handleCopyCheckpoint = () => {
    if (!checkpoint) return;
    
    navigator.clipboard.writeText(checkpoint);
  };
  
  // Function to handle change checkpoint
  const handleChangeCheckpoint = () => {
    setIsChangeCheckpointOpen(true);
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
  const handleSubmitCheckpoint = () => {
    if (!newCheckpoint || !nodeData?.id) return;
    
    setLocalCheckpoint(newCheckpoint);
    setIsChangeCheckpointOpen(false);
    setNewCheckpoint('');
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
      {/* Left section with bot logo, name, and ID */}
      <div className="flex items-center space-x-3">
        {/* Bot logo with status */}
        <NodeIcon node={{ type: nodeType, status: nodeData?.status }} className="w-6 h-6" />
        
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">{nodeName}</h2>
            {/* Node data flow icon that links to workflow */}
            <button 
              onClick={handleViewInWorkflow}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="View in Workflow"
            >
              <Workflow size={16} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{nodeFullId}</span>
            
            {/* AWS Lambda link for bot nodes */}
            {nodeType === 'lambda' && (
              <a 
                href={`https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/siq-clients-${nodeId.toLowerCase()}-BotExtractSpotifySavedTracks-mzi8QDI44P9a?tab=code`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="Open in AWS Console"
              >
                <AWSLambdaIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Node navigation controls */}
      <div className="flex items-center space-x-2">
        {/* Parent node navigation */}
        {parentNodes.length > 0 && (
          parentNodes.length === 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigateToParent(parentNodes[0])}
              title="Go to Parent Node"
              className="flex items-center"
            >
              <ChevronLeft size={16} />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  title="Parent Nodes"
                  className="flex items-center relative"
                >
                  <ChevronLeft size={16} />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {parentNodes.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {parentNodes.map((parentId: string) => (
                  <DropdownMenuItem 
                    key={parentId}
                    onClick={() => handleNavigateToParent(parentId)}
                  >
                    {parentId}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
        
        {/* Child node navigation */}
        {childNodes.length > 0 && (
          childNodes.length === 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigateToChild(childNodes[0])}
              title="Go to Child Node"
              className="flex items-center"
            >
              <ChevronRight size={16} />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  title="Child Nodes"
                  className="flex items-center relative"
                >
                  <ChevronRight size={16} />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {childNodes.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {childNodes.map((childId: string) => (
                  <DropdownMenuItem 
                    key={childId}
                    onClick={() => handleNavigateToChild(childId)}
                  >
                    {childId}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
      </div>
      
      {/* Right section with controls */}
      <div className="flex items-center space-x-4">
        {/* Play/Pause button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          onClick={handlePlayPause}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </Button>
        
        {/* Checkpoint display with dropdown */}
        <div className="flex items-center">
          <div className="max-w-[240px] truncate bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-l-md text-sm">
            {checkpoint || 'No checkpoint'}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2 py-1 rounded-r-md border-l border-gray-300 dark:border-gray-600">
                <div className="flex items-center">
                  <Settings size={14} />
                  <ChevronDown size={14} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleChangeCheckpoint}>
                Change Checkpoint
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyCheckpoint}>
                Copy Checkpoint
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleForceRun}>
                Force Run
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Checkpoint change modal */}
      {isChangeCheckpointOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-medium mb-4">Change Checkpoint</h3>
            <Input
              value={newCheckpoint}
              onChange={(e) => setNewCheckpoint(e.target.value)}
              placeholder="Enter new checkpoint value"
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsChangeCheckpointOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitCheckpoint}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 