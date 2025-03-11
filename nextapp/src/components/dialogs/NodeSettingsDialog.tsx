"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NodeSettingsDialogHeader from './NodeSettingsDialogHeader';
import { FullScreenModal } from '@/components/ui/fullscreen-modal';
import { useDialogContext } from '@/hooks/useDialogContext';
import BotDashboardTab from './tabs/BotDashboardTab';
import BotCodeTab from './tabs/BotCodeTab';
import BotSettingsTab from './tabs/BotSettingsTab';
import BotTriggersTab from './tabs/BotTriggersTab';
import QueueDashboardTab from './tabs/QueueDashboardTab';
import QueueEventsTab from './tabs/QueueEventsTab';
import QueueSettingsTab from './tabs/QueueSettingsTab';
import SystemDashboardTab from './tabs/SystemDashboardTab';
import SystemEventsTab from './tabs/SystemEventsTab';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import BotLogsTab from './tabs/BotLogsTab';
import { useToast } from '../ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useBotDetails, useQueueDetails, useSystemDetails } from '@/context/ApiContext';
import { NodeData } from '@/types/node';
import { awsNativeFetch } from '@/lib/authUtils';

// Time period options for stats
type TimePeriod = '15m' | '1hr' | '6hr' | '1d' | '1w' | 'custom';
interface TimePeriodConfig {
  range: 'minute' | 'hour' | 'day' | 'week';
  count: number;
}

// Map time period labels to API parameters
const TIME_PERIOD_CONFIGS: Record<TimePeriod, TimePeriodConfig> = {
  '15m': { range: 'minute', count: 15 },
  '1hr': { range: 'hour', count: 1 },
  '6hr': { range: 'hour', count: 6 },
  '1d': { range: 'day', count: 1 },
  '1w': { range: 'week', count: 1 },
  'custom': { range: 'minute', count: 15 } // Default, will be overridden
};

// Utility functions for calculating stats - moved here to avoid temporal dead zone
const calculateTotalExecutions = (timeSeries: any[] = []) => {
  if (!timeSeries || !Array.isArray(timeSeries)) return 0;
  
  return timeSeries.reduce((total, point) => {
    return total + (point.value || 0);
  }, 0);
};

const calculateAverageDuration = (timeSeries: any[] = [], executionTimeSeries: any[] = []) => {
  if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) return 0;
  
  // Calculate total duration from all points
  const totalDuration = timeSeries.reduce((sum, point) => {
    // Check if point has a total property (total duration), otherwise use value * 1
    return sum + (point.total || point.value || 0);
  }, 0);
  
  // Get total number of executions
  const totalExecutions = calculateTotalExecutions(executionTimeSeries);
  
  // If no executions, avoid division by zero
  if (totalExecutions === 0) return 0;
  
  // Return average duration per execution
  return Math.round(totalDuration / totalExecutions);
};

const calculateMaxDuration = (timeSeries: any[] = []) => {
  if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) return 0;
  
  return Math.max(...timeSeries.map(point => point.value || 0));
};

export interface NodeSettingsDialogProps {
  nodeId?: string;
}

