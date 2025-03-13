"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStats, useBots } from '@/context/ApiContext';
import { useAppContext } from '@/context/AppContext';
import { CatalogNodeItem, BulkAction, TimePeriod } from '@/types/catalog';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import CatalogToolbar from '@/components/catalog/CatalogToolbar';
import BulkTagDialog from '@/components/catalog/BulkTagDialog';
import { useDialogs } from '@/hooks/useDialogs';

const CatalogPage = () => {
  // Get state and API hooks
  const router = useRouter();
  const pathname = usePathname();
  const { state, dispatch } = useAppContext();
  const { openNodeSettingsDialog } = useDialogs();
  
  // Local state for filters and selection
  const [showQueues, setShowQueues] = useState(true);
  const [showBots, setShowBots] = useState(true);
  const [showSystems, setShowSystems] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<CatalogNodeItem[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>({ interval: 'minute_15' });
  const [isBulkTagDialogOpen, setIsBulkTagDialogOpen] = useState(false);
  
  // Initialize stats polling on catalog page load
  useStats();
  const botsQuery = useBots();
  
  // Load filter state from URL hash on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.length > 1) {
      try {
        // Get hash and remove the # character
        let hashStr = window.location.hash.substring(1);
        
        // Decode the URL-encoded hash
        try {
          hashStr = decodeURIComponent(hashStr);
        } catch (decodeError) {
          console.error('Error decoding hash:', decodeError);
          return;
        }
        
        // Parse the hash as JSON
        if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
          const hashData = JSON.parse(hashStr);
          
          // Load filters if they exist
          if (hashData.filters) {
            setShowQueues(hashData.filters.showQueues !== undefined ? hashData.filters.showQueues : true);
            setShowBots(hashData.filters.showBots !== undefined ? hashData.filters.showBots : true);
            setShowSystems(hashData.filters.showSystems !== undefined ? hashData.filters.showSystems : true);
            setShowArchived(hashData.filters.showArchived !== undefined ? hashData.filters.showArchived : false);
            setSearchText(hashData.filters.searchText || '');
            setSelectedTags(hashData.filters.selectedTags || []);
          }
          
          // Load time period if it exists
          if (hashData.timePeriod) {
            setTimePeriod(hashData.timePeriod);
          }
        }
      } catch (error) {
        console.error('Error parsing hash:', error);
      }
    }
  }, []);
  
  // Update URL hash when filters change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create the new hash data
      const hashData = {
        filters: {
          showQueues,
          showBots,
          showSystems,
          showArchived,
          searchText,
          selectedTags
        },
        timePeriod
      };
      
      // Serialize and encode
      const hashStr = JSON.stringify(hashData);
      window.location.hash = encodeURIComponent(hashStr);
    }
  }, [showQueues, showBots, showSystems, showArchived, searchText, selectedTags, timePeriod]);
  
  // Handle bulk actions
  const handleBulkAction = async (action: BulkAction, selectedNodes: CatalogNodeItem[]) => {
    if (selectedNodes.length === 0) return;
    
    // Simulate confirmation dialog until we have proper confirm dialog
    const confirmAction = (title: string, message: string, callback: () => void) => {
      if (window.confirm(`${title}\n\n${message}`)) {
        callback();
      }
    };
    
    switch (action) {
      case BulkAction.PAUSE_BOTS:
        // Confirm pause
        confirmAction(
          'Pause Bots',
          `Are you sure you want to pause ${selectedNodes.length} bot(s)?`,
          async () => {
            try {
              // API call would go here
              console.log('Pausing bots:', selectedNodes.map(node => node.id));
              
              // Optimistically update the UI
              dispatch({
                type: 'UPDATE_STATE',
                payload: { 
                  nodes: {
                    ...state.nodes,
                    ...selectedNodes.reduce((acc, node) => {
                      if (node.type === 'bot') {
                        acc[node.id] = { ...state.nodes[node.id], status: 'paused', paused: true };
                      }
                      return acc;
                    }, {} as Record<string, any>)
                  }
                }
              });
              
              // Refetch bots
              botsQuery.refetch();
            } catch (error) {
              console.error('Error pausing bots:', error);
            }
          }
        );
        break;
        
      case BulkAction.UNPAUSE_BOTS:
        // Confirm unpause
        confirmAction(
          'Unpause Bots',
          `Are you sure you want to unpause ${selectedNodes.length} bot(s)?`,
          async () => {
            try {
              // API call would go here
              console.log('Unpausing bots:', selectedNodes.map(node => node.id));
              
              // Optimistically update the UI
              dispatch({
                type: 'UPDATE_STATE',
                payload: { 
                  nodes: {
                    ...state.nodes,
                    ...selectedNodes.reduce((acc, node) => {
                      if (node.type === 'bot') {
                        acc[node.id] = { ...state.nodes[node.id], status: 'running', paused: false };
                      }
                      return acc;
                    }, {} as Record<string, any>)
                  }
                }
              });
              
              // Refetch bots
              botsQuery.refetch();
            } catch (error) {
              console.error('Error unpausing bots:', error);
            }
          }
        );
        break;
        
      case BulkAction.ARCHIVE_NODES:
        // Confirm archive
        confirmAction(
          'Archive Nodes',
          `Are you sure you want to archive ${selectedNodes.length} node(s)?`,
          async () => {
            try {
              // API call would go here
              console.log('Archiving nodes:', selectedNodes.map(node => node.id));
              
              // Optimistically update the UI
              dispatch({
                type: 'UPDATE_STATE',
                payload: { 
                  nodes: {
                    ...state.nodes,
                    ...selectedNodes.reduce((acc, node) => {
                      acc[node.id] = { ...state.nodes[node.id], status: 'archived', archived: true };
                      return acc;
                    }, {} as Record<string, any>)
                  }
                }
              });
              
              // Refetch bots
              botsQuery.refetch();
            } catch (error) {
              console.error('Error archiving nodes:', error);
            }
          }
        );
        break;
        
      case BulkAction.UNARCHIVE_NODES:
        // Confirm unarchive
        confirmAction(
          'Unarchive Nodes',
          `Are you sure you want to unarchive ${selectedNodes.length} node(s)?`,
          async () => {
            try {
              // API call would go here
              console.log('Unarchiving nodes:', selectedNodes.map(node => node.id));
              
              // Optimistically update the UI
              dispatch({
                type: 'UPDATE_STATE',
                payload: { 
                  nodes: {
                    ...state.nodes,
                    ...selectedNodes.reduce((acc, node) => {
                      acc[node.id] = { ...state.nodes[node.id], status: 'active', archived: false };
                      return acc;
                    }, {} as Record<string, any>)
                  }
                }
              });
              
              // Refetch bots
              botsQuery.refetch();
            } catch (error) {
              console.error('Error unarchiving nodes:', error);
            }
          }
        );
        break;
        
      case BulkAction.FORCE_RUN:
        // Confirm force run
        confirmAction(
          'Force Run',
          `Are you sure you want to force run ${selectedNodes.length} bot(s)?`,
          async () => {
            try {
              // API call would go here
              console.log('Force running bots:', selectedNodes.map(node => node.id));
              
              // No need to update UI state here since force run doesn't change state
              // Just show a notification that it was triggered
              
              // Refetch bots
              botsQuery.refetch();
            } catch (error) {
              console.error('Error force running bots:', error);
            }
          }
        );
        break;
        
      case BulkAction.TAG_NODES:
        // Open tag dialog
        setIsBulkTagDialogOpen(true);
        break;
    }
  };
  
  // Handle tags update
  const handleTagsUpdate = async (nodes: CatalogNodeItem[], tags: string[]) => {
    try {
      // API call would go here
      console.log('Updating tags for nodes:', nodes.map(node => node.id), 'tags:', tags);
      
      // Optimistically update the UI
      dispatch({
        type: 'UPDATE_STATE',
        payload: { 
          nodes: {
            ...state.nodes,
            ...nodes.reduce((acc, node) => {
              acc[node.id] = { ...state.nodes[node.id], tags };
              return acc;
            }, {} as Record<string, any>)
          }
        }
      });
      
      // Refetch bots
      botsQuery.refetch();
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  };
  
  // Handle filter tag click
  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      // Toggle the tag
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white shrink-0">Catalog</h1>
      
      {/* Toolbar with filters and search */}
      <div className="shrink-0">
        <CatalogToolbar
          searchText={searchText}
          showQueues={showQueues}
          showBots={showBots}
          showSystems={showSystems}
          showArchived={showArchived}
          timePeriod={timePeriod}
          onSearchChange={setSearchText}
          onShowQueuesChange={setShowQueues}
          onShowBotsChange={setShowBots}
          onShowSystemsChange={setShowSystems}
          onShowArchivedChange={setShowArchived}
          onTimePeriodChange={setTimePeriod}
        />
      </div>
      
      {/* AG Grid component */}
      <div className="flex-grow min-h-0">
        <CatalogGrid
          showQueues={showQueues}
          showBots={showBots}
          showSystems={showSystems}
          showArchived={showArchived}
          searchText={searchText}
          selectedTags={selectedTags}
          onSelectionChanged={setSelectedNodes}
          onBulkAction={handleBulkAction}
        />
      </div>
      
      {/* Bulk tag dialog */}
      <BulkTagDialog
        open={isBulkTagDialogOpen}
        onOpenChange={setIsBulkTagDialogOpen}
        selectedNodes={selectedNodes}
        onTagsUpdate={handleTagsUpdate}
      />
    </div>
  );
}

export default React.memo(CatalogPage); 