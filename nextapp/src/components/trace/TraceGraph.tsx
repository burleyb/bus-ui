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

// Function to wrap text similar to WorkflowGraph
const wrapNodeLabel = (text: d3.Selection<any, any, any, any>, label: string) => {
  // If text is very short, just add it directly
  if (label.length <= 10) {
    text.text(label);
    return;
  }

  // Otherwise, split into multiple lines for longer text
  const words = label.split(/(?=[A-Z])|\s+/); // Split on spaces or camelCase
  const lineHeight = 1.1; // ems
  let line: string[] = [];
  let lineNumber = 0;
  const y = text.attr('y') || '0';
  const dy = parseFloat(text.attr('dy') || '0');
  const maxWidth = 100; // Maximum width in pixels

  // Clear any existing content
  text.text(null);

  let tspan = text.append('tspan')
    .attr('x', 0)
    .attr('y', y)
    .attr('dy', dy + 'px');

  let currentLine = '';
  let currentWidth = 0;

  words.forEach((word, i) => {
    // Test adding this word to the line
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = (testLine.length * 5); // Approximate width based on character count

    if (testWidth > maxWidth && currentLine) {
      // Line would be too long, create a new line
      tspan.text(currentLine);
      tspan = text.append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', ++lineNumber * lineHeight + dy + 'px')
        .text(word);
      currentLine = word;
      currentWidth = word.length * 5;
    } else {
      // Add to current line
      currentLine = testLine;
      currentWidth = testWidth;
    }
  });

  // Add the last line
  if (currentLine) {
    tspan.text(currentLine);
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

  // Vertical spacing is doubled
  const VERTICAL_SPACING = 160; 
  // Using a consistent blue color for all nodes and processed links
  const NODE_STROKE_COLOR = '#3B82F6'; 
  // Thinner stroke weight
  const STROKE_WEIGHT = 1;

  // Function to fetch queue payload data
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
              [`${queueId}:${eid}`]: data.results[0].payload
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching queue payload:', error);
    }
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

  // Handle zoom via mouse wheel
  const handleWheel = (event: WheelEvent) => {
    if (!onZoomChange) return;
    
    event.preventDefault();
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1; // Zoom out if positive delta, in if negative
    
    // Limit zoom to reasonable bounds (0.25 to 3)
    const newZoom = Math.max(0.25, Math.min(3, zoom * zoomFactor));
    
    onZoomChange(newZoom);
  };

  // Draw the graph
  useEffect(() => {
    if (!svgRef.current || !traceData) return;

    const { nodes, links } = processTraceData();
    
    const svgElement = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Add wheel event listener for zooming
    svgRef.current.addEventListener('wheel', handleWheel);
    
    // Clear previous content
    svgElement.selectAll('*').remove();
    
    // Create the zoom/pan container group
    const g = svgElement.append('g')
      .attr('transform', `translate(${width/2 + offset[0]}, ${height/2 + offset[1]}) scale(${zoom})`);
    
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
        
        // Add background pill
        g.append('rect')
          .attr('x', -40)
          .attr('y', -10)
          .attr('width', 80)
          .attr('height', 20)
          .attr('rx', 10)
          .attr('ry', 10)
          .attr('fill', 'white')
          .attr('stroke', NODE_STROKE_COLOR)
          .attr('stroke-width', 1);
        
        // Add text
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', NODE_STROKE_COLOR)
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
            d3.select(event.currentTarget)
              .text('tracing...');
            
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
      .attr('fill', d => {
        if (d.id === traceData.event.id) return '#2563EB'; // Primary event
        if (d.type === 'bot') {
          return d.has_processed ? '#10B981' : '#EF4444'; // Green for processed, red for not
        }
        return '#F59E0B'; // Queue nodes are orange
      })
      .attr('stroke', NODE_STROKE_COLOR) // Use consistent blue stroke
      .attr('stroke-width', STROKE_WEIGHT);
    
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
      .attr('dy', nodeSize + 15)
      .attr('fill', '#4B5563')
      .attr('class', 'text-xs font-medium')
      .each(function(d) {
        // Extract short label from server_id
        const parts = d.server_id ? d.server_id.split(':') : (d.id ? d.id.split(':') : []);
        const label = parts.length > 1 ? parts[1] : (d.label || d.id || '');
        
        // Apply text wrapping
        wrapNodeLabel(d3.select(this), label);
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
    
    // Bot nodes show processed/not processed
    nodeGroups
      .filter(d => d.type === 'bot')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -nodeSize - 15)
      .attr('fill', d => d.has_processed ? '#10B981' : '#EF4444')
      .attr('class', 'text-xs font-medium')
      .text(d => d.has_processed ? 'Processed' : 'Not Processed');
    
    // Add drag behavior for panning
    svgElement.call(
      d3.drag<SVGSVGElement, unknown, unknown>()
        .on('start', (event) => {
          if (event.sourceEvent.target.closest('.settings-button') || 
              event.sourceEvent.target.closest('.trace-label')) return;
          setIsDragging(true);
          setDragStart([event.x, event.y]);
        })
        .on('drag', (event) => {
          if (!isDragging) return;
          const dx = event.x - dragStart[0];
          const dy = event.y - dragStart[1];
          onOffsetChange([offset[0] + dx, offset[1] + dy]);
          setDragStart([event.x, event.y]);
        })
        .on('end', () => {
          setIsDragging(false);
        })
    );
    
    // Cleanup event listener
    return () => {
      if (svgRef.current) {
        svgRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [traceData, zoom, offset, onOffsetChange, onZoomChange, onTraceToChild, openNodeSettingsDialog]);

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
      const hasPayload = queuePayloads[payloadKey];
      
      content = `
        <div class="text-sm">
          <div class="font-semibold mb-1">${node.label || node.id}</div>
          <div class="text-gray-500">Type: Queue</div>
          ${node.lag !== undefined && node.lag !== null ? `<div class="text-gray-500">Lag: ${node.lag}ms</div>` : ''}
          
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
          <div class="text-gray-500">Status: ${node.has_processed ? 'Processed' : 'Not Processed'}</div>
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