"use client";

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useAppContext } from '@/context/AppContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useBotDetails, useQueueDetails, useSystemDetails } from '@/context/ApiContext';

// Bot-specific tab components
import BotGeneralTab from './tabs/BotGeneralTab';
import BotPerformanceTab from './tabs/BotPerformanceTab';
import BotErrorHandlingTab from '@/components/dialogs/tabs/BotErrorHandlingTab';
import BotCodeTab from './tabs/BotCodeTab';
import BotTriggersTab from './tabs/BotTriggersTab';

// Queue-specific tab components
import QueueGeneralTab from './tabs/QueueGeneralTab';
import QueueSchemaTab from './tabs/QueueSchemaTab';
import QueueEventsTab from './tabs/QueueEventsTab';

// System-specific tab components
import SystemGeneralTab from './tabs/SystemGeneralTab';
import SystemConnectionsTab from './tabs/SystemConnectionsTab';
import SystemConfigTab from './tabs/SystemConfigTab';

// Common tab components
import LogsTab from './tabs/LogsTab';

export interface NodeSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
}

export default function NodeSettingsDialog({ open, onClose, nodeId }: NodeSettingsDialogProps) {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState("general");
  const [nodeType, setNodeType] = useState<'bot' | 'queue' | 'system' | 'unknown'>('unknown');
  const [nodeData, setNodeData] = useState<any>(null);
  
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
      if (type === 'bot') setActiveTab('general');
      else if (type === 'queue') setActiveTab('general');
      else if (type === 'system') setActiveTab('general');
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
        status: basicInfo.status || botDetailsQuery.data.status || 'unknown'
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
        setNodeData({...basicInfo, type: nodeType});
      } else {
        // If no data at all, create a minimal node data object
        setNodeData({
          id: nodeId,
          type: nodeType,
          status: 'unknown',
          name: nodeId.split(':').pop() || nodeId
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
  const isLoading = 
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
      { value: 'general', label: 'General' },
    ];
    
    // Add logs tab only for bot nodes
    const logsTab = { value: 'logs', label: 'Logs' };
    
    switch (nodeType) {
      case 'bot':
        return [
          ...commonTabs,
          logsTab,
          { value: 'triggers', label: 'Triggers' },
          { value: 'code', label: 'Code' },
          { value: 'performance', label: 'Performance' },
          { value: 'error', label: 'Error Handling' },
        ];
      case 'queue':
        return [
          ...commonTabs,
          { value: 'schema', label: 'Schema' },
          { value: 'events', label: 'Events' },
        ];
      case 'system':
        return [
          ...commonTabs,
          { value: 'connections', label: 'Connections' },
          { value: 'config', label: 'Configuration' },
        ];
      default:
        return commonTabs;
    }
  };

  const handleSave = () => {
    // Simulate saving settings
    console.log('Saving settings for node:', nodeId, nodeData);
    
    // In a real implementation, you would send these settings to your API
    // Example:
    // const saveNodeSettings = async () => {
    //   try {
    //     const response = await fetch(`/api/nodes/${nodeId}`, {
    //       method: 'PUT',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(nodeData),
    //     });
    //     const result = await response.json();
    //     onClose();
    //   } catch (error) {
    //     console.error('Error saving node settings:', error);
    //   }
    // };
    // saveNodeSettings();
    
    // For now, just simulate the save with a timeout
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={nodeData ? `${nodeType && nodeType !== 'unknown' ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : 'Node'} Settings: ${nodeData.id || nodeId}` : 'Node Settings'}
      size="lg"
    >
      {isLoading ? (
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
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div 
              className={`h-3 w-3 rounded-full ${
                nodeData.status === 'active' ? 'bg-green-500' : 
                nodeData.status === 'paused' || nodeData.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Status: {nodeData.status ? `${nodeData.status.charAt(0).toUpperCase()}${nodeData.status.slice(1)}` : 'Unknown'}
            </span>
            
            {/* Node Type Badge */}
            <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
              nodeType === 'bot' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
              nodeType === 'queue' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
              nodeType === 'system' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            }`}>
              {nodeType.toUpperCase()}
            </span>
          </div>
          
          <Tabs
            defaultValue={activeTab}
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="mb-4">
              {getTabsForNodeType().map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Render appropriate tab content based on node type */}
            {nodeType === 'bot' && (
              <>
                <TabsContent value="general" className="mt-4">
                  <BotGeneralTab nodeData={nodeData} />
                </TabsContent>
                
                <TabsContent value="triggers" className="mt-4">
                  <BotTriggersTab nodeData={nodeData} />
                </TabsContent>

                <TabsContent value="performance" className="mt-4">
                  <BotPerformanceTab nodeData={nodeData} />
                </TabsContent>
                
                <TabsContent value="error" className="mt-4">
                  <BotErrorHandlingTab nodeData={nodeData} />
                </TabsContent>
                
                <TabsContent value="code" className="mt-4">
                  <BotCodeTab nodeData={nodeData} />
                </TabsContent>
              </>
            )}

            {nodeType === 'queue' && (
              <>
                <TabsContent value="general" className="mt-4">
                  <QueueGeneralTab nodeData={nodeData} />
                </TabsContent>
                
                <TabsContent value="schema" className="mt-4">
                  <QueueSchemaTab nodeData={nodeData} />
                </TabsContent>
                
                <TabsContent value="events" className="mt-4">
                  <QueueEventsTab nodeData={nodeData} />
                </TabsContent>
              </>
            )}

            {nodeType === 'system' && (
              <>
                <TabsContent value="general" className="mt-4">
                  <SystemGeneralTab nodeData={nodeData} />
                </TabsContent>
                
                <TabsContent value="connections" className="mt-4">
                  <SystemConnectionsTab nodeData={nodeData} />
                </TabsContent>
                
                <TabsContent value="config" className="mt-4">
                  <SystemConfigTab nodeData={nodeData} />
                </TabsContent>
              </>
            )}
            
            {/* Logs Tab for bot nodes only */}
            {nodeType === 'bot' && (
              <TabsContent value="logs" className="mt-4">
                <LogsTab nodeId={nodeId} nodeType={nodeType} />
              </TabsContent>
            )}
          </Tabs>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 
                      rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300
                      bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                      font-medium text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
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