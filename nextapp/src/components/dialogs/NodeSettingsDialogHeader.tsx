"use client";

import React, { useState, useId } from 'react';
import { X, Pause, Play, ChevronLeft, ChevronRight, GitFork, Settings, ChevronDown, Database, AlertTriangle, Calendar } from 'lucide-react';
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
import { useBotPause, useBotCheckpoint, useBotForceRun } from '@/context/ApiContext';
import { useWorkflowGraph } from '@/hooks/useWorkflowGraph';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/toast';

// Time period type
type TimePeriod = '15m' | '1hr' | '6hr' | '1d' | '1w' | 'custom';

// Define the type for checkpoint actions
type CheckpointAction = 'now' | 'beginning' | 'date' | 'custom';

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

// Enhanced CheckpointActionsDropdown component
const CheckpointActionsDropdown = ({
  onCopyCheckpoint,
  onChangeCheckpoint,
  onForceRun
}: {
  onCopyCheckpoint: () => void;
  onChangeCheckpoint: () => void;
  onForceRun: () => void;
}) => {
  // Create a unique ID for this dropdown instance
  const dropdownId = useId();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2 py-1 rounded-r-md border-l border-gray-300 dark:border-gray-600"
          aria-label="Checkpoint actions"
          data-dropdown-id={dropdownId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center">
            <Settings size={14} />
            <ChevronDown size={14} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onCopyCheckpoint}>
          Copy Checkpoint
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChangeCheckpoint}>
          Change Checkpoint
        </DropdownMenuItem>
        <div className="h-px bg-muted my-1"></div>
        <DropdownMenuItem onClick={onForceRun}>
          Force Run
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Enhanced QueueSelectorDropdown component
const QueueSelectorDropdown = ({ 
  readQueueIds, 
  readQueues, 
  selectedQueueId, 
  onQueueSelect 
}: { 
  readQueueIds: string[];
  readQueues: Record<string, any>; 
  selectedQueueId: string;
  onQueueSelect: (queueId: string) => void;
}) => {
  // Create a unique ID for this dropdown instance
  const dropdownId = useId();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-r-none h-8 px-2 flex items-center gap-1"
          aria-label="Queue selector"
          data-dropdown-id={dropdownId}
          onClick={(e) => e.stopPropagation()}
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
        className="min-w-[400px] max-w-[500px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
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
              onClick={() => onQueueSelect(queueId)}
              className={`${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""} py-2`}
            >
              <div className="flex flex-col w-full">
                <div className="flex items-center">
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>}
                  <span className={`font-medium ${isSelected ? "text-blue-600 dark:text-blue-400" : ""} truncate max-w-[450px]`}>
                    {displayName}
                  </span>
                </div>
                {displayName !== queueId && (
                  <span className="text-xs text-muted-foreground font-mono ml-3 truncate max-w-[450px]">{queueId}</span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Helper function to generate EID timestamp in checkpoint format
const generateEidCheckpoint = (date?: Date): string => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const timestamp = now.getTime();
  
  return `z/${year}/${month}/${day}/${hour}/${minute}/${second}/`;
};

// Add validation helper function for EID checkpoint format
const isValidCheckpointFormat = (checkpoint: string): boolean => {
  // Basic validation for checkpoint format
  // Must start with z/ and follow the expected pattern
  const basicPattern = /^z\/(\d{4}\/)?(\d{2}\/)?(\d{2}\/)?(\d{2}\/)?(\d{2}\/)?(\d{2}\/)?(\d+-\d+)?$/;
  return basicPattern.test(checkpoint) || checkpoint === 'z/';
};

// Add function to check if a checkpoint is in the future
const isCheckpointInFuture = (checkpoint: string): boolean => {
  if (checkpoint === 'z/') return false;
  
  // Extract date parts from the checkpoint
  const parts = checkpoint.split('/').filter(Boolean);
  if (parts.length < 2) return false; // Not enough parts to determine date
  
  // Extract year, month, day, etc.
  const year = parseInt(parts[1], 10);
  const month = parts.length > 2 ? parseInt(parts[2], 10) - 1 : 0; // JS months are 0-indexed
  const day = parts.length > 3 ? parseInt(parts[3], 10) : 1;
  const hour = parts.length > 4 ? parseInt(parts[4], 10) : 0;
  const minute = parts.length > 5 ? parseInt(parts[5], 10) : 0;
  const second = parts.length > 6 ? parseInt(parts[6], 10) : 0;
  
  // Create date from checkpoint parts
  const checkpointDate = new Date(year, month, day, hour, minute, second);
  const now = new Date();
  
  // Compare with current time
  return checkpointDate > now;
};

export default function NodeSettingsDialogHeader({ 
  nodeData, 
  onClose,
  timePeriod = '15m',
  onTimePeriodChange,
  onCustomPeriodClick
}: NodeSettingsDialogHeaderProps) {
  const { openNodeSettingsDialog } = useDialogs();
  const router = useRouter();
  const { addToast } = useToast();
  const [isChangeCheckpointOpen, setIsChangeCheckpointOpen] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const [localCheckpoint, setLocalCheckpoint] = useState<string>('');
  const [localIsPaused, setLocalIsPaused] = useState<boolean>(false);
  
  // State to track which read queue is selected for checkpoint display
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  
  // New state for checkpoint dialog
  const [selectedSourceQueueId, setSelectedSourceQueueId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<CheckpointAction>('now');
  const [customCheckpointValue, setCustomCheckpointValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isChangingCheckpoint, setIsChangingCheckpoint] = useState(false);
  
  // Use the API hooks for bot operations
  const botPauseMutation = useBotPause();
  const botCheckpointMutation = useBotCheckpoint();
  const botForceRunMutation = useBotForceRun();
  
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
    // Also set default source queue for checkpoint dialog
    if (!selectedSourceQueueId && readQueueIds.length > 0) {
      setSelectedSourceQueueId(readQueueIds[0]);
    }
  }, [readQueueIds, selectedQueueId, selectedSourceQueueId]);
  
  // Function to handle saving checkpoint - update to use API context
  const saveCheckpoint = async (queueId: string, checkpointValue: string) => {
    try {
      setIsChangingCheckpoint(true);
      
      const payload = {
        id: nodeId,
        checkpoint: {
          [queueId]: checkpointValue
        }
      };
      
      // Use the API mutation hook
      await botCheckpointMutation.mutateAsync(payload);
      
      // Update local state on success
      setLocalCheckpoint(checkpointValue);
      
      // Show success toast
      addToast({
        title: 'Checkpoint Updated',
        description: `Successfully updated checkpoint for queue ${queueId.split(':').pop() || queueId}`,
        type: 'success'
      });
      
      // Close the dialog after successful operation
      setIsChangeCheckpointOpen(false);
    } catch (error: any) {
      // Error is handled by the mutation hook
      console.error('Error in saveCheckpoint:', error);
      
      // Show error toast
      addToast({
        title: 'Checkpoint Update Failed',
        description: error?.message || 'Failed to update checkpoint. Please try again.',
        type: 'error'
      });
    } finally {
      setIsChangingCheckpoint(false);
    }
  };
  
  // Get the checkpoint from the selected read queue
  const getSelectedCheckpoint = () => {
    // If a local checkpoint has been set (e.g., via a recent save), prioritize it
    if (localCheckpoint) return localCheckpoint;
    
    if (!nodeData?.checkpoints?.read) return '';
    
    // Make sure we have a valid selected queue
    if (!selectedQueueId && readQueueIds.length > 0) {
      return readQueues[readQueueIds[0]]?.checkpoint || '';
    }
    
    // Return the checkpoint for the selected queue
    return selectedQueueId && readQueues[selectedQueueId] 
      ? readQueues[selectedQueueId].checkpoint || '' 
      : '';
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
    }, {
      onSuccess: () => {
        // Show success toast
        addToast({
          title: newPausedState ? 'Bot Paused' : 'Bot Resumed',
          description: `Successfully ${newPausedState ? 'paused' : 'resumed'} bot ${nodeData.name || nodeId}`,
          type: 'success'
        });
      },
      onError: (error: any) => {
        // Show error toast
        addToast({
          title: 'Action Failed',
          description: error?.message || `Failed to ${newPausedState ? 'pause' : 'resume'} bot. Please try again.`,
          type: 'error'
        });
        
        // Revert local state
        setLocalIsPaused(!newPausedState);
      }
    });
  };
  
  // Function to handle force run - update to use API context
  const handleForceRun = async () => {
    if (!nodeData?.id) return;
    
    try {
      // Use the API mutation hook
      await botForceRunMutation.mutateAsync({
        id: nodeId,
        executeNow: true
      });
      
      // Show success toast
      addToast({
        title: 'Force Run Initiated',
        description: `Successfully initiated force run for bot ${nodeData.name || nodeId}`,
        type: 'success'
      });
    } catch (error: any) {
      // Show error toast
      addToast({
        title: 'Force Run Failed',
        description: error?.message || 'Failed to initiate force run. Please try again.',
        type: 'error'
      });
      
      console.error('Error in handleForceRun:', error);
    }
  };
  
  // Function to handle change checkpoint
  const handleChangeCheckpoint = () => {
    // Reset form state
    setSelectedAction('now');
    setCustomCheckpointValue('');
    setSelectedDate(new Date());
    
    // If we have source queues, select the first one
    if (readQueueIds.length > 0) {
      setSelectedSourceQueueId(readQueueIds[0]);
    }
    
    // Open dialog
    setIsChangeCheckpointOpen(true);
  };
  
  // Function to handle checkpoint action submission
  const handleSubmitCheckpoint = async () => {
    if (!selectedSourceQueueId) return;
    
    let checkpointValue = '';
    
    switch (selectedAction) {
      case 'now':
        checkpointValue = generateEidCheckpoint();
        break;
      case 'beginning':
        checkpointValue = 'z/';
        break;
      case 'date':
        // Validate date is not in the future
        if (selectedDate > new Date()) {
          console.error('Cannot set checkpoint to a future date');
          return;
        }
        checkpointValue = generateEidCheckpoint(selectedDate);
        break;
      case 'custom':
        // Validate custom checkpoint format
        if (!isValidCheckpointFormat(customCheckpointValue)) {
          console.error('Invalid checkpoint format');
          return;
        }
        // Validate not in future
        if (isCheckpointInFuture(customCheckpointValue)) {
          console.error('Future checkpoints are not allowed');
          return;
        }
        checkpointValue = customCheckpointValue;
        break;
    }
    
    if (checkpointValue) {
      await saveCheckpoint(selectedSourceQueueId, checkpointValue);
    }
  };
  
  // Function to handle copy checkpoint
  const handleCopyCheckpoint = () => {
    if (!checkpoint) return;
    
    // Copy to clipboard
    navigator.clipboard.writeText(checkpoint)
      .then(() => {
        // Show success toast
        addToast({
          title: 'Checkpoint Copied',
          description: 'Checkpoint copied to clipboard',
          type: 'success',
          duration: 3000 // Shorter duration for copy action
        });
      })
      .catch(err => {
        console.error('Failed to copy checkpoint:', err);
        
        // Show error toast
        addToast({
          title: 'Copy Failed',
          description: 'Failed to copy checkpoint to clipboard',
          type: 'error'
        });
      });
  };
  
  // Function to handle view in workflow
  const handleViewInWorkflow = () => {
    // Close this dialog and update graph state to focus on the node
    if (onClose) {
      onClose();
    }
    
    // Update graph state to focus on this node
    updateGraphState({ focusNode: nodeId });
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
  
  // Function to handle queue selection for checkpoint display
  const handleQueueSelect = (queueId: string) => {
    // Clear any locally set checkpoint when changing queues
    setLocalCheckpoint('');
    // Set the selected queue ID
    setSelectedQueueId(queueId);
  };
  
  // Now add a visual indicator to show which queue is selected
  // in the checkpoint section
  const getSelectedQueueDisplayName = () => {
    if (!selectedQueueId || !readQueues[selectedQueueId]) return '';
    
    const queueId = selectedQueueId;
    return queueId.split(':').pop() || queueId;
  };

  const selectedQueueDisplayName = getSelectedQueueDisplayName();

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
        
        {/* Queue selector dropdown for multiple read queues */}
        {readQueueIds.length > 1 && (
          <QueueSelectorDropdown
            readQueueIds={readQueueIds}
            readQueues={readQueues}
            selectedQueueId={selectedQueueId}
            onQueueSelect={handleQueueSelect}
          />
        )}
        
        {/* Checkpoint display */}
        <div className="flex items-center">
          {/* Wider checkpoint display with queue indicator */}
          <div className="min-w-[320px] max-w-[320px] overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-l-md text-sm">
            {selectedQueueDisplayName && (
              <div className="px-3 py-0.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center">
                <Database size={12} className="text-blue-500 mr-1" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                  {selectedQueueDisplayName}
                </span>
              </div>
            )}
            <div className="px-3 py-1 font-mono overflow-x-auto">
              {checkpoint || 'No checkpoint'}
            </div>
          </div>
          
          <CheckpointActionsDropdown
            onCopyCheckpoint={handleCopyCheckpoint}
            onChangeCheckpoint={handleChangeCheckpoint}
            onForceRun={handleForceRun}
          />
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
      
      {/* New Checkpoint change dialog using a more basic approach */}
      {isChangeCheckpointOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-[500px] shadow-lg">
            {/* Dialog header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Change Checkpoint</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsChangeCheckpointOpen(false)} 
                className="h-6 w-6 p-0 rounded-full"
              >
                <X size={16} />
              </Button>
            </div>
            
            {/* Warning message */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This operation will change the checkpoint of the bot. Please be sure you know what you are doing.
                </p>
              </div>
            </div>
            
            {/* Source queue dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Source</label>
              <Select 
                value={selectedSourceQueueId} 
                onValueChange={setSelectedSourceQueueId}
                disabled={readQueueIds.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select queue" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  {readQueueIds.map(queueId => (
                    <SelectItem key={queueId} value={queueId}>
                      {queueId.split(':').pop() || queueId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Action dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Action</label>
              <Select 
                value={selectedAction} 
                onValueChange={(value) => {
                  setSelectedAction(value as CheckpointAction);
                  // Reset any validation errors when changing action
                  setCustomCheckpointValue('');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <SelectItem value="now">Starting From Now</SelectItem>
                  <SelectItem value="beginning">From the Beginning of Time</SelectItem>
                  <SelectItem value="date">Choose Date</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Conditional UI based on action */}
            {selectedAction === 'date' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Date and Time</label>
                <div className="flex items-center">
                  <input
                    type="datetime-local"
                    value={format(selectedDate, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      // Prevent future dates
                      if (date <= new Date()) {
                        setSelectedDate(date);
                      }
                    }}
                    max={format(new Date(), "yyyy-MM-dd'T'HH:mm")} // Set max to current date/time
                    className="border border-gray-300 dark:border-gray-700 rounded-md p-2 w-full"
                  />
                  <Calendar className="h-5 w-5 text-gray-500 ml-2" />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  EID Checkpoint: <span className="font-mono">{generateEidCheckpoint(selectedDate)}</span>
                </div>
              </div>
            )}
            
            {selectedAction === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Custom Checkpoint Value</label>
                <Input
                  value={customCheckpointValue}
                  onChange={(e) => setCustomCheckpointValue(e.target.value)}
                  placeholder="e.g. z/2025/03/08/21/53/24/"
                  className={`font-mono ${!isValidCheckpointFormat(customCheckpointValue) && customCheckpointValue ? 'border-red-500' : ''}`}
                />
                {customCheckpointValue && !isValidCheckpointFormat(customCheckpointValue) && (
                  <p className="mt-1 text-xs text-red-500">
                    Invalid checkpoint format. Must start with z/ followed by year/month/day/hour/minute/second/
                  </p>
                )}
                {customCheckpointValue && isValidCheckpointFormat(customCheckpointValue) && isCheckpointInFuture(customCheckpointValue) && (
                  <p className="mt-1 text-xs text-red-500">
                    Future checkpoints are not allowed.
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Format: z/year/month/day/hour/minute/second/ or z/year/month/day/hour/minute/second/timestamp-itemnumber
                </p>
              </div>
            )}
            
            {selectedAction === 'now' && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <p>This will set the checkpoint to the current time:</p>
                <p className="mt-1 font-mono">{generateEidCheckpoint()}</p>
              </div>
            )}
            
            {selectedAction === 'beginning' && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <p>This will reset the checkpoint to the beginning of time:</p>
                <p className="mt-1 font-mono">z/</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsChangeCheckpointOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitCheckpoint} 
                disabled={
                  isChangingCheckpoint || 
                  (selectedAction === 'custom' && (
                    !customCheckpointValue || 
                    !isValidCheckpointFormat(customCheckpointValue) || 
                    isCheckpointInFuture(customCheckpointValue)
                  ))
                }
              >
                {isChangingCheckpoint ? 'Saving...' : 'Save'}
                {isChangingCheckpoint && <span className="ml-1 animate-spin">⟳</span>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 