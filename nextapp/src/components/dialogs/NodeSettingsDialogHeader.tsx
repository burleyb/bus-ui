import React, { useState } from 'react';
import { PlayCircle, PauseCircle, Settings, Workflow, CopyCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import NodeIcon from '../node/NodeIcon';
import Link from 'next/link';
import { NodeData } from '@/types/nodes';
import { API } from '@/lib/api';
import { Dialog } from '../ui/Dialog'; 
import { Input } from '../ui/input';
import { useToast } from '../ui/toast';

interface NodeSettingsDialogHeaderProps {
  nodeData: NodeData;
  nodeId: string;
  nodeType: 'bot' | 'queue' | 'system' | 'unknown';
  onClose: () => void;
}

export const NodeSettingsDialogHeader: React.FC<NodeSettingsDialogHeaderProps> = ({ 
  nodeData, 
  nodeId, 
  nodeType,
  onClose
}) => {
  const [isPaused, setIsPaused] = useState(nodeData?.status === 'paused');
  const [isLoading, setIsLoading] = useState(false);
  const [checkpoint, setCheckpoint] = useState<string | null>(nodeData?.eid || 'Not set');
  const [isCheckpointDialogOpen, setIsCheckpointDialogOpen] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState('');
  const { addToast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Update checkpoint whenever nodeData changes
  React.useEffect(() => {
    if (nodeData && nodeType === 'bot') {
      setCheckpoint(nodeData?.checkpoints?.read[Object.keys(nodeData?.checkpoints.read)[0]]?.checkpoint || 'Not set');
    }
  }, [nodeData, nodeType]);
  
  const handleTogglePause = async () => {
    setIsLoading(true);
    try {
      const result = await API.toggleNodePause(nodeId, !isPaused);
      if (result && !result.error) {
        setIsPaused(!isPaused);
        addToast({
          title: `Node ${!isPaused ? 'paused' : 'resumed'}`,
          description: `The node has been ${!isPaused ? 'paused' : 'resumed'} successfully.`,
          type: 'success'
        });
      } else {
        addToast({
          title: 'Error',
          description: result?.error || 'Failed to update node status',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error toggling pause state:', error);
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForceRun = async () => {
    setIsLoading(true);
    try {
      const result = await API.executeNodeNow(nodeId);
      if (result && !result.error) {
        addToast({
          title: 'Node execution triggered',
          description: 'The node will execute now.',
          type: 'success'
        });
      } else {
        addToast({
          title: 'Error',
          description: result?.error || 'Failed to trigger node execution',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error forcing run:', error);
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyCheckpoint = () => {
    if (checkpoint) {
      navigator.clipboard.writeText(checkpoint);
      addToast({
        title: 'Checkpoint copied',
        description: 'Checkpoint ID copied to clipboard',
        type: 'success'
      });
    }
  };
  
  const handleChangeCheckpoint = () => {
    setIsCheckpointDialogOpen(true);
  };
  
  const submitCheckpointChange = async () => {
    setIsLoading(true);
    try {
      const result = await API.resetNodeCheckpoint(nodeId, newCheckpoint);
      if (result && !result.error) {
        setCheckpoint(newCheckpoint);
        addToast({
          title: 'Checkpoint updated',
          description: 'The checkpoint has been updated successfully.',
          type: 'success'
        });
        setIsCheckpointDialogOpen(false);
      } else {
        addToast({
          title: 'Error',
          description: result?.error || 'Failed to update checkpoint',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error changing checkpoint:', error);
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the workflow link based on node type
  const getWorkflowLink = () => {
    switch (nodeType) {
      case 'bot':
        return `/workflow/bot/${nodeId.replace('bot:', '')}`;
      case 'queue':
        return `/workflow/queue/${nodeId.replace('queue:', '')}`;
      case 'system':
        return `/workflow/system/${nodeId.replace('system:', '')}`;
      default:
        return '/workflow';
    }
  };
  
  return (
    <div className="flex justify-between items-center w-full px-2">
      {/* Left side - Node info and workflow link */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={onClose}
          className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft size={20} />
        </button>
        
        <NodeIcon node={nodeData} size={48} />
        
        <div className="flex flex-col">
          <h2 className="text-lg font-medium">
            {nodeData?.name || nodeId.split(':')[1] || nodeId}
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ID: {nodeId}
          </span>
        </div>
        
        <Link 
          href={getWorkflowLink()}
          className="ml-4 flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Workflow size={20} className="mr-1" />
        </Link>
      </div>
      
      {/* Right side - Controls */}
      {nodeType === 'bot' && (
        <div className="flex items-center space-x-4">
          {/* Checkpoint display */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Checkpoint:</span>
            <span className="text-sm font-mono truncate max-w-[180px]" title={checkpoint || ''}>
              {checkpoint || 'Loading...'}
            </span>
          </div>
          
          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePause}
            disabled={isLoading}
            className={`${isPaused ? 'text-green-600' : 'text-amber-600'}`}
          >
            {isPaused ? (
              <PlayCircle className="h-5 w-5" />
            ) : (
              <PauseCircle className="h-5 w-5" />
            )}
          </Button>
          
          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              isOpen={isDropdownOpen} 
              onClose={() => setIsDropdownOpen(false)}
              align="end"
            >
              <DropdownMenuItem onClick={handleChangeCheckpoint}>
                <Settings className="h-4 w-4 mr-2" />
                <span>Change Checkpoint</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyCheckpoint}>
                <CopyCheck className="h-4 w-4 mr-2" />
                <span>Copy Checkpoint</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleForceRun}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span>Force Run</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {/* Checkpoint Change Dialog */}
      <Dialog
        open={isCheckpointDialogOpen}
        onClose={() => setIsCheckpointDialogOpen(false)}
        title="Change Checkpoint"
        size="sm"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the new event ID to use as the checkpoint for this node.
          </p>
          
          <Input
            value={newCheckpoint}
            onChange={(e) => setNewCheckpoint(e.target.value)}
            placeholder="Enter event ID"
            className="w-full"
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCheckpointDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={submitCheckpointChange}
              disabled={isLoading || !newCheckpoint}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}; 