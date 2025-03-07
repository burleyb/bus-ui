"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
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
import { awsNativeFetch } from '@/lib/authUtils';
import { useToast } from '../ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [nodeData, setNodeData] = useState<any>(null);
  const { addToast } = useToast();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('15m');
  const [customTimePeriod, setCustomTimePeriod] = useState<TimePeriodConfig>({ range: 'minute', count: 15 });
  const [showCustomPeriodDialog, setShowCustomPeriodDialog] = useState(false);
  
  // Determine current time period config
  const currentTimePeriodConfig = timePeriod === 'custom' ? customTimePeriod : TIME_PERIOD_CONFIGS[timePeriod];
  
  // Extract the node ID from the dialog data or props
  const currentNodeId = nodeId || dialogData?.nodeId;
  
  // Determine if the dialog should be shown
  const shouldShow = isOpen && currentNodeId;
  
  // Determine the type of node
  const nodeType = currentNodeId?.split(':')[0] || '';
  
  // Function to extract bot ID from node ID
  const getBotIdFromNodeId = (nodeId: string) => {
    if (!nodeId) return '';
    const parts = nodeId.split(':');
    if (parts.length < 2) return nodeId;
    return parts[1];
  };
  
  // Function to fetch node data with the selected time period
  const fetchNodeData = () => {
    if (!shouldShow || !currentNodeId) return;
    
    setIsLoading(true);
    
    // If this is a bot node, get the bot data
    if (currentNodeId.startsWith('bot:')) {
      const botId = getBotIdFromNodeId(currentNodeId);
      
      // Get current timestamp for API call
      const timestamp = new Date().toISOString();
      
      // Prepare the API URL with the current time period
      const apiUrl = `/api/dashboard/bot:${botId}?range=${currentTimePeriodConfig.range}&count=${currentTimePeriodConfig.count}&timestamp=${encodeURIComponent(timestamp)}`;
      
      // Fetch bot data using the signed request method
      awsNativeFetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch bot data: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Bot data fetched:', data);
          
          // Process the data to match our component expectations
          const processedData = {
            id: currentNodeId,
            name: currentNodeId.split(':').pop() || currentNodeId,
            type: currentNodeId.includes('bot:') ? 'lambda' : 'queue',
            status: 'RUNNING', // Default status
            stats: {
              executions: calculateTotalExecutions(data.executions),
              errors: calculateTotalExecutions(data.errors),
              avgDuration: calculateAverageDuration(data.duration),
              maxDuration: calculateMaxDuration(data.duration),
              lastRun: data.executions?.[0]?.time || null,
              errorRate: data.executions && data.executions.length > 0 && data.errors
                ? Math.round((calculateTotalExecutions(data.errors) / calculateTotalExecutions(data.executions)) * 100)
                : 0
            },
            // Include all the raw data for components that need it
            ...data
          };
          
          setNodeData(processedData);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching bot data:', error);
          addToast({
            title: "Error",
            description: `Failed to fetch node data: ${error.message}`,
            variant: "destructive"
          });
          
          // Set basic data even on error
          setNodeData({
            id: currentNodeId,
            name: currentNodeId.split(':').pop() || currentNodeId,
            type: currentNodeId.includes('bot:') ? 'lambda' : 'queue',
            status: 'UNKNOWN',
            error: error.message
          });
          setIsLoading(false);
        });
    } else if (currentNodeId.startsWith('queue:')) {
      // Queue data handling
      setNodeData({
        id: currentNodeId,
        name: currentNodeId.split(':').pop() || currentNodeId,
        type: 'queue',
        status: 'ACTIVE'
      });
      setIsLoading(false);
    } else if (currentNodeId.startsWith('system:')) {
      // System data handling
      setNodeData({
        id: currentNodeId,
        name: currentNodeId.split(':').pop() || currentNodeId,
        type: 'system',
        status: 'ACTIVE'
      });
      setIsLoading(false);
    } else {
      // Generic fallback
      setNodeData({
        id: currentNodeId,
        name: currentNodeId.split(':').pop() || currentNodeId,
        type: 'unknown',
        status: 'UNKNOWN'
      });
      setIsLoading(false);
    }
  };
  
  // Fetch data when dialog opens or time period changes
  useEffect(() => {
    fetchNodeData();
  }, [shouldShow, currentNodeId, timePeriod, customTimePeriod]);
  
  // Calculate total executions
  const calculateTotalExecutions = (timeSeries: any[]) => {
    if (!timeSeries || !Array.isArray(timeSeries)) return 0;
    
    return timeSeries.reduce((total, point) => {
      return total + (point.value || 0);
    }, 0);
  };
  
  // Calculate average duration
  const calculateAverageDuration = (timeSeries: any[]) => {
    if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) return 0;
    
    const total = timeSeries.reduce((sum, point) => {
      return sum + (point.value || 0);
    }, 0);
    
    return Math.round(total / timeSeries.length);
  };
  
  // Calculate max duration
  const calculateMaxDuration = (timeSeries: any[]) => {
    if (!timeSeries || !Array.isArray(timeSeries) || timeSeries.length === 0) return 0;
    
    return Math.max(...timeSeries.map(point => point.value || 0));
  };
  
  // Function to handle time period change
  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    
    if (period !== 'custom') {
      // If a standard time period is selected, refetch the data
      fetchNodeData();
    } else {
      // If custom is selected, show the custom dialog
      setShowCustomPeriodDialog(true);
    }
  };
  
  // Function to apply custom time period
  const applyCustomTimePeriod = (config: TimePeriodConfig) => {
    setCustomTimePeriod(config);
    setTimePeriod('custom');
    // Refetch data with new time period
    fetchNodeData();
  };
  
  // Function to handle dialog close
  const handleClose = () => {
    if (closeDialog) {
      closeDialog();
    }
  };
  
  if (!currentNodeId || !shouldShow) return null;
  
  return (
    <>
      <FullScreenModal isOpen={!!shouldShow} onClose={handleClose}>
        <NodeSettingsDialogHeader nodeData={nodeData} onClose={handleClose} />
        
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
            
            <div className="flex-1 overflow-auto p-4">
              <TabsContent value="dashboard" className="mt-0 h-full">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : nodeType === 'bot' ? (
                  <BotDashboardTab 
                    nodeData={nodeData} 
                    timePeriod={timePeriod === 'custom' ? 'custom' : timePeriod}
                    onClose={closeDialog}
                  />
                ) : nodeType === 'queue' ? (
                  <QueueDashboardTab nodeData={nodeData} />
                ) : (
                  <SystemDashboardTab nodeData={nodeData} />
                )}
              </TabsContent>
              
              <TabsContent value="code" className="mt-0 h-full">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : nodeType === 'bot' ? (
                  <BotCodeTab nodeData={nodeData} />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Code tab is only available for bots</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0 h-full">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : nodeType === 'bot' ? (
                  <BotSettingsTab nodeData={nodeData} />
                ) : nodeType === 'queue' ? (
                  <QueueSettingsTab nodeData={nodeData} />
                ) : (
                  <SystemSettingsTab nodeData={nodeData} />
                )}
              </TabsContent>
              
              <TabsContent value="triggers" className="mt-0 h-full">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : nodeType === 'bot' ? (
                  <BotTriggersTab nodeData={nodeData} />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Triggers tab is only available for bots</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="logs" className="mt-0 h-full">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : nodeType === 'bot' ? (
                  <BotLogsTab nodeData={nodeData} />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Logs tab is only available for bots</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="events" className="mt-0 h-full">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : nodeType === 'queue' ? (
                  <QueueEventsTab nodeData={nodeData} />
                ) : nodeType === 'system' ? (
                  <SystemEventsTab nodeData={nodeData} />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Events tab is only available for queues and systems</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </FullScreenModal>
      
      {/* Custom Time Period Dialog */}
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