"use client";

import React, { useState } from 'react';

interface BotCodeTabProps {
  nodeData: any;
}

export default function BotCodeTab({ nodeData }: BotCodeTabProps) {
  const [code, setCode] = useState(nodeData.code || 
    `async function handler(event) {
  // Your bot code here
  console.log("Processing event:", event);
  
  // Example: process the event data
  const result = {
    processed: true,
    timestamp: new Date().toISOString(),
    eventId: event.id
  };
  
  return result;
}`);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Bot Code</h3>
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 text-xs rounded-md text-gray-700 dark:text-gray-300 
                      border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 
                      hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Format
          </button>
          <button 
            className="px-3 py-1 text-xs rounded-md text-gray-700 dark:text-gray-300 
                      border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 
                      hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Test
          </button>
        </div>
      </div>
      
      <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            index.js
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            JavaScript
          </span>
        </div>
        <textarea
          className="w-full h-80 px-4 py-3 bg-white dark:bg-gray-900 
                    font-mono text-sm focus:outline-none text-gray-700 dark:text-gray-300
                    resize-none"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
        />
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Runtime Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Runtime</p>
            <p className="text-sm font-medium">
              {nodeData.runtime || 'Node.js 14.x'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Handler</p>
            <p className="text-sm font-medium font-mono">
              {nodeData.handler || 'index.handler'}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Event Structure</p>
          <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded-md overflow-auto font-mono text-gray-700 dark:text-gray-300">
{`{
  "id": "evt-123456",
  "timestamp": "2023-05-22T15:30:00Z",
  "source": "queue-name",
  "data": {
    // Event-specific data
  }
}`}
          </pre>
        </div>
      </div>
      
      {/* Dependencies section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dependencies</h3>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Package
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Version
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {(nodeData.dependencies || [
              { name: 'axios', version: '^0.24.0' },
              { name: 'lodash', version: '^4.17.21' }
            ]).map((dep: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2 whitespace-nowrap text-xs font-mono text-gray-700 dark:text-gray-300">
                  {dep.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                  {dep.version}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          Add Dependency
        </button>
      </div>
    </div>
  );
} 