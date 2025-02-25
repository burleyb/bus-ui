
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import moment from 'moment';
import { useStats } from '@/hooks/useQueries';

// Define the types for our context
type TimePeriod = {
  begin?: string;
  end?: string;
  interval: string;
};

// Define types for stats data
interface NodeData {
  id: string;
  label?: string;
  type?: string;
  tags?: string;
  isAlarmed?: boolean;
  outputs?: Record<string, any>;
  inputs?: Record<string, any>;
  [key: string]: any;
}

interface StatsData {
  nodes?: {
    bot?: Record<string, NodeData>;
    queue?: Record<string, NodeData>;
    system?: Record<string, NodeData>;
    [key: string]: Record<string, NodeData> | undefined;
  };
  [key: string]: any;
}

type DataContextType = {
  view: string;
  selected: string[];
  node: string;
  timePeriod: TimePeriod;
  offset: [number, number];
  details: boolean;
  zoom: number;
  collapsed: { left: string[]; right: string[] };
  expanded: { left: string[]; right: string[] };
  nodes: Record<string, any>;
  bots: string[];
  queues: string[];
  systems: string[];
  dashboard: any;
  alarmed: any[];
  tags: string[];
  filterByTag: string;
  sortBy: string;
  sortDir: string;
  hasData: boolean;
  // Actions
  changeView: (view: string) => void;
  changeSelected: (selected: string[]) => void;
  changeNode: (nodeId: string, view: string, offset: [number, number]) => void;
  changeTimePeriod: (begin: string, end: string, interval: string) => void;
  changeDetailsBool: (details: boolean) => void;
  changeCollapsed: (collapsed: { left: string[]; right: string[] }, expanded: { left: string[]; right: string[] }) => void;
  changeZoomAndOffset: (zoom: number, offset: [number, number]) => void;
  changeAllStateValues: (
    selected: string[],
    timePeriod: TimePeriod,
    view: string,
    offset: [number, number],
    node: string,
    zoom: number,
    details: boolean
  ) => void;
};

