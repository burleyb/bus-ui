"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useAppContext } from '@/context/AppContext';
import { useDialogs } from '@/hooks/useDialogs';
import { ChevronRightCircle, Settings } from 'lucide-react';

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
  onTraceToChild: (path: string) => void;
}

export default function TraceGraph({
  traceData,
  zoom,
  offset,
  onOffsetChange,
  onTraceToChild
}: TraceGraphProps) {
  const { state } = useAppContext();
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { openNodeSettingsDialog } = useDialogs();

  const processChildren = (
    children: Record<string, TraceNode>,
    parentX: number, 
    parentY: number,
    depth: number,
    nodes: TraceNode[],
    links: TraceLink[],
    parentId: string,
    pathPrefix = ''
  ): void => {
    const childKeys = Object.keys(children);
    const spacing = 100; // Vertical spacing between nodes
    
    // Calculate vertical positioning
    childKeys.forEach((key, index) => {
      const node = children[key];
      const y = parentY + 100; // Fixed vertical distance
      const x = parentX - (childKeys.length - 1) * 60 / 2 + index * 60; // Horizontal spread
      
      // Add node with position
      nodes.push({
        ...node,
        x,
        y
      });
      
      // Add link from parent to this node
      links.push({
        source: parentId,
        target: node.id,
        processed: !!node.has_processed,
        type: 'child',
      });
      
      // Process children recursively if they exist
      if (node.children && Object.keys(node.children).length > 0) {
        const newPathPrefix = pathPrefix ? `${pathPrefix},${node.id}` : node.id;
        processChildren(
          node.children,
          x,
          y,
          depth + 1,
          nodes,
          links,
          node.id,
          newPathPrefix
        );
      }
    });
  };

  // Process the trace data into a format suitable for visualization
  const processTraceData = () => {
    const nodes: TraceNode[] = [];
    const links: TraceLink[] = [];
    
    // Start with the event node (center)
    const eventNode = { ...traceData.event, x: 0, y: 0 };
    nodes.push(eventNode);
    
    // Process parent nodes (placed above)
    if (traceData.parents && traceData.parents.length > 0) {
      traceData.parents.forEach((parent, index, arr) => {
        const y = -100; // Fixed vertical position above
        const x = -(arr.length - 1) * 60 / 2 + index * 60; // Spread horizontally
        
        nodes.push({
          ...parent,
          x,
          y
        });
        
        // Add link to event
        links.push({
          source: parent.id,
          target: eventNode.id,
          processed: true, // Parents always processed the event
          type: 'parent',
        });
      });
    }
    
    // Process children (placed below)
    if (traceData.children && Object.keys(traceData.children).length > 0) {
      processChildren(
        traceData.children,
        0, // Event node x
        0, // Event node y
        1, // Depth
        nodes,
        links,
        eventNode.id
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
    
    // Create the zoom/pan container group
    const g = svgElement.append('g')
      .attr('transform', `translate(${width/2 + offset[0]}, ${height/2 + offset[1]}) scale(${zoom})`);
    
    // Draw links first (so they're behind nodes)
    const link = g.selectAll('.link')
      .data(links)
      .enter()
      .append('g')
      .attr('class', 'link');
    
    // Draw link lines
    link.append('line')
      .attr('x1', d => {
        const source = nodes.find(n => n.id === d.source);
        return source?.x || 0;
      })
      .attr('y1', d => {
        const source = nodes.find(n => n.id === d.source);
        return source?.y || 0;
      })
      .attr('x2', d => {
        const target = nodes.find(n => n.id === d.target);
        return target?.x || 0;
      })
      .attr('y2', d => {
        const target = nodes.find(n => n.id === d.target);
        return target?.y || 0;
      })
      .attr('stroke', d => d.tracing ? '#3B82F6' : (d.processed ? '#10B981' : '#D1D5DB'))
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.tracing ? '5,5' : 'none');
    
    // Add link labels (for trace links)
    link.filter(d => d.processed && d.type === 'child')
      .append('text')
      .attr('x', d => {
        const source = nodes.find(n => n.id === d.source);
        const target = nodes.find(n => n.id === d.target);
        return ((source?.x || 0) + (target?.x || 0)) / 2;
      })
      .attr('y', d => {
        const source = nodes.find(n => n.id === d.source);
        const target = nodes.find(n => n.id === d.target);
        return ((source?.y || 0) + (target?.y || 0)) / 2 - 5;
      })
      .attr('text-anchor', 'middle')
      .attr('class', 'text-xs cursor-pointer')
      .attr('fill', d => d.tracing ? '#3B82F6' : '#6B7280')
      .text(d => d.tracing ? 'tracing...' : 'click to trace')
      .on('click', (event, d) => {
        event.stopPropagation();
        // Mark as tracing
        d.tracing = true;
        d3.select(event.currentTarget.parentNode)
          .select('line')
          .attr('stroke', '#3B82F6')
          .attr('stroke-dasharray', '5,5');
        
        d3.select(event.currentTarget)
          .text('tracing...')
          .attr('fill', '#3B82F6');
        
        // Build the children path
        const sourceNode = nodes.find(n => n.id === d.source);
        const targetNode = nodes.find(n => n.id === d.target);
        
        if (sourceNode && targetNode) {
          onTraceToChild([sourceNode.id, targetNode.id].join(','));
        }
      });
    
    // Draw nodes
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
        showTooltip(d, event);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        hideTooltip();
      });
    
    // Node background circles
    nodeGroups.append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        if (d.id === traceData.event.id) return '#2563EB'; // Primary event
        if (d.type === 'bot') {
          return d.has_processed ? '#10B981' : '#EF4444'; // Green for processed, red for not
        }
        return '#F59E0B'; // Queue nodes are orange
      })
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2);
    
    // Node labels
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('fill', '#4B5563')
      .attr('class', 'text-xs font-medium')
      .text(d => {
        // Extract short label from server_id
        const parts = d.server_id ? d.server_id.split(':') : (d.id ? d.id.split(':') : []);
        return parts.length > 1 ? parts[1] : (d.label || d.id || '');
      });
    
    // Add queue settings button
    nodeGroups
      .filter(d => d.type === 'queue')
      .each(function(d) {
        const group = d3.select(this);
        
        // Add gear icon
        group.append('g')
          .attr('transform', 'translate(15, -15)')
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
      .attr('dy', -30)
      .attr('fill', d => d.has_processed ? '#10B981' : '#EF4444')
      .attr('class', 'text-xs font-medium')
      .text(d => d.has_processed ? 'Processed' : 'Not Processed');
    
    // Add drag behavior
    svgElement.call(
      d3.drag()
        .on('start', (event) => {
          if (event.sourceEvent.target.closest('.settings-button')) return;
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
    
  }, [traceData, zoom, offset, onOffsetChange, onTraceToChild, openNodeSettingsDialog]);

  // Handle tooltip positioning and content
  const showTooltip = (node: TraceNode, event: any) => {
    if (!tooltipRef.current) return;
    
    const tooltip = tooltipRef.current;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Format tooltip content based on node type
    let content = '';
    
    if (node.type === 'queue') {
      content = `
        <div class="text-sm">
          <div class="font-semibold mb-1">${node.label || node.id}</div>
          <div class="text-gray-500">Type: Queue</div>
          ${node.lag !== undefined && node.lag !== null ? `<div class="text-gray-500">Lag: ${node.lag}ms</div>` : ''}
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
  
  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full bg-gray-50 dark:bg-gray-900"
        width="100%"
        height="100%"
      />
      <div
        ref={tooltipRef}
        className="absolute hidden z-50 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs"
      />
    </div>
  );
} 