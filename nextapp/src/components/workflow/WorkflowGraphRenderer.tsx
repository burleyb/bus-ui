"use client";

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Node, Link, GraphData } from '@/types/workflow';
import { getNodeImagesSvgString } from '@/components/node/NodeIcon';
import { getNodeShape, getShapePath, formatTimeAgo, fixedPositions } from '@/utils/workflowUtils';
import { Crosshair, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

/**
 * Helper function to wrap text with proper line breaks
 * @param text The D3 text selection
 * @param nodeId The text to wrap
 */
const wrapNodeLabel = (text: d3.Selection<any, any, any, any>, nodeId: string) => {
  // If text is very short, just add it directly
  if (nodeId.length <= 5) {
    text.text(nodeId);
    return;
  }
  
  // Clear text element for appending tspans
  text.text(null);
  
  // Set up text wrapping parameters
  const maxWidth = 48 * 3; // Max width in pixels
  const charWidth = 7; // Approximate character width
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);
  
  // Natural break characters
  const breakChars = [' ', '-', '_'];
  const lines: string[] = [];
  let startIndex = 0;
  let lastBreakIndex = -1;
  
  // Scan through text looking for natural break points
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
};

interface WorkflowGraphRendererProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  graphData: GraphData;
  primaryNode: string;
  offset: number[];
  zoom: number;
  collapsedState: {
    collapsed: { left: string[]; right: string[] };
    expanded: { left: string[]; right: string[] };
  };
  showStats: boolean;
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onNodeSettingsClick: (nodeId: string) => void;
  onCollapse: (nodeId: string, direction: 'left' | 'right') => void;
  onExpand: (nodeId: string, direction: 'left' | 'right') => void;
  onFocusClick: (nodeId: string) => void;
  onHoveredNodeChange: (nodeId: string | null) => void;
}

/**
 * Component responsible for rendering the workflow graph using D3.
 * This separates the D3 rendering logic from the main graph component.
 */
