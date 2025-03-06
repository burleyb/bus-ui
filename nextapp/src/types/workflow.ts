export type Interval = 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week';

export interface TimePeriod {
  begin?: string;
  end?: string;
  interval: Interval;
}

export interface WorkflowGraphProps {
  selectedBot: string[];
  view?: string;
  timePeriod?: TimePeriod;
  offset?: number[];
  node?: string;
  zoom?: number;
  stats?: boolean;
}

export interface Node {
  id: string;
  status: string;
  type?: string;
  group?: number; // 0 = input, 1 = focus, 2 = output
  generation?: number; // Generation level (negative for ancestors, positive for descendants)
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  executions?: number;
  errors?: number;
  queues?: {
    write?: {
      count?: number;
      last_write?: string;
    };
    read?: {
      count?: number;
      last_source_lag?: number;
    };
  };
  link_to?: {
    parent?: Record<string, any>;
    children?: Record<string, any>;
  };
}

export interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  stats?: {
    count?: number;
    last_time?: string;
    lag?: number;
  };
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface CollapsedState {
  collapsed: { 
    left: string[]; 
    right: string[] 
  };
  expanded: { 
    left: string[]; 
    right: string[] 
  };
}

export interface NodePosition {
  x: number;
  y: number;
} 