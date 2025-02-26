"use client";

import React, { useState } from 'react';
import { PlusCircle, Trash, RefreshCw } from 'lucide-react';

interface SystemConnectionsTabProps {
  nodeData: any;
}

interface Connection {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'degraded';
  lastChecked?: string;
}

const SystemConnectionsTab: React.FC<SystemConnectionsTabProps> = ({ nodeData }) => {
  // Initialize connections from nodeData or use defaults
  const [connections, setConnections] = useState<Connection[]>(
    nodeData.connections || [
      { id: 'conn-1', name: 'Database', type: 'postgres', status: 'connected', lastChecked: new Date().toISOString() },
      { id: 'conn-2', name: 'Message Broker', type: 'rabbitmq', status: 'connected', lastChecked: new Date().toISOString() },
      { id: 'conn-3', name: 'External API', type: 'rest', status: 'disconnected', lastChecked: new Date(Date.now() - 3600000).toISOString() }
    ]
  );
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    type: 'postgres',
    endpoint: '',
    username: '',
    password: '',
  });
  
  const refreshConnections = () => {
    setIsRefreshing(true);
    // In a real implementation, this would check all connections and update their status
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };
  
  const handleAddConnection = () => {
    if (newConnection.name && newConnection.endpoint) {
      const newId = `conn-${Date.now()}`;
      setConnections([
        ...connections,
        { 
          id: newId, 
          name: newConnection.name, 
          type: newConnection.type,
          status: 'connected',
          lastChecked: new Date().toISOString()
        }
      ]);
      setNewConnection({
        name: '',
        type: 'postgres',
        endpoint: '',
        username: '',
        password: '',
      });
      setShowAddConnection(false);
    }
  };
  
  const handleRemoveConnection = (connectionId: string) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'disconnected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Connected Services
        </h3>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowAddConnection(!showAddConnection)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium 
                     rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100
                     dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            <PlusCircle size={14} className="mr-1" />
            Add Connection
          </button>
          <button
            type="button"
            onClick={refreshConnections}
            disabled={isRefreshing}
            className="inline-flex items-center px-2 py-1 text-xs font-medium 
                     rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200
                     dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Check Status
          </button>
        </div>
      </div>
      
      {showAddConnection && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Connection</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newConnection.name}
                onChange={(e) => setNewConnection({...newConnection, name: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                          bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                          focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Production Database"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Connection Type
              </label>
              <select
                value={newConnection.type}
                onChange={(e) => setNewConnection({...newConnection, type: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                          bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                          focus:ring-2 focus:ring-blue-500"
              >
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="redis">Redis</option>
                <option value="rabbitmq">RabbitMQ</option>
                <option value="kafka">Kafka</option>
                <option value="rest">REST API</option>
                <option value="graphql">GraphQL</option>
                <option value="s3">S3 Storage</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endpoint
              </label>
              <input
                type="text"
                value={newConnection.endpoint}
                onChange={(e) => setNewConnection({...newConnection, endpoint: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                          bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                          focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., postgres://localhost:5432/mydb"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({...newConnection, username: e.target.value})}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                            focus:ring-2 focus:ring-blue-500"
                  placeholder="Username (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newConnection.password}
                  onChange={(e) => setNewConnection({...newConnection, password: e.target.value})}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 
                            bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none 
                            focus:ring-2 focus:ring-blue-500"
                  placeholder="Password (optional)"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setShowAddConnection(false)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 
                          rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300
                          bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddConnection}
                className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm 
                          font-medium text-white bg-blue-600 hover:bg-blue-700 
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Connection
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
        {connections.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {connections.map((connection) => (
              <li key={connection.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-2 w-2 ${getStatusColor(connection.status)} rounded-full mr-2`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{connection.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Type: {connection.type}</p>
                    {connection.lastChecked && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last checked: {new Date(connection.lastChecked).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusTextColor(connection.status)}`}>
                    {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveConnection(connection.id)}
                    className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No connections configured</p>
            <p className="text-sm mt-1">Add a connection to start monitoring external services</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-100 dark:border-yellow-900/30">
        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-500">
          Note
        </h4>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
          Connection credentials are stored securely and encrypted. Make sure to use credentials with appropriate permissions.
        </p>
      </div>
    </div>
  );
};

export default SystemConnectionsTab; 