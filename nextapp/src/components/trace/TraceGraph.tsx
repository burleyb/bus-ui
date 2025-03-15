"use client";

import React, { useEffect, useRef, useState } from 'react';
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
  event: TraceNode;
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

// Fix the text wrapping function for proper vertical stacking
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
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [queuePayloads, setQueuePayloads] = useState<Record<string, any>>({});
  const { openNodeSettingsDialog } = useDialogs();

  // Vertical spacing is increased by 60% more
  const VERTICAL_SPACING = 260; // Increased from 160 to 260 
  // Using a consistent blue color for all nodes and processed links
  const NODE_STROKE_COLOR = '#3B82F6'; 
  // Thinner stroke weight
  const STROKE_WEIGHT = 1;

  // Define drag handlers at component level for better type safety
  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;
    
    const dx = event.clientX - dragStart[0];
    const dy = event.clientY - dragStart[1];
    onOffsetChange([offset[0] + dx, offset[1] + dy]);
    setDragStart([event.clientX, event.clientY]);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Reset cursor back to grab
    if (svgRef.current) {
      d3.select(svgRef.current).select('rect').style('cursor', 'grab');
    }
  };

  // Improved wheel event handler to fix zoom functionality
  const handleWheel = (event: WheelEvent) => {
    if (!onZoomChange) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1; // Zoom out if positive delta, in if negative
    
    // Limit zoom to reasonable bounds (0.25 to 3)
    const newZoom = Math.max(0.25, Math.min(3, zoom * zoomFactor));
    
    onZoomChange(newZoom);
  };

  // Function to fetch queue payload data and event timestamps
  const fetchQueuePayload = async (queueId: string, eid: string) => {
    try {
      // Only fetch if we don't already have it cached
      if (!queuePayloads[`${queueId}:${eid}`]) {
        const response = await fetch(`/api/queues/${queueId}/events?eid=${eid}&limit=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            setQueuePayloads(prev => ({
              ...prev,
              [`${queueId}:${eid}`]: {
                payload: data.results[0].payload,
                created_at: data.results[0].created_at || data.results[0].ts
              }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching queue payload:', error);
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

  // Process children - modified to create unique instances for shared children
  const processChildren = (
    children: Record<string, TraceNode>,
    parentX: number, 
    parentY: number,
    depth: number,
    nodes: TraceNode[],
    links: TraceLink[],
    parentId: string,
    pathPrefix = '',
    processedNodes: Set<string> = new Set()
  ): void => {
    const childKeys = Object.keys(children);
    
    // Calculate horizontal positioning (for horizontal layout)
    childKeys.forEach((key, index) => {
      const node = children[key];
      const x = parentX + 200; // Fixed horizontal distance
      
      // Distribute children vertically with more space, centered on the parent
      const y = parentY - (childKeys.length - 1) * VERTICAL_SPACING / 2 + index * VERTICAL_SPACING;
      
      // Create a unique ID for this instance of the node
      const uniqueId = `${node.id}_${parentId}_${index}`;
      
      // Always add a new node instance (don't reuse)
      nodes.push({
        ...node,
        x,
        y,
        uniqueId
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
          processedNodes
        );
      }
    });
  };

  // Process the trace data into a format suitable for visualization
  const processTraceData = () => {
    const nodes: TraceNode[] = [];
    const links: TraceLink[] = [];
    const processedNodes = new Set<string>();
    
    // Start with the event node (center)
    const eventNode = { ...traceData.event, x: 0, y: 0, uniqueId: traceData.event.id };
    nodes.push(eventNode);
    
    // Process parent nodes (placed to the left for horizontal layout)
    if (traceData.parents && traceData.parents.length > 0) {
      traceData.parents.forEach((parent, index, arr) => {
        const x = -200; // Fixed horizontal position to the left
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
    
    // Remove any existing wheel listener to prevent duplicates
    svgRef.current.removeEventListener('wheel', handleWheel);
    // Add wheel event listener for zooming with passive:false to allow preventDefault
    svgRef.current.addEventListener('wheel', handleWheel, { passive: false });
    
    // Clear any lingering event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Clear previous content
    svgElement.selectAll('*').remove();
    
    // Create background rect to capture events
    svgElement.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f3f4f6') // Light grey background
      .style('cursor', 'grab')
      .style('touch-action', 'none') // Prevent default touch actions
      .on('mousedown', function(this: any, event: any) {
        // Only start drag if clicking on background (not a node)
        if (event.target === this) {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(true);
          setDragStart([event.clientX, event.clientY]);
          
          // Set a 'grabbing' cursor to indicate active dragging
          d3.select(this).style('cursor', 'grabbing');
          
          // Add event listeners to document for better tracking
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }
      });

    // Add a specific mouse wheel handler to the SVG
    svgElement.on('wheel.zoom', function(this: any, event: any) {
      if (!onZoomChange) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const delta = event.deltaY;
      const zoomFactor = delta > 0 ? 0.9 : 1.1; // Zoom out if positive delta, in if negative
      
      // Limit zoom to reasonable bounds (0.25 to 3)
      const newZoom = Math.max(0.25, Math.min(3, zoom * zoomFactor));
      
      onZoomChange(newZoom);
    });
    
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
            
            if (sourceNode && targetNode) {
              onTraceToChild([sourceNode.id, targetNode.id].join(','));
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
        
        // For queue nodes that have been traced, fetch their payload
        if (d.type === 'queue' && traceData.event.id) {
          fetchQueuePayload(d.id, traceData.event.id);
        }
        
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
      
    // Node labels with text wrapping
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', nodeSize + 15)
      .attr('fill', '#4B5563')
      .attr('class', 'text-xs font-medium node-label')
      .each(function(d) {
        const text = d3.select(this);
        // Extract short label
        const parts = d.server_id ? d.server_id.split(':') : (d.id ? d.id.split(':') : []);
        const label = parts.length > 1 ? parts[1] : (d.label || d.id || '');
        
        // Apply simplified text wrapping to avoid overlapping
        if (label.length <= 12) {
          text.text(label);
        } else {
          // For longer labels, add line breaks
          const lines = [];
          let currentLine = '';
          
          // Split the label into words
          const words = label.split(/(?=[A-Z])|\s+/);
          
          words.forEach(word => {
            if ((currentLine + word).length <= 12) {
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
    
    // Add processed/not processed labels BELOW node name for bot nodes
    nodeGroups
      .filter(d => d.type === 'bot')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', nodeSize + 40) // Fixed position below the node label
      .attr('fill', d => d.has_processed ? '#10B981' : '#EF4444')
      .attr('class', 'text-xs font-medium status-label')
      .text(d => d.has_processed ? 'Processed' : 'Not Processed');
    
    // Adjust the queue timestamp to be better positioned and formatted
    nodeGroups
      .filter(d => d.type === 'queue')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', nodeSize + 45) // Position further down below the node label
      .attr('fill', '#6B7280')
      .attr('class', 'text-xs timestamp-label')
      .each(function(d) {
        const text = d3.select(this);
        const payloadKey = `${d.id}:${traceData.event.id}`;
        const queueData = queuePayloads[payloadKey];
        
        if (queueData && queueData.created_at) {
          text.text(formatDate(queueData.created_at));
        } else {
          text.text('Loading time...');
          
          // Fetch the data if not available
          if (d.type === 'queue' && traceData.event.id) {
            fetchQueuePayload(d.id, traceData.event.id).then(() => {
              // Update the text when data is available
              const updatedData = queuePayloads[payloadKey];
              if (updatedData && updatedData.created_at) {
                text.text(formatDate(updatedData.created_at));
              } else {
                text.text('Time unavailable');
              }
            });
          }
        }
      });
    
    // Add queue settings button
    nodeGroups
      .filter(d => d.type === 'queue')
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
        
        // Add settings icon
        group.select('.settings-button')
          .append('g')
          .attr('transform', 'translate(0, 0) scale(0.6)')
          .html('<path d="M9 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="white"/><path d="M9 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="white"/><path d="M9 14.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="white"/>');
        
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
    
    // Cleanup event listeners in return function
    return () => {
      if (svgRef.current) {
        svgRef.current.removeEventListener('wheel', handleWheel);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      svgElement.on('wheel.zoom', null);
    };
  }, [traceData, zoom, offset, onOffsetChange, onZoomChange, onTraceToChild, openNodeSettingsDialog, isDragging, queuePayloads]);

  // Handle tooltip positioning and content
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
      const hasPayload = queueData?.payload;
      
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
                <pre>${JSON.stringify(hasPayload, null, 2)}</pre>
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

  // Handle zoom changes
  const handleZoomChange = (zoomFactor: number) => {
    // Limit zoom to reasonable bounds (0.25 to 3)
    const newZoom = Math.max(0.25, Math.min(3, zoom * zoomFactor));
    
    // Use the onZoomChange handler if provided
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full bg-gray-100 dark:bg-gray-800"
        width="100%"
        height="100%"
      />
      <div
        ref={tooltipRef}
        className="absolute hidden z-50 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs"
      />
      
      {/* Zoom and position controls */}
      <div className="absolute bottom-4 right-4 flex flex-row gap-2">
        <button 
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={() => handleZoomChange(1.1)} // Zoom in
          title="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button 
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          onClick={() => handleZoomChange(0.9)} // Zoom out
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