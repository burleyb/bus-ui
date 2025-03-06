import { useState, useEffect, useCallback, useRef } from 'react';
import { CollapsedState, TimePeriod } from '@/types/workflow';
import { parseUrlHash, updateUrlHash, debounce } from '@/utils/workflowUtils';

interface UseWorkflowGraphOptions {
  initialOffset?: number[];
  initialZoom?: number;
  initialStats?: boolean;
}

interface WorkflowGraphState {
  focusNode: string;
  selectedNodes: string[];
  timePeriod: TimePeriod;
  offset: number[];
  zoom: number;
  collapsedState: CollapsedState;
  showStats: boolean;
  isDragging: boolean;
}

export function useWorkflowGraph({
  initialOffset = [0, 0],
  initialZoom = 1,
  initialStats = true
}: UseWorkflowGraphOptions = {}) {
  // State for graph parameters
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [focusNode, setFocusNode] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>({
    interval: 'minute_15',
    begin: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    end: new Date().toISOString() // current time
  });
  
  const [offset, setOffset] = useState<number[]>(initialOffset);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [showStats, setShowStats] = useState<boolean>(initialStats);
  
  // State for collapsed/expanded nodes
  const [collapsedState, setCollapsedState] = useState<CollapsedState>({
    collapsed: { left: [], right: [] },
    expanded: { left: [], right: [] }
  });
  
  // Dragging state
  const isDragging = useRef<boolean>(false);
  const dragStartPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const offsetStartPos = useRef<number[]>([0, 0]);
  
  // Parse hash when it changes
  useEffect(() => {
    const parseHash = () => {
      const hashData = parseUrlHash();
      
      // Set selected nodes from hash
      if (hashData.selected && Array.isArray(hashData.selected) && hashData.selected.length > 0) {
        setSelectedNodes(hashData.selected);
      } else if (hashData.node) {
        // Fallback to node property
        setSelectedNodes([hashData.node]);
      } else {
        setSelectedNodes([]);
      }
      
      // Set focus node from hash
      if (hashData.node) {
        setFocusNode(hashData.node);
      } else if (hashData.selected && Array.isArray(hashData.selected) && hashData.selected.length > 0) {
        setFocusNode(hashData.selected[0]);
      } else {
        setFocusNode('');
      }
      
      // Set time period if available
      if (hashData.timePeriod) {
        setTimePeriod(hashData.timePeriod);
      }
      
      // Set zoom if available
      if (hashData.zoom !== undefined) {
        setZoom(Number(hashData.zoom));
      }
      
      // Set offset if available
      if (hashData.offset && Array.isArray(hashData.offset) && hashData.offset.length === 2) {
        setOffset(hashData.offset);
      }
      
      // Set stats toggle if available
      if (hashData.stats !== undefined) {
        setShowStats(Boolean(hashData.stats));
      }
      
      // Get collapsed and expanded state from hash
      const newCollapsedState = {
        collapsed: {
          left: Array.isArray(hashData.collapsed?.left) ? hashData.collapsed.left : [],
          right: Array.isArray(hashData.collapsed?.right) ? hashData.collapsed.right : []
        },
        expanded: {
          left: Array.isArray(hashData.expanded?.left) ? hashData.expanded.left : [],
          right: Array.isArray(hashData.expanded?.right) ? hashData.expanded.right : []
        }
      };
      
      setCollapsedState(newCollapsedState);
    };
    
    // Parse hash initially
    parseHash();
    
    // Add event listener for hash changes
    window.addEventListener('hashchange', parseHash);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('hashchange', parseHash);
    };
  }, []);
  
  // Debounced function to update URL hash
  const debouncedUpdateHash = useCallback(
    debounce((
      newOffset?: number[], 
      newZoom?: number, 
      newCollapsed?: { left: string[], right: string[] },
      newExpanded?: { left: string[], right: string[] }
    ) => {
      const params: Record<string, any> = {};
      
      if (newOffset) params.offset = newOffset;
      if (newZoom !== undefined) params.zoom = newZoom;
      if (newCollapsed) params.collapsed = newCollapsed;
      if (newExpanded) params.expanded = newExpanded;
      
      updateUrlHash(params);
    }, 100),
    []
  );
  
  // Update URL hash when state changes
  const updateGraphState = useCallback((params: Partial<WorkflowGraphState>) => {
    // Update local state
    if (params.focusNode !== undefined) {
      setFocusNode(params.focusNode);
      
      // When focus changes, also update selected nodes
      if (params.focusNode) {
        setSelectedNodes([params.focusNode]);
        
        // Update hash immediately for focus/selected changes
        updateUrlHash({
          node: params.focusNode,
          selected: [params.focusNode]
        });
      }
    }
    
    if (params.selectedNodes !== undefined) {
      setSelectedNodes(params.selectedNodes);
      
      // Update hash immediately for selected nodes changes
      updateUrlHash({
        selected: params.selectedNodes
      });
    }
    
    if (params.timePeriod !== undefined) {
      setTimePeriod(params.timePeriod);
      
      // Update hash immediately for time period changes
      updateUrlHash({
        timePeriod: params.timePeriod
      });
    }
    
    if (params.showStats !== undefined) {
      setShowStats(params.showStats);
      
      // Update hash immediately for stats changes
      updateUrlHash({
        stats: params.showStats
      });
    }
    
    // Use debounced update for offset, zoom, and collapsed state
    const shouldUpdateHash = 
      params.offset !== undefined || 
      params.zoom !== undefined || 
      params.collapsedState !== undefined;
    
    if (params.offset !== undefined) setOffset(params.offset);
    if (params.zoom !== undefined) setZoom(params.zoom);
    if (params.collapsedState !== undefined) setCollapsedState(params.collapsedState);
    
    if (shouldUpdateHash) {
      debouncedUpdateHash(
        params.offset,
        params.zoom,
        params.collapsedState?.collapsed,
        params.collapsedState?.expanded
      );
    }
  }, [debouncedUpdateHash]);
  
  // Start dragging
  const startDrag = useCallback((x: number, y: number) => {
    isDragging.current = true;
    dragStartPos.current = { x, y };
    offsetStartPos.current = [...offset];
  }, [offset]);
  
  // Update drag
  const updateDrag = useCallback((x: number, y: number) => {
    if (!isDragging.current) return;
    
    const dx = x - dragStartPos.current.x;
    const dy = y - dragStartPos.current.y;
    
    const newOffset = [
      offsetStartPos.current[0] + dx,
      offsetStartPos.current[1] + dy
    ];
    
    setOffset(newOffset);
    return newOffset;
  }, []);
  
  // End dragging
  const endDrag = useCallback(() => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    debouncedUpdateHash(offset);
  }, [offset, debouncedUpdateHash]);
  
  // Handle zoom
  const handleZoom = useCallback((factor: number) => {
    const newZoom = Math.max(0.1, Math.min(5, zoom * factor));
    setZoom(newZoom);
    debouncedUpdateHash(offset, newZoom);
    return newZoom;
  }, [zoom, offset, debouncedUpdateHash]);
  
  // Toggle collapsed state for a node
  const toggleCollapsed = useCallback((nodeId: string, direction: 'left' | 'right') => {
    const newCollapsedState = { ...collapsedState };
    
    // Check if node is already collapsed
    const collapsedIndex = newCollapsedState.collapsed[direction].indexOf(nodeId);
    
    if (collapsedIndex === -1) {
      // Node is not collapsed, so collapse it
      newCollapsedState.collapsed[direction].push(nodeId);
      
      // And remove from expanded if present
      const expandedIndex = newCollapsedState.expanded[direction].indexOf(nodeId);
      if (expandedIndex !== -1) {
        newCollapsedState.expanded[direction].splice(expandedIndex, 1);
      }
    } else {
      // Node is collapsed, so un-collapse it
      newCollapsedState.collapsed[direction].splice(collapsedIndex, 1);
    }
    
    setCollapsedState(newCollapsedState);
    debouncedUpdateHash(undefined, undefined, newCollapsedState.collapsed, newCollapsedState.expanded);
    
    return newCollapsedState;
  }, [collapsedState, debouncedUpdateHash]);
  
  // Toggle expanded state for a node
  const toggleExpanded = useCallback((nodeId: string, direction: 'left' | 'right') => {
    const newCollapsedState = { ...collapsedState };
    
    // Check if node is already expanded
    const expandedIndex = newCollapsedState.expanded[direction].indexOf(nodeId);
    
    if (expandedIndex === -1) {
      // Node is not expanded, so expand it
      newCollapsedState.expanded[direction].push(nodeId);
      
      // And remove from collapsed if present
      const collapsedIndex = newCollapsedState.collapsed[direction].indexOf(nodeId);
      if (collapsedIndex !== -1) {
        newCollapsedState.collapsed[direction].splice(collapsedIndex, 1);
      }
    } else {
      // Node is expanded, so un-expand it
      newCollapsedState.expanded[direction].splice(expandedIndex, 1);
    }
    
    setCollapsedState(newCollapsedState);
    debouncedUpdateHash(undefined, undefined, newCollapsedState.collapsed, newCollapsedState.expanded);
    
    return newCollapsedState;
  }, [collapsedState, debouncedUpdateHash]);
  
  // Toggle stats visibility
  const toggleStats = useCallback(() => {
    const newShowStats = !showStats;
    setShowStats(newShowStats);
    updateUrlHash({ stats: newShowStats });
    return newShowStats;
  }, [showStats]);
  
  return {
    // State
    selectedNodes,
    focusNode,
    timePeriod,
    offset,
    zoom,
    collapsedState,
    showStats,
    
    // Actions
    updateGraphState,
    startDrag,
    updateDrag,
    endDrag,
    handleZoom,
    toggleCollapsed,
    toggleExpanded,
    toggleStats
  };
} 