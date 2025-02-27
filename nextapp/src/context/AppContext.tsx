"use client";

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';

// Define the initial state based on the old MobX store
export interface AppState {
  action: Record<string, any>;
  active: string | null;
  activeBotCount: number;
  alarmed: any[];
  alarmedCount: number;
  availableTags: Record<string, any>;
  authenticated: boolean | null;
  bots: any[];
  config: any | null;
  changeLog: any | null;
  checksums: Record<string, any>;
  cronInfo: any | null;
  dashboard: any | null;
  displayState: any | null;
  eventSettings: any | null;
  filterByTag: string;
  gotInitialChangeLog: boolean;
  hasData: boolean;
  lastStatsUpdate: number | null;
  logDetails: any | null;
  logId: string | null;
  logSettings: any | null;
  logs: any | null;
  nodes: Record<string, any>;
  queues: any[];
  rangeCount: any | null;
  refreshDashboard: boolean;
  runNow: any | null;
  savedSettings: any | null;
  sdkConfig: Record<string, any>;
  sdkPick: string;
  settings: any | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  tableData: any | null;
  tags: any[];
  tagCards: Record<string, any>;
  topicInfo: Record<string, any>;
  totalEvents: any | null;
  updatingStats: boolean;
  urlObj: {
    timePeriod: { interval: string };
    selected: any[];
    view: string;
    collapsed: { left: any[]; right: any[] };
    expanded: { left: any[]; right: any[] };
  };
  stats: any | null;
  systemTypes: any | null;
  systems: any[];
}

// Define action types
type AppAction = 
  | { type: 'SET_ACTIVE', payload: string | null }
  | { type: 'SET_BOTS', payload: any[] }
  | { type: 'SET_DASHBOARD', payload: any }
  | { type: 'SET_NODES', payload: Record<string, any> }
  | { type: 'SET_STATS', payload: any }
  | { type: 'CHANGE_VIEW', payload: string }
  | { type: 'CHANGE_SELECTED', payload: any[] }
  | { type: 'CHANGE_TIME_PERIOD', payload: { begin?: number, end?: number, interval: string } }
  | { type: 'SET_FILTER_BY_TAG', payload: string }
  | { type: 'SET_SORT', payload: { sortBy: string, sortDir: 'asc' | 'desc' } }
  | { type: 'SET_SDK_PICK', payload: string }
  | { type: 'SET_AUTHENTICATED', payload: boolean }
  | { type: 'RESET_STATE' }
  | { type: 'UPDATE_STATE', payload: Partial<AppState> };

// Helper function to safely access localStorage
const getStoredTagCards = (): Record<string, any> => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('tagCards');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return {};
    }
  }
  return {};
};

// Define the initial state
const initialState: AppState = {
  action: {},
  active: null,
  activeBotCount: 0,
  alarmed: [],
  alarmedCount: 0,
  availableTags: {},
  authenticated: null,
  bots: [],
  config: null,
  changeLog: null,
  checksums: {},
  cronInfo: null,
  dashboard: null,
  displayState: null,
  eventSettings: null,
  filterByTag: '',
  gotInitialChangeLog: false,
  hasData: false,
  lastStatsUpdate: null,
  logDetails: null,
  logId: null,
  logSettings: null,
  logs: null,
  nodes: {},
  queues: [],
  rangeCount: null,
  refreshDashboard: true,
  runNow: null,
  savedSettings: null,
  sdkConfig: {},
  sdkPick: 'node',
  settings: null,
  sortBy: '',
  sortDir: 'desc',
  tableData: null,
  tags: [],
  tagCards: getStoredTagCards(),
  topicInfo: {},
  totalEvents: null,
  updatingStats: false,
  urlObj: { 
    timePeriod: { interval: "minute_15" }, 
    selected: [], 
    view: "dashboard", 
    collapsed: { left: [], right: [] }, 
    expanded: { left: [], right: [] }
  },
  stats: null,
  systemTypes: null,
  systems: [],
};

// Create the reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE':
      return { ...state, active: action.payload };
    case 'SET_BOTS':
      return { ...state, bots: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };
    case 'SET_NODES':
      return { ...state, nodes: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'CHANGE_VIEW':
      return { 
        ...state, 
        urlObj: { 
          ...state.urlObj, 
          view: action.payload 
        } 
      };
    case 'CHANGE_SELECTED':
      return { 
        ...state, 
        urlObj: { 
          ...state.urlObj, 
          selected: action.payload 
        } 
      };
    case 'CHANGE_TIME_PERIOD':
      return { 
        ...state, 
        urlObj: { 
          ...state.urlObj, 
          timePeriod: { 
            ...state.urlObj.timePeriod, 
            ...action.payload 
          } 
        } 
      };
    case 'SET_FILTER_BY_TAG':
      return { ...state, filterByTag: action.payload };
    case 'SET_SORT':
      return { 
        ...state, 
        sortBy: action.payload.sortBy, 
        sortDir: action.payload.sortDir 
      };
    case 'SET_SDK_PICK':
      return { ...state, sdkPick: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, authenticated: action.payload };
    case 'RESET_STATE':
      return initialState;
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// Define the context interfaces
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Sync tagCards with localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tagCards', JSON.stringify(state.tagCards));
    }
  }, [state.tagCards]);

  // Add this effect to sync with AuthProvider if it becomes available
  useEffect(() => {
    // Listen for authentication status changes from other sources
    const handleAuthChange = (event: StorageEvent) => {
      if (event.key === 'auth_status') {
        const newStatus = event.newValue === 'true';
        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: newStatus
        });
      }
    };

    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook for using the app context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 