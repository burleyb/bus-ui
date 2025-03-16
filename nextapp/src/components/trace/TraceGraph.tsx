"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useAppContext } from '@/context/AppContext';
import { useDialogs } from '@/hooks/useDialogs';
import { ChevronRightCircle, Settings } from 'lucide-react';
import { getNodeImagesSvgString, getNodeImagePath } from '@/components/node/NodeIcon';
import { getNodeShape, getShapePath, getNodeVisualProperties } from '@/utils/workflowUtils';

interface TraceNode {
  id: string;
  label: string;
  type: string;
  server_id: string;
  has_processed?: boolean;
  lag?: number | null;
  children?: Record<string, TraceNode>;
  checkpoint?: any;
  x?: number;
  y?: number;
  // For duplicate detection
  uniqueId?: string;
  // Add timestamp property that might be present
  timestamp?: string;
  // Add payload property that might be present
  payload?: any;
  // Store path from root for tracing
  pathFromRoot?: string;
}

interface TraceLink {
  source: string;
  target: string;
  processed: boolean;
  type: string;
  tracing?: boolean;
}

export interface TraceData {
  parents: TraceNode[];
  event: TraceNode & { timestamp?: string };
  children: Record<string, TraceNode>;
}

interface TraceGraphProps {
  traceData: TraceData;
  zoom: number;
  offset: [number, number];
  onOffsetChange: (offset: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  onTraceToChild: (path: string) => void;
}

// Fix the text wrapping function for proper vertical stackincode
const wrapNodeLabel = (text: d3.Selection<any, any, any, any>, label: string) => {
  // If text is very short, just add it directly
  if (label.length <= 10) {
    text.text(label);
    return;
  }

  // Otherwise, split into multiple lines for longer text
  const words = label.split(/(?=[A-Z])|\s+/); // Split on spaces or camelCase
  const lineHeight = 1.2; // ems - increased for better spacing
  
  // Clear any existing content
  text.text(null);

  // Create a wrapper group for better positioning
  let y = 0;
  let currentLine = '';
  const maxWidth = 12; // Character limit per line
  
  // Create multiple tspans for each line
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    
    if (testLine.length > maxWidth && i > 0) {
      // Line would be too long, create a new line
      text.append('tspan')
        .attr('x', 0)
        .attr('dy', y === 0 ? 0 : lineHeight + 'em')
        .text(currentLine);
      
      currentLine = word;
      y++;
    } else {
      currentLine = testLine;
    }
  }
  
  // Add the last line
  if (currentLine) {
    text.append('tspan')
      .attr('x', 0)
      .attr('dy', y === 0 ? 0 : lineHeight + 'em')
      .text(currentLine);
  }
};

