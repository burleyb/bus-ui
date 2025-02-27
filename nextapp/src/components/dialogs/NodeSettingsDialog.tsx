"use client";

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useAppContext } from '@/context/AppContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useBotDetails, useQueueDetails, useSystemDetails } from '@/context/ApiContext';
import { NodeIcon } from '@/components/node';
import { NodeSettingsDialogHeader } from './NodeSettingsDialogHeader';
import { useToast } from '../ui/toast';
import { API } from '@/lib/api';

// Bot-specific tab components
import BotDashboardTab from '@/components/dialogs/tabs/BotDashboardTab';
import BotSettingsTab from '@/components/dialogs/tabs/BotSettingsTab';
import BotCodeTab from '@/components/dialogs/tabs/BotCodeTab';

// Queue-specific tab components
import QueueDashboardTab from '@/components/dialogs/tabs/QueueDashboardTab';
import QueueSchemaTab from '@/components/dialogs/tabs/QueueSchemaTab';
import QueueEventsTab from '@/components/dialogs/tabs/QueueEventsTab';

// System-specific tab components
import SystemDashboardTab from '@/components/dialogs/tabs/SystemDashboardTab';
import SystemConnectionsTab from '@/components/dialogs/tabs/SystemConnectionsTab';
import SystemConfigTab from '@/components/dialogs/tabs/SystemConfigTab';

// Common tab components
import LogsTab from '@/components/dialogs/tabs/LogsTab';

export interface NodeSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
}

