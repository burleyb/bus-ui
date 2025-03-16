import { NodeData } from './nodes';

// Catalog node item interface
export interface CatalogNodeItem {
  id: string;
  type: 'bot' | 'queue' | 'system';
  name: string;
  tags: string[];
  status?: string;
  lastAction?: string;
  errorCount?: number;
  readCount?: number;
  writeCount?: number;
  executionCount?: number;
  sourceLag?: number;
  writeLag?: number;
  isArchived?: boolean;
  isPaused?: boolean;
  isAlarmed?: boolean;
  health?: {
    status?: string;
  };
  icon?: string;
  description?: string;
}

// Filter states
export interface CatalogFilters {
  showQueues: boolean;
  showBots: boolean;
  showSystems: boolean;
  showArchived: boolean;
  pauseFilter: 'all' | 'paused' | 'unpaused';
  searchText: string;
  selectedTags: string[];
  timePeriod?: TimePeriod;
}

// Time period interface (similar to WorkflowFilters)
export interface TimePeriod {
  begin?: string;
  end?: string;
  interval: Interval;
}

export type Interval = 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week';

// Bookmark interface
export interface SavedBookmark {
  name: string;
  url: string;
}

// Bulk actions that can be performed on selected nodes
export enum BulkAction {
  PAUSE_BOTS = 'pause-bots',
  UNPAUSE_BOTS = 'unpause-bots',
  ARCHIVE_NODES = 'archive-nodes',
  UNARCHIVE_NODES = 'unarchive-nodes',
  FORCE_RUN = 'force-run',
  TAG_NODES = 'tag-nodes'
}

// State for URL parameters
export interface CatalogUrlState {
  filters: CatalogFilters;
  sort?: string;
  order?: 'asc' | 'desc';
  selected?: string[];
  view?: string;
} 