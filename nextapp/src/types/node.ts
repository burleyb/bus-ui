export interface Queue {
  id: string;
  checkpoint?: string;
  [key: string]: any;
}

export interface QueueMap {
  read?: Record<string, Queue>;
  write?: Record<string, Queue>;
  [key: string]: any;
}

export interface NodeStats {
  executions?: number;
  errors?: number;
  avgDuration?: number;
  maxDuration?: number;
  lastRun?: string | null;
  errorRate?: number;
  [key: string]: any;
}

export interface NodeData {
  id: string;
  name: string;
  type: 'bot' | 'queue' | 'system' | 'infinity' | 'unknown';
  status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR' | 'UNKNOWN';
  parentNodes: string[];
  childNodes: string[];
  queues?: QueueMap;
  stats?: NodeStats;
  error?: string;
  [key: string]: any;
} 