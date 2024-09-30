import React, { createContext, useContext, useReducer, useRef } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import _ from 'lodash';
import refUtil from "../components/utils/reference.js";

// Define initial state
const initialState = {
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
  fetchTimeout: undefined,
  filterByTag: '',
  gotInitialChangeLog: false,
  hasData: false,
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
  tagCards: JSON.parse(localStorage.getItem('tagCards') || '{}'),
  topicInfo: {},
  totalEvents: null,
  updatingStats: false,
  urlObj: {
    timePeriod: { interval: 'minute_15' },
    selected: [],
    view: 'dashboard',
    collapsed: { left: [], right: [] },
    expanded: { left: [], right: [] }
  },
  stats: null,
  systemTypes: null,
  systems: [],
};


// Reducer function to handle state changes
const dataReducer = (state, action) => {
  switch (action.type) {
    case 'SET_URL_OBJ':
      return { ...state, urlObj: { ...state.urlObj, ...action.payload } };
    case 'SET_CRON_INFO':
      return { ...state, cronInfo: action.payload };
    case 'SET_CHANGE_LOG':
      return { ...state, changeLog: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };
    case 'SET_LOGS':
      return { ...state, logs: action.payload, logDetails: action.details, active: 0 };
    case 'SET_STATS':
      return { ...state, stats: action.payload, hasData: true };
    case 'RESET_STATE':
      return { ...state, urlObj: { timePeriod: { interval: 'minute_15' }, selected: [] } };
    case 'CHANGE_DETAILS_BOOL':
      return { ...state, urlObj: { ...state.urlObj, details: action.payload } };
    case 'CHANGE_SELECTED':
      return { ...state, urlObj: { ...state.urlObj, selected: [action.payload] } };
    case 'CHANGE_TIME_PERIOD':
      return { ...state, urlObj: { ...state.urlObj, timePeriod: action.payload } };
    case 'CHANGE_NODE':
      return { ...state, urlObj: { ...state.urlObj, ...action.payload } };
    case 'CHANGE_COLLAPSED':
      return { ...state, urlObj: { ...state.urlObj, collapsed: action.payload.collapsed, expanded: action.payload.expanded } };
    case 'CHANGE_ZOOM_AND_OFFSET':
      return { ...state, urlObj: { ...state.urlObj, zoom: action.payload.zoom, offset: action.payload.offset } };
    case 'SET_CHECKSUMS':
      return { ...state, checksums: action.payload };
    default:
      return state;
  }
};

// Create context
export const DataContext = createContext(initialState);


export const useDataContext = () => {
  const context = useContext(DataContext)

  if (context === null) {
    throw new Error('useDataContext must be used within a DataProvider')
  }

  return context
}

// Provider component
export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  
  const botRef = useRef(null);

  // Function to set up URL object
  const setupURL = (urlHash) => {
    let parsed = JSON.parse(decodeURIComponent(urlHash));
    dispatch({ type: 'SET_URL_OBJ', payload: parsed });
  };

  // Function to reset state
  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // Function to change selected node
  const changeSelected = (selected) => {
    dispatch({ type: 'CHANGE_SELECTED', payload: selected });
  };

  // Function to change view details
  const changeDetailsBool = (bool) => {
    dispatch({ type: 'CHANGE_DETAILS_BOOL', payload: bool });
  };

  // Function to change node
  const changeNode = (nodeId, view, offset) => {
    dispatch({
      type: 'CHANGE_NODE',
      payload: { node: nodeId, selected: [nodeId], view, offset }
    });
  };

  // Function to change the collapsed/expanded view
  const changeCollapsed = (collapsed, expanded) => {
    dispatch({
      type: 'CHANGE_COLLAPSED',
      payload: { collapsed, expanded }
    });
  };

  // Function to change zoom and offset
  const changeZoomAndOffset = (zoom, offset) => {
    dispatch({
      type: 'CHANGE_ZOOM_AND_OFFSET',
      payload: { zoom, offset }
    });
  };

  // API call for getting cron info using `react-query`
  const { data: cronInfo, isLoading: isCronLoading } = useQuery(
    ['cron', state.urlObj.node],
    async () => {
      const { data } = await axios.get(`/api/cron/${encodeURIComponent(state.urlObj.node)}`);
      return data;
    },
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_CRON_INFO', payload: data });
      }
    }
  );

  // API call for fetching change log
  const fetchChangeLog = async (nodeId) => {
    const { data } = await axios.get(`api/search/${encodeURIComponent('queue:BotChangeLog')}/${encodeURIComponent(nodeId)}`);
    return data;
  };

  const { data: changeLogData } = useQuery(
    ['changeLog'],
    () => fetchChangeLog(state.nodes['queue:BotChangeLog']),
    {
      enabled: state.gotInitialChangeLog === false,
      onSuccess: (data) => {
        dispatch({ type: 'SET_CHANGE_LOG', payload: data.results });
      }
    }
  );

  // API call for fetching dashboard data
  const fetchDashboard = async (id, range_count, timestamp) => {
    const { data } = await axios.get(`api/dashboard/${id}?range=${range_count[0]}&count=${range_count[1] || 1}&timestamp=${timestamp}`);
    return data;
  };

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
  } = useQuery(
    ['dashboard', state.urlObj.node],
    () => fetchDashboard(state.urlObj.node, state.rangeCount, moment().format()),
    {
      onSuccess: (data) => {
        dispatch({ type: 'SET_DASHBOARD', payload: data });
      }
    }
  );

  // API call for fetching logs
  const fetchLogs = async (botId, result, customTimeFrame) => {
    const queryString = {
      start: customTimeFrame
        ? customTimeFrame
        : moment().subtract(5, 'm').valueOf(),
    };
    const { data } = await axios.get(`api/logs/${botId}/${result.isTemplated ? encodeURIComponent(result.id) : 'all'}`, queryString);
    return data;
  };

  const {
    data: logsData,
    isLoading: isLogsLoading,
  } = useQuery(
    ['logs', state.logId],
    () => fetchLogs(state.logId, state.logSettings),
    {
      onSuccess: (data) => {
        dispatch({
          type: 'SET_LOGS',
          payload: data,
          details: (data[0] || {}).details || {},
        });
      }
    }
  );

  // Function to get checksums
  const fetchChecksums = async (nodeData) => {
    const botIds = { ids: [] };
    if (nodeData.type === 'system') {
      _.map(state.nodes, (node) => {
        if (node.system === nodeData.id) {
          botIds.ids.push(refUtil.botRef(node.id).id);
        }
      });
    } else {
      botIds.ids.push(refUtil.botRef(nodeData.id).id);
    }

    const { data } = await axios.post("api/bot", JSON.stringify(botIds));
    dispatch({ type: 'SET_CHECKSUMS', payload: data });
  };

  const { data: checksumData } = useQuery(
    ['checksums', state.urlObj.node],
    () => fetchChecksums(state.urlObj.node),
    {
      enabled: !!state.urlObj.node
    }
  );

  return (
    <DataContext.Provider
      value={{
        state,
        setupURL,
        resetState,
        changeSelected,
        changeDetailsBool,
        changeNode,
        changeCollapsed,
        changeZoomAndOffset,
        isCronLoading,
        isLogsLoading,
        isDashboardLoading,
        changeLogData,
        dashboardData,
        logsData,
        checksumData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
