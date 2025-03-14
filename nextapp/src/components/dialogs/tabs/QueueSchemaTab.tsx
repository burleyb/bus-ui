"use client";

import React, { useState } from 'react';
import { useToast } from '@/components/ui/toast';

interface QueueSchemaTabProps {
  nodeData: any;
}

const QueueSchemaTab: React.FC<QueueSchemaTabProps> = ({ nodeData }) => {
  const [schema, setSchema] = useState(nodeData.schema || `{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the event"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "When the event occurred"
    },
    "data": {
      "type": "object",
      "description": "Event payload",
      "properties": {}
    }
  },
  "required": ["id", "timestamp", "data"]
}`);

  const [showSampleEvent, setShowSampleEvent] = useState(false);
  const { addToast } = useToast();
  
  const handleFormatSchema = () => {
    try {
      const parsed = JSON.parse(schema);
      setSchema(JSON.stringify(parsed, null, 2));
    } catch (error) {
      addToast({
        title: 'Invalid JSON',
        description: (error as Error).message,
        type: 'error'
      });
    }
  };
  
  const handleValidateSchema = () => {
    try {
      JSON.parse(schema);
      addToast({
        title: 'Schema Validated',
        description: 'Schema is valid JSON',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="schemaEditor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          JSON Schema
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleFormatSchema}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 
                     text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
          >
            Format
          </button>
          <button
            type="button"
            onClick={handleValidateSchema}
            className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 
                     text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
          >
            Validate
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0 mb-2">
        Define the structure that events in this queue must follow
      </p>
      
      <div className="relative">
        <textarea
          id="schemaEditor"
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          rows={15}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                   bg-gray-900 text-gray-100 px-3 py-2 text-sm font-mono
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Schema Validation
          </h3>
          <button
            type="button"
            onClick={() => setShowSampleEvent(!showSampleEvent)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {showSampleEvent ? 'Hide Sample Event' : 'Show Sample Event'}
          </button>
        </div>
        
        {showSampleEvent && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Sample event based on the schema:
            </p>
            <pre className="text-xs overflow-auto bg-white dark:bg-gray-900 p-3 rounded-md">
              {`{
  "id": "evt-12345",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "message": "This is a sample event",
    "value": 42
  }
}`}
            </pre>
          </div>
        )}
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Validation Options
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="schemaEnforcement"
                type="checkbox"
                defaultChecked={nodeData.enforceSchema || true}
                className="rounded border-gray-300 dark:border-gray-700 
                         text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="schemaEnforcement" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enforce schema validation for all events
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="rejectInvalid"
                type="checkbox"
                defaultChecked={nodeData.rejectInvalid || false}
                className="rounded border-gray-300 dark:border-gray-700 
                         text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="rejectInvalid" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Reject events that don't match schema
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-100 dark:border-yellow-900/30">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-500">
            Warning
          </h4>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
            Changing the schema may affect existing bots that consume events from this queue.
            Make sure to update any dependent bots after modifying the schema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QueueSchemaTab; 