export default function TraceGraph({
  traceData,
  zoom,
  offset,
  onOffsetChange,
  onZoomChange,
  onTraceToChild
}: TraceGraphProps) {
  const { state } = useAppContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [queuePayloads, setQueuePayloads] = useState<Record<string, any>>({});
  const { openNodeSettingsDialog } = useDialogs();
  
  // Add a ref to store active AbortControllers
  const activeRequestsRef = useRef<Map<string, AbortController>>(new Map());
  
  // Add drag reference state to track drag start position
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffset: [number, number];
    dragging: boolean;
  }>({
    startX: 0,
    startY: 0,
    startOffset: [0, 0],
    dragging: false
  });

  // Vertical spacing is increased by 60% more
  const VERTICAL_SPACING = 260; // Increased from 160 to 260 
  // Using a consistent blue color for all nodes and processed links
  const NODE_STROKE_COLOR = '#3B82F6'; 
  // Thinner stroke weight
  const STROKE_WEIGHT = 2;

  // Function to abort all pending requests
  const abortAllRequests = useCallback(() => {
    activeRequestsRef.current.forEach((controller, key) => {
      controller.abort();
      activeRequestsRef.current.delete(key);
    });
  }, []);

  // Cleanup all requests when component unmounts or trace data changes
  useEffect(() => {
    return () => {
      abortAllRequests();
    };
  }, [abortAllRequests, traceData]);

  // Function to fetch queue payload data and event timestamps with AbortController
  const fetchQueuePayload = async (queueId: string, eid: string) => {
    try {
      const requestKey = `${queueId}:${eid}`;
      
      // Only fetch if we don't already have it cached
      if (!queuePayloads[requestKey]) {
        // Abort any existing request for this queue/eid
        if (activeRequestsRef.current.has(requestKey)) {
          activeRequestsRef.current.get(requestKey)?.abort();
          activeRequestsRef.current.delete(requestKey);
        }
        
        // Create a new AbortController for this request
        const controller = new AbortController();
        activeRequestsRef.current.set(requestKey, controller);
        
        // This is where the actual API call would happen
        // For now, we're just setting a placeholder timestamp as per requirements
        setQueuePayloads(prev => ({
          ...prev,
          [requestKey]: {
            created_at: traceData.event?.timestamp || new Date().toISOString()
          }
        }));
        
        // If this was an actual API call, we'd use controller.signal
        // Example:
        // const response = await fetch(`/api/queues/${queueId}/events/${eid}`, {
        //   signal: controller.signal
        // });
        
        // After request completes, remove the controller
        activeRequestsRef.current.delete(requestKey);
      }
    } catch (error) {
      // Only log non-abort errors
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error handling queue data:', error);
      }
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Process children - modified to create unique instances for ALL nodes and avoid overlaps
  const processChildren = (
    children: Record<string, TraceNode>,
    parentX: number, 
    parentY: number,
    depth: number,
    nodes: TraceNode[],
    links: TraceLink[],
    parentId: string,
    pathPrefix = '',
    processedNodes: Set<string> = new Set(),
    occupiedPositions: Map<number, Set<number>> = new Map()
  ): void => {
    const childKeys = Object.keys(children);
    
    // Track occupied positions at each X coordinate
    if (!occupiedPositions.has(parentX + 400)) {
      occupiedPositions.set(parentX + 400, new Set<number>());
    }
    
    // Calculate horizontal positioning (for horizontal layout)
    childKeys.forEach((key, index) => {
      const node = children[key];
      const x = parentX + 400; // Doubled horizontal distance from 200 to 400
      
      // Distribute children vertically with more space, centered on the parent
      let y = parentY - (childKeys.length - 1) * VERTICAL_SPACING / 2 + index * VERTICAL_SPACING;
      
      // Check if this position is occupied and adjust if needed
      const occupiedYs = occupiedPositions.get(x)!;
      
      // Find a non-overlapping Y position by incrementing in VERTICAL_SPACING/2 units if needed
      let attempts = 0;
      const originalY = y;
      while (occupiedYs.has(y) && attempts < 20) { // Limit attempts to avoid infinite loops
        y = originalY + (VERTICAL_SPACING / 2) * (attempts + 1);
        attempts++;
      }
      
      // Mark this position as occupied
      occupiedYs.add(y);
      
      // Always create a unique ID for this instance of the node
      const uniqueId = `${node.id}_${parentId}_${index}`;
      
      // For queue nodes, try to find event timestamp if available
      let timestamp = node.timestamp;
      if (node.type === 'queue' && traceData.event && traceData.event.timestamp) {
        timestamp = traceData.event.timestamp;
      }
      
      // Always add a new node instance (don't reuse nodes)
      nodes.push({
        ...node,
        timestamp,
        x,
        y,
        uniqueId,
        // Store path from root for tracing
        pathFromRoot: pathPrefix ? `${pathPrefix},${node.id}` : node.id
      });
      
      // Add link from parent to this node
      links.push({
        source: parentId,
        target: uniqueId, // Use unique ID for targeting
        processed: !!node.has_processed,
        type: 'child',
      });
      
      // Process children recursively if they exist
      if (node.children && Object.keys(node.children).length > 0) {
        const newPathPrefix = pathPrefix ? `${pathPrefix},${node.id}` : node.id;
        processChildren(
          node.children,
          x, // New parent X
          y, // New parent Y
          depth + 1,
          nodes,
          links,
          uniqueId, // Use unique ID as parent
          newPathPrefix,
          processedNodes,
          occupiedPositions
        );
      }
    });
  };

  // Process the trace data into a format suitable for visualization
  const processTraceData = () => {
    const nodes: TraceNode[] = [];
    const links: TraceLink[] = [];
    const processedNodes = new Set<string>();
    
    // Handle potential missing traceData
    if (!traceData || !traceData.event) {
      return { nodes, links };
    }
    
    // Start with the event node (center)
    const eventNode = { ...traceData.event, x: 0, y: 0, uniqueId: traceData.event.id };
    nodes.push(eventNode);
    
    // Process parent nodes (placed to the left for horizontal layout)
    if (traceData.parents && traceData.parents.length > 0) {
      traceData.parents.forEach((parent, index, arr) => {
        if (!parent.id) return; // Skip if parent has no id
        
        const x = -400; // Doubled horizontal position to the left (from -200 to -400)
        // Increased vertical spacing
        const y = -(arr.length - 1) * VERTICAL_SPACING / 2 + index * VERTICAL_SPACING; 
        
        // Create a unique ID for this instance
        const uniqueId = `${parent.id}_parent_${index}`;
        
        nodes.push({
          ...parent,
          x,
          y,
          uniqueId
        });
        
        // Add link to event
        links.push({
          source: uniqueId,
          target: eventNode.uniqueId!,
          processed: true, // Parents always processed the event
          type: 'parent',
        });
      });
    }
    
    // Process children (placed to the right for horizontal layout)
    if (traceData.children && Object.keys(traceData.children).length > 0) {
      processChildren(
        traceData.children,
        0, // Event node x
        0, // Event node y
        1, // Depth
        nodes,
        links,
        eventNode.uniqueId!,
        "",
        processedNodes
      );
    }
    
    return { nodes, links };
  };

  // Draw the graph
  useEffect(() => {
    if (!svgRef.current || !traceData) return;

    const { nodes, links } = processTraceData();
    
    const svgElement = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous content
    svgElement.selectAll('*').remove();
    
    // Create the D3 drag behavior with improved event handling
    const dragBehavior = d3.drag()
      .on('start', function(event) {
        // Store the initial drag position and current offset
        dragRef.current = {
          startX: event.sourceEvent.clientX,
          startY: event.sourceEvent.clientY,
          startOffset: [...offset] as [number, number],
          dragging: true
        };
        
        // Use React state to control cursor
        setIsDragging(true);
      })
      .on('drag', function(event) {
        if (!dragRef.current.dragging) return;
        
        // Calculate the new offset based on the distance from the drag start position
        const dx = event.sourceEvent.clientX - dragRef.current.startX;
        const dy = event.sourceEvent.clientY - dragRef.current.startY;
        
        // Apply the delta to the original offset
        const newOffsetX = dragRef.current.startOffset[0] + dx;
        const newOffsetY = dragRef.current.startOffset[1] + dy;
        
        // Update the offset with the calculated values
        onOffsetChange([newOffsetX, newOffsetY]);
      })
      .on('end', function() {
        // Reset drag state
        dragRef.current.dragging = false;
        
        // Use React state to control cursor
        setIsDragging(false);
      });
    
    // Create background rect to capture events
    svgElement.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f3f4f6') // Light grey background
      .style('touch-action', 'none') // Prevent default touch actions
      .style('user-select', 'none') // Prevent selection during drag
      .call(dragBehavior as any); // Apply the drag behavior
      
    // Create the zoom/pan container group
    const g = svgElement.append('g')
      .attr('transform', `translate(${width/2 + offset[0]}, ${height/2 + offset[1]}) scale(${zoom})`)
      .attr('class', 'graph-container');
    
    // Draw links first (so they're behind nodes)
    const link = g.selectAll('.link')
      .data(links)
      .enter()
      .append('g')
      .attr('class', 'link');
    
    // Draw link paths with curves
    link.append('path')
      .attr('d', d => {
        const source = nodes.find(n => n.uniqueId === d.source);
        const target = nodes.find(n => n.uniqueId === d.target);
        
        if (!source || !target) return '';
        
        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        
        // If nodes are horizontally aligned, use a straight line
        if (Math.abs(dy) < 5) {
          return `M${source.x},${source.y} L${target.x},${target.y}`;
        }
        
        // Otherwise use a curved path
        // Calculate curve control points
        const midX = (source.x! + target.x!) / 2;
        
        return `M${source.x},${source.y} 
                C${source.x! + dx/3},${source.y!},
                  ${target.x! - dx/3},${target.y!},
                  ${target.x},${target.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (d.tracing) return NODE_STROKE_COLOR; // Blue for tracing
        return d.processed ? NODE_STROKE_COLOR : '#D1D5DB'; // Blue for processed, grey for unprocessed
      })
      .attr('stroke-width', STROKE_WEIGHT)
      .attr('stroke-dasharray', d => d.tracing ? '5,5' : 'none');
    
    // Add link labels (for trace links) with styled background
    link.filter(d => d.processed && d.type === 'child')
      .append('g')
      .attr('transform', d => {
        const source = nodes.find(n => n.uniqueId === d.source);
        const target = nodes.find(n => n.uniqueId === d.target);
        if (!source || !target) return '';
        
        const x = (source.x! + target.x!) / 2;
        const y = (source.y! + target.y!) / 2 - 10;
        return `translate(${x}, ${y})`;
      })
      .attr('class', 'trace-label')
      .each(function(this: any, d: any) {
        const g = d3.select(this);
        
        // Add background pill with improved styling
        g.append('rect')
          .attr('x', -45)
          .attr('y', -12)
          .attr('width', 90)
          .attr('height', 24)
          .attr('rx', 12)
          .attr('ry', 12)
          .attr('fill', 'white')
          .attr('stroke', NODE_STROKE_COLOR)
          .attr('stroke-width', 1)
          .attr('class', 'trace-label-bg');
        
        // Add text with improved visibility
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', NODE_STROKE_COLOR)
          .attr('font-weight', 'bold')
          .attr('class', 'text-xs cursor-pointer')
          .attr('pointer-events', 'all')
          .text(d.tracing ? 'tracing...' : 'click to trace')
          .on('click', function(this: any, event: any, d: any) {
            event.stopPropagation();
            // Mark as tracing
            d.tracing = true;
            
            // Update path style
            d3.select(event.currentTarget.parentNode.parentNode)
              .select('path')
              .attr('stroke', NODE_STROKE_COLOR)
              .attr('stroke-dasharray', '5,5');
            
            // Update label
            d3.select(this)
              .text('tracing...');
            
            d3.select(this.parentNode)
              .select('.trace-label-bg')
              .attr('fill', '#EBF5FF');
            
            // Build the children path
            const sourceNode = nodes.find(n => n.uniqueId === d.source);
            const targetNode = nodes.find(n => n.uniqueId === d.target);
            
            // Only call onTraceToChild if both nodes exist and have ids
            if (sourceNode && targetNode && sourceNode.id && targetNode.id) {
              // If target node has a stored path from root, use that for more complete tracing
              // This enables deeper tracing through the tree as described in requirements
              const tracePath = targetNode.pathFromRoot || `${sourceNode.id},${targetNode.id}`;
              onTraceToChild(tracePath);
            } else {
              console.error('Cannot trace: missing node data');
            }
          });
      });
    
    // Draw nodes
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)
      .attr('data-id', d => d.id)
      .attr('data-unique-id', d => d.uniqueId || '')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
        
        // For queue nodes, don't fetch their payload
        // if (d.type === 'queue' && traceData.event.id) {
        //   fetchQueuePayload(d.id, traceData.event.id);
        // }
        
        // Add highlight effect
        d3.select(event.currentTarget)
          .select('circle:first-child')
          .attr('stroke', NODE_STROKE_COLOR)
          .attr('stroke-width', STROKE_WEIGHT * 2);
          
        showTooltip(d, event);
      })
      .on('mouseleave', (event) => {
        setHoveredNode(null);
        // Remove highlight effect
        d3.select(event.currentTarget)
          .select('circle:first-child')
          .attr('stroke', NODE_STROKE_COLOR)
          .attr('stroke-width', STROKE_WEIGHT);
          
        hideTooltip();
      })
      .on('click', (event, d) => {
        // Handle node click - could show more details or focus on the node
        console.log('Node clicked:', d.id);
        // Center the graph on this node
        if (d.x !== undefined && d.y !== undefined) {
          const newOffsetX = -d.x * zoom;
          const newOffsetY = -d.y * zoom;
          onOffsetChange([newOffsetX, newOffsetY]);
        }
      });
    
    // Create shape outlines for nodes (similar to WorkflowGraph)
    const nodeSize = 26;
    
    // Draw node backgrounds based on type
    nodeGroups.append('circle')
      .attr('r', nodeSize)
      .attr('fill', 'white') // All nodes have white background
      .attr('stroke', NODE_STROKE_COLOR) // Blue stroke for all nodes
      .attr('stroke-width', STROKE_WEIGHT);
    
    // For bot nodes, use dashed outline for unprocessed bots
    nodeGroups
      .filter(d => d.type === 'bot' && !d.has_processed)
      .select('circle')
      .attr('stroke-dasharray', '2,2');
    
    // Add node icons using proper icon paths
    nodeGroups.each(function(d) {
      const node = d3.select(this);
      
      // Add proper node icons
      if (d.type === 'bot' || d.type === 'queue') {
        // Add a white background circle for the icon
        node.append('circle')
          .attr('r', nodeSize * 0.7)
          .attr('fill', 'white');
        
        // For bots, always use bot.png
        const imgPath = d.type === 'bot' 
          ? '/images/nodes/bot.png' 
          : getNodeImagePath({ 
              type: d.type, 
              has_processed: d.has_processed,
              status: d.has_processed ? 'running' : 'blocked'
            });
        
        // Add image directly using SVG image element with proper centering
        node.append('image')
          .attr('href', typeof window !== 'undefined' ? 
            `${window.location.origin}${imgPath}` : imgPath)
          .attr('x', -nodeSize * 0.5)
          .attr('y', -nodeSize * 0.5)
          .attr('width', nodeSize)
          .attr('height', nodeSize)
          .attr('preserveAspectRatio', 'xMidYMid meet');
      } else {
        // Fallback for other node types
        node.append('circle')
          .attr('r', nodeSize * 0.7)
          .attr('fill', 'white');
          
        node.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', '14px')
          .attr('fill', d.id === traceData.event.id ? '#2563EB' : '#6B7280')
          .text(d.type?.charAt(0).toUpperCase() || 'E');
      }
    });
      
    // Node labels with consistent width between bots and queues (was too wide for queues, too narrow for bots)
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', nodeSize + 15)
      .attr('fill', '#4B5563')
      .attr('class', 'text-xs font-medium node-label')
      .each(function(d) {
        // Save the node reference in the DOM element for later access
        // @ts-ignore - Add property for internal use
        this.__data__ = d;
        
        const text = d3.select(this);
        // Extract short label
        const parts = d.server_id ? d.server_id.split(':') : (d.id ? d.id.split(':') : []);
        const label = parts.length > 1 ? parts[1] : (d.label || d.id || '');
        
        // Use consistent max width for all node types
        const maxWidth = d.type === 'queue' ? 14 : 12; // Slightly wider for queues, narrower for bots
        
        // Apply simplified text wrapping to avoid overlapping
        if (label.length <= 10) {
          text.text(label);
        } else {
          // For longer labels, add line breaks
          const lines = [];
          let currentLine = '';
          
          // Split the label into words
          const words = label.split(/(?=[A-Z])|\s+/);
          
          words.forEach(word => {
            if ((currentLine + word).length <= maxWidth) {
              currentLine += word;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          });
          
          if (currentLine) lines.push(currentLine);
          
          // Add each line as a tspan with proper vertical spacing
          lines.forEach((line, i) => {
            text.append('tspan')
              .attr('x', 0)
              .attr('dy', i === 0 ? 0 : '1.2em')
              .text(line);
          });
        }
      });
    
    // Calculate label height for proper positioning of status labels
    nodeGroups.each(function(d) {
      const node = d3.select(this);
      const labelNode = node.select('.node-label').node();
      if (!labelNode) return;
      
      // Get actual height of the label element
      const labelHeight = (labelNode as SVGGraphicsElement).getBBox().height;
      
      // Position bot status labels properly below the node label
      if (d.type === 'bot') {
        node.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', nodeSize + 20 + labelHeight) // Position below label with padding
          .attr('fill', d.has_processed ? '#10B981' : '#EF4444')
          .attr('class', 'text-xs font-medium status-label')
          .text(d.has_processed ? 'Processed' : 'Not Processed');
      }
      
      // Position queue timestamp labels properly below the node label
      if (d.type === 'queue') {
        const timestampLabel = node.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', nodeSize + 20 + labelHeight) // Position below label with padding
          .attr('fill', '#6B7280')
          .attr('class', 'text-xs timestamp-label');
        
        // Logic to determine timestamp text - simplified to not rely on API calls
        if (d.timestamp) {
          timestampLabel.text(formatDate(d.timestamp));
        } else if (traceData.event && traceData.event.timestamp) {
          timestampLabel.text(formatDate(traceData.event.timestamp));
        } else {
          timestampLabel.text('Time unavailable');
        }
      }
    });
    
    // Add queue settings button
    nodeGroups
      .filter(d => d.type === 'queue' || d.type === 'bot') // Modified to include bot nodes
      .each(function(d) {
        const group = d3.select(this);
        
        // Add gear icon
        group.append('g')
          .attr('transform', `translate(${nodeSize - 5}, ${-nodeSize + 5})`)
          .attr('class', 'settings-button')
          .style('cursor', 'pointer')
          .style('opacity', 0) // Start hidden
          .on('click', (event) => {
            event.stopPropagation();
            openNodeSettingsDialog(d.id);
          })
          .append('circle')
          .attr('r', 10)
          .attr('fill', '#4B5563');
        
        // Add settings icon - replaced with proper gear icon from WorkflowGraphRenderer
        group.select('.settings-button')
          .append('path')
          .attr('d', 'M9.594 3.094A1.5 1.5 0 0 1 11.07 4.5h.164a1.5 1.5 0 0 1 1.477 1.256l.133.792a1.5 1.5 0 0 0 1.732 1.132l.316-.07a1.5 1.5 0 0 1 1.706.8l.082.16a1.5 1.5 0 0 1-.292 1.841l-.63.54a1.5 1.5 0 0 0 0 2.25l.63.54a1.5 1.5 0 0 1 .292 1.841l-.082.16a1.5 1.5 0 0 1-1.706.8l-.316-.07a1.5 1.5 0 0 0-1.732 1.132l-.133.792A1.5 1.5 0 0 1 11.234 19h-.164a1.5 1.5 0 0 1-1.477-1.256l-.133-.792a1.5 1.5 0 0 0-1.732-1.132l-.316.07a1.5 1.5 0 0 1-1.706-.8l-.082-.16a1.5 1.5 0 0 1 .292-1.841l.63-.54a1.5 1.5 0 0 0 0-2.25l-.63-.54a1.5 1.5 0 0 1-.292-1.841l.082-.16a1.5 1.5 0 0 1 1.706-.8l.316.07a1.5 1.5 0 0 0 1.732-1.132l.133-.792ZM11 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z')
          .attr('transform', 'translate(-10, -10) scale(0.85)')
          .attr('fill', 'white')
          .attr('stroke', 'white')
          .attr('stroke-width', '0.2');
        
        // Show buttons on hover
        group.on('mouseenter.buttons', function() {
          group.select('.settings-button')
            .transition()
            .duration(200)
            .style('opacity', 1);
        });
        
        group.on('mouseleave.buttons', function() {
          group.select('.settings-button')
            .transition()
            .duration(200)
            .style('opacity', 0);
        });
      });
    
    // Cleanup function
    return () => {
      // Clean up D3 event listeners
      svgElement.on('wheel', null);
    };
  }, [traceData, zoom, offset, onOffsetChange, onZoomChange, onTraceToChild, openNodeSettingsDialog, isDragging, queuePayloads]);

  // Show tooltip + handle AbortController cleanup for tooltip events
  const showTooltip = (node: TraceNode, event: any) => {
    if (!tooltipRef.current) return;
    
    const tooltip = tooltipRef.current;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Format tooltip content based on node type
    let content = '';
    
    if (node.type === 'queue') {
      const payloadKey = `${node.id}:${traceData.event.id}`;
      const queueData = queuePayloads[payloadKey];
      
      // Show payload if this is the primary node with payload
      const isPrimaryNode = node.id === traceData.event.id;
      const hasPayload = isPrimaryNode && traceData.event.payload;
      
      content = `
        <div class="text-sm">
          <div class="font-semibold mb-1">${node.label || node.id}</div>
          <div class="text-gray-500">Type: Queue</div>
          ${node.lag !== undefined && node.lag !== null ? `<div class="text-gray-500">Lag: ${node.lag}ms</div>` : ''}
          ${queueData?.created_at ? `<div class="text-gray-500">Time: ${formatDate(queueData.created_at)}</div>` : ''}
          
          ${hasPayload ? `
            <div class="mt-2 border-t border-gray-200 pt-2">
              <div class="font-medium text-gray-700 mb-1">Event Payload:</div>
              <div class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-60">
                <pre>${JSON.stringify(traceData.event.payload, null, 2)}</pre>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    } else if (node.type === 'bot') {
      content = `
        <div class="text-sm">
          <div class="font-semibold mb-1">${node.label || node.id}</div>
          <div class="text-gray-500">Type: Bot</div>
          <div class="${node.has_processed ? 'text-green-500' : 'text-red-500'} font-medium">
            ${node.has_processed ? 'Processed' : 'Not Processed'}
          </div>
          ${node.checkpoint ? `
            <div class="mt-1 text-xs text-gray-500">
              ${node.checkpoint.checkpoint ? `<div>Last checkpoint: ${node.checkpoint.checkpoint}</div>` : ''}
              ${node.checkpoint.records ? `<div>Records: ${node.checkpoint.records}</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    // Set tooltip content
    tooltip.innerHTML = content;
    
    // Position tooltip
    tooltip.style.left = `${mouseX + 10}px`;
    tooltip.style.top = `${mouseY + 10}px`;
    tooltip.style.display = 'block';
  };
  
  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  };

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      abortAllRequests();
    };
  }, [abortAllRequests]);

  return (
    <div 
      className="relative w-full h-full"
      onWheel={(e) => {
        if (!onZoomChange) return;
        
        // Prevent default scrolling behavior
        e.preventDefault();
        
        // Determine direction and apply zoom
        const isScrollingUp = e.deltaY < 0;
        
        if (isScrollingUp) {
          // Zoom in - same as zoom in button
          const newZoom = Math.min(3, zoom * 1.1);
          onZoomChange(newZoom);
        } else {
          // Zoom out - same as zoom out button
          const newZoom = Math.max(0.25, zoom * 0.9);
          onZoomChange(newZoom);
        }
      }}
    >
      <svg
        ref={svgRef}
        className={`w-full h-full bg-gray-100 dark:bg-gray-800 ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
        width="100%"
        height="100%"
        style={{ touchAction: 'none' }} // Prevent browser-default touch actions
      />
      <div
        ref={tooltipRef}
        className="absolute hidden z-50 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs"
      />
      
      {/* Zoom and position controls */}
      <div className="absolute bottom-4 right-4 flex flex-row gap-2">
        <button 
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={() => {
            if (onZoomChange) {
              // Zoom in by 10%
              const newZoom = Math.min(3, zoom * 1.1);
              onZoomChange(newZoom);
            }
          }}
          title="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button 
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={() => {
            if (onZoomChange) {
              // Zoom out by 10%
              const newZoom = Math.max(0.25, zoom * 0.9);
              onZoomChange(newZoom);
            }
          }}
          title="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <button 
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={() => {
            // Reset both position and zoom
            onOffsetChange([0, 0]);
            if (onZoomChange) {
              onZoomChange(1);
            }
          }}
          title="Reset view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l-3 3m0 0l-3-3m3 3V7m6 10l-3-3m0 0l-3 3m3-3v3M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </button>
      </div>
    </div>
  );
} 