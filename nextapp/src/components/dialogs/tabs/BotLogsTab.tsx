"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface BotLogsTabProps {
  nodeData: any;
}

export default function BotLogsTab({ nodeData }: BotLogsTabProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logLevel, setLogLevel] = useState('info');

  // Safeguard against null nodeData
  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Generate mock logs for demo purposes
  useEffect(() => {
    loadLogs();
  }, [nodeData]);

  const loadLogs = () => {
    setIsLoading(true);
    
    // Simulate API call to fetch logs
    setTimeout(() => {
      const mockLogs = [
        `[${new Date().toISOString()}] [INFO] Bot ${nodeData?.id || 'unknown'} started`,
        `[${new Date().toISOString()}] [INFO] Initializing handler`,
        `[${new Date().toISOString()}] [DEBUG] Fetching configuration from environment`,
        `[${new Date().toISOString()}] [INFO] Connected to queue "${Object.keys(nodeData?.queues?.read || {})[0] || 'unknown'}"`,
        `[${new Date().toISOString()}] [DEBUG] Processing batch of events`,
        `[${new Date().toISOString()}] [INFO] Processed 0 events successfully`,
        `[${new Date().toISOString()}] [INFO] Writing results to output queue`,
        `[${new Date().toISOString()}] [INFO] Handler execution completed successfully`,
      ];
      
      setLogs(mockLogs);
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    loadLogs();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Button 
            variant={logLevel === 'error' ? "destructive" : "outline"} 
            size="sm" 
            onClick={() => setLogLevel('error')}
          >
            Errors
          </Button>
          <Button 
            variant={logLevel === 'warn' ? "warning" : "outline"} 
            size="sm" 
            onClick={() => setLogLevel('warn')}
          >
            Warnings
          </Button>
          <Button 
            variant={logLevel === 'info' ? "default" : "outline"} 
            size="sm"
            onClick={() => setLogLevel('info')}
          >
            Info
          </Button>
          <Button 
            variant={logLevel === 'debug' ? "secondary" : "outline"} 
            size="sm"
            onClick={() => setLogLevel('debug')}
          >
            Debug
          </Button>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Bot Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-black text-green-400 font-mono text-xs p-4 h-[400px] overflow-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-8">No logs available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 