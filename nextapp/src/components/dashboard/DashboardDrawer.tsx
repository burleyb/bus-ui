"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X as XIcon, Plus as PlusIcon } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useMemo } from 'react';
import { useSearchQueueEvents } from '@/context/ApiContext';
import DonutChart from './DonutChart';
import NodeIcon from '@/components/node/NodeIcon';
import { format } from 'date-fns';
import { Dialog, Transition, DialogPanel, DialogTitle } from '@headlessui/react';
import { Fragment } from 'react';

interface TaggedBotsConfig {
  tag: string;
  id: string;
}

interface TaggedBotsChartData {
  id: string;
  tag: string;
  total: number;
  alarmed: number;
  notAlarmed: number;
  donutData: {
    name: string;
    value: number;
    color: string;
  }[];
  lastUpdated: number;
}

interface BotChangeLogEntry {
  id: string;
  name: string;
  timestamp: number;
  changes: string[];
}

export default function DashboardDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { state } = useAppContext();
  const [taggedBotsConfig, setTaggedBotsConfig] = useState<TaggedBotsConfig[]>([]);
  const [taggedBotsChartData, setTaggedBotsChartData] = useState<TaggedBotsChartData[]>([]);
  const [changeLog, setChangeLog] = useState<BotChangeLogEntry[]>([]);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate EID for last hour for change log search
  const changeLogEid = useMemo(() => {
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    return `z/${lastHour.getFullYear()}/${(lastHour.getMonth() + 1).toString().padStart(2, '0')}/${lastHour.getDate().toString().padStart(2, '0')}/${lastHour.getHours().toString().padStart(2, '0')}/${lastHour.getMinutes().toString().padStart(2, '0')}/${Math.floor(lastHour.getTime())}`;
  }, []);
  
  // Use the searchQueueEvents hook to fetch change log data
  const changeLogQuery = useSearchQueueEvents(
    "queue:BotChangeLog",
    changeLogEid,
    undefined,
    20
  );

  // Load change log data when the drawer opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Refetch the change log data when the drawer opens
      changeLogQuery.refetch().then(() => {
        setIsLoading(false);
      }).catch(error => {
        console.error('Error fetching change log:', error);
        setIsLoading(false);
      });
    }
  }, [isOpen, changeLogQuery]);
  
  // Update the change log state when the query data changes
  useEffect(() => {
    if (changeLogQuery.data?.results) {
      try {
        // Transform the data for our components
        const logEntries: BotChangeLogEntry[] = changeLogQuery.data.results.map((item: any) => {
          const changes: string[] = [];
          
          if (item.payload.diff) {
            item.payload.diff.forEach((diffItem: any) => {
              Object.keys(diffItem).forEach(key => {
                changes.push(`${key}: ${diffItem[key].old} → ${diffItem[key].new}`);
              });
            });
          }
          
          return {
            id: item.id,
            name: item.payload.new?.name || item.payload.old?.name || 'Unknown',
            timestamp: item.timestamp,
            changes
          };
        });
        
        setChangeLog(logEntries);
      } catch (error) {
        console.error('Error processing change log data:', error);
      }
    }
  }, [changeLogQuery.data]);

  // Extract all available tags from nodes
  useEffect(() => {
    if (state.nodes) {
      const tagsSet = new Set<string>();
      
      Object.values(state.nodes).forEach(node => {
        if (node.tags) {
          const tagsList = typeof node.tags === 'string' 
            ? node.tags.split(',') 
            : Array.isArray(node.tags) ? node.tags : [];
          
          tagsList.forEach((tag: string) => tagsSet.add(tag.trim()));
        }
      });
      
      setAvailableTags(Array.from(tagsSet).sort());
    }
  }, [state.nodes]);

  // Load saved tagged bots configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('taggedBotsConfig');
    if (savedConfig) {
      try {
        setTaggedBotsConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error parsing tagged bots config:', error);
      }
    }

    // Load saved chart data from localStorage
    const savedChartData = localStorage.getItem('taggedBotsChartData');
    if (savedChartData) {
      try {
        setTaggedBotsChartData(JSON.parse(savedChartData));
      } catch (error) {
        console.error('Error parsing tagged bots chart data:', error);
      }
    }
  }, []);

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('taggedBotsConfig', JSON.stringify(taggedBotsConfig));
  }, [taggedBotsConfig]);

  // Save chart data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('taggedBotsChartData', JSON.stringify(taggedBotsChartData));
  }, [taggedBotsChartData]);

  // Update chart data when drawer opens or when tag configs change
  useEffect(() => {
    if (isOpen && state.nodes && taggedBotsConfig.length > 0) {
      // Create a new array with updated chart data
      const updatedChartData = taggedBotsConfig.map(config => {
        // Check if we have cached data that's less than 5 minutes old
        const existingData = taggedBotsChartData.find(data => 
          data.id === config.id && 
          (Date.now() - data.lastUpdated) < 5 * 60 * 1000
        );

        if (existingData) {
          return existingData;
        }

        // Calculate new data
        const freshData = calculateTaggedBotsData(config.tag, config.id);
        return freshData;
      });

      setTaggedBotsChartData(updatedChartData);
    }
  }, [isOpen, state.nodes, taggedBotsConfig, taggedBotsChartData]);

  // Calculate donut chart data for a specific tag
  const calculateTaggedBotsData = useCallback((tag: string, id: string): TaggedBotsChartData => {
    // Filter bots by tag
    const taggedBots = Object.values(state.nodes).filter(node => {
      const nodeTags = typeof node.tags === 'string' 
        ? node.tags.split(',') 
        : Array.isArray(node.tags) ? node.tags : [];
      
      return nodeTags.some((t: string) => t.trim() === tag.trim());
    });
    
    // Count alarmed vs not alarmed bots
    const alarmedBots = taggedBots.filter(node => 
      node.status?.toLowerCase() === 'blocked' || 
      node.status?.toLowerCase() === 'danger' || 
      node.status?.toLowerCase() === 'rogue'
    ).length;
    
    const notAlarmedBots = taggedBots.length - alarmedBots;
    
    return {
      id,
      tag,
      total: taggedBots.length,
      alarmed: alarmedBots,
      notAlarmed: notAlarmedBots,
      donutData: [
        { name: 'Not Alarmed', value: notAlarmedBots, color: '#4ade80' },
        { name: 'Alarmed', value: alarmedBots, color: '#ef4444' }
      ],
      lastUpdated: Date.now()
    };
  }, [state.nodes]);

  // Handle adding a new tagged bots configuration
  const handleAddTaggedBots = () => {
    if (!selectedTag) return;
    
    // Check if this tag is already in the config
    if (taggedBotsConfig.some(config => config.tag === selectedTag)) {
      return;
    }
    
    const newConfigId = `tag-${selectedTag}-${Date.now()}`;
    const newConfig: TaggedBotsConfig = {
      tag: selectedTag,
      id: newConfigId
    };
    
    // Add to config
    setTaggedBotsConfig(prev => [...prev, newConfig]);
    
    // Calculate and add chart data
    const newChartData = calculateTaggedBotsData(selectedTag, newConfigId);
    setTaggedBotsChartData(prev => [...prev, newChartData]);
    
    setSelectedTag('');
    setIsTagDialogOpen(false);
  };

  // Handle removing a tagged bots configuration
  const handleRemoveTaggedBots = (id: string) => {
    setTaggedBotsConfig(prev => prev.filter(config => config.id !== id));
    setTaggedBotsChartData(prev => prev.filter(data => data.id !== id));
  };

  // Get chart data for a specific tag config
  const getChartData = (config: TaggedBotsConfig) => {
    // Try to find cached data
    const cachedData = taggedBotsChartData.find(data => data.id === config.id);
    
    // If no cached data or it's older than 5 minutes, calculate fresh data
    if (!cachedData || (Date.now() - cachedData.lastUpdated) > 5 * 60 * 1000) {
      return calculateTaggedBotsData(config.tag, config.id);
    }
    
    return cachedData;
  };

  return (
    <>
      <div 
        className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } z-40 overflow-y-auto`}
        style={{ 
          right: isOpen ? '0' : '-20rem', 
          position: 'fixed',
          top: 0,
          height: '100vh' 
        }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dashboard Details</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Tagged Bots Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Tagged Bots</h4>
            <button 
              onClick={() => setIsTagDialogOpen(true)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <PlusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {taggedBotsConfig.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No tagged bots configured.
              <div className="mt-2 text-sm">
                Click the + button to add a tag.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {taggedBotsConfig.map(config => {
                const tagData = getChartData(config);
                return (
                  <div 
                    key={config.id} 
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {config.tag}
                      </h5>
                      <button 
                        onClick={() => handleRemoveTaggedBots(config.id)}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <XIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="flex justify-center">
                      <DonutChart 
                        data={tagData.donutData}
                        innerLabel={{
                          value: `${tagData.alarmed}/${tagData.total}`,
                          label: 'alarmed'
                        }}
                        size={120}
                        strokeWidth={15}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Recent Change Log Section */}
        <div className="p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Recent Change Log</h4>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : changeLog.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No recent changes found.
            </div>
          ) : (
            <div className="space-y-2">
              {changeLog.map((entry) => (
                <div 
                  key={`${entry.id}-${entry.timestamp}`}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      <NodeIcon node={{ id: entry.name, type: 'bot' }} size={20} />
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  {entry.changes.length > 0 && (
                    <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 pl-6">
                      <div className="font-medium mb-1">Changes:</div>
                      <ul className="list-disc pl-3 space-y-1">
                        {entry.changes.slice(0, 3).map((change, idx) => (
                          <li key={idx}>{change}</li>
                        ))}
                        {entry.changes.length > 3 && (
                          <li className="text-gray-500 dark:text-gray-400 italic">
                            +{entry.changes.length - 3} more changes
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-30 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      
      {/* Tag Selection Dialog */}
      <Transition appear show={isTagDialogOpen} as={Fragment}>
        <Dialog 
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => setIsTagDialogOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25"></div>
            </Transition.Child>

            {/* This centers the modal */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="inline-block w-full max-w-sm p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-lg">
                <DialogTitle className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Select Tag
                </DialogTitle>
                
                {availableTags.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No tags found in the system.
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Available Tags
                    </label>
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a tag...</option>
                      {availableTags.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsTagDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTaggedBots}
                    disabled={!selectedTag || availableTags.length === 0}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                      !selectedTag || availableTags.length === 0
                        ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed'
                        : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
                    }`}
                  >
                    Add
                  </button>
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}