// Create the context with default values
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider component
export const DataProvider = ({ children }: { children: ReactNode }) => {
  // URL hash state
  const [urlObj, setUrlObj] = useState<Record<string, any>>({
    timePeriod: { interval: 'minute_15' },
    selected: [],
    view: 'dashboard',
    collapsed: { left: [], right: [] },
    expanded: { left: [], right: [] }
  });
  
  // State derived from urlObj
  const [view, setView] = useState<string>(urlObj.view || 'dashboard');
  const [selected, setSelected] = useState<string[]>(urlObj.selected || []);
  const [node, setNode] = useState<string>(urlObj.node || '');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(urlObj.timePeriod || { interval: 'minute_15' });
  const [offset, setOffset] = useState<[number, number]>(urlObj.offset || [0, 0]);
  const [details, setDetails] = useState<boolean>(urlObj.details || false);
  const [zoom, setZoom] = useState<number>(urlObj.zoom || 1);
  const [collapsed, setCollapsed] = useState<{ left: string[]; right: string[] }>(urlObj.collapsed || { left: [], right: [] });
  const [expanded, setExpanded] = useState<{ left: string[]; right: string[] }>(urlObj.expanded || { left: [], right: [] });
  
  // Additional state from the original app
  const [nodes, setNodes] = useState<Record<string, any>>({});
  const [bots, setBots] = useState<string[]>([]);
  const [queues, setQueues] = useState<string[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [alarmed, setAlarmed] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [filterByTag, setFilterByTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<string>('desc');
  const [hasData, setHasData] = useState<boolean>(false);

  // Fetch stats data using TanStack Query
  const { data: statsData, isLoading: statsLoading } = useStats();

  // Setup URL from hash on initial load
  useEffect(() => {
    const setupURL = () => {
      let urlHash = decodeURIComponent(window.location.hash.substr(1));
      if (urlHash) {
        try {
          const parsed = JSON.parse(urlHash);
          setUrlObj(prev => ({ ...prev, ...parsed }));
          
          // Update state from URL
          if (parsed.view) setView(parsed.view);
          if (parsed.selected) setSelected(parsed.selected);
          if (parsed.node) setNode(parsed.node);
          if (parsed.timePeriod) setTimePeriod(parsed.timePeriod);
          if (parsed.offset) setOffset(parsed.offset);
          if (parsed.details !== undefined) setDetails(parsed.details);
          if (parsed.zoom) setZoom(parsed.zoom);
          if (parsed.collapsed) setCollapsed(parsed.collapsed);
          if (parsed.expanded) setExpanded(parsed.expanded);
        } catch (e) {
          console.error('Error parsing URL hash', e);
        }
      }
    };
    
    setupURL();
  }, []);

  // Update state from stats data
  useEffect(() => {
    if (statsData && !statsLoading) {
      const typedStatsData = statsData as StatsData;
      
      if (typedStatsData.nodes) {
        const nodesData = {
          ...(typedStatsData.nodes.bot || {}),
          ...(typedStatsData.nodes.queue || {}),
          ...(typedStatsData.nodes.system || {})
        };
        
        setNodes(nodesData);
        setBots(Object.keys(typedStatsData.nodes.bot || {}));
        setQueues(Object.keys(typedStatsData.nodes.queue || {}));
        setSystems(Object.keys(typedStatsData.nodes.system || {}));
        setHasData(true);
        
        // Process tags
        const tagSet = new Set<string>();
        if (typedStatsData.nodes.bot) {
          Object.values(typedStatsData.nodes.bot).forEach((bot: NodeData) => {
            if (bot.tags) {
              bot.tags.toString().split(/,\s*/).filter((tag: string) => tag).forEach((tag: string) => {
                tagSet.add(tag.toUpperCase());
              });
            }
          });
        }
        
        setTags(Array.from(tagSet));
        
        // Process alarmed bots
        const alarmedBots: any[] = [];
        if (typedStatsData.nodes.bot) {
          Object.values(typedStatsData.nodes.bot).forEach((bot: NodeData) => {
            if (bot.isAlarmed) {
              alarmedBots.push({
                id: bot.id,
                type: bot.type,
                tags: (bot.tags || '').toString().split(/,\s*/).sort().filter((tag: string) => tag),
                label: bot.label,
                // Add other properties as needed
              });
            }
          });
        }
        
        setAlarmed(alarmedBots);
      }
    }
  }, [statsData, statsLoading]);

  // Actions
  const changeView = useCallback((newView: string) => {
    setView(newView);
    setUrlObj(prev => ({ ...prev, view: newView }));
    updateURL({ view: newView });
  }, []);

  const changeSelected = useCallback((newSelected: string[]) => {
    setSelected(newSelected);
    setUrlObj(prev => ({ ...prev, selected: newSelected }));
    updateURL({ selected: newSelected });
  }, []);

  const changeNode = useCallback((nodeId: string, newView: string, newOffset: [number, number]) => {
    setNode(nodeId);
    setView(newView);
    setOffset(newOffset);
    setUrlObj(prev => ({ ...prev, node: nodeId, view: newView, offset: newOffset }));
    updateURL({ node: nodeId, view: newView, offset: newOffset });
  }, []);

  const changeTimePeriod = useCallback((begin: string, end: string, interval: string) => {
    const newTimePeriod = { begin, end, interval };
    setTimePeriod(newTimePeriod);
    setUrlObj(prev => ({ ...prev, timePeriod: newTimePeriod }));
    updateURL({ timePeriod: newTimePeriod });
  }, []);

  const changeDetailsBool = useCallback((newDetails: boolean) => {
    setDetails(newDetails);
    setUrlObj(prev => ({ ...prev, details: newDetails }));
    updateURL({ details: newDetails });
  }, []);

  const changeCollapsed = useCallback(
    (newCollapsed: { left: string[]; right: string[] }, newExpanded: { left: string[]; right: string[] }) => {
      setCollapsed(newCollapsed);
      setExpanded(newExpanded);
      setUrlObj(prev => ({ ...prev, collapsed: newCollapsed, expanded: newExpanded }));
      updateURL({ collapsed: newCollapsed, expanded: newExpanded });
    },
    []
  );

  const changeZoomAndOffset = useCallback((newZoom: number, newOffset: [number, number]) => {
    setZoom(newZoom);
    setOffset(newOffset);
    setUrlObj(prev => ({ ...prev, zoom: newZoom, offset: newOffset }));
    updateURL({ zoom: newZoom, offset: newOffset });
  }, []);

  const changeAllStateValues = useCallback(
    (
      newSelected: string[],
      newTimePeriod: TimePeriod,
      newView: string,
      newOffset: [number, number],
      newNode: string,
      newZoom: number,
      newDetails: boolean
    ) => {
      setSelected(newSelected);
      setTimePeriod(newTimePeriod);
      setView(newView);
      setOffset(newOffset);
      setNode(newNode);
      setZoom(newZoom);
      setDetails(newDetails);
      
      const updates = {
        selected: newSelected,
        timePeriod: newTimePeriod,
        view: newView,
        offset: newOffset,
        node: newNode,
        zoom: newZoom,
        details: newDetails,
      };
      
      setUrlObj(prev => ({ ...prev, ...updates }));
      updateURL(updates);
    },
    []
  );

  // Helper function to update URL hash
  const updateURL = (params: Record<string, any>) => {
    const newUrlObj = { ...urlObj, ...params };
    window.location.hash = JSON.stringify(newUrlObj);
  };

  const value = {
    view,
    selected,
    node,
    timePeriod,
    offset,
    details,
    zoom,
    collapsed,
    expanded,
    nodes,
    bots,
    queues,
    systems,
    dashboard,
    alarmed,
    tags,
    filterByTag,
    sortBy,
    sortDir,
    hasData,
    // Actions
    changeView,
    changeSelected,
    changeNode,
    changeTimePeriod,
    changeDetailsBool,
    changeCollapsed,
    changeZoomAndOffset,
    changeAllStateValues,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 