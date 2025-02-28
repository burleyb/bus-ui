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
      
      // Update the URL hash
      const hashStr = JSON.stringify(hashData);
      window.location.hash = encodeURIComponent(hashStr);
    } catch (error) {
      console.error('Error updating URL hash:', error);
    }
  }, [localOffset, localZoom, collapsedState]);
  
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
      debouncedUpdateUrl(localOffset, newZoom);
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
  }, [localZoom, localOffset, debouncedUpdateUrl]);

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
        debouncedUpdateUrl(localOffset, localZoom);
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
  }, [localOffset, localZoom, debouncedUpdateUrl]);
  
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
    
    // Add the focus node
    data.nodes.push({
      id: primaryNode,
      status: focusNodeData.status || 'unknown',
      type: focusNodeData.type || 'unknown',
      group: 1, // Focus node is always group 1
      executions: focusNodeData.executions || 0,
      errors: focusNodeData.errors || 0,
      queues: focusNodeData.queues,
      link_to: focusNodeData.link_to
    });
    
    // Add parent nodes (inputs to the focus node) if not collapsed
    const isParentsCollapsed = collapsedState.collapsed.left.includes(primaryNode);
    if (focusNodeData.link_to?.parent && Object.keys(focusNodeData.link_to.parent).length > 0 && !isParentsCollapsed) {
      Object.keys(focusNodeData.link_to.parent).forEach(connId => {
        const parentNode = state.nodes[connId];
        if (parentNode) {
          // Add parent node
          data.nodes.push({
            id: connId,
            status: parentNode.status || 'unknown',
            type: parentNode.type || 'unknown',
            group: 0, // Parent/input nodes are group 0
            executions: parentNode.executions || 0,
            errors: parentNode.errors || 0,
            queues: parentNode.queues,
            link_to: parentNode.link_to
          });
          
          // Add link from parent to focus with stats if available
          const linkStats = {
            count: 0,
            last_time: '',
            lag: 0
          };
          
          // For queue->bot connection, get stats from bot's read queue data
          if (parentNode.type === 'queue' && focusNodeData.type === 'bot' && focusNodeData.queues?.read) {
            const readStats = focusNodeData.queues.read[connId];
            if (readStats) {
              linkStats.count = readStats.count || 0;
              linkStats.lag = readStats.last_source_lag || 0;
            }
          }
          
          // For bot->queue connection, get stats from bot's write queue data
          if (parentNode.type === 'bot' && focusNodeData.type === 'queue' && parentNode.queues?.write) {
            const writeStats = parentNode.queues.write[focusNodeData.id];
            if (writeStats) {
              linkStats.count = writeStats.count || 0;
              linkStats.last_time = writeStats.last_write || '';
            }
          }
          
          data.links.push({
            source: connId,
            target: primaryNode,
            value: 1,
            stats: linkStats
          });
        }
      });
    }
    
    // Add child nodes (outputs from the focus node) if not collapsed
    const isChildrenCollapsed = collapsedState.collapsed.right.includes(primaryNode);
    if (focusNodeData.link_to?.children && Object.keys(focusNodeData.link_to.children).length > 0 && !isChildrenCollapsed) {
      Object.keys(focusNodeData.link_to.children).forEach(connId => {
        const childNode = state.nodes[connId];
        if (childNode) {
          // Add child node
          data.nodes.push({
            id: connId,
            status: childNode.status || 'unknown',
            type: childNode.type || 'unknown',
            group: 2, // Child/output nodes are group 2
            executions: childNode.executions || 0,
            errors: childNode.errors || 0,
            queues: childNode.queues,
            link_to: childNode.link_to
          });
          
          // Add link from focus to child with stats if available
          const linkStats = {
            count: 0,
            last_time: '',
            lag: 0
          };
          
          // For bot->queue connection, get stats from bot's write queue data
          if (focusNodeData.type === 'bot' && childNode.type === 'queue' && focusNodeData.queues?.write) {
            const writeStats = focusNodeData.queues.write[connId];
            if (writeStats) {
              linkStats.count = writeStats.count || 0;
              linkStats.last_time = writeStats.last_write || '';
            }
          }
          
          // For queue->bot connection, get stats from bot's read queue data
          if (focusNodeData.type === 'queue' && childNode.type === 'bot' && childNode.queues?.read) {
            const readStats = childNode.queues.read[focusNodeData.id];
            if (readStats) {
              linkStats.count = readStats.count || 0;
              linkStats.lag = readStats.last_source_lag || 0;
            }
          }
          
          data.links.push({
            source: primaryNode,
            target: connId,
            value: 1,
            stats: linkStats
          });
        }
      });
    }
    
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
    
    // Define arrow marker for links
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20) // Position slightly before the target node
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#3182ce"); // Blue arrow
    
    // Set positions based on node groups
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Determine layout approach based on node relationships
    const parents = graphData.nodes.filter(node => node.group === 0);
    const focus = graphData.nodes.find(node => node.group === 1);
    const children = graphData.nodes.filter(node => node.group === 2);
    
    // Apply stored positions to nodes or generate new ones
    const nodesWithPositions = graphData.nodes.map(node => {
      // For new layout, position nodes based on left-to-right flow
      if (!initialLayoutComplete.current || !fixedPositions[node.id]) {
        // Default to center position
        let x = innerWidth / 2;
        let y = innerHeight / 2;
        
        if (node.group === 0) {
          // Parent nodes go left
          x = innerWidth * 0.25;
          
          // If multiple parents, space them vertically
          if (parents.length > 1) {
            const index = parents.findIndex(n => n.id === node.id);
            const spacing = innerHeight / (parents.length + 1);
            y = spacing * (index + 1);
          }
        } else if (node.group === 1) {
          // Focus node goes in the center
          x = innerWidth / 2;
          y = innerHeight / 2;
        } else if (node.group === 2) {
          // Child nodes go right
          x = innerWidth * 0.75;
          
          // If multiple children, space them vertically
          if (children.length > 1) {
            const index = children.findIndex(n => n.id === node.id);
            const spacing = innerHeight / (children.length + 1);
            y = spacing * (index + 1);
          }
        }
        
        return { ...node, x, y };
      }
      
      // Use stored position for existing nodes
      return { 
        ...node, 
        x: fixedPositions[node.id].x, 
        y: fixedPositions[node.id].y
      };
    });
    
    // Create the simulation but don't apply forces for dragging
    const simulation = d3.forceSimulation(nodesWithPositions as any)
      .force("link", d3.forceLink(graphData.links as any)
        .id((d: any) => d.id)
        .distance(180)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collide", d3.forceCollide().radius(70))
      .force("x", d3.forceX().strength(0.1))
      .stop(); // Start manually and control ticks
    
    // Fix positions of all nodes if we already have a layout
    if (initialLayoutComplete.current) {
      nodesWithPositions.forEach((d: any) => {
        d.fx = d.x;
        d.fy = d.y;
      });
      simulation.tick(0); // Just update without moving
    } else {
      // Run simulation for a fixed number of ticks to position initial layout
      simulation.tick(100);
      
      // Store the final positions
      nodesWithPositions.forEach((d: any) => {
        fixedPositions[d.id] = { x: d.x, y: d.y };
      });
      
      initialLayoutComplete.current = true;
    }
    
    // Create links - straight lines for 1-1, curved for others
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(graphData.links)
      .join("path")
      .attr("d", (d: any) => {
        const source = typeof d.source === 'object' ? d.source : nodesWithPositions.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : nodesWithPositions.find(n => n.id === d.target);
        
        if (!source || !target) return '';
        
        // For 1-to-1 connections (no siblings), use straight lines
        const sourceHasSiblings = nodesWithPositions.filter(n => 
          n.group === source.group && n.id !== source.id
        ).length > 0;
        
        const targetHasSiblings = nodesWithPositions.filter(n => 
          n.group === target.group && n.id !== target.id
        ).length > 0;
        
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
        
        // Calculate points at the edge of the circles (radius = 24)
        const nodeRadius = 24;
        const sourceX = x1 + (nx * nodeRadius);
        const sourceY = y1 + (ny * nodeRadius);
        const targetX = x2 - (nx * nodeRadius);
        const targetY = y2 - (ny * nodeRadius);
        
        // For perfectly horizontal 1-to-1 connections with no siblings
        if (!sourceHasSiblings && !targetHasSiblings && Math.abs(y1 - y2) < 1) {
          return `M${sourceX},${sourceY}L${targetX},${targetY}`;
        }
        
        // Otherwise use curved lines
        const newDx = targetX - sourceX;
        const newDy = targetY - sourceY;
        const newDr = Math.sqrt(newDx * newDx + newDy * newDy) * 1.5; // Adjust curve
        
        return `M${sourceX},${sourceY}A${newDr},${newDr} 0 0,1 ${targetX},${targetY}`;
      })
      .attr("fill", "none")
      .attr("stroke", "#3182ce") // Blue links
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 2)
    
    // Add connection stats if stats toggle is on
    if (stats) {
      // Add stats above and below the link
      link.each(function(d: any) {
        const linkElement = d3.select(this);
        const source = typeof d.source === 'object' ? d.source : nodesWithPositions.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : nodesWithPositions.find(n => n.id === d.target);
        
        if (!source || !target) return;
        
        // Get the midpoint of the link
        const path = linkElement.node() as SVGPathElement;
        if (!path) return;
        
        const pathLength = path.getTotalLength();
        const midPoint = path.getPointAtLength(pathLength / 2);
        
        const sourceNode = source as Node;
        const targetNode = target as Node;
        
        // Add count (events) above the line
        const count = d.stats?.count || 0;
        g.append("text")
          .attr("x", midPoint.x)
          .attr("y", midPoint.y - 10)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#3182ce")
          .text(`${count}`);
        
        // Add timing or lag information below the line
        if (sourceNode.type === 'bot' && targetNode.type === 'queue') {
          // Bot -> Queue shows last write time
          const timeAgo = d.stats?.last_time ? formatTimeAgo(d.stats.last_time) : '-';
          g.append("text")
            .attr("x", midPoint.x)
            .attr("y", midPoint.y + 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#3182ce")
            .text(timeAgo);
        } else if (sourceNode.type === 'queue' && targetNode.type === 'bot') {
          // Queue -> Bot shows lag
          const lag = d.stats?.lag || 0;
          g.append("text")
            .attr("x", midPoint.x)
            .attr("y", midPoint.y + 15)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", lag > 1000 ? "#e53e3e" : "#3182ce")
            .text(lag > 0 ? `${lag}ms lag` : '-');
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
      .data(nodesWithPositions)
      .join("g")
      .attr("cursor", "pointer")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .on("mouseover", (event, d) => {
        setHoveredNode(d.id);
        
        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("display", "block")
          .html(`
            <div class="font-medium">${d.id}</div>
            <div>Type: ${d.type}</div>
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
      });
    
    // Add shadow circles for collapsed nodes
    nodeGroup.each(function(d: any) {
      const nodeGroup = d3.select(this);
      
      // Add shadow circles for collapsed nodes
      if (d.id === primaryNode) {
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
              .attr("cx", -5 - (i * 3))
              .attr("cy", -5 - (i * 3))
              .attr("fill", "none")
              .attr("stroke", "#3182ce")
              .attr("stroke-width", 1)
              .attr("opacity", 0.2 - (i * 0.05));
          }
        }
        
        if (hasCollapsedChildren) {
          // Add shadow circles for collapsed children
          const childCount = Object.keys(d.link_to.children).length;
          for (let i = 0; i < Math.min(3, childCount); i++) {
            nodeGroup.append("circle")
              .attr("r", 24)
              .attr("cx", 5 + (i * 3))
              .attr("cy", 5 + (i * 3))
              .attr("fill", "none")
              .attr("stroke", "#3182ce")
              .attr("stroke-width", 1)
              .attr("opacity", 0.2 - (i * 0.05));
          }
        }
      }
    });
    
    // Add circle around node for queue nodes and all active bots
    nodeGroup.each(function(d: any) {
      const nodeGroup = d3.select(this);
      
      // Add circle for all queue nodes and bots in good states
      const goodStates = ['active', 'idle', 'running'];
      if ((d.type === 'bot' && goodStates.includes(d.status?.toLowerCase())) || 
          d.type === 'queue' || d.type === 'system') {
        // Add solid circle with stroke
        nodeGroup.append("circle")
          .attr("r", 24)
          .attr("fill", "none")
          .attr("stroke", "#3182ce")
          .attr("stroke-width", d.id === primaryNode ? 6 : 1.5) // Doubled thickness for selected node (from 3 to 6)
          .attr("opacity", 0.8);
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
      nodeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("y", 36 + (lineCount * 14)) // Base position + adjustment for each line
        .attr("font-size", "10px")
        .html(() => {
          return `<tspan fill="#3182ce">${d.executions || 0}</tspan>/<tspan fill="#e53e3e">${d.errors || 0}</tspan>`;
        });
    });
    
    // Add floating action buttons that appear on hover
    nodeGroup.each(function(d: any) {
      const node = d3.select(this);
      const radius = 32; // Distance from node center
      const buttonRadius = 16; // Size of the action buttons
      
      // Create a group for the action buttons with initial opacity of 0
      const actionGroup = node.append("g")
        .attr("class", "action-buttons")
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
      
      // Add crosshair icon using SVG path
      selectButton.append("path")
        .attr("d", "M15 3.75a.75.75 0 0 1 .75.75v2.25h2.25a.75.75 0 0 1 0 1.5H15.75V10.5a.75.75 0 0 1-1.5 0V8.25H12a.75.75 0 0 1 0-1.5h2.25V4.5a.75.75 0 0 1 .75-.75Zm-7.5 7.5a.75.75 0 0 1 .75.75v2.25h2.25a.75.75 0 0 1 0 1.5H8.25V18a.75.75 0 0 1-1.5 0v-2.25H4.5a.75.75 0 0 1 0-1.5h2.25V12a.75.75 0 0 1 .75-.75Z")
        .attr("transform", "translate(-8, -8) scale(0.5)")
        .attr("fill", "white");
      
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
      const pos2 = positionButton(Math.PI * 0.25);
      const settingsButton = actionGroup.append("g")
        .attr("transform", `translate(${pos2.x},${pos2.y})`)
        .attr("cursor", "pointer");
      
      settingsButton.append("circle")
        .attr("r", buttonRadius)
        .attr("fill", "#4a5568")
        .attr("opacity", 0.9);
      
      // Add settings icon using SVG path
      settingsButton.append("path")
        .attr("d", "M9.594 3.094A1.5 1.5 0 0 1 11.07 4.5h.164a1.5 1.5 0 0 1 1.477 1.256l.133.792a1.5 1.5 0 0 0 1.732 1.132l.316-.07a1.5 1.5 0 0 1 1.706.8l.082.16a1.5 1.5 0 0 1-.292 1.841l-.63.54a1.5 1.5 0 0 0 0 2.25l.63.54a1.5 1.5 0 0 1 .292 1.841l-.082.16a1.5 1.5 0 0 1-1.706.8l-.316-.07a1.5 1.5 0 0 0-1.732 1.132l-.133.792A1.5 1.5 0 0 1 11.234 19h-.164a1.5 1.5 0 0 1-1.477-1.256l-.133-.792a1.5 1.5 0 0 0-1.732-1.132l-.316.07a1.5 1.5 0 0 1-1.706-.8l-.082-.16a1.5 1.5 0 0 1 .292-1.841l.63-.54a1.5 1.5 0 0 0 0-2.25l-.63-.54a1.5 1.5 0 0 1-.292-1.841l.082-.16a1.5 1.5 0 0 1 1.706-.8l.316.07a1.5 1.5 0 0 0 1.732-1.132l.133-.792ZM11 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z")
        .attr("transform", "translate(-8, -8) scale(0.45)")
        .attr("fill", "white");
      
      // On click, open node settings dialog
      settingsButton.on("click", (event) => {
        event.stopPropagation();
        openNodeSettingsDialog(d.id);
      });
      
      // 3. Children collapse/expand button at 3 o'clock (only for nodes with children)
      if (d.id === primaryNode && d.link_to?.children && Object.keys(d.link_to.children).length > 0) {
        const pos3 = positionButton(Math.PI * 0.5);
        const childrenButton = actionGroup.append("g")
          .attr("transform", `translate(${pos3.x},${pos3.y})`)
          .attr("cursor", "pointer");
        
        childrenButton.append("circle")
          .attr("r", buttonRadius)
          .attr("fill", "#ed8936")
          .attr("opacity", 0.9);
        
        // Add chevron icon using SVG path (right for expand, left for collapse)
        const isCollapsed = collapsedState.collapsed.right.includes(d.id);
        childrenButton.append("path")
          .attr("d", isCollapsed 
            ? "M8.25 4.5l7.5 7.5-7.5 7.5" // Right chevron (expand)
            : "M15.75 19.5L8.25 12l7.5-7.5" // Left chevron (collapse)
          )
          .attr("transform", "translate(-8, -8) scale(0.5)")
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("stroke-width", "3")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round");
        
        // On click, toggle children collapse state
        childrenButton.on("click", (event) => {
          event.stopPropagation();
          toggleChildrenCollapse(d.id);
        });
      }
      
      // 4. Parents collapse/expand button at 9 o'clock (only for nodes with parents)
      if (d.id === primaryNode && d.link_to?.parent && Object.keys(d.link_to.parent).length > 0) {
        const pos4 = positionButton(Math.PI * 1.5);
        const parentsButton = actionGroup.append("g")
          .attr("transform", `translate(${pos4.x},${pos4.y})`)
          .attr("cursor", "pointer");
        
        parentsButton.append("circle")
          .attr("r", buttonRadius)
          .attr("fill", "#38b2ac")
          .attr("opacity", 0.9);
        
        // Add chevron icon using SVG path (left for expand, right for collapse)
        const isCollapsed = collapsedState.collapsed.left.includes(d.id);
        parentsButton.append("path")
          .attr("d", isCollapsed 
            ? "M15.75 19.5L8.25 12l7.5-7.5" // Left chevron (expand)
            : "M8.25 4.5l7.5 7.5-7.5 7.5" // Right chevron (collapse)
          )
          .attr("transform", "translate(-8, -8) scale(0.5)")
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("stroke-width", "3")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round");
        
        // On click, toggle parents collapse state
        parentsButton.on("click", (event) => {
          event.stopPropagation();
          toggleParentsCollapse(d.id);
        });
      }
      
      // Show/hide action buttons on hover
      if (hoveredNode === d.id) {
        actionGroup
          .attr("opacity", 1)
          .attr("pointer-events", "all");
      }
    });
        
    // Fix node dragging to only work with specific drag handlers
    function dragstarted(event: any, d: any) {
      d.isDragging = true;
    }
    
    function dragged(event: any, d: any) {
      // Directly update position
      d.x = event.x;
      d.y = event.y;
      
      // Update fixed position during drag
      d.fx = event.x;
      d.fy = event.y;
      
      // Use the event source element
      const draggedNode = d3.select(event.sourceEvent.target.closest('.nodes > g'));
      draggedNode.attr("transform", `translate(${event.x},${event.y})`);
      
      // Update connected links
      link.filter((l: any) => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return sourceId === d.id || targetId === d.id;
      }).attr("d", (l: any) => {
        const source = typeof l.source === 'object' ? l.source : nodesWithPositions.find(n => n.id === l.source);
        const target = typeof l.target === 'object' ? l.target : nodesWithPositions.find(n => n.id === l.target);
        
        // Update source or target position based on which node is being dragged
        const x1 = source.id === d.id ? d.x : source.x;
        const y1 = source.id === d.id ? d.y : source.y;
        const x2 = target.id === d.id ? d.x : target.x;
        const y2 = target.id === d.id ? d.y : target.y;
        
        // Calculate direction vector
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate points at the edge of the circles (radius = 24)
        const nodeRadius = 24;
        const sourceX = x1 + (nx * nodeRadius);
        const sourceY = y1 + (ny * nodeRadius);
        const targetX = x2 - (nx * nodeRadius);
        const targetY = y2 - (ny * nodeRadius);
        
        // Calculate curve
        const newDx = targetX - sourceX;
        const newDy = targetY - sourceY;
        const newDr = Math.sqrt(newDx * newDx + newDy * newDy) * 1.5;
        
        return `M${sourceX},${sourceY}A${newDr},${newDr} 0 0,1 ${targetX},${targetY}`;
      });
    }
    
    function dragended(event: any, d: any) {
      d.isDragging = false;
      
      // Update stored position
      fixedPositions[d.id] = { x: d.x, y: d.y };
    }
  };
  
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