export default function NodeSettingsDialog({ open, onClose, nodeId }: NodeSettingsDialogProps) {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [nodeType, setNodeType] = useState<'bot' | 'queue' | 'system' | 'unknown'>('unknown');
  const [nodeData, setNodeData] = useState<any>(null);
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine node type from nodeId or state.nodes
  useEffect(() => {
    if (open && nodeId) {
      let type: 'bot' | 'queue' | 'system' | 'unknown' = 'unknown';
      
      // First try to get type from state.nodes
      const nodeBasicInfo = state.nodes[nodeId] || {};
      
      if (nodeBasicInfo && Object.keys(nodeBasicInfo).length > 0) {
        // Use type from state.nodes if available
        if (nodeBasicInfo.type === 'bot') type = 'bot';
        else if (nodeBasicInfo.type === 'queue') type = 'queue';
        else if (nodeBasicInfo.type === 'system') type = 'system';
      } else {
        // Fallback: Try to determine type from the nodeId format
        if (nodeId.startsWith('bot:') || nodeId.startsWith('b_')) {
          type = 'bot';
        } else if (nodeId.startsWith('queue:') || nodeId.startsWith('q_')) {
          type = 'queue';
        } else if (nodeId.startsWith('system:') || nodeId.startsWith('s_')) {
          type = 'system';
        }
        
        console.log('Node basic info not found in state, determined type from ID:', nodeId, '→', type);
      }
      
      setNodeType(type);
      
      // Set default active tab based on node type
      if (type === 'bot') setActiveTab('Dashboard');
      else if (type === 'queue') setActiveTab('Dashboard');
      else if (type === 'system') setActiveTab('Dashboard');
    }
  }, [open, nodeId, state.nodes]);
  
  // Fetch detailed data based on node type
  const botDetailsQuery = useBotDetails(nodeType === 'bot' && open ? nodeId : '');
  const queueDetailsQuery = useQueueDetails(nodeType === 'queue' && open ? nodeId : '');
  const systemDetailsQuery = useSystemDetails(nodeType === 'system' && open ? nodeId : '');
  
  // Set node data from the appropriate query
  useEffect(() => {
    if (nodeType === 'bot' && botDetailsQuery.data) {
      const basicInfo = state.nodes[nodeId] || {};
      setNodeData({
        ...botDetailsQuery.data,
        type: 'bot',
        // Keep some fields from the basic info if needed
        id: nodeId,
        status: basicInfo.status || botDetailsQuery.data.status || 'unknown',
        // Ensure health data is properly structured
        health: botDetailsQuery.data.health || basicInfo.health || {
          status: 'unknown',
          lastCheck: null
        }
      });
    } else if (nodeType === 'queue' && queueDetailsQuery.data) {
      const basicInfo = state.nodes[nodeId] || {};
      setNodeData({
        ...queueDetailsQuery.data,
        type: 'queue',
        id: nodeId,
        status: basicInfo.status || queueDetailsQuery.data.status || 'unknown'
      });
    } else if (nodeType === 'system' && systemDetailsQuery.data) {
      const basicInfo = state.nodes[nodeId] || {};
      setNodeData({
        ...systemDetailsQuery.data,
        type: 'system',
        id: nodeId,
        status: basicInfo.status || systemDetailsQuery.data.status || 'unknown'
      });
    } else if (open && nodeId && nodeType !== 'unknown') {
      // If no detailed data is available yet but we know the type, use basic info as fallback
      const basicInfo = state.nodes[nodeId] || {};
      if (Object.keys(basicInfo).length > 0) {
        console.log('Using basic info as fallback for', nodeType, nodeId);
        setNodeData({
          ...basicInfo, 
          type: nodeType,
          // Add default health property for bot nodes
          ...(nodeType === 'bot' ? {
            health: basicInfo.health || {
              status: 'unknown',
              lastCheck: null
            }
          } : {})
        });
      } else {
        // If no data at all, create a minimal node data object
        setNodeData({
          id: nodeId,
          type: nodeType,
          status: 'unknown',
          name: nodeId.split(':').pop() || nodeId,
          // Add default health property for bot nodes
          ...(nodeType === 'bot' ? {
            health: {
              status: 'unknown',
              lastCheck: null
            }
          } : {})
        });
      }
    }
  }, [
    nodeType, 
    botDetailsQuery.data, 
    queueDetailsQuery.data, 
    systemDetailsQuery.data, 
    nodeId, 
    open, 
    state.nodes
  ]);

  // Determine loading state from the appropriate query
  const isLoadingQuery = 
    (nodeType === 'bot' && botDetailsQuery.isLoading) ||
    (nodeType === 'queue' && queueDetailsQuery.isLoading) ||
    (nodeType === 'system' && systemDetailsQuery.isLoading) ||
    (open && nodeId && !nodeData);
  
  // Determine error state
  const hasError = 
    (nodeType === 'bot' && botDetailsQuery.isError) ||
    (nodeType === 'queue' && queueDetailsQuery.isError) ||
    (nodeType === 'system' && systemDetailsQuery.isError);
  
  const errorMessage = 
    (nodeType === 'bot' && botDetailsQuery.error instanceof Error ? botDetailsQuery.error.message : '') ||
    (nodeType === 'queue' && queueDetailsQuery.error instanceof Error ? queueDetailsQuery.error.message : '') ||
    (nodeType === 'system' && systemDetailsQuery.error instanceof Error ? systemDetailsQuery.error.message : '') ||
    'Failed to load node details';

  // Get available tabs based on node type
  const getTabsForNodeType = () => {
    const commonTabs = [
      { value: 'dashboard', label: 'Dashboard' },
    ];
    
    // Add logs tab only for bot nodes
    const logsTab = { value: 'logs', label: 'Logs' };
    
    switch (nodeType) {
      case 'bot':
        return [
          ...commonTabs,
          { value: 'code', label: 'Code' },
          logsTab,
          { value: 'settings', label: 'Settings' },
        ];
      case 'queue':
        return [
          ...commonTabs,
          { value: 'schema', label: 'Schema' },
          { value: 'events', label: 'Events' },
          { value: 'settings', label: 'Settings' },
        ];
      case 'system':
        return [
          ...commonTabs,
          { value: 'connections', label: 'Connections' },
          { value: 'config', label: 'Configuration' },
          { value: 'settings', label: 'Settings' },
        ];
      default:
        return commonTabs;
    }
  };

  const handleSave = async () => {
    if (!nodeData) return;
    
    try {
      setIsLoading(true);
      console.log('Saving settings for node:', nodeId, nodeData);
      
      // Gather form data from the dialog
      // This will need to be updated based on your actual form implementation
      const formData = {
        // Extract values from form fields
        // You would replace these with actual form values
        name: nodeData.name,
        description: nodeData.description,
        // Add other settings as needed
      };
      
      // Save node settings using the appropriate API method based on node type
      let result;
      switch (nodeType) {
        case 'bot':
          result = await API.saveNodeSettings(nodeId, formData);
          break;
        case 'queue':
          result = await API.saveNodeSettings(nodeId, formData);
          break;
        case 'system':
          result = await API.saveNodeSettings(nodeId, formData);
          break;
        default:
          result = await API.saveNodeSettings(nodeId, formData);
      }
      
      if (result && !result.error) {
        addToast({
          title: 'Settings saved',
          description: 'Node settings have been updated successfully.',
          type: 'success'
        });
        onClose();
      } else {
        addToast({
          title: 'Error saving settings',
          description: result?.error || 'An error occurred while saving node settings.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving node settings:', error);
      addToast({
        title: 'Error',
        description: 'An unexpected error occurred while saving settings.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      headerContent={nodeData ? <NodeSettingsDialogHeader 
        nodeData={nodeData} 
        nodeId={nodeId} 
        nodeType={nodeType} 
        onClose={onClose} 
      /> : undefined}
      title={nodeData ? `${nodeType && nodeType !== 'unknown' ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : 'Node'} Settings: ${nodeData.id || nodeId}` : 'Node Settings'}
      size="full"
    >
      {isLoadingQuery ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : hasError ? (
        <div className="text-center py-8 text-red-500 dark:text-red-400 space-y-2">
          <p className="font-medium">Failed to load details</p>
          <p className="text-sm">{errorMessage}</p>
          <button
            onClick={() => {
              if (nodeType === 'bot') botDetailsQuery.refetch();
              else if (nodeType === 'queue') queueDetailsQuery.refetch();
              else if (nodeType === 'system') systemDetailsQuery.refetch();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center space-x-2"
          >
            <span>Try Again</span>
          </button>
        </div>
      ) : nodeData ? (
        <div className="space-y-6 h-full flex flex-col">
          <Tabs
            defaultValue={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="flex-1 flex flex-col"
          >
            <TabsList className="mb-4">
              {getTabsForNodeType().map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {/* Render appropriate tab content based on node type */}
              {nodeType === 'bot' && (
                <>
                  <TabsContent value="Dashboard" className="mt-4 h-full">
                    <BotDashboardTab nodeData={nodeData} />
                  </TabsContent>
                  
                  <TabsContent value="code" className="mt-4 h-full">
                    <BotCodeTab nodeData={nodeData} />
                  </TabsContent>

                  <TabsContent value="error" className="mt-4 h-full">
                    <BotSettingsTab nodeData={nodeData} />
                  </TabsContent>
                  
                </>
              )}

              {nodeType === 'queue' && (
                <>
                  <TabsContent value="Dashboard" className="mt-4 h-full">
                    <QueueDashboardTab nodeData={nodeData} />
                  </TabsContent>
                  
                  <TabsContent value="schema" className="mt-4 h-full">
                    <QueueSchemaTab nodeData={nodeData} />
                  </TabsContent>
                  
                  <TabsContent value="events" className="mt-4 h-full overflow-auto">
                    <QueueEventsTab nodeData={nodeData} />
                  </TabsContent>
                </>
              )}

              {nodeType === 'system' && (
                <>
                  <TabsContent value="Dashboard" className="mt-4 h-full">
                    <SystemDashboardTab nodeData={nodeData} />
                  </TabsContent>
                  
                  <TabsContent value="connections" className="mt-4 h-full">
                    <SystemConnectionsTab nodeData={nodeData} />
                  </TabsContent>
                  
                  <TabsContent value="config" className="mt-4 h-full">
                    <SystemConfigTab nodeData={nodeData} />
                  </TabsContent>
                </>
              )}
              
              {/* Logs Tab for bot nodes only */}
              {nodeType === 'bot' && (
                <TabsContent value="logs" className="mt-4 h-full">
                  <LogsTab nodeId={nodeId} nodeType={nodeType} />
                </TabsContent>
              )}
            </div>
          </Tabs>

          <div className="flex justify-end space-x-3 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 
                      rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300
                      bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                      font-medium text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Node details could not be loaded</p>
        </div>
      )}
    </Dialog>
  );
} 