export function WorkflowGraphRenderer({
  svgRef,
  tooltipRef,
  graphData,
  primaryNode,
  offset,
  zoom,
  collapsedState,
  showStats,
  onNodeClick,
  onNodeDoubleClick,
  onNodeSettingsClick,
  onCollapse,
  onExpand,
  onFocusClick,
  onHoveredNodeChange
}: WorkflowGraphRendererProps) {
  const initialLayoutComplete = useRef<boolean>(false);
  const { state } = useAppContext();
  
  // Main rendering function
  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) {
      console.log('Not rendering graph: SVG ref or nodes missing', {
        hasSvgRef: !!svgRef.current,
        nodeCount: graphData.nodes.length
      });
      return;
    }
    
    console.log('Rendering workflow graph with', graphData.nodes.length, 'nodes and', graphData.links.length, 'links');
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create SVG elements
    const svg = d3.select(svgRef.current);
    
    // Define arrowhead marker for link directionality
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 26) // Offset slightly to prevent overlap with node
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#888');
    
    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20, 20)');
    
    // Legend title
    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-weight', 'bold')
      .text('Node Status:');
    
    // Status types for legend
    const statusTypes = [
      { status: 'running', label: 'Running', color: '#10b981' },
      { status: 'starting', label: 'Starting', color: '#f59e0b' },
      { status: 'stopped', label: 'Stopped', color: '#6b7280' },
      { status: 'error', label: 'Error', color: '#ef4444' },
      { status: 'focus', label: 'Focus Node', color: '#3b82f6' }
    ];
    
    // Add legend items
    statusTypes.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${20 + i * 25})`);
      
      legendItem.append('circle')
        .attr('r', 8)
        .attr('fill', item.color)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
      
      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 5)
        .text(item.label);
    });
    
    // Main graph container
    const g = svg.append('g');
    
    // Apply zoom and offset transformations
    g.attr('transform', `translate(${offset[0]}, ${offset[1]}) scale(${zoom})`);
    
    // Draw links first (so they appear behind nodes)
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(graphData.links)
      .enter()
      .append('path')
      .attr('stroke', '#888')
      .attr('fill', 'none')
      .attr('stroke-width', 2);
    
    // Set link paths
    link.attr('d', function(d) {
      const source = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
      const target = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
      
      if (!source || !target) return '';
      
      const sourceX = source.x || 0;
      const sourceY = source.y || 0;
      const targetX = target.x || 0;
      const targetY = target.y || 0;

        // Determine relationship type for styling
        const relationType = 
        (source.type === 'bot' && target.type === 'queue') ? 'write' as const :
        (source.type === 'queue' && target.type === 'bot') ? 'read' as const : 
        'default' as const;

        // Store relationship type on the link data for later use
        d.relationType = relationType;
      
      // Create a straight line with slight curve for aesthetics
      return `M${sourceX},${sourceY} C${(sourceX + targetX) / 2},${sourceY} ${(sourceX + targetX) / 2},${targetY} ${targetX},${targetY}`;
    });
    
    // Add link stats if enabled
    if (showStats) {
      // Create a group for each link to hold its statistics
      const linkLabels = g
        .append('g')
        .attr('class', 'link-stats')
        .selectAll('g')
        .data(graphData.links)
        .enter()
        .append('g');
      
      // Find midpoint of each link for positioning stats
      linkLabels.attr('transform', function(d) {
        const source = typeof d.source === 'object' ? d.source : graphData.nodes.find(n => n.id === d.source);
        const target = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
        
        if (!source || !target) return '';

        const sourceX = source.x || 0;
        const sourceY = source.y || 0;
        const targetX = target.x || 0;
        const targetY = target.y || 0;
        
        // Position text at midpoint of the link
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        return `translate(${midX}, ${midY})`;
      });
      
      // Add background for better readability
      linkLabels
        .append('rect')
        .attr('x', -30)
        .attr('y', -18)
        .attr('width', 60)
        .attr('height', 36)
        .attr('fill', 'white')
        .attr('fill-opacity', 0)
        .attr('rx', 4);
      
      // Add count stats
      linkLabels
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -8)
        .attr('font-size', '10px')
        .attr('fill', '#374151')
        .text(function(d) {
          if (!d.stats) return '';
          return d.stats.count ? `${d.stats.count}` : '0';
        });
      
      // Add timing stats (lag or last time)
      linkLabels
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 15)
        .attr('font-size', '10px')
        .attr('fill', '#374151')
        .text(function(d) {
          if (!d.stats) return '';
          if (d.stats.lag !== undefined) {
            return `Lag: ${d.stats.lag.toFixed(0)}s`;
          } else if (d.stats.last_time) {
            return `Last: ${formatTimeAgo(d.stats.last_time)}`;
          }
          return '';
        });
    }
    
    // Create nodes group
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('id', (d) => `node-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`)
      .attr('data-id', (d) => d.id);
    
    // Add node shapes (outer circle)
    node
      .append('circle')
      .attr('class', 'node-shape')
      .attr('r', (d) => (d.originalId || d.id) === primaryNode ? 24 : 22)
      .attr('fill', (d) => {
        // Focus node is highlighted
        if ((d.originalId || d.id) === primaryNode) return '#3b82f6';
        
        // Color based on status
        switch (d.status) {
          case 'running': return '#10b981';
          case 'starting': return '#f59e0b';
          case 'stopped': return '#6b7280';
          case 'error': return '#ef4444';
          case 'infinity': return '#9333ea'; // Special color for infinity nodes
          default: return '#6b7280';
        }
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);
    
    // Add inner circle (for image background)
    node
      .append('circle')
      .attr('r', 18)
      .attr('fill', '#ffffff');
    
    // Get the base URL for node icons
    const baseUrl = window.location.origin;
    
    // Add node icons
    node
      .append('svg')
      .attr('width', 32)
      .attr('height', 32)
      .attr('x', -16)
      .attr('y', -16)
      .html((d) => {
        // Convert node type to expected format and provide all required parameters
        const iconSvg = getNodeImagesSvgString(
          { type: d.type || 'unknown' }, 
          state.nodes || {}, 
          baseUrl
        );
        return iconSvg;
      });
    
    // Add node labels
    node
      .append('text')
      .attr('y', 36)
      .attr('dy', null)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .style('fill', '#374151')
      .style('font-size', '12px')
      .each(function(d) {
        const text = d3.select(this);
        const nodeId = d.originalId || (d.id.includes(':') ? d.id.split(':').pop() : d.id);
        wrapNodeLabel(text, nodeId || '');
      });
    
    // Add stats text if enabled
    if (showStats) {
      node
        .append('text')
        .attr('dy', 65)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .style('font-size', '10px')
        .text((d) => {
            return `${d.executions ? `${d.executions}` : '0'} / ${d.errors ? `${d.errors}` : '0'}`;
        });
    }
    
    // Add hover functionality for nodes
    node
      .on('mouseover', function(event, d) {
        onHoveredNodeChange(d.originalId || d.id);
        
        // Add hover effect to node
        d3.select(this).select('.node-shape')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 3);
        
        // Show node control buttons
        addNodeControls(d3.select(this), d);
      })
      .on('mouseout', function(event, d) {
        onHoveredNodeChange(null);
        
        // Remove hover effect from node
        d3.select(this).select('.node-shape')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        
        // Hide node control buttons with delay (to allow clicking)
        const nodeControls = d3.select(this).select('.node-controls');
        if (!nodeControls.empty()) {
          setTimeout(() => {
            if (!d3.select(this).classed('hovered')) {
              nodeControls.remove();
            }
          }, 200);
        }
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.originalId || d.id);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        onNodeDoubleClick(d.originalId || d.id);
      });
    
    // Function to add node control buttons on hover
    function addNodeControls(nodeSelection: d3.Selection<any, any, any, any>, d: Node) {
      // Remove existing controls if any
      nodeSelection.select('.node-controls').remove();
      
      // Create a group for the controls
      const controls = nodeSelection
        .append('g')
        .attr('class', 'node-controls');
      
      // Calculate positions for buttons
      // This creates a circle of buttons around the node
      const positions = [
        { angle: 0, icon: ChevronRight, direction: 'right', action: 'collapse' },
        { angle: 180, icon: ChevronLeft, direction: 'left', action: 'collapse' },
        { angle: 45, icon: Crosshair, action: 'focus' },
        { angle: 135, icon: Settings, action: 'settings' }
      ];
      
      // Add buttons
      positions.forEach((pos) => {
        // Calculate button position
        const radius = 35; // Distance from node center
        const x = Math.cos((pos.angle * Math.PI) / 180) * radius;
        const y = Math.sin((pos.angle * Math.PI) / 180) * radius;
        
        // Create button group
        const button = controls
          .append('g')
          .attr('class', 'control-button')
          .attr('transform', `translate(${x}, ${y})`)
          .style('cursor', 'pointer');
        
        // Add button background
        button
          .append('circle')
          .attr('r', 14)
          .attr('fill', 'var(--bg-color, white)')
          .attr('stroke', '#888')
          .attr('stroke-width', 1);
        
        // Check if we need to modify the icon based on the collapsed state
        let IconComponent = pos.icon;
        
        // Handle collapse/expand icons based on current state
        if (pos.action === 'collapse') {
          const direction = pos.direction as 'left' | 'right';
          const nodeIdentifier = d.originalId || d.id;
          const isCollapsed = collapsedState.collapsed[direction].includes(nodeIdentifier);
          const isExpanded = collapsedState.expanded[direction].includes(nodeIdentifier);
          
          // Create custom SVG for expand/collapse
          button
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('fill', 'currentColor')
            .style('font-size', '16px')
            .text(function() {
              // Show different symbols based on the state
              if (isCollapsed) {
                return '+'; // '+' for collapsed (to expand)
              } else if (isExpanded) {
                return '−'; // '−' for expanded (to collapse)
              } else {
                return pos.direction === 'left' ? '←' : '→'; // Arrows for neutral state
              }
            });
          
          // Add click handler for collapse/expand
          button.on('click', (event: Event) => {
            event.stopPropagation();
            
            // Toggle state based on current state
            if (isCollapsed) {
              onExpand(nodeIdentifier, direction);
            } else if (isExpanded) {
              onCollapse(nodeIdentifier, direction);
            } else {
              onExpand(nodeIdentifier, direction);
            }
          });
        } else {
          // Add icon for other buttons
          button
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('fill', 'currentColor')
            .style('font-size', '16px')
            .text(function() {
              // Use different symbols for different actions
              switch (pos.action) {
                case 'focus': return '⊕';
                case 'settings': return '⚙';
                default: return '?';
              }
            });
          
          // Add click handler for other buttons
          button.on('click', (event: Event) => {
            event.stopPropagation();
            
            if (pos.action === 'focus') {
              onFocusClick(d.originalId || d.id);
            } else if (pos.action === 'settings') {
              onNodeSettingsClick(d.originalId || d.id);
            }
          });
        }
      });
    }
    
    // Position nodes based on their x, y coordinates
    node.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    
    // Initial layout is complete
    initialLayoutComplete.current = true;
  }, [
    svgRef, 
    tooltipRef, 
    graphData, 
    primaryNode, 
    offset, 
    zoom, 
    collapsedState, 
    showStats, 
    onNodeClick, 
    onNodeDoubleClick, 
    onNodeSettingsClick, 
    onCollapse, 
    onExpand, 
    onFocusClick, 
    onHoveredNodeChange,
    state.nodes
  ]);
  
  return null; // This is a logic-only component, no rendering needed
} 