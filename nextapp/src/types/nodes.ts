/**
 * Node Types and Interfaces
 */

export interface NodeData {
  checkpoints: any;
  id: string;
  name?: string;
  type: 'bot' | 'queue' | 'system' | 'infinity' | 'unknown';
  status?: string;
  description?: string;
  paused?: boolean;
  archived?: boolean;
  icon?: string;
  templateId?: string;
  eid?: string;
  connections?: {
    inputs?: string[];
    outputs?: string[];
  };
  memorySize?: number;
  timeout?: number;
  concurrency?: number;
  performance?: {
    avgExecutionTime?: number;
    maxExecutionTime?: number;
    invocations?: number;
    errors?: number;
    lastInvocation?: string;
  };
}

export interface BotNode extends NodeData {
  type: 'bot';
  code?: string;
  language?: string;
  handler?: string;
}

export interface QueueNode extends NodeData {
  type: 'queue';
  schema?: Record<string, any>;
}

export interface SystemNode extends NodeData {
  type: 'system';
  config?: Record<string, any>;
} 