"use client";

import React, { useState } from 'react';
import { X, Pause, Play, ChevronLeft, ChevronRight, GitFork, Settings, ChevronDown, Database } from 'lucide-react';
import { useDialogs } from '@/hooks/useDialogs';
import { AWSLambdaIcon } from '../icons/AWSLambdaIcon';
import NodeIcon from '../node/NodeIcon';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { NodeData } from '@/types/node';
import { useBotPause } from '@/context/ApiContext';
import { useWorkflowGraph } from '@/hooks/useWorkflowGraph';

// Time period type
type TimePeriod = '15m' | '1hr' | '6hr' | '1d' | '1w' | 'custom';

interface NodeSettingsDialogHeaderProps {
  nodeData: NodeData;
  onClose?: () => void;
  timePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
  onCustomPeriodClick?: () => void;
}

// Renders a visual indicator for each read queue
function ReadQueueIndicator({ 
  queueId, 
  isSelected, 
  onClick 
}: { 
  queueId: string; 
  isSelected: boolean; 
  onClick: () => void 
}) {
  const displayName = queueId.split(':').pop() || queueId;
  
  return (
    <div 
      className={`
        flex items-center px-2 py-1 rounded-md my-1 cursor-pointer
        ${isSelected 
          ? 'bg-blue-100 dark:bg-blue-900/20 border-l-2 border-blue-500' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
      `}
      onClick={onClick}
      title={queueId}
    >
      <Database 
        size={14} 
        className={isSelected ? 'text-blue-500' : 'text-gray-500'} 
      />
      <span 
        className={`
          ml-2 text-sm truncate 
          ${isSelected ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}
        `}
      >
        {displayName}
      </span>
    </div>
  );
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
  
  // State to track which read queue is selected for checkpoint display
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  
  // Use the bot pause mutation
  const botPauseMutation = useBotPause();
  
  // Get workflow graph methods for navigation
  const { updateGraphState } = useWorkflowGraph();
  
  // Safely handle the node data
  const nodeName = nodeData?.name || 'Loading...';
  const nodeType = nodeData?.type || 'unknown';
  const nodeFullId = nodeData?.id ? `${nodeType}:${nodeData.id}` : 'Loading...';
  const nodeId = nodeData?.id || '';
  const parentNodes = nodeData?.parentNodes || [];
  const childNodes = nodeData?.childNodes || [];
  
  // Check if the node is paused/stopped
  const isPaused = localIsPaused || nodeData?.paused || nodeData?.status === 'PAUSED' || nodeData?.status === 'STOPPED';
  
  // Get all read queues 
  const readQueues = nodeData?.checkpoints?.read || {};
  const readQueueIds = Object.keys(readQueues);
  
  // If no queue is selected and there are queues available, select the first one
  React.useEffect(() => {
    if (!selectedQueueId && readQueueIds.length > 0) {
      setSelectedQueueId(readQueueIds[0]);
    }
  }, [readQueueIds, selectedQueueId]);
  
  // Get the checkpoint from the selected read queue
  const getSelectedCheckpoint = () => {
    if (localCheckpoint) return localCheckpoint;
    
    if (!nodeData?.checkpoints?.read) return '';
    
    if (!selectedQueueId && readQueueIds.length > 0) {
      // Default to first queue if none selected
      return readQueueIds
        .map(id => readQueues[id]?.checkpoint)
        .find(checkpoint => checkpoint) || '';
    }
    
    if (!selectedQueueId || !readQueues[selectedQueueId]) return '';
    
    return readQueues[selectedQueueId]?.checkpoint || '';
  };
  
  const checkpoint = getSelectedCheckpoint();

  // Function to handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Function to handle play/pause click
  const handlePlayPause = () => {
    if (!nodeData?.id) return;
    
    const newPausedState = !isPaused;
    setLocalIsPaused(newPausedState);
    
    // Call the API to update the paused state
    botPauseMutation.mutate({
      id: `${nodeId}`,
      paused: newPausedState
    });
    
    console.log(`Toggle pause state for node ${nodeData?.id} to ${newPausedState}`);
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
    
    // Copy to clipboard
    navigator.clipboard.writeText(checkpoint)
      .then(() => {
        console.log('Checkpoint copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy checkpoint:', err);
      });
  };
  
  // Function to handle change checkpoint
  const handleChangeCheckpoint = () => {
    setIsChangeCheckpointOpen(true);
  };
  
  // Function to handle view in workflow
  const handleViewInWorkflow = () => {
    // Close this dialog and update graph state to focus on the node
    if (onClose) {
      onClose();
    }
    
    // Update graph state to focus on this node and center the graph
    updateGraphState({ 
      focusNode: nodeId,
      offset: [0, 0] // Center the graph around the node
    });
  };
  
  // Function to handle navigate to parent
  const handleNavigateToParent = (parentNodeId: string) => {
    // Close current dialog and open parent node settings
    if (onClose) {
      onClose();
    }
    
    // Small delay to ensure current dialog is closed
    setTimeout(() => {
      openNodeSettingsDialog(parentNodeId);
    }, 100);
  };
  
  // Function to handle navigate to child
  const handleNavigateToChild = (childNodeId: string) => {
    // Close current dialog and open child node settings
    if (onClose) {
      onClose();
    }
    
    // Small delay to ensure current dialog is closed
    setTimeout(() => {
      openNodeSettingsDialog(childNodeId);
    }, 100);
  };
  
  // Function to handle checkpoint submission
  const handleSubmitCheckpoint = () => {
    if (!newCheckpoint) return;
    
    setLocalCheckpoint(newCheckpoint);
    setIsChangeCheckpointOpen(false);
    
    // In a real implementation, call an API to update the checkpoint
    console.log(`Update checkpoint to: ${newCheckpoint}`);
  };
  
  // Function to handle queue selection for checkpoint display
  const handleQueueSelect = (queueId: string) => {
    setSelectedQueueId(queueId);
  };
  
  return (
    <header className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
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
              <div style={{ transform: 'rotate(90deg)' }}>
                <GitFork size={26} />
              </div>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{nodeFullId}</span>
            
            {/* AWS Lambda link for bot nodes */}
            {nodeType === 'bot' && (
              <a 
                href={`https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/${nodeData.lambdaName}?tab=configure`}
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
                  <Badge className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-0">
                    {parentNodes.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {parentNodes.map(parentId => (
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
                {childNodes.map(childId => (
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
        {/* Play/Pause button - More prominent now */}
        <Button
          variant={isPaused ? "outline" : "primary"}
          size="sm"
          className={`px-3 py-1 flex items-center gap-1 ${
            isPaused 
              ? "border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-gray-800" 
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
          onClick={handlePlayPause}
          title={isPaused ? "Resume" : "Pause"}
          disabled={botPauseMutation.isPending}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          <span>{isPaused ? "Resume" : "Pause"}</span>
          {botPauseMutation.isPending && <span className="ml-1 animate-spin">⟳</span>}
        </Button>
        
        
        {/* Queue selector dropdown for multiple read queues - Now a compact icon-only button */}
        {readQueueIds.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                data-dropdown="queue-selector"
                variant="outline" 
                size="sm" 
                className="rounded-r-none h-8 px-2 flex items-center gap-1"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  // Prevent event from bubbling up to parent elements
                  e.stopPropagation();
                }}
              >
                <Database size={14} className="text-blue-500" />
                <Badge 
                  variant="secondary" 
                  className="h-4 px-1 text-xs flex items-center justify-center"
                >
                  {readQueueIds.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-[300px] max-h-[400px] overflow-y-auto"
            >
              <div className="px-2 py-1 text-xs text-muted-foreground font-semibold">Select Queue</div>
              <div className="h-px bg-muted my-1"></div>
              {readQueueIds.map(queueId => {
                // Format queue name for display
                const displayName = queueId.split(':').pop() || queueId;
                const isSelected = selectedQueueId === queueId;
                return (
                  <DropdownMenuItem 
                    key={queueId}
                    onClick={() => handleQueueSelect(queueId)}
                    className={`${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""} py-2`}
                  >
                    <div className="flex flex-col w-full">
                      <div className="flex items-center">
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>}
                        <span className={`font-medium ${isSelected ? "text-blue-600 dark:text-blue-400" : ""}`}>
                          {displayName}
                        </span>
                      </div>
                      {displayName !== queueId && (
                        <span className="text-xs text-muted-foreground font-mono ml-3">{queueId}</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Checkpoint display */}
        <div className="flex items-center">
          {/* Wider checkpoint display */}
          <div className="min-w-[320px] max-w-[320px] overflow-x-auto bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-l-md text-sm font-mono">
            {checkpoint || 'No checkpoint'}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                data-dropdown="checkpoint-actions"
                variant="ghost" 
                className="h-8 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2 py-1 rounded-r-md border-l border-gray-300 dark:border-gray-600"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  // Prevent event from bubbling up to parent elements
                  e.stopPropagation();
                }}
              >
                <div className="flex items-center">
                  <Settings size={14} />
                  <ChevronDown size={14} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyCheckpoint}>
                Copy Checkpoint
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleChangeCheckpoint}>
                Change Checkpoint
              </DropdownMenuItem>
              <div className="h-px bg-muted my-1"></div>
              <DropdownMenuItem onClick={handleForceRun}>
                Force Run
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="rounded-full"
          title="Close"
        >
          <X size={20} />
        </Button>
      </div>
      
      {/* Checkpoint change dialog */}
      {isChangeCheckpointOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-[480px] shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Change Checkpoint</h3>
            <Input
              value={newCheckpoint}
              onChange={(e) => setNewCheckpoint(e.target.value)}
              placeholder="Enter new checkpoint"
              className="mb-4 font-mono"
            />
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsChangeCheckpointOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCheckpoint}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 