"use client";

import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { 
  PlayIcon, 
  PauseIcon, 
  ArchiveIcon, 
  TagIcon,
  RotateCw
} from 'lucide-react';
import { CatalogNodeItem, BulkAction } from '@/types/catalog';

// Button for the bulk actions
const ActionButton = ({ 
  icon, 
  label, 
  onClick,
  disabled = false
}: { 
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      className={`flex items-center w-full px-4 py-2 text-sm ${
        disabled 
          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
};

interface BulkActionsMenuProps {
  selectedNodes: CatalogNodeItem[];
  onAction: (action: BulkAction) => void;
}

export default function BulkActionsMenu({
  selectedNodes,
  onAction
}: BulkActionsMenuProps) {
  // Add debug logging for the component rendering
  console.log("BulkActionsMenu render with selected nodes:", selectedNodes.length, selectedNodes);
  
  // Simplified logging that won't slow down the application

  // Check for nodes with specific properties
  const hasBotsSelected = selectedNodes.some(node => node.type === 'bot');
  const hasRunningBotsSelected = selectedNodes.some(node => node.type === 'bot' && node.status === 'running' && !node.isPaused);
  const hasPausedBotsSelected = selectedNodes.some(node => node.type === 'bot' && node.isPaused);
  const hasArchivedSelected = selectedNodes.some(node => node.isArchived);
  const hasNonArchivedSelected = selectedNodes.some(node => !node.isArchived);
  
  // Update the button style to be more visible
  return (
    <Menu as="div" className="relative inline-block text-left z-50">
      <div>
        <Menu.Button
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
            selectedNodes.length === 0
              ? 'bg-gray-100 text-gray-400 border-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 cursor-not-allowed'
              : 'bg-red-600 text-white border-transparent hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700'
          }`}
          disabled={selectedNodes.length === 0}
          onClick={() => {
            console.log('Actions button clicked with selectedNodes:', selectedNodes.length);
            if (selectedNodes.length > 0) {
              console.log('Selected nodes details:', selectedNodes);
            }
          }}
        >
          Actions ({selectedNodes.length})
          <ChevronDown className="ml-2 h-4 w-4" />
        </Menu.Button>
      </div>
          
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <ActionButton
                  icon={<PauseIcon size={16} />}
                  label="Pause Bots"
                  onClick={() => {
                    onAction(BulkAction.PAUSE_BOTS);
                  }}
                  disabled={!hasRunningBotsSelected}
                />
              )}
            </Menu.Item>
                
            <Menu.Item>
              {({ active }) => (
                <ActionButton
                  icon={<PlayIcon size={16} />}
                  label="Unpause Bots"
                  onClick={() => {
                    onAction(BulkAction.UNPAUSE_BOTS);
                  }}
                  disabled={!hasPausedBotsSelected}
                />
              )}
            </Menu.Item>
                
            <Menu.Item>
              {({ active }) => (
                <ActionButton
                  icon={<RotateCw size={16} />}
                  label="Force Run"
                  onClick={() => {
                    onAction(BulkAction.FORCE_RUN);
                  }}
                  disabled={!hasBotsSelected}
                />
              )}
            </Menu.Item>
          </div>
              
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <ActionButton
                  icon={<ArchiveIcon size={16} />}
                  label="Archive Nodes"
                  onClick={() => {
                    onAction(BulkAction.ARCHIVE_NODES);
                  }}
                  disabled={!hasNonArchivedSelected}
                />
              )}
            </Menu.Item>
                
            <Menu.Item>
              {({ active }) => (
                <ActionButton
                  icon={<ArchiveIcon size={16} />}
                  label="Unarchive Nodes"
                  onClick={() => {
                    onAction(BulkAction.UNARCHIVE_NODES);
                  }}
                  disabled={!hasArchivedSelected}
                />
              )}
            </Menu.Item>
          </div>
              
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <ActionButton
                  icon={<TagIcon size={16} />}
                  label="Tag Nodes"
                  onClick={() => {
                    onAction(BulkAction.TAG_NODES);
                  }}
                  disabled={selectedNodes.length === 0}
                />
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 