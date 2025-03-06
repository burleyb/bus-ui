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

  nodeId = nodeId.split(':').pop() || nodeId;
  
  // Clear text element for appending tspans
  text.text(null);
  
  // Set up text wrapping parameters
  const maxWidth = 48 * 3; // Max width in pixels
  const charWidth = 7; // Approximate character width
  const maxCharsPerLine = Math.floor(maxWidth / charWidth);
  const maxLines = 2; // Limit to 2 lines to avoid excessive height
  
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
      
      // Stop if we've reached max lines (save the rest for last line with ellipsis)
      if (lines.length >= maxLines - 1) {
        break;
      }
    }
  }
  
  // Add any remaining text as the last line, with ellipsis if it was cut
  if (startIndex < nodeId.length) {
    let remainingText = nodeId.substring(startIndex);
    
    // Add ellipsis if we are at max lines and the text is too long
    if (lines.length >= maxLines - 1 && remainingText.length > maxCharsPerLine) {
      remainingText = remainingText.substring(0, maxCharsPerLine - 3) + '...';
    }
    
    lines.push(remainingText);
  }
  
  // Add all lines as tspans with proper positioning
  lines.forEach((line, i) => {
    text.append("tspan")
      .attr("x", 0) // Center each line horizontally (text-anchor: middle applied to parent)
      .attr("dy", i === 0 ? 0 : "1.2em") // Add line spacing after the first line
      .text(line);
  });
  
  // Return the number of lines for positioning other elements
  return lines.length;
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
  const previousPrimaryNode = useRef<string | null>(null);
  const previousCollapsedState = useRef<typeof collapsedState | null>(null);
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
    
    // Check if primary node has changed or if collapsed state has changed
    const primaryNodeChanged = previousPrimaryNode.current !== primaryNode;
    const collapsedStateChanged = JSON.stringify(previousCollapsedState.current) !== JSON.stringify(collapsedState);
    
    // Update refs for next render
    previousPrimaryNode.current = primaryNode;
    previousCollapsedState.current = collapsedState;
    
    // Flag for animation
    const shouldAnimate = primaryNodeChanged || collapsedStateChanged;
    
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
      .attr('stroke', '#3b82f6')
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
        .attr('fill', '#3b82f6')
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
        .attr('fill', '#3b82f6')
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
    
    // Add shadow circles for collapsed nodes - need to add these first so they appear behind the node
    node.each(function(d) {
      const nodeGroup = d3.select(this);
      const nodeId = d.originalId || d.id;
      
      // Check if this node has collapsed parents or children
      const hasCollapsedParents = collapsedState.collapsed.left.includes(nodeId) && 
        d.link_to?.parent && Object.keys(d.link_to.parent).length > 0;
      
      const hasCollapsedChildren = collapsedState.collapsed.right.includes(nodeId) && 
        d.link_to?.children && Object.keys(d.link_to.children).length > 0;
      
      // Add shadow circles for collapsed parents (left)
      if (hasCollapsedParents) {
        // Always use 3 shadow circles regardless of the actual count
        for (let i = 0; i < 2; i++) {
          nodeGroup.append("circle")
            .attr("r", 24)
            .attr("cx", -4 - (i * 5))
            .attr("cy", -4 - (i * 5))
            .attr("fill", "none")
            .attr("stroke", "#3182ce")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5 - (i * 0.1));
        }
      }
      
      // Add shadow circles for collapsed children (right)
      if (hasCollapsedChildren) {
        // Always use 3 shadow circles regardless of the actual count
        for (let i = 0; i < 2; i++) {
          nodeGroup.append("circle")
            .attr("r", 24)
            .attr("cx", 4 + (i * 5))
            .attr("cy", 4 + (i * 5))
            .attr("fill", "none")
            .attr("stroke", "#3182ce")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5 - (i * 0.1));
        }
      }
    });
    
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
          case 'running': return '##3b82f6';
          case 'stopped': return '#6b7280';
          case 'error': return '#ef4444';
          case 'infinity': return '#9333ea'; // Special color for infinity nodes
          default: return '#3b82f6';
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
    
    // Add node labels and get their height
    const nodeLabelLineCount = new Map<string, number>();
    
    node.each(function(d) {
      const nodeSelection = d3.select(this);
      const labelGroup = nodeSelection
        .append('text')
        .attr('y', 36)  // Set absolute y position below the node
        .attr('x', 0)   // Center horizontally
        .attr('text-anchor', 'middle')
        .attr('class', 'node-label')
        .style('fill', '#374151')
        .style('font-size', '12px');  // Increased font size for better visibility
      
      // Store the rendered height for positioning stats
      const nodeId = d.originalId || (d.id.includes(':') ? d.id.split(':').pop() : d.id);
      const lineCount = wrapNodeLabel(labelGroup, nodeId || '');
      
      // Store the line count in a map instead of on the node
      nodeLabelLineCount.set(d.id, lineCount || 1);
    });
    
    // Add stats text if enabled, positioned based on label height
    if (showStats) {
      node.each(function(d) {
        const lineCount = nodeLabelLineCount.get(d.id) || 1;
        const statsY = 36 + (lineCount * 15); // Base position + line height adjustment
        
        d3.select(this)
          .append('text')
          .attr('y', statsY)  // Position based on label height
          .attr('x', 0)   // Center horizontally
          .attr('text-anchor', 'middle')
          .attr('fill', '#4B5563')  // Slightly lighter color for stats
          .style('font-size', '10px')  // Smaller font size for stats
          .text(() => {
            return `${d.executions ? `${d.executions}` : '0'} / ${d.errors ? `${d.errors}` : '0'}`;
          });
      });
    }
    
    // Update the hover behavior for nodes
    node
      .on('mouseover', function(event, d) {
        // Notify parent of hovered node
        onHoveredNodeChange(d.originalId || d.id);
        
        // Add hover effect to node
        d3.select(this).select('.node-shape')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 3);
        
        // Show node control buttons with a slight delay
        setTimeout(() => {
          // Only add controls if the node is still being hovered
          if (d3.select(this).classed('hovered')) return;
          d3.select(this).classed('hovered', true);
          addNodeControls(d3.select(this), d);
        }, 100);
      })
      .on('mouseout', function(event, d) {
        onHoveredNodeChange(null);
        
        // Remove hover effect from node
        d3.select(this).select('.node-shape')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        
        // Remove hovered class but keep controls visible briefly
        d3.select(this).classed('hovered', false);
        
        // Hide node control buttons with delay (to allow clicking)
        const nodeControls = d3.select(this).select('.node-controls');
        if (!nodeControls.empty()) {
          setTimeout(() => {
            if (!d3.select(this).classed('hovered')) {
              nodeControls.remove();
            }
          }, 300); // Longer delay to improve UX
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
    
    // Update the function to add node controls with improved behavior
    function addNodeControls(nodeSelection: d3.Selection<any, any, any, any>, d: Node) {
      // Remove existing controls if any
      nodeSelection.select('.node-controls').remove();
      
      // Create a group for the controls with initial opacity
      const controls = nodeSelection
        .append('g')
        .attr('class', 'node-controls')
        .attr('data-node-id', d.originalId || d.id)
        .attr('opacity', 0.9)
        .style('pointer-events', 'all');
      
      const radius = 50; // Distance from node center
      const buttonRadius = 15; // Size of action buttons
      
      // Function to position button at given angle
      const positionButton = (angle: number) => {
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius; // Negative because SVG y-axis is inverted
        return { x, y };
      };
      
      // Get node data including links
      const nodeData = state.nodes?.[d.originalId || d.id];
      const nodeId = d.originalId || d.id;
      
      // 1. Focus button (Crosshair icon) at 1 o'clock - should trigger double-click
      const pos1 = positionButton(Math.PI * 0.08);
      const focusButton = controls.append('g')
        .attr('transform', `translate(${pos1.x}, ${pos1.y})`)
        .style('cursor', 'pointer')
        .attr('class', 'focus-button');
      
      focusButton.append('circle')
        .attr('r', buttonRadius)
        .attr('fill', '#3182ce')
        .attr('opacity', 0.9);
      
      // Add crosshair icon
      focusButton.append('path')
        .attr('d', 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z')
        .attr('transform', 'translate(-10, -10) scale(0.75)')
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', '1.5');
      
      // Add the crosshair lines
      focusButton.append('path')
        .attr('d', 'M22 12h-4 M6 12H2 M12 6V2 M12 22v-4')
        .attr('transform', 'translate(-10, -10) scale(0.75)')
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', '1.5')
        .attr('stroke-linecap', 'round');
      
      // Focus button click handler - trigger double-click action
      focusButton.on('click', (event) => {
        event.stopPropagation();
        onNodeDoubleClick(nodeId);
      });
      
      // 2. Settings button at 2 o'clock - open node details
      const pos2 = positionButton(Math.PI * 0.29);
      const settingsButton = controls.append('g')
        .attr('transform', `translate(${pos2.x}, ${pos2.y})`)
        .style('cursor', 'pointer')
        .attr('class', 'settings-button');
      
      settingsButton.append('circle')
        .attr('r', buttonRadius)
        .attr('fill', '#4a5568')
        .attr('opacity', 0.9);
      
      // Add settings icon
      settingsButton.append('path')
        .attr('d', 'M9.594 3.094A1.5 1.5 0 0 1 11.07 4.5h.164a1.5 1.5 0 0 1 1.477 1.256l.133.792a1.5 1.5 0 0 0 1.732 1.132l.316-.07a1.5 1.5 0 0 1 1.706.8l.082.16a1.5 1.5 0 0 1-.292 1.841l-.63.54a1.5 1.5 0 0 0 0 2.25l.63.54a1.5 1.5 0 0 1 .292 1.841l-.082.16a1.5 1.5 0 0 1-1.706.8l-.316-.07a1.5 1.5 0 0 0-1.732 1.132l-.133.792A1.5 1.5 0 0 1 11.234 19h-.164a1.5 1.5 0 0 1-1.477-1.256l-.133-.792a1.5 1.5 0 0 0-1.732-1.132l-.316.07a1.5 1.5 0 0 1-1.706-.8l-.082-.16a1.5 1.5 0 0 1 .292-1.841l.63-.54a1.5 1.5 0 0 0 0-2.25l-.63-.54a1.5 1.5 0 0 1-.292-1.841l.082-.16a1.5 1.5 0 0 1 1.706-.8l.316.07a1.5 1.5 0 0 0 1.732-1.132l.133-.792ZM11 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z')
        .attr('transform', 'translate(-10, -10) scale(0.85)')
        .attr('fill', 'white')
        .attr('stroke', 'white')
        .attr('stroke-width', '0.2');
      
      // Settings button click handler - open node details
      settingsButton.on('click', (event) => {
        event.stopPropagation();
        onNodeSettingsClick(nodeId);
      });
      
      // 3. Children collapse/expand button at 3 o'clock (only for nodes with children)
      if (nodeData?.link_to?.children && Object.keys(nodeData.link_to.children).length > 0) {
        // Only show for generation 0 or positive
        const generation = d.generation || 0;
        if (generation >= 0) {
          const pos3 = positionButton(Math.PI * 0.5);
          const childrenButton = controls.append('g')
            .attr('class', 'children-button')
            .attr('transform', `translate(${pos3.x}, ${pos3.y})`)
            .style('cursor', 'pointer');
          
          childrenButton.append('circle')
            .attr('r', buttonRadius)
            .attr('fill', '#3b82f6')
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5);
          
          // Different icons for collapsed vs expanded
          const isCollapsed = collapsedState.collapsed.right.includes(nodeId);
          childrenButton.append('path')
            .attr('d', isCollapsed
              ? 'M-4,-6 L4,0 L-4,6' // Right-pointing chevron for collapsed
              : 'M4,-6 L-4,0 L4,6'  // Left-pointing chevron for expanded
            )
            .attr('fill', isCollapsed ? 'white' : 'none')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round');
          
          childrenButton.on('click', (event) => {
            event.stopPropagation();
            if (isCollapsed) {
              onExpand(nodeId, 'right');
            } else {
              onCollapse(nodeId, 'right');
            }
          });
        }
      }
      
      // 4. Parents collapse/expand button at 9 o'clock (only for nodes with parents)
      if (nodeData?.link_to?.parent && Object.keys(nodeData.link_to.parent).length > 0) {
        // Only show for generation 0 or negative
        const generation = d.generation || 0;
        if (generation <= 0) {
          const pos4 = positionButton(Math.PI * 1.5);
          const parentsButton = controls.append('g')
            .attr('class', 'parents-button')
            .attr('transform', `translate(${pos4.x}, ${pos4.y})`)
            .style('cursor', 'pointer');
          
          parentsButton.append('circle')
            .attr('r', buttonRadius)
            .attr('fill', '#3b82f6')
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5);
          
          // Different icons for collapsed vs expanded
          const isCollapsed = collapsedState.collapsed.left.includes(nodeId);
          parentsButton.append('path')
            .attr('d', isCollapsed
              ? 'M4,-6 L-4,0 L4,6'  // Left-pointing chevron for collapsed
              : 'M-4,-6 L4,0 L-4,6' // Right-pointing chevron for expanded
            )
            .attr('fill', isCollapsed ? 'white' : 'none')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round');
          
          parentsButton.on('click', (event) => {
            event.stopPropagation();
            if (isCollapsed) {
              onExpand(nodeId, 'left');
            } else {
              onCollapse(nodeId, 'left');
            }
          });
        }
      }
      
      // Animate controls to fade in
      controls
        .transition()
        .duration(200)
        .attr('opacity', 1);
      
      // Ensure controls stay visible when hovered directly
      controls.on('mouseover', function() {
        nodeSelection.classed('hovered', true);
      })
      .on('mouseout', function() {
        nodeSelection.classed('hovered', false);
      });
    }
    
    // Position nodes based on their x, y coordinates
    node.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    
    // Center primary node if needed
    if (shouldAnimate && initialLayoutComplete.current) {
      // Find the primary node's position
      const primaryNodeData = graphData.nodes.find(n => (n.originalId || n.id) === primaryNode);
      
      if (primaryNodeData && primaryNodeData.x !== undefined && primaryNodeData.y !== undefined) {
        const svgWidth = svgRef.current.clientWidth;
        const svgHeight = svgRef.current.clientHeight;
        
        // Calculate center of the SVG viewBox
        const centerX = svgWidth / 2;
        const centerY = svgHeight / 2;
        
        // Calculate the required offset to center the primary node
        const newOffsetX = centerX - primaryNodeData.x * zoom;
        const newOffsetY = centerY - primaryNodeData.y * zoom;
        
        // Animate nodes gathering, then spreading
        if (shouldAnimate) {
          // First move all nodes to the position of the primary node (gather effect)
          node.transition()
            .duration(600)
            .attr('transform', () => `translate(${primaryNodeData.x || 0}, ${primaryNodeData.y || 0})`)
            .on('end', () => {
              // Then spread them out to their final positions
              node.transition()
                .duration(800)
                .ease(d3.easeElasticOut.amplitude(1).period(0.5))
                .attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
              
              // Center the graph on the primary node
              g.transition()
                .duration(800)
                .attr('transform', `translate(${newOffsetX}, ${newOffsetY}) scale(${zoom})`);
            });
        } else {
          // Just center the graph without the gather/spread animation
          g.transition()
            .duration(500)
            .attr('transform', `translate(${newOffsetX}, ${newOffsetY}) scale(${zoom})`);
        }
      }
    }
    
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