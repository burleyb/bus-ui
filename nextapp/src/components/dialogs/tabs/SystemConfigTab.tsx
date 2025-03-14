"use client";

import React, { useState } from 'react';
import { useToast } from '@/components/ui/toast';

interface SystemConfigTabProps {
  nodeData: any;
}

const SystemConfigTab: React.FC<SystemConfigTabProps> = ({ nodeData }) => {
  const [config, setConfig] = useState(nodeData.config || `{
  "connection": {
    "host": "localhost",
    "port": 5432,
    "ssl": true,
    "timeout": 30000
  },
  "auth": {
    "type": "basic",
    "username": "app_user",
    "passwordSecretKey": "system_password"
  },
  "options": {
    "maxConnections": 10,
    "idleTimeout": 60000,
    "retries": 3,
    "backoff": {
      "initial": 1000,
      "max": 10000,
      "factor": 2
    }
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}`);

  const [isReadOnly, setIsReadOnly] = useState(true);
  const { addToast } = useToast();
  
  const handleFormatConfig = () => {
    try {
      const parsed = JSON.parse(config);
      setConfig(JSON.stringify(parsed, null, 2));
    } catch (error) {
      addToast({
        title: 'Invalid JSON',
        description: (error as Error).message,
        type: 'error'
      });
    }
  };
  
  const handleValidateConfig = () => {
    try {
      JSON.parse(config);
      addToast({
        title: 'Configuration Validated',
        description: 'Configuration is valid JSON',
        type: 'success'
      });
    } catch (error) {
      addToast({
        title: 'Invalid JSON',
        description: (error as Error).message,
        type: 'error'
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <label htmlFor="configEditor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            System Configuration
          </label>
          <div className="ml-3">
            <button
              type="button"
              onClick={() => setIsReadOnly(!isReadOnly)}
              className={`text-xs px-2 py-1 rounded ${
                isReadOnly 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {isReadOnly ? 'Enable Editing' : 'Editing Enabled'}
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleFormatConfig}
            disabled={isReadOnly}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 
                     text-gray-700 dark:text-gray-300 px-2 py-1 rounded
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Format
          </button>
          <button
            type="button"
            onClick={handleValidateConfig}
            className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 
                     text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
          >
            Validate
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {isReadOnly 
          ? 'Configuration is in read-only mode. Enable editing to make changes.'
          : 'Warning: Editing system configuration directly may cause system instability. Proceed with caution.'}
      </p>
      
      <div className="relative">
        <textarea
          id="configEditor"
          value={config}
          onChange={(e) => !isReadOnly && setConfig(e.target.value)}
          readOnly={isReadOnly}
          rows={20}
          className={`w-full rounded-md border border-gray-300 dark:border-gray-700 
                   bg-gray-900 text-gray-100 px-3 py-2 text-sm font-mono
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   ${isReadOnly ? 'opacity-90' : ''}`}
        />
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {nodeData.configUpdatedAt ? new Date(nodeData.configUpdatedAt).toLocaleString() : 'Unknown'}
        </div>
        
        {!isReadOnly && (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setIsReadOnly(true)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 
                       rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm 
                       font-medium text-white bg-blue-600 hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Configuration Schema</h3>
        <div className="overflow-y-auto max-h-48">
          <pre className="text-xs text-gray-600 dark:text-gray-400">
{`{
  "type": "object",
  "properties": {
    "connection": {
      "type": "object",
      "properties": {
        "host": {"type": "string"},
        "port": {"type": "integer"},
        "ssl": {"type": "boolean"},
        "timeout": {"type": "integer"}
      },
      "required": ["host", "port"]
    },
    "auth": {
      "type": "object",
      "properties": {
        "type": {"type": "string", "enum": ["basic", "oauth", "key"]},
        "username": {"type": "string"},
        "passwordSecretKey": {"type": "string"}
      }
    },
    "options": {
      "type": "object",
      "properties": {
        "maxConnections": {"type": "integer"},
        "idleTimeout": {"type": "integer"},
        "retries": {"type": "integer"},
        "backoff": {"type": "object"}
      }
    },
    "logging": {
      "type": "object",
      "properties": {
        "level": {"type": "string", "enum": ["debug", "info", "warn", "error"]},
        "format": {"type": "string"}
      }
    }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigTab; 