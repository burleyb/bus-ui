import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import numeral from 'numeral';
import refUtil from '../components/utils/reference.js';

const DataContext = createContext({hasData: false});

export const DataProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // All state variables converted from MobX observables
  const [action, setAction] = useState({});
  const [active, setActive] = useState(null);
  const [activeBotCount, setActiveBotCount] = useState(0);
  const [alarmed, setAlarmed] = useState([]);
  const [alarmedCount, setAlarmedCount] = useState(0);
  const [availableTags, setAvailableTags] = useState({});
  const [authenticated, setAuthenticated] = useState(null);
  const [bots, setBots] = useState([]);
  const [config, setConfig] = useState(null);
  const [changeLog, setChangeLog] = useState(null);
  const [checksums, setChecksums] = useState({});
  const [cronInfo, setCronInfo] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [displayState, setDisplayState] = useState(null);
  const [detailsPaneNodes, setDetailsPaneNodes] = useState(null);
  const [eventSettings, setEventSettings] = useState(null);
  const [filterByTag, setFilterByTag] = useState('');
  const [hasData, setHasData] = useState(false);
  const [logDetails, setLogDetails] = useState(null);
  const [logId, setLogId] = useState(null);
  const [logSettings, setLogSettings] = useState(null);
  const [logs, setLogs] = useState(null);
  const [nodes, setNodes] = useState({});
  const [queues, setQueues] = useState([]);
  const [rangeCount, setRangeCount] = useState(null);
  const [refreshDashboard, setRefreshDashboard] = useState(true);
  const [runNow, setRunNow] = useState(null);
  const [savedSettings, setSavedSettings] = useState(null);
  const [sdkConfig, setSdkConfig] = useState({});
  const [sdkPick, setSdkPick] = useState('node');
  const [settings, setSettings] = useState(null);
  const [subNodeSettings, setSubNodeSettings] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [tableData, setTableData] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagCards, setTagCards] = useState(JSON.parse(localStorage.getItem('tagCards') || '{}'));
  const [topicInfo, setTopicInfo] = useState({});
  const [totalEvents, setTotalEvents] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [updatingStats, setUpdatingStats] = useState(false);
  const [messageQueue, setMessageQueue] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);

  const [urlObj, setUrlObj] = useState({
    timePeriod: { interval: 'minute_15' },
    selected: [],
    view: 'dashboard',
    collapsed: { left: [], right: [] },
    expanded: { left: [], right: [] },
  });
  const [stats, setStats] = useState(null);
  const [systemTypes, setSystemTypes] = useState(null);
  const [systems, setSystems] = useState([]);
  const [api, setApi] = useState('http://localhost:8080/botmon/');
  const defaultServers = ['webshipshipment', 'external.dhlftp', 'external.fraudapp', 'Webship_shipment'];
  const [servers, setServers] = useState(defaultServers);
  const defaultTimePeriod = {
    endFormatted: () => {}
  };
  const [timePeriod, setTimePeriod] = useState(defaultTimePeriod);

  // Utility function for updating state values
  const updateUrlObj = (updates) => setUrlObj((prev) => ({ ...prev, ...updates }));

  // Fetcher function for Axios
  const fetcher = (url) => axios.get(url).then((res) => res.data);

  // Queries to fetch initial data using TanStack Query
  const { data: configData, refetch: refetchConfig } = useQuery({
    queryKey: ['config'], 
    queryFn: () => fetcher(`${api}api/accessConfig`), 
    refetchInterval: 30000,
    onSuccess: (data) => setConfig(data)
  });

  const { data: eventSettingsData, refetch: refetchEventSettings } = useQuery({
    queryKey: ['eventSettings'],  
    queryFn: () => fetcher(`${api}api/eventSettings`),
    refetchInterval: 30000,
    onSuccess: (data) => setEventSettings(data)
  });

  const { data: sdkConfigData, refetch: refetchSdkConfig } = useQuery({
    queryKey: ['sdkConfig'], 
    queryFn: () => fetcher(`${api}api/sdkConfig`), 
    refetchInterval: 30000,
    onSuccess: (data) => setSdkConfig(data),
  });

  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'], 
    queryFn: () => fetcher(`${api}api/settings`), 
    refetchInterval: 30000,
    onSuccess: (data) => setSettings(data),
  });

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['stats', urlObj, timePeriod], 
    queryFn: () => fetchStats(),
    refetchInterval: 30000, 
    onSuccess: (data) => setStats(data),
  });

  // Action functions to modify URL object and various states
  const changeView = (view) => updateUrlObj({ view });
  const changeSelected = (selected) => updateUrlObj({ selected: [selected] });
  const changeTimePeriod = (begin, end, interval) =>
    updateUrlObj({ timePeriod: { begin, end, interval } });

  const changeNode = (nodeId, view, offset) =>
    updateUrlObj({ node: nodeId, selected: [nodeId], view, offset });

  const changeDetailsBool = (bool) => updateUrlObj({ details: bool });

  const resetState = () =>
    setUrlObj({
      timePeriod: { interval: 'minute_15' },
      selected: [],
    });

  const changeCollapsed = (collapsed, expanded) =>
    updateUrlObj({ collapsed, expanded });

  const changeZoomAndOffset = (zoom, offset) =>
    updateUrlObj({ zoom, offset });

  const changeAllStateValues = (selected, timePeriod, view, offset, node, zoom, details) =>
    updateUrlObj({
      selected,
      timePeriod,
      view,
      offset,
      node,
      details,
    });

  // Additional fetch actions using Axios
  const fetchChangeLog = useCallback(() => {
    if (!nodes["queue:BotChangeLog"]) return;
    const node = nodes["queue:BotChangeLog"];
    const latestWrite = node.latest_write;
    const timestamp = `z${moment.utc(latestWrite).subtract(2, 'minutes').format('/YYYY/MM/DD/HH/mm/')}${moment
      .utc(latestWrite)
      .subtract(2, 'minutes')
      .valueOf()}`;

    axios
      .get(`${api}api/search/${encodeURIComponent('queue:BotChangeLog')}/${encodeURIComponent(timestamp)}`)
      .then((result) => setChangeLog(result.data.results))
      .catch((error) => {
        if (error.status !== 'abort' && error.status !== 'canceled') {
          messageLogNotify(`Failure searching events on "${nodes["queue:BotChangeLog"].label}"`, 'error', error);
        }
      });
  }, [nodes]);

  const fetchChecksums = (nodeData) => {
    let botIds = { ids: [] };
    if (nodeData.type === 'system') {
      _.map(nodes, (node) => {
        if (node.system && node.system === nodeData.id) {
          botIds.ids.push(refUtil.botRef(node.id).id);
        }
      });
    } else {
      botIds.ids.push(refUtil.botRef(nodeData.id).id);
    }

    axios
      .post(`${api}api/bot`, botIds)
      .then((response) => {
        if (nodeData.type === 'system') {
          const newChecksums = response.data.reduce((acc, res) => {
            acc[res.id] = res.checksum;
            return acc;
          }, {});
          setChecksums(newChecksums);
        } else {
          const newChecksums = { [nodeData.id]: response.data[0].checksum };
          setChecksums(newChecksums);
        }
      })
      .catch((error) => {
        if (error.statusText !== 'abort') {
          messageLogNotify('Failure getting checksums', 'error', error);
        }
      });
  };

  const fetchDashboard = (id, rangeCount, timestamp) => {
    if (!refreshDashboard) return;
    axios
      .get(`${api}api/dashboard/${id}?range=${rangeCount[0]}&count=${rangeCount[1] || 1}&timestamp=${timestamp}`)
      .then((result) => {
        setDashboard(result.data);
      })
      .finally(() => {
        setTimeout(() => {
          fetchDashboard(id, rangeCount, timestamp);
        }, 1000);
      });
  };

  // Fetching function
  const fetchStats = async () => {
    const range = (urlObj.timePeriod.interval || 'minute_15').split('_');
    const timestamp = timePeriod?.endFormatted();

    const { data } = await axios.get(`${api}api/stats_v2?range=${range[0]}&count=${range[1] || 1}&timestamp=${timestamp}`);

    const thisnodes = { ...data.nodes.bot, ...data.nodes.queue, ...data.nodes.system };

    const postProcess = (node) => {
      let units = numeral(node.units).format('0,0');
      node.icon = !node.icon || node.icon === node.type + '.png' ? undefined : node.icon;
      node.paused = node.paused || node.status === 'paused' || node.status === 'archived';
      node.archived = node.archived || node.status === 'archived';
      
      if (node.logs && node.logs.errors?.length) {
        node.status = 'blocked';
        node.errored = true;
      }
      
      if (node.rogue) {
        node.status = 'rogue';
        node.errored = true;
      }

      node.details = {
        name: node.label,
        id: node.id,
        status: node.status,
        schedule: node.frequency || undefined,
        last_run_time: node.last_run?.start ? moment(node.last_run.start).format('MMM D, Y h:mm:ss a') : undefined,
        last_write_time: node.latest_write ? moment(node.latest_write).format('MMM D, Y h:mm:ss a') : undefined,
        error_message: node.logs?.errors[0]?.message || '',
      };
    };

    // Process each node and determine if they are orphaned
    for (let id in thisnodes) {
      postProcess(thisnodes[id]);
      let isOrphan = !['system'].includes(thisnodes[id].type);

      Object.keys(thisnodes[id].link_to?.children || {}).forEach((childId) => {
        const child = thisnodes[childId] || {};
        if (!child.archived && !child.status?.includes('archived')) {
          isOrphan = false;
        }
      });

      Object.keys(thisnodes[id].link_to?.parent || {}).forEach((parentId) => {
        const parent = thisnodes[parentId] || {};
        if (!parent.archived && !parent.status?.includes('archived')) {
          isOrphan = false;
        }
      });

      thisnodes[id].isOrphan = isOrphan;
    }

    return { thisnodes, data };
  };
  
    const updateStatsDashboard = (botList, nodeList) => {
      let newAlarmed = [];
      let newAlarmedCount = 0;
      let newAvailableTags = {};
      let newTotalEvents = 0;
      let newActiveBotCount = 0;
      let newTags = tags.slice();
  
      botList.forEach((botId) => {
        const bot = nodeList[botId];
        if (!bot) return;
        newTotalEvents += countEvents(bot);
        if (!bot.archived) newActiveBotCount++;
        if (bot.isAlarmed) {
          newAlarmedCount += 1;
          newAlarmed.push(bot);
        }
        (bot.tags || []).forEach((tag) => {
          if (!newTags.includes(tag)) newTags.push(tag);
          if (!newAvailableTags[tag]) newAvailableTags[tag] = tag;
        });
      });
  
      setActiveBotCount(newActiveBotCount);
      setTotalEvents(newTotalEvents);
      setAlarmed(newAlarmed);
      setAlarmedCount(newAlarmedCount);
      setAvailableTags(newAvailableTags);
      setTags(newTags.sort());
    };
  
    const countEvents = (node) => {
      let total = 0;
      if (node?.link_to) {
        Object.keys(node.link_to.children || {}).forEach((id) => (total += node.link_to.children[id].units || 0));
        Object.keys(node.link_to.parent || {}).forEach((id) => (total += node.link_to.parent[id].units || 0));
      }
      return total;
    };

    const formatTime = (timestamp, baseTime) => {
      const milliseconds = baseTime ? moment(timestamp).diff(baseTime) : moment().diff(timestamp);
      return [milliseconds >= 1000 ? `${milliseconds / 1000}s` : `${milliseconds}ms`, ''];
    };

    const sortAlarmed = useCallback(() => {
      const sortedAlarmed = [...alarmed].sort((a, b) => {
          const compareKey = sortDir === 'asc' ? -1 : 1;
          if (sortBy === 'name') return a.label.localeCompare(b.label) * compareKey;
          return (b[sortBy]?.value || -1 - (a[sortBy]?.value || -1)) * compareKey;
      });
      setAlarmed(sortedAlarmed);
  }, [alarmed, sortBy, sortDir]);    
  


  const timePeriodHumanize = function(milliseconds, showMilliseconds) {
    if (showMilliseconds && milliseconds < 1000) {
      return Math.round(milliseconds) + 'ms';
    }
    var seconds = Math.round(milliseconds / (1000));
    if (seconds < 60) {
      return seconds + 's';
    } else {
      var minutes = Math.floor(milliseconds / (1000 * 60));
      if (minutes < 60) {
        return minutes + 'm' + (seconds % 60 ? ', ' + (seconds % 60) + 's' : '');
      } else {
        var hours = Math.floor(milliseconds / (1000 * 60 * 60));
        if (hours < 24) {
          return hours + 'h' + (minutes % 60 ? ', ' + (minutes % 60) + 'm' : '');
        } else {
          var days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
          return days + 'd' + (hours % 24 ? ', ' + (hours % 24) + 'h' : '');
        }
      }
    }
  };

    // Helper function to build a message object
  const buildMessage = (message, priority, details) => ({
      details,
      timestamp: Date.now(),
      message: typeof message === 'string' ? [message] : message,
      priority,
  });

  // Message notification logic
  const messageNotify = (message, priority, details) => {
      const newMessage = buildMessage(message, priority, details);
      setMessageQueue((prevQueue) => [...prevQueue, newMessage]);
      nextMessage();
  };

  // Message logging logic
  const messageLog = (message, priority, details) => {
      const newMessage = buildMessage(message, priority, details);
      let messages = sessionStorage.getItem('messageQueue') || '[]';
      try {
          messages = JSON.parse(messages);
      } catch (e) {
          messages = [];
      }
      messages.push(newMessage);
      sessionStorage.setItem('messageQueue', JSON.stringify(messages));
      // messageLog(messages.length);
  };

  // Combined message notification and logging
  const messageLogNotify = (message, priority, details) => {
      messageNotify(message, priority, details);
      messageLog(message, priority, details);
  };

  // Handle showing the next message in the queue
  const nextMessage = () => {
      if (messageQueue.length > 0) {
          const next = messageQueue.shift();
          setCurrentMessage(next);
          setMessageQueue([...messageQueue]);
          setTimeout(() => {
              setCurrentMessage(null);
              setTimeout(nextMessage, 500); // Continue to the next message after a delay
          }, 2500);
      }
  };


    return (
      <DataContext.Provider
        value={{
          action,
          active,
          activeBotCount,
          alarmed,
          alarmedCount,
          availableTags,
          authenticated,
          bots,
          config,
          changeLog,
          checksums,
          cronInfo,
          dashboard,
          detailsPaneNodes,
          displayState,
          eventSettings,
          filterByTag,
          hasData,
          logDetails,
          logId,
          logSettings,
          logs,
          nodes,
          messageLog,
          messageNotify,
          messageLogNotify,
          queues,
          rangeCount,
          refreshDashboard,
          runNow,
          savedSettings,
          sdkConfig,
          sdkPick,
          settings,
          sortBy,
          sortDir,
          tableData,
          tags,
          tagCards,
          timePeriod,
          topicInfo,
          totalEvents,
          updatingStats,
          urlObj,
          stats,
          systemTypes,
          systems,
          templates,
          setAuthenticated,
          setCronInfo,
          setDetailsPaneNodes,
          setDisplayState,
          setFilterByTag,
          setHasData,
          setLogDetails,
          setLogId,
          setLogSettings,
          setLogs,
          setNodes,
          setQueues,
          setRangeCount,
          setRefreshDashboard,
          setRunNow,
          setSavedSettings,
          setSdkPick,
          setSettings,
          setSortBy,
          setSortDir,
          setStats,
          setSubNodeSettings,
          setSystemTypes,
          setSystems,
          setTableData,
          setTags,
          setTagCards,
          setTopicInfo,
          setTotalEvents,
          setTemplates,
          setTimePeriod,
          setUpdatingStats,
          setUrlObj,
          sortAlarmed,
          subNodeSettings,
          formatTime,
          fetcher,
          changeView,
          changeSelected,
          changeTimePeriod,
          changeNode,
          changeDetailsBool,
          resetState,
          changeCollapsed,
          changeZoomAndOffset,
          changeAllStateValues,
          fetchChangeLog,
          fetchChecksums,
          fetchDashboard,
          fetchStats,
          refetchConfig,
          refetchEventSettings,
          refetchSdkConfig,
          refetchSettings
        }}
      >
        {children}
      </DataContext.Provider>
    );
  };
  
  export const useData = () => {
    const context = useContext(DataContext);
  
    if (context === null) {
      throw new Error('useDialog must be used within a DialogProvider');
    }
  
    return context;
  };
  

