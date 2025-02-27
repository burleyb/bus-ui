"use client";

import React from 'react';
import { NodeIcon } from '@/components/node';

export default function NodeIconExamples() {
  // Sample node data
  const sampleNodes = {
    // Bot nodes with different states
    'bot:active': { id: 'bot:active', type: 'bot', status: 'active', name: 'Active Bot' },
    'bot:paused': { id: 'bot:paused', type: 'bot', status: 'paused', name: 'Paused Bot' },
    'bot:error': { id: 'bot:error', type: 'bot', status: 'error', name: 'Error Bot' },
    'bot:archived': { id: 'bot:archived', type: 'bot', status: 'archived', name: 'Archived Bot' },
    
    // Queue nodes
    'queue:standard': { id: 'queue:standard', type: 'queue', name: 'Standard Queue' },
    'queue:archived': { id: 'queue:archived', type: 'queue', archived: true, name: 'Archived Queue' },
    
    // System nodes
    'system:active': { id: 'system:active', type: 'system', status: 'active', name: 'Active System' },
    'system:archived': { id: 'system:archived', type: 'system', archived: true, name: 'Archived System' },
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Node Icon Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bot nodes */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Bot Nodes</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:active']} size={32} />
              <span>Active Bot</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:paused']} size={32} />
              <span>Paused Bot</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:error']} size={32} />
              <span>Error Bot</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:archived']} size={32} />
              <span>Archived Bot</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node="add" size={32} />
              <span>Add Node</span>
            </div>
          </div>
        </div>
        
        {/* Queue nodes */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Queue Nodes</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['queue:standard']} size={32} />
              <span>Standard Queue</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['queue:archived']} size={32} />
              <span>Archived Queue</span>
            </div>
          </div>
        </div>
        
        {/* System nodes */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-4">System Nodes</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['system:active']} size={32} />
              <span>Active System</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['system:archived']} size={32} />
              <span>Archived System</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node="infinite" size={32} />
              <span>Infinite Node</span>
            </div>
          </div>
        </div>
        
        {/* Size variations */}
        <div className="border p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Size Variations</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:active']} size={16} />
              <span>Small (16px)</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:active']} size={32} />
              <span>Medium (32px)</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:active']} size={48} />
              <span>Large (48px)</span>
            </div>
            <div className="flex items-center space-x-3">
              <NodeIcon node={sampleNodes['bot:active']} size={64} />
              <span>Extra Large (64px)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 