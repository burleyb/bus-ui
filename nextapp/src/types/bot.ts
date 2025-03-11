/**
 * Bot health monitoring thresholds
 */
export interface BotHealth {
  source_lag: number | null;
  write_lag: number | null;
  error_limit: number | null;
  consecutive_errors: number | null;
}

/**
 * Lambda settings for a bot
 */
export interface BotLambdaSettings {
  source?: string;
  destination?: string;
}

/**
 * Lambda configuration for a bot
 */
export interface BotLambda {
  settings?: BotLambdaSettings[];
}

/**
 * Bot trigger configuration
 */
export interface BotTrigger {
  event_source_id: string;
  event_types?: string[];
}

/**
 * Core Bot Data structure
 */
export interface BotData {
  id: string;
  name: string;
  description: string | null;
  tags: string | null;
  time?: string;
  triggers?: BotTrigger[];
  templateId?: string;
  invocationType?: string;
  lambdaName?: string;
  lambda?: BotLambda;
  health?: BotHealth;
  archived: boolean;
  paused: boolean;
  isPausing?: boolean;
  checkpoint?: string;
  lastRun?: string;
  lastCheckpoint?: string;
}

/**
 * Data for saving a bot
 */
export interface BotSaveData {
  id: string;
  name?: string;
  description?: string | null;
  tags?: string | null;
  time?: string;
  eventStreamQueue?: string;
  health?: BotHealth;
  archived?: boolean;
  paused?: boolean;
  checkpoint?: string;
  forceRun?: boolean;
} 