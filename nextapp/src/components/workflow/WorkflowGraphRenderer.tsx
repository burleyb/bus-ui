"use client";

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Node, Link, GraphData } from '@/types/workflow';
import { getNodeImagesSvgString } from '@/components/node/NodeIcon';
import { getNodeShape, getShapePath, formatTimeAgo, fixedPositions } from '@/utils/workflowUtils';
import { Crosshair, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

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
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');
    
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
      .attr('r', 22)
      .attr('fill', (d) => {
        // Focus node is highlighted
        if (d.id === primaryNode) return '#3b82f6';
        
        // Color based on status
        switch (d.status) {
          case 'running': return '#10b981';
          case 'starting': return '#f59e0b';
          case 'stopped': return '#6b7280';
          case 'error': return '#ef4444';
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
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('class', 'node-label')
      .style('fill', '#374151')
      .style('font-size', '12px')
      .text((d) => d.id.split(':').slice(1).join(':'));
    
    // Add stats text if enabled
    if (showStats) {
      node
        .append('text')
        .attr('dy', 45)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .style('font-size', '10px')
        .text((d) => {
          if (d.executions !== undefined) {
            return `${d.executions} runs${d.errors ? ` (${d.errors} errors)` : ''}`;
          } else if (d.queues?.write?.count !== undefined) {
            return `${d.queues.write.count} writes`;
          } else if (d.queues?.read?.count !== undefined) {
            return `${d.queues.read.count} reads`;
          }
          return '';
        });
      
      node
        .append('text')
        .attr('dy', 57)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .style('font-size', '10px')
        .text((d) => {
          if (d.queues?.write?.last_write) {
            return `Last: ${formatTimeAgo(d.queues.write.last_write)}`;
          } else if (d.queues?.read?.last_source_lag) {
            return `Lag: ${d.queues.read.last_source_lag.toFixed(2)}s`;
          }
          return '';
        });
    }
    
    // Add hover functionality for nodes
    node
      .on('mouseover', function(event, d) {
        onHoveredNodeChange(d.id);
        
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
        onNodeClick(d.id);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        onNodeDoubleClick(d.id);
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
          const isCollapsed = collapsedState.collapsed[direction].includes(d.id);
          const isExpanded = collapsedState.expanded[direction].includes(d.id);
          
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
              onExpand(d.id, direction);
            } else if (isExpanded) {
              onCollapse(d.id, direction);
            } else {
              onExpand(d.id, direction);
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
              onFocusClick(d.id);
            } else if (pos.action === 'settings') {
              onNodeSettingsClick(d.id);
            }
          });
        }
      });
    }
    
    // Update link paths to connect nodes
    link.attr('d', (d) => {
      const sourceNode = graphData.nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
      const targetNode = graphData.nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
      
      if (!sourceNode || !targetNode) return '';
      
      // Calculate the path between source and target nodes
      const sourceX = sourceNode.x || 0;
      const sourceY = sourceNode.y || 0;
      const targetX = targetNode.x || 0;
      const targetY = targetNode.y || 0;
      
      // Make the links look nicer with a slight curve
      // Adjust the control points based on the direction
      const dx = targetX - sourceX;
      const controlX1 = sourceX + dx / 3;
      const controlX2 = sourceX + dx * 2 / 3;
      
      return `M${sourceX},${sourceY} C${controlX1},${sourceY} ${controlX2},${targetY} ${targetX},${targetY}`;
    });
    
    // Position nodes based on their x, y coordinates
    node.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    
    // Add arrowhead marker for links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20) // Position of the arrowhead on the path
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#888');
    
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