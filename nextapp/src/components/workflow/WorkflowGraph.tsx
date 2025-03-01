"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import * as d3 from 'd3';
import { useDialogs } from '@/hooks/useDialogs';
import { getNodeImagesSvgString } from '@/components/node/NodeIcon';
import { formatDistanceToNow } from 'date-fns';
import { Crosshair, Settings, ChevronRight, ChevronLeft } from 'lucide-react';

interface WorkflowGraphProps {
  selectedBot: string[];
  view?: string;
  timePeriod?: {
    begin?: string;
    end?: string;
    interval: 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week';
  };
  offset?: number[];
  node?: string;
  zoom?: number;
  stats?: boolean;
}

type Node = {
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
};

type Link = {
  source: string | Node;
  target: string | Node;
  value: number;
  stats?: {
    count?: number;
    last_time?: string;
    lag?: number;
  };
};

type GraphData = {
  nodes: Node[];
  links: Link[];
};

// Store node positions across rerenders
const fixedPositions: Record<string, { x: number, y: number }> = {};

export default function WorkflowGraph({ 
  selectedBot, 
  timePeriod, 
  offset = [0, 0], 
  zoom = 1,
  stats = false
}: WorkflowGraphProps) {
  const { state } = useAppContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { openNodeSettingsDialog } = useDialogs();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialLayoutComplete = useRef<boolean>(false);
  const [noFocusMessage, setNoFocusMessage] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // State for collapsed/expanded nodes is now derived from URL hash
  const [collapsedState, setCollapsedState] = useState<{
    collapsed: { left: string[], right: string[] },
    expanded: { left: string[], right: string[] }
  }>({
    collapsed: { left: [], right: [] },
    expanded: { left: [], right: [] }
  });
  
  const [localOffset, setLocalOffset] = useState<number[]>(offset);
  const [localZoom, setLocalZoom] = useState<number>(zoom);
  const isDragging = useRef<boolean>(false);
  const dragStartPos = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const offsetStartPos = useRef<number[]>([0, 0]);
  
  // Get the primary focus node (first one in the array)
  const primaryNode = selectedBot && selectedBot.length > 0 ? selectedBot[0] : '';
  
  // Set up background color variable for node circles based on theme
  useEffect(() => {
    // Check if we're in dark mode
    const isDarkMode = window.matchMedia && 
      (window.matchMedia('(prefers-color-scheme: dark)').matches || 
       document.documentElement.classList.contains('dark'));
    
    // Set the CSS variable based on theme
    document.documentElement.style.setProperty(
      '--bg-color', 
      isDarkMode ? '#1f2937' : '#ffffff'
    );
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.style.setProperty(
        '--bg-color', 
        e.matches ? '#1f2937' : '#ffffff'
      );
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Read collapsed/expanded state from URL hash on initialization and when hash changes
  useEffect(() => {
    const parseCollapsedState = () => {
      try {
        if (window.location.hash && window.location.hash.length > 1) {
          const hashStr = decodeURIComponent(window.location.hash.substring(1));
          if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
            const hashData = JSON.parse(hashStr);
            
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
          }
        }
      } catch (error) {
        console.error('Error parsing collapsed state from hash:', error);
      }
    };
    
    // Parse hash initially
    parseCollapsedState();
    
    // Add event listener for hash changes
    window.addEventListener('hashchange', parseCollapsedState);
    
    return () => window.removeEventListener('hashchange', parseCollapsedState);
  }, []);
  
  // Update local state when props change
  useEffect(() => {
    setLocalOffset(offset);
  }, [offset]);
  
  useEffect(() => {
    setLocalZoom(zoom);
  }, [zoom]);
  
  // Update URL hash with all relevant data including collapsed/expanded state
  const updateUrlHash = useCallback((
    newOffset?: number[], 
    newZoom?: number, 
    newCollapsed?: { left: string[], right: string[] },
    newExpanded?: { left: string[], right: string[] }
  ) => {
    const updatedOffset = newOffset || localOffset;
    const updatedZoom = newZoom || localZoom;
    const updatedCollapsed = newCollapsed || collapsedState.collapsed;
    const updatedExpanded = newExpanded || collapsedState.expanded;
    
    try {
      // Get current hash data
      let hashData: Record<string, any> = {};
      if (window.location.hash && window.location.hash.length > 1) {
        try {
          const hashStr = decodeURIComponent(window.location.hash.substring(1));
          if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
            hashData = JSON.parse(hashStr);
          }
        } catch (error) {
          console.error('Error parsing hash:', error);
        }
      }
      
      // Update data in hash
      hashData.offset = updatedOffset;
      hashData.zoom = updatedZoom;
      hashData.collapsed = updatedCollapsed;
      hashData.expanded = updatedExpanded;
      
      // Ensure stats parameter is preserved
      if (hashData.stats === undefined) {
        hashData.stats = stats; // Default to current stats value
      }
      
      // Update the URL hash
      const hashStr = JSON.stringify(hashData);
      window.location.hash = encodeURIComponent(hashStr);
    } catch (error) {
      console.error('Error updating URL hash:', error);
    }
  }, [localOffset, localZoom, collapsedState, stats]);
  
  // Debounced update function for smooth updates
  const debouncedUpdateUrl = useCallback(
    debounce((
      offset: number[], 
      zoom: number, 
      collapsed?: { left: string[], right: string[] },
      expanded?: { left: string[], right: string[] }
    ) => {
      updateUrlHash(offset, zoom, collapsed, expanded);
    }, 100),
    []
  );
  
  // Set up wheel event for zooming - MOVED TO BEFORE CONDITIONAL RETURNS but AFTER debouncedUpdateUrl
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      
      // Calculate new zoom based on wheel delta
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // Zoom out if positive, zoom in if negative
      const newZoom = Math.max(0.1, Math.min(5, localZoom * zoomFactor)); // Clamp between 0.1 and 5
      
      setLocalZoom(newZoom);
      debouncedUpdateUrl(localOffset, newZoom, collapsedState.collapsed, collapsedState.expanded);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [localZoom, localOffset, debouncedUpdateUrl, collapsedState]);

  // Handle mouse events for dragging the canvas - MOVED TO BEFORE CONDITIONAL RETURNS but AFTER debouncedUpdateUrl
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseDown = (event: MouseEvent) => {
      // Only initiate drag on primary button (left click)
      if (event.button !== 0) return;
      
      // Check if the click is directly on the canvas, not on a node
      if ((event.target as Element).tagName === 'svg' || 
          (event.target as Element).classList.contains('canvas-drag-area')) {
        isDragging.current = true;
        dragStartPos.current = { x: event.clientX, y: event.clientY };
        offsetStartPos.current = [...localOffset];
        document.body.style.cursor = 'grabbing';
        event.preventDefault();
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging.current) return;
      
      const dx = event.clientX - dragStartPos.current.x;
      const dy = event.clientY - dragStartPos.current.y;
      
      const newOffset = [
        offsetStartPos.current[0] + dx,
        offsetStartPos.current[1] + dy
      ];
      
      setLocalOffset(newOffset);
      
      // Update the graph with new offset
      drawGraph(newOffset, localZoom);
      
      // Don't update URL on every move to avoid performance issues
      // That will happen on mouse up
    };
    
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        
        // Update URL when drag ends
        debouncedUpdateUrl(localOffset, localZoom, collapsedState.collapsed, collapsedState.expanded);
      }
    };
    
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [localOffset, localZoom, debouncedUpdateUrl, collapsedState]);
  
  // Helper function to check if a node is collapsed
  const isNodeCollapsed = useCallback((nodeId: string, direction: 'left' | 'right'): boolean => {
    const side = direction === 'left' ? 'parents' : 'children';
    const collapseArray = direction === 'left' ? collapsedState.collapsed.left : collapsedState.collapsed.right;
    
    return collapseArray.includes(nodeId);
  }, [collapsedState]);
  
  // Function to toggle collapsed state of a node's children (right)
  const toggleChildrenCollapse = useCallback((nodeId: string) => {
    setCollapsedState(prevState => {
      // Check if node is already in collapsed.right
      const isCollapsed = prevState.collapsed.right.includes(nodeId);
      let newCollapsed, newExpanded;
      
      if (isCollapsed) {
        // Remove from collapsed, add to expanded
        newCollapsed = {
          ...prevState.collapsed,
          right: prevState.collapsed.right.filter(id => id !== nodeId)
        };
        newExpanded = {
          ...prevState.expanded,
          right: [...prevState.expanded.right, nodeId]
        };
      } else {
        // Add to collapsed, remove from expanded
        newCollapsed = {
          ...prevState.collapsed,
          right: [...prevState.collapsed.right, nodeId]
        };
        newExpanded = {
          ...prevState.expanded,
          right: prevState.expanded.right.filter(id => id !== nodeId)
        };
      }
      
      // Update URL with new collapsed/expanded state
      debouncedUpdateUrl(localOffset, localZoom, newCollapsed, newExpanded);
      
      return { collapsed: newCollapsed, expanded: newExpanded };
    });
  }, [localOffset, localZoom, debouncedUpdateUrl]);
  
  // Function to toggle collapsed state of a node's parents (left)
  const toggleParentsCollapse = useCallback((nodeId: string) => {
    setCollapsedState(prevState => {
      // Check if node is already in collapsed.left
      const isCollapsed = prevState.collapsed.left.includes(nodeId);
      let newCollapsed, newExpanded;
      
      if (isCollapsed) {
        // Remove from collapsed, add to expanded
        newCollapsed = {
          ...prevState.collapsed,
          left: prevState.collapsed.left.filter(id => id !== nodeId)
        };
        newExpanded = {
          ...prevState.expanded,
          left: [...prevState.expanded.left, nodeId]
        };
      } else {
        // Add to collapsed, remove from expanded
        newCollapsed = {
          ...prevState.collapsed,
          left: [...prevState.collapsed.left, nodeId]
        };
        newExpanded = {
          ...prevState.expanded,
          left: prevState.expanded.left.filter(id => id !== nodeId)
        };
      }
      
      // Update URL with new collapsed/expanded state
      debouncedUpdateUrl(localOffset, localZoom, newCollapsed, newExpanded);
      
      return { collapsed: newCollapsed, expanded: newExpanded };
    });
  }, [localOffset, localZoom, debouncedUpdateUrl]);

  // Add a useEffect to update button visibility when hoveredNode changes
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Hide all action buttons first
    d3.select(svgRef.current)
      .selectAll('.action-buttons')
      .attr('opacity', 0)
      .attr('pointer-events', 'none');
    
    // If there's a hovered node, show its action buttons
    if (hoveredNode) {
      d3.select(svgRef.current)
        .selectAll(`.action-buttons[data-node-id="${hoveredNode}"]`)
        .attr('opacity', 1)
        .attr('pointer-events', 'all');
    }
  }, [hoveredNode]);

  // Prepare graph data based on selected focus node
  const graphData = React.useMemo<GraphData>(() => {
    const data: GraphData = { nodes: [], links: [] };
    
    // Only show graph when a focus node is selected
    if (!primaryNode || !state.nodes || Object.keys(state.nodes).length === 0) {
      setNoFocusMessage(!primaryNode);
      return data;
    }
    
    setNoFocusMessage(false);
    const focusNodeData = state.nodes[primaryNode];
    
    // If focus node doesn't exist in our data, return empty graph
    if (!focusNodeData) {
      return data;
    }
    
    // Track visited nodes to avoid cycles
    const visited = new Set<string>();
    
    // Helper function to add a node to the graph data
    const addNodeToGraph = (nodeId: string, generation: number, group: number) => {
      if (visited.has(nodeId)) return;
      
      const nodeData = state.nodes[nodeId];
      if (!nodeData) return;
      
      visited.add(nodeId);
      
      data.nodes.push({
        id: nodeId,
        status: nodeData.status || 'unknown',
        type: nodeData.type || 'unknown',
        group, // 0 = ancestor, 1 = focus, 2 = descendant
        generation, // Negative for ancestors, 0 for focus, positive for descendants
        executions: nodeData.executions || 0,
        errors: nodeData.errors || 0,
        queues: nodeData.queues,
        link_to: nodeData.link_to
      });
    };
    
    // Add focus node to the graph
    addNodeToGraph(primaryNode, 0, 1);
    
    // Recursively add ancestor nodes (parents and their parents)
    const addAncestors = (nodeId: string, generation: number) => {
      const nodeData = state.nodes[nodeId];
      if (!nodeData || !nodeData.link_to?.parent) return;
      
      // Check if this node is collapsed
      const isCollapsed = collapsedState.collapsed.left.includes(nodeId);
      if (isCollapsed) return;
      
      // Add each parent
      Object.keys(nodeData.link_to.parent).forEach(parentId => {
        const parentNode = state.nodes[parentId];
        if (!parentNode) return;
        
        // Check if we've already visited this node
        if (!visited.has(parentId)) {
          // Add parent node with generation - 1 (moving left)
          addNodeToGraph(parentId, generation - 1, 0);
          
          // Add link from parent to child
          const linkStats = {
            count: 0,
            last_time: '',
            lag: 0
          };
          
          // For queue->bot connection, get stats from bot's read queue data
          if (parentNode.type === 'queue' && nodeData.type === 'bot' && nodeData.queues?.read) {
            const readStats = nodeData.queues.read[parentId];
            if (readStats) {
              linkStats.count = readStats.count || 0;
              linkStats.lag = readStats.last_source_lag || 0;
            }
          }
          
          // For bot->queue connection, get stats from bot's write queue data
          if (parentNode.type === 'bot' && nodeData.type === 'queue' && parentNode.queues?.write) {
            const writeStats = parentNode.queues.write[nodeId];
            if (writeStats) {
              linkStats.count = writeStats.count || 0;
              linkStats.last_time = writeStats.last_write || '';
            }
          }
          
          data.links.push({
            source: parentId,
            target: nodeId,
            value: 1,
            stats: linkStats
          });
          
          // Recursively add ancestors of this parent
          addAncestors(parentId, generation - 1);
        }
      });
    };
    
    // Recursively add descendant nodes (children and their children)
    const addDescendants = (nodeId: string, generation: number) => {
      const nodeData = state.nodes[nodeId];
      if (!nodeData || !nodeData.link_to?.children) return;
      
      // Check if this node is collapsed
      const isCollapsed = collapsedState.collapsed.right.includes(nodeId);
      if (isCollapsed) return;
      
      // Add each child
      Object.keys(nodeData.link_to.children).forEach(childId => {
        const childNode = state.nodes[childId];
        if (!childNode) return;
        
        // Check if we've already visited this node
        if (!visited.has(childId)) {
          // Add child node with generation + 1 (moving right)
          addNodeToGraph(childId, generation + 1, 2);
          
          // Add link from parent to child
          const linkStats = {
            count: 0,
            last_time: '',
            lag: 0
          };
          
          // For bot->queue connection, get stats from bot's write queue data
          if (nodeData.type === 'bot' && childNode.type === 'queue' && nodeData.queues?.write) {
            const writeStats = nodeData.queues.write[childId];
            if (writeStats) {
              linkStats.count = writeStats.count || 0;
              linkStats.last_time = writeStats.last_write || '';
            }
          }
          
          // For queue->bot connection, get stats from bot's read queue data
          if (nodeData.type === 'queue' && childNode.type === 'bot' && childNode.queues?.read) {
            const readStats = childNode.queues.read[nodeId];
            if (readStats) {
              linkStats.count = readStats.count || 0;
              linkStats.lag = readStats.last_source_lag || 0;
            }
          }
          
          data.links.push({
            source: nodeId,
            target: childId,
            value: 1,
            stats: linkStats
          });
          
          // Recursively add descendants of this child
          addDescendants(childId, generation + 1);
        }
      });
    };
    
    // Start recursive traversal from the focus node
    addAncestors(primaryNode, 0);
    addDescendants(primaryNode, 0);
    
    return data;
  }, [state.nodes, selectedBot, primaryNode, collapsedState]);

  // Reset positions when selected bot changes
  useEffect(() => {
    initialLayoutComplete.current = false;
    
    // Clear stored positions when focus node changes
    Object.keys(fixedPositions).forEach(key => {
      delete fixedPositions[key];
    });
  }, [primaryNode]);

  // Resize handler to update the graph when container size changes
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current && containerRef.current) {
        // On resize, we reset the layout
        initialLayoutComplete.current = false;
        Object.keys(fixedPositions).forEach(key => {
          delete fixedPositions[key];
        });
        drawGraph();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Draw the graph when data changes
  useEffect(() => {
    drawGraph();
  }, [graphData, zoom, offset, stats]);

  // Format time ago from timestamp
  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Modified drawGraph function to handle new interaction features
  const drawGraph = (currentOffset = localOffset, currentZoom = localZoom) => {
    // If no focus node selected, don't draw anything
    if (!primaryNode) return;
    
    // If no nodes or container not ready, don't draw
    if (!graphData.nodes.length || !svgRef.current || !containerRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous graph
    
    // Add a canvas drag area that covers the entire SVG
    svg.append("rect")
      .attr("class", "canvas-drag-area")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "transparent")
      .attr("pointer-events", "all");
    
    // Use the container's dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Create a group for the graph with margins
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left + currentOffset[0]},${margin.top + currentOffset[1]}) scale(${currentZoom})`);
    
    // Set positions based on node groups
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // =========================================================================
    // NEW HIERARCHICAL TREE LAYOUT ALGORITHM
    // =========================================================================
    
    // STEP 1: Define constants for spacing and dimensions
    const NODE_RADIUS = 24;
    const MIN_NODE_SPACING = 240; // Fixed vertical spacing between sibling nodes (pixels)
    const GENERATION_SPACING = 220; // Horizontal spacing between generations (pixels)
    
    // STEP 2: Build hierarchical tree structure
    const nodeMap = new Map<string, {
      node: Node,
      children: string[],
      parents: string[],
      x: number,
      y: number,
      level: number, // Vertical level within a generation
      totalLevels: number, // Total number of levels in this node's generation
      branchHeight: number, // Height of the branch starting from this node
    }>();
    
    // Initialize nodeMap with all nodes
    graphData.nodes.forEach(node => {
      nodeMap.set(node.id, {
        node,
        children: [],
        parents: [],
        x: 0,
        y: 0,
        level: 0,
        totalLevels: 1,
        branchHeight: 1, // Initially, each node has a branch height of 1 (itself)
      });
    });
    
    // Populate parent-child relationships from links
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);
      
      if (sourceNode && targetNode) {
        const sourceGen = sourceNode.node.generation || 0;
        const targetGen = targetNode.node.generation || 0;
        
        // Determine direction based on generation
        if (sourceGen < targetGen) {
          // Source is parent of target
          sourceNode.children.push(targetId);
          targetNode.parents.push(sourceId);
        } else if (targetGen < sourceGen) {
          // Target is parent of source
          targetNode.children.push(sourceId);
          sourceNode.parents.push(targetId);
        }
      }
    });
    
    // STEP 3: Collect nodes by generation and sort them
    const nodesByGeneration = new Map<number, string[]>();
    
    graphData.nodes.forEach(node => {
      const generation = node.generation || 0;
      if (!nodesByGeneration.has(generation)) {
        nodesByGeneration.set(generation, []);
      }
      nodesByGeneration.get(generation)!.push(node.id);
    });
    
    // Get min and max generations
    const allGenerations = Array.from(nodesByGeneration.keys()).sort((a, b) => a - b);
    const minGeneration = allGenerations[0];
    const maxGeneration = allGenerations[allGenerations.length - 1];
    
    // STEP 4: Set horizontal positions based on generation
    const centerX = innerWidth / 2;
    
    // Horizontal placement - each generation gets a fixed x position
    nodesByGeneration.forEach((nodeIds, generation) => {
      nodeIds.forEach(nodeId => {
        const nodeInfo = nodeMap.get(nodeId);
        if (nodeInfo) {
          // Calculate x position based on generation
          nodeInfo.x = centerX + (generation * GENERATION_SPACING);
        }
      });
    });
    
    // STEP 5: Calculate vertical levels and positions using a tree layout algorithm
    
    // First, process generation 0 (focus node)
    if (nodesByGeneration.has(0)) {
      const gen0Nodes = nodesByGeneration.get(0)!;
      const totalNodes = gen0Nodes.length;
      
      // Place generation 0 nodes in the center vertically
      gen0Nodes.forEach((nodeId, index) => {
        const nodeInfo = nodeMap.get(nodeId);
        if (nodeInfo) {
          nodeInfo.level = index;
          nodeInfo.totalLevels = totalNodes;
          nodeInfo.y = (index - totalNodes / 2 + 0.5) * MIN_NODE_SPACING;
        }
      });
    }
    
    // FIRST PASS: Calculate branch heights from leaf nodes to roots
    // Start from the maximum generation (leaf nodes) and work backwards
    
    // Process positive generations (descendants) first
    for (let gen = maxGeneration; gen > 0; gen--) {
      if (!nodesByGeneration.has(gen)) continue;
      
      const currentGenNodes = nodesByGeneration.get(gen)!;
      
      // For each node in this generation
      currentGenNodes.forEach(nodeId => {
        const nodeInfo = nodeMap.get(nodeId);
        if (!nodeInfo) return;
        
        // For leaf nodes, branch height is 1 (already set)
        // For non-leaf nodes, branch height is the sum of children's branch heights
        if (nodeInfo.children.length === 0) {
          nodeInfo.branchHeight = 1;
        } else {
          let totalChildBranchHeight = 0;
          nodeInfo.children.forEach(childId => {
            const childInfo = nodeMap.get(childId);
            if (childInfo && childInfo.node.generation! > nodeInfo.node.generation!) {
              totalChildBranchHeight += childInfo.branchHeight;
            }
          });
          // If no forward children found, set minimum height of 1
          nodeInfo.branchHeight = Math.max(1, totalChildBranchHeight);
        }
        
        // Propagate branch height to parents
        nodeInfo.parents.forEach(parentId => {
          const parentInfo = nodeMap.get(parentId);
          if (parentInfo && parentInfo.node.generation! < nodeInfo.node.generation!) {
            // Parent's branch height will be updated when its generation is processed
          }
        });
      });
    }
    
    // Then process generation 0
    if (nodesByGeneration.has(0)) {
      const gen0Nodes = nodesByGeneration.get(0)!;
      gen0Nodes.forEach(nodeId => {
        const nodeInfo = nodeMap.get(nodeId);
        if (!nodeInfo) return;
        
        // Calculate descendant branch height
        let descendantBranchHeight = 0;
        nodeInfo.children.forEach(childId => {
          const childInfo = nodeMap.get(childId);
          if (childInfo && childInfo.node.generation! > 0) {
            descendantBranchHeight += childInfo.branchHeight;
          }
        });
        
        // Calculate ancestor branch height
        let ancestorBranchHeight = 0;
        nodeInfo.parents.forEach(parentId => {
          const parentInfo = nodeMap.get(parentId);
          if (parentInfo && parentInfo.node.generation! < 0) {
            ancestorBranchHeight += parentInfo.branchHeight;
          }
        });
        
        // Branch height should account for both directions
        nodeInfo.branchHeight = Math.max(1, Math.max(descendantBranchHeight, ancestorBranchHeight));
      });
    }
    
    // Finally process negative generations (ancestors)
    for (let gen = -1; gen >= minGeneration; gen--) {
      if (!nodesByGeneration.has(gen)) continue;
      
      const currentGenNodes = nodesByGeneration.get(gen)!;
      
      // For each node in this generation
      currentGenNodes.forEach(nodeId => {
        const nodeInfo = nodeMap.get(nodeId);
        if (!nodeInfo) return;
        
        // For leaf nodes, branch height is 1 (already set)
        // For non-leaf nodes, branch height is the sum of children's branch heights
        if (nodeInfo.parents.length === 0) {
          nodeInfo.branchHeight = 1;
        } else {
          let totalParentBranchHeight = 0;
          nodeInfo.parents.forEach(parentId => {
            const parentInfo = nodeMap.get(parentId);
            if (parentInfo && parentInfo.node.generation! < nodeInfo.node.generation!) {
              totalParentBranchHeight += parentInfo.branchHeight;
            }
          });
          // If no backward parents found, set minimum height of 1
          nodeInfo.branchHeight = Math.max(1, totalParentBranchHeight);
        }
      });
    }
    
    // SECOND PASS: Position nodes using branch heights for spacing
    
    // First, position generation 0 nodes (usually just one focus node)
    if (nodesByGeneration.has(0)) {
      const gen0Nodes = nodesByGeneration.get(0)!;
      const totalNodes = gen0Nodes.length;
      
      let yOffset = 0;
      gen0Nodes.forEach((nodeId, index) => {
        const nodeInfo = nodeMap.get(nodeId);
        if (nodeInfo) {
          nodeInfo.y = yOffset;
          // Add the node's branch height to the offset for the next node
          yOffset += nodeInfo.branchHeight * MIN_NODE_SPACING;
        }
      });
    }
    
    // Position negative generations (ancestors)
    for (let gen = -1; gen >= minGeneration; gen--) {
      if (!nodesByGeneration.has(gen)) continue;
      
      const currentGenNodes = nodesByGeneration.get(gen)!;
      
      // Group nodes by their children
      const nodesByChildren = new Map<string, string[]>();
      
      currentGenNodes.forEach(nodeId => {
        const nodeInfo = nodeMap.get(nodeId);
        if (!nodeInfo) return;
        
        // Find children in the next generation
        const childrenInNextGen = nodeInfo.children.filter(childId => {
          const childInfo = nodeMap.get(childId);
          return childInfo && childInfo.node.generation === gen + 1;
        });
        
        if (childrenInNextGen.length > 0) {
          // Use the first child as a grouping key
          const primaryChildId = childrenInNextGen[0];
          if (!nodesByChildren.has(primaryChildId)) {
            nodesByChildren.set(primaryChildId, []);
          }
          nodesByChildren.get(primaryChildId)!.push(nodeId);
        } else {
          // Node has no children in next gen, treat it as an independent group
          nodesByChildren.set(`orphan_${nodeId}`, [nodeId]);
        }
      });
      
      // Position nodes based on their relationships
      const sortedChildGroups = Array.from(nodesByChildren.entries())
        .sort((a, b) => {
          const aChildId = a[0].startsWith('orphan_') ? a[0].substring(7) : a[0];
          const bChildId = b[0].startsWith('orphan_') ? b[0].substring(7) : b[0];
          
          const aChildInfo = nodeMap.get(aChildId);
          const bChildInfo = nodeMap.get(bChildId);
          
          if (!aChildInfo || !bChildInfo) return 0;
          return aChildInfo.y - bChildInfo.y;
        });
      
      // Now position the parents
      sortedChildGroups.forEach(([childId, parentIds]) => {
        // Sort parents for consistent ordering
        parentIds.sort((a, b) => a.localeCompare(b));
        
        if (!childId.startsWith('orphan_')) {
          const childInfo = nodeMap.get(childId);
          if (childInfo) {
            // If only one parent, align directly with child
            if (parentIds.length === 1) {
              const parentInfo = nodeMap.get(parentIds[0]);
              if (parentInfo) {
                parentInfo.y = childInfo.y;
              }
            } 
            // If multiple parents, distribute based on branch heights
            else {
              // Calculate total branch height needed
              let totalBranchHeight = 0;
              parentIds.forEach(parentId => {
                const parentInfo = nodeMap.get(parentId);
                if (parentInfo) {
                  totalBranchHeight += parentInfo.branchHeight;
                }
              });
              
              // Calculate starting Y position to center around the child
              let startY = childInfo.y - (totalBranchHeight * MIN_NODE_SPACING) / 2;
              
              // Position each parent
              parentIds.forEach(parentId => {
                const parentInfo = nodeMap.get(parentId);
                if (parentInfo) {
                  parentInfo.y = startY + (parentInfo.branchHeight * MIN_NODE_SPACING) / 2;
                  startY += parentInfo.branchHeight * MIN_NODE_SPACING;
                }
              });
            }
          }
        } else {
          // For orphan nodes, place them with enough spacing
          let currentY = 0;
          parentIds.forEach(parentId => {
            const parentInfo = nodeMap.get(parentId);
            if (parentInfo) {
              parentInfo.y = currentY;
              currentY += parentInfo.branchHeight * MIN_NODE_SPACING;
            }
          });
        }
      });
    }
    
    // Position positive generations (descendants)
    for (let gen = 1; gen <= maxGeneration; gen++) {
      if (!nodesByGeneration.has(gen)) continue;
      
      const currentGenNodes = nodesByGeneration.get(gen)!;
      
      // Group nodes by their parents
      const nodesByParents = new Map<string, string[]>();
      
      currentGenNodes.forEach(nodeId => {
        const nodeInfo = nodeMap.get(nodeId);
        if (!nodeInfo) return;
        
        // Find parents in the previous generation
        const parentsInPrevGen = nodeInfo.parents.filter(parentId => {
          const parentInfo = nodeMap.get(parentId);
          return parentInfo && parentInfo.node.generation === gen - 1;
        });
        
        if (parentsInPrevGen.length > 0) {
          // Use the first parent as a grouping key
          const primaryParentId = parentsInPrevGen[0];
          if (!nodesByParents.has(primaryParentId)) {
            nodesByParents.set(primaryParentId, []);
          }
          nodesByParents.get(primaryParentId)!.push(nodeId);
        } else {
          // Node has no parents in prev gen, treat it as an independent group
          nodesByParents.set(`orphan_${nodeId}`, [nodeId]);
        }
      });
      
      // Position nodes based on their relationships
      const sortedParentGroups = Array.from(nodesByParents.entries())
        .sort((a, b) => {
          const aParentId = a[0].startsWith('orphan_') ? a[0].substring(7) : a[0];
          const bParentId = b[0].startsWith('orphan_') ? b[0].substring(7) : b[0];
          
          const aParentInfo = nodeMap.get(aParentId);
          const bParentInfo = nodeMap.get(bParentId);
          
          if (!aParentInfo || !bParentInfo) return 0;
          return aParentInfo.y - bParentInfo.y;
        });
      
      // Now position the children
      sortedParentGroups.forEach(([parentId, childIds]) => {
        // Sort children for consistent ordering
        childIds.sort((a, b) => a.localeCompare(b));
        
        if (!parentId.startsWith('orphan_')) {
          const parentInfo = nodeMap.get(parentId);
          if (parentInfo) {
            // If only one child, align directly with parent
            if (childIds.length === 1) {
              const childInfo = nodeMap.get(childIds[0]);
              if (childInfo) {
                childInfo.y = parentInfo.y;
              }
            } 
            // If multiple children, distribute based on branch heights
            else {
              // Calculate total branch height needed
              let totalBranchHeight = 0;
              childIds.forEach(childId => {
                const childInfo = nodeMap.get(childId);
                if (childInfo) {
                  totalBranchHeight += childInfo.branchHeight;
                }
              });
              
              // Calculate starting Y position to center around the parent
              let startY = parentInfo.y - (totalBranchHeight * MIN_NODE_SPACING) / 2;
              
              // Position each child
              childIds.forEach(childId => {
                const childInfo = nodeMap.get(childId);
                if (childInfo) {
                  childInfo.y = startY + (childInfo.branchHeight * MIN_NODE_SPACING) / 2;
                  startY += childInfo.branchHeight * MIN_NODE_SPACING;
                }
              });
            }
          }
        } else {
          // For orphan nodes, place them with enough spacing
          let currentY = 0;
          childIds.forEach(childId => {
            const childInfo = nodeMap.get(childId);
            if (childInfo) {
              childInfo.y = currentY;
              currentY += childInfo.branchHeight * MIN_NODE_SPACING;
            }
          });
        }
      });
    }
    
    // STEP 7: Normalize vertical positions to center the graph
    // Find the min and max Y values
    let minY = Infinity;
    let maxY = -Infinity;
    
    nodeMap.forEach(info => {
      minY = Math.min(minY, info.y);
      maxY = Math.max(maxY, info.y);
    });
    
    // Calculate the vertical offset to center the graph
    const heightRange = maxY - minY;
    const verticalOffset = 100 - minY; // Start with a padding of 100px from the top
    
    // Apply the offset to center the graph vertically
    nodeMap.forEach(info => {
      info.y += verticalOffset;
    });
    
    // STEP 8: Apply the calculated positions to each node
    graphData.nodes.forEach(node => {
      const nodeInfo = nodeMap.get(node.id);
      if (nodeInfo) {
        // Update node position
        node.x = nodeInfo.x;
        node.y = nodeInfo.y;
        
        // Store position for future reference
        fixedPositions[node.id] = { x: nodeInfo.x, y: nodeInfo.y };
      }
    });
    
    // =========================================================================
    // END OF NEW LAYOUT ALGORITHM
    // =========================================================================
    
    // Create links - straight lines for 1-1, curved for others
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(graphData.links)
      .join("path")
      .attr("d", (d: any) => {
        const source = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
        
        if (!source || !target) return '';
        
        // Define constants for node sizing and connections
        const NODE_RADIUS = 24;
        const CONNECTION_OFFSET = NODE_RADIUS * 0.6; // 60% of the node radius for connections
        
        // Determine if this is a parent-child relationship
        const sourceGen = source.generation || 0;
        const targetGen = target.generation || 0;
        const isParentToChild = sourceGen < targetGen;
        const isChildToParent = sourceGen > targetGen;
                               
        // Determine relationship type for styling
        const relationType = 
          (source.type === 'bot' && target.type === 'queue') ? 'write' as const :
          (source.type === 'queue' && target.type === 'bot') ? 'read' as const : 
          'default' as const;
        
        // Store relationship type on the link data for later use
        d.relationType = relationType;
                               
        // Basic coordinates
        const x1 = source.x;
        const y1 = source.y;
        const x2 = target.x;
        const y2 = target.y;
        
        // Calculate direction vector
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate points closer to the center of the circles
        const sourceX = x1 + (nx * CONNECTION_OFFSET);
        const sourceY = y1 + (ny * CONNECTION_OFFSET);
        const targetX = x2 - (nx * CONNECTION_OFFSET);
        const targetY = y2 - (ny * CONNECTION_OFFSET);
        
        // Check if this is a straight path (parent to single child or vice versa)
        const sourceNodeInfo = nodeMap.get(source.id);
        const targetNodeInfo = nodeMap.get(target.id);
        
        if (sourceNodeInfo && targetNodeInfo) {
          const isDirectParentChild = 
            (isParentToChild && sourceNodeInfo.children.length === 1) ||
            (isChildToParent && targetNodeInfo.children.length === 1);
          
          const isDirectChildParent = 
            (isParentToChild && targetNodeInfo.parents.length === 1) ||
            (isChildToParent && sourceNodeInfo.parents.length === 1);
          
          // For direct parent-child relationships use straight lines
          if ((isDirectParentChild || isDirectChildParent) && Math.abs(sourceY - targetY) < 10) {
            return `M${sourceX},${sourceY}L${targetX},${targetY}`;
          }
        }
        
        // For all other cases, use curved paths
        // Calculate curve intensity - use more curve when vertical difference is larger
        const verticalDifference = Math.abs(sourceY - targetY);
        const curveIntensity = Math.max(0.3, Math.min(0.6, verticalDifference / 300));
        
        // S-curve for smooth transitions
        // Create control points for a smooth S-curve
        const cp1x = sourceX + (targetX - sourceX) * 0.3;
        const cp1y = sourceY;
        const cp2x = sourceX + (targetX - sourceX) * 0.7;
        const cp2y = targetY;
        
        return `M${sourceX},${sourceY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`;
      })
      .attr("fill", "none")
      .attr("stroke", (d: any) => {
        // Different colors based on relationship type
        const relationType = d.relationType || 'default';
        const colorMap: Record<string, string> = {
          'write': '#3182ce', // Blue for write relationships (bot->queue)
          'read': '#3182ce',  // Purple for read relationships (queue->bot)
          'default': '#3182ce' // Default blue
        };
        return colorMap[relationType];
      })
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d: any) => {
        // Different line styles based on relationship type
        const relationType = d.relationType || 'default';
        const dashMap: Record<string, string> = {
          'write': '0',      // Solid line for write (bot->queue)
          'read': '0',     // Dashed line for read (queue->bot)
          'default': '0'     // Solid line for default
        };
        return dashMap[relationType];
      });
      
    // Add connection stats if stats toggle is on
    if (stats) {
      // Add stats above and below the link
      link.each(function(d: any) {
        const linkElement = d3.select(this);
        const source = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
        
        if (!source || !target) return;
        
        // Get the midpoint of the link
        const path = linkElement.node() as SVGPathElement;
        if (!path) return;
        
        const pathLength = path.getTotalLength();
        const midPoint = path.getPointAtLength(pathLength / 2);
        
        // Determine relationship type for styling
        const relationType = d.relationType || 'default';
        const relationColor = relationType === 'write' ? '#3182ce' : relationType === 'read' ? '#805ad5' : '#3182ce';
        
        // Create a group for this link's stats
        const statsGroup = g.append("g")
          .attr("class", "link-stats")
          .attr("transform", `translate(${midPoint.x},${midPoint.y})`);
          
        // Add background rect for better readability
        statsGroup.append("rect")
          .attr("x", -30)
          .attr("y", -18)
          .attr("width", 60)
          .attr("height", 36)
          .attr("rx", 4)
          .attr("fill", "white")
          .attr("fill-opacity", 0.8)
          .attr("stroke", relationColor)
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.5);
        
        // Add count (events) above the line
        const count = d.stats?.count || 0;
        statsGroup.append("text")
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", relationColor)
          .attr("y", -5)
          .text(`Events: ${count}`);
        
        // Add timing or lag information below the line
        if (relationType === 'write') {
          // Bot -> Queue shows last write time
          const timeAgo = d.stats?.last_time ? formatTimeAgo(d.stats.last_time) : '-';
          statsGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", relationColor)
            .attr("y", 12)
            .text(`Last: ${timeAgo}`);
        } else if (relationType === 'read') {
          // Queue -> Bot shows lag
          const lag = d.stats?.lag || 0;
          statsGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", lag > 1000 ? "#e53e3e" : relationColor)
            .attr("y", 12)
            .text(`Lag: ${lag}ms`);
        }
      });
    }
    
    // Determine the base URL for assets
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || '';
    
    // Create node groups with hover action buttons
    const nodeGroup = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .attr("transform", (d: any) => {
        // Use the positions calculated by our hierarchical layout
        return `translate(${d.x},${d.y})`;
      })
      .on("mouseover", (event, d) => {
        setHoveredNode(d.id);
        
        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("display", "block")
          .html(`
            <div class="font-medium">${d.id}</div>
            <div>Type: ${d.type}</div>
            <div>Generation: ${d.generation || 0}</div>
            <div>Status: ${d.status}</div>
            <div>Executions: ${d.executions || 0}</div>
            <div>Errors: ${d.errors || 0}</div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        d3.select(tooltipRef.current).style("display", "none");
      })
      .on("click", (event, d) => {
        if (!event.defaultPrevented) {
          openNodeSettingsDialog(d.id);
        }
      });
    
    // Add hover detection area FIRST (larger than the visible node)
    nodeGroup.each(function(d: any) {
      const nodeGroup = d3.select(this);
      
      // Add an invisible, larger circle for better hover detection
      // Make it about 67% larger than the visible node circle (24px * 1.67 = 40px)
      nodeGroup.append("circle")
        .attr("r", 40)
        .attr("fill", "transparent") // Completely transparent
        .attr("stroke", "none")
        .attr("pointer-events", "all") // Ensure it captures mouse events
        .attr("class", "hover-detection-area");
    });
    
    // Add shadow circles for collapsed nodes
    nodeGroup.each(function(d: any) {
      const nodeGroup = d3.select(this);
      
      // Add shadow circles for collapsed nodes
      const hasCollapsedParents = collapsedState.collapsed.left.includes(d.id) && 
        d.link_to?.parent && Object.keys(d.link_to.parent).length > 0;
      
      const hasCollapsedChildren = collapsedState.collapsed.right.includes(d.id) && 
        d.link_to?.children && Object.keys(d.link_to.children).length > 0;
      
      if (hasCollapsedParents) {
        // Add shadow circles for collapsed parents
        const parentCount = Object.keys(d.link_to.parent).length;
        for (let i = 0; i < Math.min(3, parentCount); i++) {
          nodeGroup.append("circle")
            .attr("r", 24)
            .attr("cx", -8 - (i * 5))
            .attr("cy", -8 - (i * 5))
            .attr("fill", "none")
            .attr("stroke", "#3182ce")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5 - (i * 0.1));
        }
      }
      
      if (hasCollapsedChildren) {
        // Add shadow circles for collapsed children
        const childCount = Object.keys(d.link_to.children).length;
        for (let i = 0; i < Math.min(3, childCount); i++) {
          nodeGroup.append("circle")
            .attr("r", 24)
            .attr("cx", 8 + (i * 5))
            .attr("cy", 8 + (i * 5))
            .attr("fill", "none")
            .attr("stroke", "#3182ce")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5 - (i * 0.1));
        }
      }
    });

    // Define node shape utility functions
    const getNodeShape = (status: string): string => {
      const shapes: Record<string, string> = {
        danger: 'delta',
        blocked: 'octogon',
        rogue: 'octogon'
      };
      return shapes[status?.toLowerCase()] || 'circle';
    };
    
    // Add shape path definition function
    const getShapePath = (shape: string, radius: number): string => {
      switch (shape) {
        case 'delta': // Triangle shape for danger status
          return `M 0,-${radius} L ${radius * 0.866},${radius * 0.5} L -${radius * 0.866},${radius * 0.5} Z`;
        
        case 'octogon': // Octagon shape for blocked or rogue status
          const octRadius = radius * 0.7071; // cos(45°) to keep octagon size similar to circle
          return `
            M ${octRadius},${octRadius * 0.4142} 
            L ${octRadius * 0.4142},${octRadius} 
            L -${octRadius * 0.4142},${octRadius} 
            L -${octRadius},${octRadius * 0.4142} 
            L -${octRadius},-${octRadius * 0.4142} 
            L -${octRadius * 0.4142},-${octRadius} 
            L ${octRadius * 0.4142},-${octRadius} 
            L ${octRadius},-${octRadius * 0.4142} 
            Z
          `;
        
        case 'circle':
        default:
          return ''; // No path for circle, we'll use the circle element
      }
    };
    
    // Add circle around node for queue nodes and all active bots
    nodeGroup.each(function(d: any) {
      const nodeGroup = d3.select(this);
      
      // Add solid circle with stroke and solid background
      const goodStates = ['active', 'idle', 'running'];
      if ((d.type === 'bot' && goodStates.includes(d.status?.toLowerCase())) || 
          d.type === 'queue' || d.type === 'system') {
        nodeGroup.append("circle")
          .attr("r", 24)
          .attr("fill", "var(--bg-color, #ffffff)") // Use CSS variable with fallback to white
          .attr("stroke", "#3182ce")
          .attr("stroke-width", d.id === primaryNode ? 6 : 1.5) // Doubled thickness for selected node (from 3 to 6)
          .attr("opacity", 1.0); // Full opacity to hide shadow circles
      } else {
        // For nodes with special status, use the appropriate shape
        const nodeShape = getNodeShape(d.status);
        
        if (nodeShape === 'circle') {
          nodeGroup.append("circle")
            .attr("r", 24)
            .attr("fill", "var(--bg-color, #ffffff)")
            .attr("stroke", d.status === 'danger' ? "#e53e3e" : "#3182ce") // Red stroke for danger
            .attr("stroke-width", d.id === primaryNode ? 6 : 1.5)
            .attr("opacity", 1.0);
        } else {
          // Draw shape based on status
          nodeGroup.append("path")
            .attr("d", getShapePath(nodeShape, 24))
            .attr("fill", "var(--bg-color, #ffffff)")
            .attr("stroke", nodeShape === 'delta' ? "#e53e3e" : "#3182ce") // Different stroke for different shapes
            .attr("stroke-width", d.id === primaryNode ? 6 : 1.5)
            .attr("opacity", 1.0);
        }
      }
    });
    
    // Add SVG for node icons with proper dimensions
    nodeGroup.append("g")
      .attr("transform", "translate(-20, -20)") // Center the 40x40 icon around the node point
      .each(function(d: any) {
        // Create a group for each node's icon
        const nodeGroup = d3.select(this);
        
        // Generate SVG markup for node icon
        const svgMarkup = getNodeImagesSvgString(
          { 
            id: d.id, 
            type: d.type,
            status: d.status
          },
          state.nodes,
          baseUrl
        );
        
        // Create an SVG element for the icon with proper dimensions
        const iconSvg = nodeGroup.append("svg")
          .attr("width", 40)
          .attr("height", 40)
          .attr("viewBox", "0 0 40 40");
        
        // Manually append the SVG markup to the node
        iconSvg.html(svgMarkup);
      });
    
    // Add text labels for node IDs with wrapping
    nodeGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 36) // Absolute positioning from the node center
      .attr("dy", null) // Remove any relative positioning
      .attr("font-size", "12px")
      .attr("fill", "currentColor")
      .each(function(d) {
        const text = d3.select(this);
        const nodeId = d.id.split(':')[1] || d.id;
        
        // Set up text wrapping
        const textElement = text.node();
        if (!textElement) return;
        
        const maxWidth = Math.floor(48 * 3);
        
        // If text is very short, just add it directly
        if (nodeId.length <= 5) {
          text.text(nodeId);
          return;
        }
        
        // Clear text element for appending tspans
        text.text(null);
        
        // Character width in pixels (approximate)
        const charWidth = 7;
        const maxCharsPerLine = Math.floor(maxWidth / charWidth);
        
        // Prioritize wrapping at natural break points (space, dash, underscore)
        const breakChars = [' ', '-', '_'];
        const lines: string[] = [];
        let startIndex = 0;
        let lastBreakIndex = -1;
        
        // Scan through text looking for natural break points while respecting max width
        for (let i = 0; i < nodeId.length; i++) {
          // Update the last break position when we encounter a break character
          if (breakChars.includes(nodeId[i])) {
            lastBreakIndex = i;
          }
          
          // If we're approaching max width, decide where to break
          if (i - startIndex + 1 >= maxCharsPerLine) {
            if (lastBreakIndex > startIndex) {
              // Break at the last natural break point if we found one
              lines.push(nodeId.substring(startIndex, lastBreakIndex + 1));
              startIndex = lastBreakIndex + 1;
            } else {
              // Hard break if no natural break point was found
              lines.push(nodeId.substring(startIndex, i + 1));
              startIndex = i + 1;
            }
            // Reset last break index since we're starting a new line
            lastBreakIndex = -1;
          }
        }
        
        // Add any remaining text as the last line
        if (startIndex < nodeId.length) {
          lines.push(nodeId.substring(startIndex));
        }
        
        // Add all lines as tspans with proper positioning
        lines.forEach((line, i) => {
          text.append("tspan")
            .attr("x", 0) // Center each line horizontally (text-anchor: middle applied to parent)
            .attr("dy", i === 0 ? 0 : "1.2em") // Add line spacing after the first line
            .text(line);
        });
      });
    
    // Add execution/error counts with increased vertical padding
    // Adjust y value based on number of lines in the node label
    nodeGroup.each(function(d: any) {
      const nodeGroup = d3.select(this);
      const labelElement = nodeGroup.select('text');
      
      // Count number of tspans (lines) in the label
      const tspans = labelElement.selectAll('tspan');
      const lineCount = tspans.size() || 1; // At least 1 line
      
      // Add stats with position adjusted based on line count
      if(d.type === 'bot') {
        nodeGroup.append("text")
      .attr("text-anchor", "middle")
          .attr("y", 36 + (lineCount * 14)) // Base position + adjustment for each line
      .attr("font-size", "10px")
          .html(() => {
            return `<tspan fill="#3182ce">${d.executions || 0}</tspan>/<tspan fill="#e53e3e">${d.errors || 0}</tspan>`;
          });
      }
    });
    
    // Add floating action buttons that appear on hover
    nodeGroup.each(function(d: any) {
      const node = d3.select(this);
      const radius = 50; // Increase distance from node center (was 32)
      const buttonRadius = 15; // Increase size of the action buttons (was 16)
      
      // Create a group for the action buttons with initial opacity of 0
      const actionGroup = node.append("g")
        .attr("class", "action-buttons")
        .attr("data-node-id", d.id) // Add data attribute to identify the node
        .attr("opacity", 0)
        .attr("pointer-events", "none");
      
      // Function to position button at given angle
      const positionButton = (angle: number) => {
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius; // Negative because SVG y-axis is inverted
        return { x, y };
      };
      
      // 1. Crosshair button (select node) at 1 o'clock
      const pos1 = positionButton(Math.PI * 0.08);
      const selectButton = actionGroup.append("g")
        .attr("transform", `translate(${pos1.x},${pos1.y})`)
        .attr("cursor", "pointer");
      
      selectButton.append("circle")
        .attr("r", buttonRadius)
        .attr("fill", "#3182ce")
        .attr("opacity", 0.9);
      
      // Add crosshair icon using SVG path - made thicker
      selectButton.append("path")
        .attr("d", "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z")
        .attr("transform", "translate(-10, -10) scale(0.75)")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", "1.5");
      
      // Add the crosshair lines
      selectButton.append("path")
        .attr("d", "M22 12h-4 M6 12H2 M12 6V2 M12 22v-4")
        .attr("transform", "translate(-10, -10) scale(0.75)")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", "1.5")
        .attr("stroke-linecap", "round");
      
      // On click, update URL to select this node
      selectButton.on("click", (event) => {
        event.stopPropagation();
        let hashData: Record<string, any> = {};
        
        try {
          if (window.location.hash && window.location.hash.length > 1) {
            try {
              const hashStr = decodeURIComponent(window.location.hash.substring(1));
              if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
                hashData = JSON.parse(hashStr);
              }
            } catch (error) {
              console.error('Error parsing hash:', error);
            }
          }
          
          // Update selected node in hash data
          hashData.selected = [d.id];
          hashData.node = d.id;
          
          // Update the URL hash
          const hashStr = JSON.stringify(hashData);
          window.location.hash = encodeURIComponent(hashStr);
        } catch (error) {
          console.error('Error updating URL hash:', error);
        }
      });
      
      // 2. Settings button (open node settings) at 2 o'clock
      const pos2 = positionButton(Math.PI * 0.29);
      const settingsButton = actionGroup.append("g")
        .attr("transform", `translate(${pos2.x},${pos2.y})`)
        .attr("cursor", "pointer");
      
      settingsButton.append("circle")
        .attr("r", buttonRadius)
        .attr("fill", "#4a5568")
        .attr("opacity", 0.9);
      
      // Add settings icon using SVG path - made thicker
      settingsButton.append("path")
        .attr("d", "M9.594 3.094A1.5 1.5 0 0 1 11.07 4.5h.164a1.5 1.5 0 0 1 1.477 1.256l.133.792a1.5 1.5 0 0 0 1.732 1.132l.316-.07a1.5 1.5 0 0 1 1.706.8l.082.16a1.5 1.5 0 0 1-.292 1.841l-.63.54a1.5 1.5 0 0 0 0 2.25l.63.54a1.5 1.5 0 0 1 .292 1.841l-.082.16a1.5 1.5 0 0 1-1.706.8l-.316-.07a1.5 1.5 0 0 0-1.732 1.132l-.133.792A1.5 1.5 0 0 1 11.234 19h-.164a1.5 1.5 0 0 1-1.477-1.256l-.133-.792a1.5 1.5 0 0 0-1.732-1.132l-.316.07a1.5 1.5 0 0 1-1.706-.8l-.082-.16a1.5 1.5 0 0 1 .292-1.841l.63-.54a1.5 1.5 0 0 0 0-2.25l-.63-.54a1.5 1.5 0 0 1-.292-1.841l.082-.16a1.5 1.5 0 0 1 1.706-.8l.316.07a1.5 1.5 0 0 0 1.732-1.132l.133-.792ZM11 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z")
        .attr("transform", "translate(-10, -10) scale(0.85)") // Increased scale from 0.45
      .attr("fill", "white")
        .attr("stroke", "white")
        .attr("stroke-width", "0.2");
      
      // On click, open node settings dialog
      settingsButton.on("click", (event) => {
        event.stopPropagation();
        openNodeSettingsDialog(d.id);
      });
      
      // 3. Children collapse/expand button at 3 o'clock (only for nodes with children)
      if (d.link_to?.children && Object.keys(d.link_to.children).length > 0) {
        // Simplified button visibility rule:
        // Show 3 o'clock button if node is in generation 0 or positive generation
        const generation = d.generation || 0;
        if (generation >= 0) {
          const pos3 = positionButton(Math.PI * 0.5);
          const childrenButton = actionGroup.append("g")
            .attr("class", "action-button children-button")
            .attr("transform", `translate(${pos3.x}, ${pos3.y})`)
            .attr("cursor", "pointer");
            
          childrenButton.append("circle")
            .attr("r", buttonRadius)
            .attr("fill", "#3b82f6") // Blue background
            .attr("stroke", "white")
            .attr("stroke-width", 1.5);
          
          // Different icons for collapsed vs expanded (right chevron or X)
          childrenButton.append("path")
            .attr("d", collapsedState.collapsed.right.includes(d.id) 
              ? "M-4,-6 L4,0 L-4,6" // Right-pointing chevron for collapsed
              : "M4,-6 L-4,0 L4,6" // Left-pointing chevron for expanded
            )
            .attr("fill", collapsedState.collapsed.right.includes(d.id) ? "white" : "none")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "round");
          
          childrenButton.on("click", (event) => {
            event.stopPropagation();
            toggleChildrenCollapse(d.id);
          });
        }
      }
      
      // 4. Parents collapse/expand button at 9 o'clock (only for nodes with parents)
      if (d.link_to?.parent && Object.keys(d.link_to.parent).length > 0) {
        // Simplified button visibility rule:
        // Show 9 o'clock button if node is in generation 0 or negative generation
        const generation = d.generation || 0;
        if (generation <= 0) {
          const pos4 = positionButton(Math.PI * 1.5);
          const parentsButton = actionGroup.append("g")
            .attr("class", "action-button parents-button")
            .attr("transform", `translate(${pos4.x}, ${pos4.y})`)
            .attr("cursor", "pointer");
            
          parentsButton.append("circle")
            .attr("r", buttonRadius)
            .attr("fill", "#3b82f6") // Blue background
            .attr("stroke", "white")
            .attr("stroke-width", 1.5);
            
            // Different icons for collapsed vs expanded (left chevron or X)
            parentsButton.append("path")
              .attr("d", collapsedState.collapsed.left.includes(d.id) 
                ? "M4,-6 L-4,0 L4,6" // Left-pointing chevron for collapsed
                : "M-4,-6 L4,0 L-4,6" // Right-pointing chevron for expanded
              )
              .attr("fill", collapsedState.collapsed.left.includes(d.id) ? "white" : "none")
              .attr("stroke", "white")
              .attr("stroke-width", 2)
              .attr("stroke-linecap", "round");
          
          parentsButton.on("click", (event) => {
            event.stopPropagation();
            toggleParentsCollapse(d.id);
          });
        }
      }
    });
  };
  
  // Effect to update URL hash when stats change to preserve collapsed/expanded state
  useEffect(() => {
    // Only update if there are actual nodes in the graph
    if (graphData.nodes.length > 0) {
      // Update hash with current state to preserve collapse/expand state when stats change
      debouncedUpdateUrl(localOffset, localZoom, collapsedState.collapsed, collapsedState.expanded);
    }
  }, [stats, debouncedUpdateUrl, localOffset, localZoom, collapsedState, graphData.nodes.length]);
  
  if (state.updatingStats && !graphData.nodes.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-500 dark:text-gray-400">Loading workflow...</span>
        </div>
      </div>
    );
  }
  
  // Show message when no focus node is selected
  if (noFocusMessage) {
  return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Select a Focus Node</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please select a node from the dropdown to visualize its connections in the workflow.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="w-full h-full bg-white dark:bg-gray-800"></svg>
      <div
        ref={tooltipRef}
        className="absolute hidden bg-white dark:bg-gray-900 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs z-10"
      ></div>
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-2 rounded shadow border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold mb-1">Legend</div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center">
            <div className="h-4 w-4 mr-1">
              <svg viewBox="0 0 20 20" width="20" height="20">
                <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/bot.png`} width="100%" height="100%" />
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300">Bot</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 mr-1">
              <svg viewBox="0 0 20 20" width="20" height="20">
                <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/queue.png`} width="100%" height="100%" />
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300">Queue</span>
          </div>
          <div className="flex items-center">
            <div className="h-4 w-4 mr-1">
              <svg viewBox="0 0 20 20" width="20" height="20">
                <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/system.png`} width="100%" height="100%" />
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-300">System</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to debounce updates
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
} 