// Custom Time Period Dialog Component
function CustomTimePeriodDialog({ 
  isOpen, 
  onClose, 
  customTimePeriod,
  setCustomTimePeriod,
  onApply 
}: { 
  isOpen: boolean;
  onClose: () => void;
  customTimePeriod: TimePeriodConfig;
  setCustomTimePeriod: React.Dispatch<React.SetStateAction<TimePeriodConfig>>;
  onApply: (config: TimePeriodConfig) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Custom Time Period</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Interval</Label>
            <Select 
              value={customTimePeriod.range}
              onValueChange={(value) => setCustomTimePeriod({
                ...customTimePeriod,
                range: value as 'minute' | 'hour' | 'day' | 'week'
              })}
            >
              <SelectTrigger id="interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minute">Minutes</SelectItem>
                <SelectItem value="hour">Hours</SelectItem>
                <SelectItem value="day">Days</SelectItem>
                <SelectItem value="week">Weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="count">Count</Label>
            <Input
              id="count"
              type="number"
              value={customTimePeriod.count}
              onChange={(e) => setCustomTimePeriod({
                ...customTimePeriod,
                count: parseInt(e.target.value) || 1
              })}
              min="1"
              max="1000"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => {
              onApply(customTimePeriod);
              onClose();
            }}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NodeSettingsDialog({ nodeId }: NodeSettingsDialogProps) {
  const { dialogData, closeDialog, isOpen } = useDialogContext() || {};
  const [activeTab, setActiveTab] = useState("dashboard");
  const { addToast } = useToast();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('15m');
  const [customTimePeriod, setCustomTimePeriod] = useState<TimePeriodConfig>({ range: 'minute', count: 15 });
  const [showCustomPeriodDialog, setShowCustomPeriodDialog] = useState(false);
  
  // Track whether this is an initial load or just a time period refresh
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Determine current time period config
  const currentTimePeriodConfig = timePeriod === 'custom' ? customTimePeriod : TIME_PERIOD_CONFIGS[timePeriod];
  
  // Extract the node ID from the dialog data or props
  const currentNodeId = nodeId || dialogData?.nodeId;
  
  // Determine if the dialog should be showr
  const shouldShow = isOpen && currentNodeId;
  
  // Determine the type of node
  const nodeType = currentNodeId?.split(':')[0] || '';
  
  // Get timestamp for API calls
  const timestamp = new Date().toISOString();
  
  // Get the appropriate data based on node type
  const {
    data: botDetails,
    isLoading: isBotLoading,
    isError: isBotError,
    error: botError
  } = useBotDetails(nodeType === 'bot' ? currentNodeId : '');
  
  const {
    data: queueDetails,
    isLoading: isQueueLoading,
    isError: isQueueError,
    error: queueError
  } = useQueueDetails(nodeType === 'queue' ? currentNodeId : '');
  
  const {
    data: systemDetails,
    isLoading: isSystemLoading,
    isError: isSystemError,
    error: systemError
  } = useSystemDetails(nodeType === 'system' ? currentNodeId : '');
  
  // Add detailed logging for debugging
  useEffect(() => {
    if (currentNodeId) {
      console.log('[NodeSettingsDialog] Current node ID:', currentNodeId);
      console.log('[NodeSettingsDialog] Should show dialog:', shouldShow);
    }
  }, [currentNodeId, shouldShow]);
  
  // Log node details when they change
  useEffect(() => {
    const details = botDetails || queueDetails || systemDetails;
    if (details) {
      console.log(`[NodeSettingsDialog] ${nodeType} details loaded:`, details);
      console.log(`[NodeSettingsDialog] ${nodeType} details has link_to:`, !!details.link_to);
      
      if (details.link_to) {
        console.log(`[NodeSettingsDialog] ${nodeType} parent nodes:`, details.link_to.parent || []);
        console.log(`[NodeSettingsDialog] ${nodeType} child nodes:`, details.link_to.children || []);
      } else {
        console.log(`[NodeSettingsDialog] No link_to data found in ${nodeType} details`);
        
        // For bots, check if we need to fetch additional data
        if (nodeType === 'bot') {
          console.log('[NodeSettingsDialog] Bot details structure:', Object.keys(details));
          // Check if there's any relationship data in a different location
          if (details.parent_nodes) {
            console.log('[NodeSettingsDialog] Found parent_nodes in bot details:', details.parent_nodes);
          }
          if (details.child_nodes) {
            console.log('[NodeSettingsDialog] Found child_nodes in bot details:', details.child_nodes);
          }
        }
      }
    }
  }, [botDetails, queueDetails, systemDetails, nodeType]);
  
  // For dashboard data, we'll use a direct fetch instead of the hook
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isDashboardError, setIsDashboardError] = useState(false);
  const [dashboardError, setDashboardError] = useState<Error | null>(null);
  
  // Log dashboard data when it changes
  useEffect(() => {
    if (dashboardData) {
      console.log('[NodeSettingsDialog] Dashboard data loaded');
      
      // Check if the dashboard data has nodes information
      if (dashboardData.nodes && dashboardData.nodes[currentNodeId]) {
        const nodeStats = dashboardData.nodes[currentNodeId];
        console.log('[NodeSettingsDialog] Found node in dashboard data:', nodeStats);
        
        if (nodeStats.link_to) {
          console.log('[NodeSettingsDialog] Dashboard data has link_to for this node:', nodeStats.link_to);
        } else {
          console.log('[NodeSettingsDialog] Dashboard data does not have link_to for this node');
        }
      } else {
        console.log('[NodeSettingsDialog] Node not found in dashboard data nodes');
      }
    }
  }, [dashboardData, currentNodeId]);
  
  // Function to fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    if (!currentNodeId) return;
    
    // Only set loading state on initial load, not on time period refresh
    if (!isRefresh) {
      setIsDashboardLoading(true);
    }
    
    setIsDashboardError(false);
    setDashboardError(null);
    
    try {
      // Build the URL with the format shown in the example
      // Example: /api/dashboard/bot:BURLEYB_botWriteSavedTracks?range=minute&count=15&timestamp=...
      const apiUrl = `/api/dashboard/${currentNodeId}?range=${currentTimePeriodConfig.range}&count=${currentTimePeriodConfig.count}&timestamp=${encodeURIComponent(timestamp)}`;
      
      const response = await awsNativeFetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsDashboardError(true);
      setDashboardError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsDashboardLoading(false);
      // If this was an initial load, mark it as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  };
  
  // Fetch dashboard data when component mounts or time period changes
  useEffect(() => {
    if (shouldShow && currentNodeId) {
      // If dialog first opens or node changes, do a full load
      if (isInitialLoad) {
        fetchDashboardData(false);
      } else {
        // If just the time period changed, do a quiet refresh
        fetchDashboardData(true);
      }
    }
  }, [shouldShow, currentNodeId, timePeriod, customTimePeriod]);
  
  // Reset initial load state when dialog closes or node changes
  useEffect(() => {
    if (!shouldShow || !currentNodeId) {
      setIsInitialLoad(true);
    }
  }, [shouldShow, currentNodeId]);
  
  // Function to manually refetch dashboard data
  const refetchDashboard = () => {
    fetchDashboardData(true);
  };
  
  // Combine all loading states, but only include dashboard loading for initial loads
  const isLoading = isBotLoading || isQueueLoading || isSystemLoading || (isInitialLoad && isDashboardLoading);
  
  // Combine error states
  const hasError = isBotError || isQueueError || isSystemError || isDashboardError;
  
  // Calculate processed node data based on node type
  const nodeData: NodeData | null = React.useMemo(() => {
    if (!currentNodeId) return null;
    
    console.log(`[NodeSettingsDialog] Building nodeData for ${nodeType} with ID ${currentNodeId}`);
    
    // Base node data common to all types
    const baseData = {
      id: currentNodeId,
      name: currentNodeId.split(':').pop() || currentNodeId,
      type: (nodeType === 'bot' ? 'bot' : (nodeType === 'queue' ? 'queue' : nodeType === 'system' ? 'system' : 'unknown')) as NodeData['type'],
      status: 'UNKNOWN' as NodeData['status'],
      // Initialize with empty arrays
      parentNodes: [] as string[],
      childNodes: [] as string[]
    } as NodeData;
    
    // Get detailed node data based on type
    let detailedData = {};
    if (nodeType === 'bot' && botDetails) {
      console.log(`[NodeSettingsDialog] Processing bot details:`, botDetails);
      detailedData = {
        ...botDetails,
        status: botDetails.paused ? 'PAUSED' : 'RUNNING'
      };
    } else if (nodeType === 'queue' && queueDetails) {
      console.log(`[NodeSettingsDialog] Processing queue details:`, queueDetails);
      detailedData = {
        ...queueDetails,
        status: 'ACTIVE' // Default for queues
      };
    } else if (nodeType === 'system' && systemDetails) {
      console.log(`[NodeSettingsDialog] Processing system details:`, systemDetails);
      detailedData = {
        ...systemDetails,
        status: 'ACTIVE' // Default for systems
      };
    }
    
    // Update parentNodes and childNodes from detailedData if available
    if (detailedData && (detailedData as any).link_to) {
      console.log(`[NodeSettingsDialog] Found link_to data in ${nodeType} details:`, (detailedData as any).link_to);
      baseData.parentNodes = (detailedData as any).link_to.parent || [];
      baseData.childNodes = (detailedData as any).link_to.children || [];
    } 
    // For bots, try multiple fallback mechanisms to get relationship data
    else if (nodeType === 'bot') {
      console.log(`[NodeSettingsDialog] No link_to data found in bot details, checking alternatives`);
      
      // Try to find relationship data in different properties of bot details
      if (botDetails) {
        
        // Check for relationships in queues
        if (botDetails.checkpoints) {
          console.log(`[NodeSettingsDialog] Checking bot checkpoints for relationship data:`, botDetails.checkpoints);
          
          // Extract parent nodes from read queues
          if (botDetails.checkpoints.read) {
            const readQueueIds = Object.keys(botDetails.checkpoints.read);
            if (readQueueIds.length > 0) {
              console.log(`[NodeSettingsDialog] Found read queues that could be parent nodes:`, readQueueIds);
              // Add read queues as parent nodes if not already included
              readQueueIds.forEach(queueId => {
                if (!baseData.parentNodes.includes(queueId)) {
                  baseData.parentNodes.push(queueId);
                }
              });
            }
          }
          
          // Extract child nodes from write queues
          if (botDetails.checkpoints.write) {
            const writeQueueIds = Object.keys(botDetails.checkpoints.write);
            if (writeQueueIds.length > 0) {
              console.log(`[NodeSettingsDialog] Found write queues that could be child nodes:`, writeQueueIds);
              // Add write queues as child nodes if not already included
              writeQueueIds.forEach(queueId => {
                if (!baseData.childNodes.includes(queueId)) {
                  baseData.childNodes.push(queueId);
                }
              });
            }
          }
        }
      }
      
      // Try to get relationship data from dashboard data as a last resort
      if (dashboardData && dashboardData.nodes) {
        // Try to find the node in the dashboard data
        const nodeStats = dashboardData.nodes[currentNodeId];
        if (nodeStats) {
          console.log(`[NodeSettingsDialog] Found node in dashboard data:`, nodeStats);
          
          if (nodeStats.link_to) {
            console.log(`[NodeSettingsDialog] Found link_to data for bot in dashboard data:`, nodeStats.link_to);
            
            // Only add parent nodes if we haven't found any yet
            if (baseData.parentNodes.length === 0 && nodeStats.link_to.parent) {
              baseData.parentNodes = nodeStats.link_to.parent;
            }
            
            // Only add child nodes if we haven't found any yet
            if (baseData.childNodes.length === 0 && nodeStats.link_to.children) {
              baseData.childNodes = nodeStats.link_to.children;
            }
          }
          
          // Check for other relationship properties in dashboard data
          if (nodeStats.parent_nodes && baseData.parentNodes.length === 0) {
            console.log(`[NodeSettingsDialog] Found parent_nodes in dashboard data:`, nodeStats.parent_nodes);
            baseData.parentNodes = Array.isArray(nodeStats.parent_nodes) ? nodeStats.parent_nodes : [nodeStats.parent_nodes];
          }
          
          if (nodeStats.child_nodes && baseData.childNodes.length === 0) {
            console.log(`[NodeSettingsDialog] Found child_nodes in dashboard data:`, nodeStats.child_nodes);
            baseData.childNodes = Array.isArray(nodeStats.child_nodes) ? nodeStats.child_nodes : [nodeStats.child_nodes];
          }
        } else {
          console.log(`[NodeSettingsDialog] Node not found in dashboard data nodes`);
        }
      }
      
      // Check if we found any relationships
      console.log(`[NodeSettingsDialog] Final parent nodes for ${currentNodeId}:`, baseData.parentNodes);
      console.log(`[NodeSettingsDialog] Final child nodes for ${currentNodeId}:`, baseData.childNodes);
    }
    
    // Add dashboard stats if available
    let statsData = {};
    if (dashboardData) {
      statsData = {
        stats: {
          executions: calculateTotalExecutions(dashboardData.executions),
          errors: calculateTotalExecutions(dashboardData.errors),
          avgDuration: calculateAverageDuration(dashboardData.duration, dashboardData.executions),
          maxDuration: calculateMaxDuration(dashboardData.duration),
          lastRun: dashboardData.executions?.[0]?.time || null,
          errorRate: dashboardData.executions && dashboardData.executions.length > 0 && dashboardData.errors
            ? Math.round((calculateTotalExecutions(dashboardData.errors) / calculateTotalExecutions(dashboardData.executions)) * 100)
            : 0
        },
        // Include raw dashboard data for components that need it
        ...dashboardData
      };
    }
    
    // Combine all data
    return {
      ...baseData,
      ...detailedData,
      ...statsData
    };
  }, [currentNodeId, nodeType, botDetails, queueDetails, systemDetails, dashboardData]);
  
  // Log the final nodeData object
  useEffect(() => {
    if (nodeData) {
      console.log('[NodeSettingsDialog] Final nodeData object:', {
        id: nodeData.id,
        type: nodeData.type,
        parentNodes: nodeData.parentNodes,
        childNodes: nodeData.childNodes
      });
      
      // Check if navigation buttons should be visible
      const hasParentNodes = Array.isArray(nodeData.parentNodes) && nodeData.parentNodes.length > 0;
      const hasChildNodes = Array.isArray(nodeData.childNodes) && nodeData.childNodes.length > 0;
      
      console.log('[NodeSettingsDialog] Navigation visibility:', {
        hasParentNodes,
        hasChildNodes,
        parentNodesCount: hasParentNodes ? nodeData.parentNodes.length : 0,
        childNodesCount: hasChildNodes ? nodeData.childNodes.length : 0
      });
    }
  }, [nodeData]);
  
  // Handle time period change
  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    
    if (period !== 'custom') {
      // If a standard time period is selected, refetch the dashboard data quietly
      setTimeout(() => fetchDashboardData(true), 0);
    } else {
      // If custom is selected, show the custom dialog
      setShowCustomPeriodDialog(true);
    }
  };
  
  // Function to apply custom time period
  const applyCustomTimePeriod = (config: TimePeriodConfig) => {
    setCustomTimePeriod(config);
    setTimePeriod('custom');
    // Refetch data with new time period - use setTimeout to ensure state is updated first
    // Do a quiet refresh without showing loading state
    setTimeout(() => fetchDashboardData(true), 0);
  };
  
  // Function to handle dialog close
  const handleClose = () => {
    if (closeDialog) {
      closeDialog();
    }
  };
  
  // Show error toast if there's an API error
  useEffect(() => {
    if (hasError) {
      const errorMessage = botError || queueError || systemError || dashboardError;
      addToast({
        title: "Error",
        description: `Failed to fetch node data: ${errorMessage?.message || 'Unknown error'}`,
        type: "error"
      });
    }
  }, [hasError, botError, queueError, systemError, dashboardError, addToast]);
  
  if (!currentNodeId || !shouldShow) return null;
  
  return (
    <>
      <FullScreenModal isOpen={!!shouldShow} onClose={handleClose}>
        <NodeSettingsDialogHeader 
          nodeData={nodeData || { 
            id: currentNodeId, 
            name: currentNodeId.split(':').pop() || currentNodeId, 
            type: (nodeType === 'bot' ? 'bot' : (nodeType === 'queue' ? 'queue' : nodeType === 'system' ? 'system' : 'unknown')) as NodeData['type'], 
            status: 'UNKNOWN' as NodeData['status'],
            parentNodes: [] as string[],
            childNodes: [] as string[]
          }} 
          onClose={handleClose}
          timePeriod={timePeriod}
          onTimePeriodChange={handleTimePeriodChange}
          onCustomPeriodClick={() => setShowCustomPeriodDialog(true)}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2">
                    Dashboard
                  </TabsTrigger>
                  
                  {nodeType === 'bot' && (
                    <TabsTrigger value="code" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2">
                      Code
                    </TabsTrigger>
                  )}
                  
                  {nodeType === 'bot' && (
                    <TabsTrigger value="logs" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2">
                      Logs
                    </TabsTrigger>
                  )}
                  
                  {(nodeType === 'queue' || nodeType === 'system') && (
                    <TabsTrigger value="events" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2">
                      Events
                    </TabsTrigger>
                  )}
                  
                  <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none rounded-none px-4 py-2">
                    Settings
                  </TabsTrigger>
                  
                </TabsList>
                
                {/* Time Period Selector - Right aligned */}
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500 mr-2">Time Period:</span>
                  {(['15m', '1hr', '6hr', '1d', '1w'] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      className={`px-3 py-1 text-xs rounded-md ${
                        timePeriod === period 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleTimePeriodChange(period)}
                    >
                      {period}
                    </button>
                  ))}
                  <button
                    className={`px-3 py-1 text-xs rounded-md ${
                      timePeriod === 'custom' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleTimePeriodChange('custom')}
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-2 text-gray-500">Loading...</p>
                  </div>
                </div>
              ) : (
                <>
                  <TabsContent value="dashboard" className="mt-0 h-full overflow-y-auto">
                    {nodeType === 'bot' && <BotDashboardTab nodeData={nodeData} timePeriod={timePeriod} />}
                    {nodeType === 'queue' && <QueueDashboardTab nodeData={nodeData} timePeriod={timePeriod} />}
                    {nodeType === 'system' && <SystemDashboardTab nodeData={nodeData} timePeriod={timePeriod} />}
                  </TabsContent>
                  
                  {nodeType === 'bot' && (
                    <TabsContent value="code" className="mt-0 h-full overflow-y-auto">
                      <BotCodeTab nodeData={nodeData} />
                    </TabsContent>
                  )}
                  
                  {nodeType === 'bot' && (
                    <TabsContent value="logs" className="mt-0 h-full overflow-y-auto">
                      <BotLogsTab nodeData={nodeData} />
                    </TabsContent>
                  )}
                  
                  {(nodeType === 'queue' || nodeType === 'system') && (
                    <TabsContent value="events" className="mt-0 h-full overflow-y-auto">
                      {nodeType === 'queue' && <QueueEventsTab nodeData={nodeData} />}
                      {nodeType === 'system' && <SystemEventsTab nodeData={nodeData} />}
                    </TabsContent>
                  )}
                  
                  <TabsContent value="settings" className="mt-0 h-full overflow-y-auto">
                    {nodeType === 'bot' && <BotSettingsTab nodeData={nodeData} />}
                    {nodeType === 'queue' && <QueueSettingsTab nodeData={nodeData} />}
                    {nodeType === 'system' && <SystemSettingsTab nodeData={nodeData} />}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </FullScreenModal>
      
      {/* Custom time period dialog */}
      <CustomTimePeriodDialog
        isOpen={showCustomPeriodDialog}
        onClose={() => setShowCustomPeriodDialog(false)}
        customTimePeriod={customTimePeriod}
        setCustomTimePeriod={setCustomTimePeriod}
        onApply={applyCustomTimePeriod}
      />
    </>
  );
} 