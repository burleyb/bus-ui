"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { Node, Link, GraphData } from '@/types/workflow';
import { getNodeImagesSvgString, getNodeImagePath } from '@/components/node/NodeIcon';
import { getNodeShape, getShapePath, formatTimeAgo, fixedPositions, getNodeVisualProperties } from '@/utils/workflowUtils';
import { Crosshair, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import ReactDOM from 'react-dom';

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
  const { state } = useAppContext();
  
  // Track if initial layout has been done
  const initialLayoutComplete = useRef(false);
  
  // Track previous primary node and collapsed state for detecting changes
  const previousPrimaryNode = useRef<string | null>(null);
  const previousCollapsedState = useRef<any>(null);
  
  // Flag to prevent multiple animations from running
  const isAnimating = useRef(false);
  
  // Add missing refs for context menu and hovered node tracking
  const isContextMenuActive = useRef<boolean>(false);
  const hoveredNodeRef = useRef<string | null>(null);
  
  // Add a humanize function that matches the original implementation
  const humanizeDuration = (milliseconds: number, showMilliseconds = false): string => {
    if (showMilliseconds && milliseconds < 1000) {
      return Math.round(milliseconds) + 'ms';
    }
    
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) {
      return seconds + 's';
    } else {
      const minutes = Math.floor(milliseconds / (1000 * 60));
      if (minutes < 60) {
        return minutes + 'm' + (seconds % 60 ? ', ' + (seconds % 60) + 's' : '');
      } else {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        if (hours < 24) {
          return hours + 'h' + (minutes % 60 ? ', ' + (minutes % 60) + 'm' : '');
        } else {
          const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
          return days + 'd' + (hours % 24 ? ', ' + (hours % 24) + 'h' : '');
        }
      }
    }
  };
  
  // Function to update the tooltip content and position
  const updateTooltip = useCallback((nodeId: string | null, event?: MouseEvent) => {
    // Don't show tooltip if context menu is active
    if (isContextMenuActive.current) {
      return;
    }

    if (!tooltipRef.current || !nodeId) {
      // Hide tooltip if no node ID or tooltip ref
      if (tooltipRef.current && !isContextMenuActive.current) {
        tooltipRef.current.style.display = 'none';
      }
      return;
    }

    // Find the node data
    const nodeData = graphData.nodes.find(n => (n.originalId || n.id) === nodeId);
    if (!nodeData) return;

    // Create tooltip content based on node type
    let tooltipContent = '';
    
    // Differentiate between bot and queue nodes
    if (nodeData.type === 'bot') {
      // Bot node
      // Access properties safely - some may come from the API but not be in the TypeScript definition
      const description = (nodeData as any).description || '';
      const lambdaName = (nodeData as any).lambdaName || '';
      
      tooltipContent = `
        <div class="font-medium">${nodeId.split(':').pop()}</div>
        <div class="mt-1">Status: ${nodeData.status || 'Unknown'}</div>
        ${description ? `<div class="mt-1">Description: ${description}</div>` : ''}
        ${lambdaName ? `<div class="mt-1">Lambda: ${lambdaName}</div>` : ''}
      `;
    } else if (nodeData.type === 'queue' || nodeData.type === 'system') {
      // Queue node
      const lastWrite = nodeData.queues?.write?.last_write ? 
        formatTimeAgo(nodeData.queues.write.last_write) : 'Unknown';
      
      // Checkpoint may come from the API but not be in the TypeScript definition
      const checkpoint = (nodeData as any).checkpoint || '';
      
      tooltipContent = `
        <div class="font-medium">${nodeId.split(':').pop()}</div>
        <div class="mt-1">Last Write: ${lastWrite}</div>
        ${checkpoint ? `<div class="mt-1">Latest Checkpoint: ${checkpoint}</div>` : ''}
      `;
    } else {
      // Default tooltip for other node types
      tooltipContent = `
        <div class="font-medium">${nodeId.split(':').pop()}</div>
        <div class="mt-1">Type: ${nodeData.type || 'Unknown'}</div>
        <div class="mt-1">Status: ${nodeData.status || 'Unknown'}</div>
      `;
    }

    // Update tooltip content
    tooltipRef.current.innerHTML = tooltipContent;
    
    // Apply tooltip styling
    tooltipRef.current.className = 'absolute bg-white dark:bg-gray-900 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs z-10';
    tooltipRef.current.style.display = 'block';
    tooltipRef.current.style.maxWidth = '350px';

    // Position tooltip relative to current mouse position but with a large offset
    // to avoid interfering with hover buttons
    if (event && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      
      // Position tooltip with a significant offset to avoid buttons
      tooltipRef.current.style.left = `${event.clientX - rect.left - 380}px`; // Large offset to the left
      tooltipRef.current.style.top = `${event.clientY - rect.top - 20}px`; // Slight offset above cursor
      
      // Check if tooltip is off the left edge of the screen
      if (event.clientX - 280 < 0) {
        // If it would be off-screen to the left, position it to the right instead
        tooltipRef.current.style.left = `${event.clientX - rect.left + 140}px`; // offset to the right
      }
    }
  }, [graphData.nodes, tooltipRef, svgRef]);

  // Function to show context menu on right click
  const showContextMenu = useCallback((nodeId: string, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!tooltipRef.current) return;
    
    // Hide any existing tooltip
    tooltipRef.current.style.display = 'none';
    
    // Set context menu active flag
    isContextMenuActive.current = true;
    
    // Find the node data
    const nodeData = graphData.nodes.find(n => (n.originalId || n.id) === nodeId);
    if (!nodeData) return;
    
    console.log('Showing context menu for node:', nodeId); // Debug log
    
    // Create context menu content based on node type
    let menuContent = '';
    
    // Common menu items
    const commonItems = `
      <div class="context-menu-item" data-action="focus" data-node-id="${nodeId}">
        Focus Node
      </div>
      <div class="context-menu-item" data-action="details" data-node-id="${nodeId}">
        Node Details
      </div>
      <div class="context-menu-item" data-action="copy-name" data-node-id="${nodeId}">
        Copy Node Name
      </div>
    `;
    
    if (nodeData.type === 'bot') {
      // Bot-specific menu items
      menuContent = `
        ${commonItems}
        <div class="context-menu-item" data-action="force-run" data-node-id="${nodeId}">
          Force Run
        </div>
      `;
    } else if (nodeData.type === 'queue' || nodeData.type === 'system') {
      // Queue-specific menu items
      menuContent = `
        ${commonItems}
        <div class="context-menu-item" data-action="copy-event" data-node-id="${nodeId}">
          Copy Last Event
        </div>
      `;
    } else {
      // Default menu for other node types
      menuContent = commonItems;
    }
    
    // Create the context menu with containing div for better styling
    tooltipRef.current.innerHTML = `
      <div class="context-menu">
        ${menuContent}
      </div>
    `;
    
    // Add styles for the context menu
    tooltipRef.current.className = 'absolute bg-white dark:bg-gray-900 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs z-20';
    
    // Position context menu at mouse position
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      tooltipRef.current.style.left = `${event.clientX - rect.left}px`;
      tooltipRef.current.style.top = `${event.clientY - rect.top}px`;
    }
    
    // Make tooltip visible after all setup
    tooltipRef.current.style.display = 'block';
    
    // Add event listeners for menu items
    const menuItems = tooltipRef.current.querySelectorAll('.context-menu-item');
    menuItems.forEach(item => {
      // Apply styles to make menu items more visible and interactive
      (item as HTMLElement).style.padding = '8px 12px';
      (item as HTMLElement).style.cursor = 'pointer';
      (item as HTMLElement).style.margin = '2px 0';
      (item as HTMLElement).style.borderRadius = '4px';
      
      // Add hover effect
      item.addEventListener('mouseover', () => {
        (item as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      });
      
      item.addEventListener('mouseout', () => {
        (item as HTMLElement).style.backgroundColor = 'transparent';
      });
      
      // Handle click actions
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const action = (item as HTMLElement).dataset.action;
        const targetNodeId = (item as HTMLElement).dataset.nodeId || '';
        
        // Hide the context menu
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
          isContextMenuActive.current = false;
        }
        
        // Handle different actions
        switch (action) {
          case 'focus':
            onNodeDoubleClick(targetNodeId);
            break;
          case 'details':
            onNodeSettingsClick(targetNodeId);
            break;
          case 'copy-name':
            navigator.clipboard.writeText(targetNodeId);
            break;
          case 'force-run':
            // You'll need to implement this or call the appropriate function
            console.log(`Force run for node: ${targetNodeId}`);
            break;
          case 'copy-event':
            // You'll need to implement this to get and copy the last event
            console.log(`Copy last event for queue: ${targetNodeId}`);
            break;
        }
      });
    });
    
    // Define closeContextMenu function before using it
    const closeContextMenu = (e: MouseEvent) => {
      // Don't close if clicking inside the menu
      if (tooltipRef.current && tooltipRef.current.contains(e.target as HTMLElement)) {
        return;
      }
      
      if (tooltipRef.current && isContextMenuActive.current) {
        tooltipRef.current.style.display = 'none';
        isContextMenuActive.current = false;
        document.removeEventListener('click', closeContextMenu);
      }
    };
    
    // Clear any existing event handlers to prevent multiple registrations
    document.removeEventListener('click', closeContextMenu);
    
    // Add a longer delay before adding the event listener to ensure user can interact with menu
    setTimeout(() => {
      document.addEventListener('click', closeContextMenu);
    }, 100);
    
  }, [graphData.nodes, tooltipRef, svgRef, onNodeDoubleClick, onNodeSettingsClick]);

  // Render the graph with D3
  const renderGraph = useCallback(() => {
    if (!svgRef.current || !graphData.nodes.length) return;
    
    console.log('Rendering workflow graph with', graphData.nodes.length, 'nodes and', graphData.links.length, 'links');
    
    // Check if primary node has changed or if collapsed state has changed
    const primaryNodeChanged = previousPrimaryNode.current !== null && 
                             previousPrimaryNode.current !== primaryNode;
    const collapsedStateChanged = previousCollapsedState.current !== null &&
                                JSON.stringify(previousCollapsedState.current) !== JSON.stringify(collapsedState);
    
    // Flag for animation
    const shouldAnimate = (primaryNodeChanged || collapsedStateChanged) && initialLayoutComplete.current;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create SVG elements
    const svg = d3.select(svgRef.current);
    
    // Define arrowhead marker for link directionality
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28) // Increased from 26 to match the new spacing and prevent overlap with nodes
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#3b82f6');
    
    // Main graph container
    const g = svg.append('g');
    
    // Apply zoom and offset transformations
    g.attr('transform', `translate(${offset[0]}, ${offset[1]}) scale(${zoom})`);
    
    // Draw links first (so they appear behind nodes)
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(graphData.links)
      .enter()
      .append('path')
      .attr('stroke', '#3b82f6')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      // Add dashed line style for links to infinity nodes
      .attr('stroke-dasharray', function(d) {
        const target = typeof d.target === 'object' ? d.target : graphData.nodes.find(n => n.id === d.target);
        // Check if this is a link to an infinity node (cycle terminator)
        if (target && (target.type === 'infinity' || d.relationType === 'cycle')) {
          return '5,5'; // Dashed line pattern
        }
        return 'none'; // Solid line for regular links
      });
    
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
      const relationType = source.type === 'bot' && (target.type === 'queue' || target.type === 'system') ? 'write' :
                          source.type === 'queue' && (target.type === 'bot' || target.type === 'system')  ? 'read' : 'default';
      
      // Store relationship type on the link data for later use
      d.relationType = relationType;
      
      // Calculate the difference in x and y coordinates
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      
      // If nodes are horizontally aligned (within a small threshold), use a straight line
      if (Math.abs(dy) < 5) {
        return `M${sourceX},${sourceY} L${targetX},${targetY}`;
      }
      
      // Otherwise use a curved path with control points at midpoint
      // Calculate control points for smooth curve
      const midX = (sourceX + targetX) / 2;
      
      // Use curved path with control points for better aesthetics
      return `M${sourceX},${sourceY} 
              C${sourceX + dx/3},${sourceY},
                ${targetX - dx/3},${targetY},
                ${targetX},${targetY}`;
    });
    
    // Add link stats if enabled
    if (showStats) {
      // Create a group for each link to hold its statistics
      const linkLabels = g.append('g')
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
      linkLabels.append('rect')
        .attr('x', -15)
        .attr('y', -18)
        .attr('width', 30)
        .attr('height', 14)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.9)
        .attr('rx', 4)
        .attr('class', 'count-bg');
        
      // Add a separate background for timing text
      linkLabels.append('rect')
        .attr('x', -25)
        .attr('y', 7)
        .attr('width', 50)
        .attr('height', 14)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.9)
        .attr('rx', 4)
        .attr('class', 'timing-bg');
      
      // Add count stats
      const countTexts = linkLabels.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -8)
        .attr('font-size', '10px')
        .attr('fill', '#3b82f6')
        .attr('class', 'count-text')
        .text(function(d) {
          if (!d.stats) return '';
          return d.stats.count ? `${d.stats.count}` : '0';
        });
      
      // Add timing stats (lag or last time)
      const timingTexts = linkLabels.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 15)
        .attr('font-size', '10px')
        .attr('fill', '#3b82f6')
        .attr('class', 'timing-text')
        .text(function(d) {
          if (!d.stats) return '';
          
          // Handle relationship types
          if (d.relationType === 'read') {
            // Queue -> Bot (reading) relationship
            if (d.stats.lag === undefined || d.stats.lag === null) {
              return 'N/A';
            } else if (d.stats.lag < 100) {
              return '-';
            } else {
              // Use the humanize function for lag formatting
              return 'lag: ' + humanizeDuration(d.stats.lag);
            }
          } else if (d.relationType === 'write') {
            // Bot -> Queue (writing) relationship
            if (!d.stats.last_time) {
              return 'N/A';
            } else {
              try {
                // Calculate time difference between now and last_time
                const lastTime = new Date(d.stats.last_time);
                const now = new Date();
                const timeDiff = now.getTime() - lastTime.getTime();
                
                // Use the humanize function for time ago formatting
                return humanizeDuration(timeDiff) + ' ago';
              } catch (e) {
                return 'invalid date';
              }
            }
          } else {
            return '';
          }
        });
        
      // Adjust background sizes to fit text content
      linkLabels.each(function() {
        const group = d3.select(this);
        const countText = group.select('.count-text').node() as SVGTextElement;
        const timingText = group.select('.timing-text').node() as SVGTextElement;
        
        if (countText) {
          const countBBox = countText.getBBox();
          group.select('.count-bg')
            .attr('x', countBBox.x - 4)
            .attr('y', countBBox.y - 1)
            .attr('width', countBBox.width + 8)
            .attr('height', countBBox.height + 2);
        }
        
        if (timingText) {
          const timingBBox = timingText.getBBox();
          group.select('.timing-bg')
            .attr('x', timingBBox.x - 4)
            .attr('y', timingBBox.y - 1)
            .attr('width', timingBBox.width + 8)
            .attr('height', timingBBox.height + 2);
        }
      });
    }
    
    // Create nodes group
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('id', (d) => `node-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`)
      .attr('data-id', (d) => d.id);
    
    // Add a large invisible circle to improve hover behavior
    // Add this as the first element in each node group
    node.each(function(d) {
      // Skip adding hover area to infinity nodes
      if (d.type === 'infinity') return;
      
      // Add a large invisible circle for better hover detection
      d3.select(this)
        .insert('circle', ':first-child')
        .attr('class', 'hover-area')
        .attr('r', 50) // Large radius to cover the node and all its buttons
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', 'white')
        .attr('fill-opacity', 0) // Make it invisible
        .attr('pointer-events', 'all'); // Ensure it captures mouse events
    });
    
    // Add shadow circles for collapsed nodes - need to add these first so they appear behind the node
    node.each(function(d) {
      const nodeGroup = d3.select(this);
      const nodeId = d.originalId || d.id;
      
      // Check if this node has collapsed parents or children
      const hasCollapsedParents = collapsedState.collapsed.left.includes(nodeId) && 
        d.link_to?.parent && Object.keys(d.link_to.parent).length > 0;
      
      const hasCollapsedChildren = collapsedState.collapsed.right.includes(nodeId) && 
        d.link_to?.children && Object.keys(d.link_to.children).length > 0;
      
      // Check if this node was auto-collapsed
      const isAutoCollapsed = d.isAutoCollapsed === true;
      
      // Add shadow circles for collapsed parents (left)
      if (hasCollapsedParents) {
        // Always use 3 shadow circles regardless of the actual count
        for (let i = 0; i < 2; i++) {
          nodeGroup.append("circle")
            .attr("r", 24)
            .attr("cx", -4 - (i * 5))
            .attr("cy", -4 - (i * 5))
            .attr("fill", "none")
            .attr("stroke", isAutoCollapsed ? "#e53e3e" : "#3182ce") // Red for auto-collapsed, blue for manual
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
            .attr("stroke", isAutoCollapsed ? "#e53e3e" : "#3182ce") // Red for auto-collapsed, blue for manual
            .attr("stroke-width", 2)
            .attr("opacity", 0.5 - (i * 0.1));
        }
      }
      
      // Add a warning indicator for auto-collapsed nodes
      if (isAutoCollapsed) {
        nodeGroup.append("path")
          .attr("d", "M12 0a1 1 0 0 1 .894.553l7 14a1 1 0 0 1-.894 1.447H1a1 1 0 0 1-.894-1.447l7-14A1 1 0 0 1 12 0zm0 8a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1zm0 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z")
          .attr("transform", "translate(18, -18) scale(0.8)")
          .attr("fill", "#e53e3e");
      }
    });
    
    // Add node shapes based on status
    node
      .append('path')
      .attr('class', 'node-shape')
      .attr('d', (d: any) => {
        // Infinity nodes have no shapes
        if (d.type === 'infinity') return '';
        
        // Get node visual properties
        const isAlarmed = ((d as any).isAlarmed || state.nodes?.[d.id]?.isAlarmed) && 
          !state.nodes?.[d.id]?.alarmsAcknowledged;
        const isArchived = !!((d as any).archived || state.nodes?.[d.id]?.archived);
        
        // IMPORTANT: Use direct check against primaryNode instead of state.nodes
        const isPrimary = (d.originalId || d.id) === primaryNode;
        
        const { shape } = getNodeVisualProperties(
          (d as any).type || 'unknown',
          ((d as any).status)?.toLowerCase() || 'unknown',
          isAlarmed,
          isArchived,
          isPrimary,
          true, // Explicitly request strokes for the workflow graph
          d.icon // Pass the icon to identify system nodes with URL icons
        );
        
        // Store shape for later use
        (d as any)._shape = shape;
        
        let radius = isPrimary ? 26 : 22;
        
        // Increase size for triangle and diamond shapes
        if (shape === 'triangle' || shape === 'diamond') {
          radius *= 1.15; // 15% larger
        }
        
        return getShapePath(shape, radius);
      })
      .attr('fill', (d: any) => {
        // Get node visual properties
        const isAlarmed = ((d as any).isAlarmed || state.nodes?.[d.id]?.isAlarmed) && 
                          !state.nodes?.[d.id]?.alarmsAcknowledged;
        const isArchived = !!((d as any).archived || state.nodes?.[d.id]?.archived);
        
        // IMPORTANT: Use direct check against primaryNode instead of state.nodes
        const isPrimary = (d.originalId || d.id) === primaryNode;
        
        const { fillColor } = getNodeVisualProperties(
          (d as any).type || 'unknown',
          ((d as any).status)?.toLowerCase() || 'unknown',
          isAlarmed,
          isArchived,
          isPrimary,
          true,
          d.icon
        );
        
        return fillColor;
      })
      .attr('stroke', (d: any) => {
        // Get node visual properties
        const isAlarmed = ((d as any).isAlarmed || state.nodes?.[d.id]?.isAlarmed) && 
                          !state.nodes?.[d.id]?.alarmsAcknowledged;
        const isArchived = !!((d as any).archived || state.nodes?.[d.id]?.archived);
        
        // IMPORTANT: Use direct check against primaryNode instead of state.nodes
        const isPrimary = (d.originalId || d.id) === primaryNode;
        
        const { showStroke, strokeColor } = getNodeVisualProperties(
          (d as any).type || 'unknown',
          ((d as any).status)?.toLowerCase() || 'unknown',
          isAlarmed,
          isArchived,
          isPrimary,
          true,
          d.icon
        );
        
        // Ensure primary nodes always have a stroke
        if (isPrimary) {
          return '#ffffff'; // Force white stroke for primary node
        }
        
        return showStroke ? strokeColor : 'none';
      })
      .attr('stroke-width', (d: any) => {
        // Make primary node stroke thicker for emphasis
        const isPrimary = (d.originalId || d.id) === primaryNode;
        return isPrimary ? 0 : 2; // Thicker stroke for primary node
      });
    
    // Store the shape for each node for later reference
    node.each(function(d) {
      // Shape is already stored in d._shape from earlier step
      // No need to recalculate it
    });
    
    // Add white shape background for icons that matches the node shape
    node
      .filter(d => d.type !== 'infinity') // Skip infinity nodes
      .append('path')
      .attr('d', (d) => {
        // Use smaller radius for the icon background (90% of shape size)
        let radius = ((d.originalId || d.id) === primaryNode ? 25 : 22) * 0.9;
        
        // Also increase triangle and diamond backgrounds by 15%
        if ((d as any)._shape === 'triangle' || (d as any)._shape === 'diamond') {
          radius *= 1.55; // 15% larger
        }
        
        return getShapePath((d as any)._shape || 'circle', radius);
      })
      .attr('fill', '#ffffff')
      .attr('stroke', 'none')
      .attr('stroke-width', 0);
      
    // Add infinity symbol for infinity nodes
    node.each(function(d) {
      if (d.type === 'infinity') {
        const nodeGroup = d3.select(this);
        
        // Add infinity symbol (∞)
        nodeGroup.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '50px')
          .attr('fill', '#333') 
          .attr('stroke', '#ffffff')
          .attr('stroke-width', '0.5')
          .text('∞');
          
        // No need for node controls on infinity nodes, so skip those
      }
    });
    
    // Get the base URL for node icons
    const baseUrl = window.location.origin;
    
    // Add node icons (skip for infinity nodes)
    node
      .filter(d => d.type !== 'infinity') // Skip infinity nodes
      .append('svg')
      .attr('width', 40) // Bigger icon size to fill the shape
      .attr('height', 40)
      .attr('x', -20)
      .attr('y', -20)
      .html((d) => {
        // Get the original node data from state if available, for more accurate icon
        const nodeData = state.nodes?.[d.originalId || d.id] || d;
        
        // Check for alarmed status based on both local and state data
        const isAlarmed = ((d as any).isAlarmed || state.nodes?.[d.id]?.isAlarmed) && 
                          (d.status === 'running' || d.status === 'paused');
        
        // Convert node type to expected format and provide all required parameters
        const iconSvg = getNodeImagesSvgString(
          { 
            id: d.originalId || d.id,
            type: d.type || 'unknown',
            status: isAlarmed ? 'danger' : d.status,
            archived: (d as any).archived || nodeData.archived,
            paused: (d as any).paused || nodeData.paused,
            isAlarmed: isAlarmed,
            icon: (d as any).icon || (nodeData as any).icon // Use type assertion to avoid TypeScript errors
          }, 
          state.nodes || {}, 
          baseUrl
        );
        return iconSvg;
      });
    
    // Add node labels and get their height
    const nodeLabelLineCount = new Map<string, number>();
    
    node.each(function(d) {
      const nodeSelection = d3.select(this);
      
      // Skip adding labels to infinity nodes
      if (d.type === 'infinity') return;
      
      const labelGroup = nodeSelection
        .append('text')
        .attr('y', 36)  // Set absolute y position below the node
        .attr('x', 0)   // Center horizontally
        .attr('text-anchor', 'middle')
        .attr('class', 'node-label')
        .style('fill', '#374151')
        .style('font-size', '12px');  // Increased font size for better visibility
      
      // Store the rendered height for positioning stats
      const nodeId = d.originalId || d.id;
      const lineCount = wrapNodeLabel(labelGroup, nodeId || '');
      
      // Store the line count in a map instead of on the node
      nodeLabelLineCount.set(d.id, lineCount || 1);
    });
    
    // Add stats text if enabled, positioned based on label height
    if (showStats) {
      node.each(function(d) {
        // Skip adding stats to infinity nodes
        if (d.type === 'infinity') return;
        
        // Only show executions and errors for bot nodes
        if (d.type !== 'bot') return;
        
        const lineCount = nodeLabelLineCount.get(d.id) || 1;
        const statsY = 36 + (lineCount * 15); // Base position + line height adjustment
        
        // Create stats text element
        const statsGroup = d3.select(this)
          .append('text')
          .attr('y', statsY)  // Position based on label height
          .attr('x', 0)   // Center horizontally
          .attr('text-anchor', 'middle')
          .style('font-size', '10px');  // Smaller font size for stats
        
        // Add executions count
        statsGroup.append('tspan')
          .attr('fill', '#4B5563')  // Gray color for executions
          .text(() => {
            return `${d.executions || 0}`;
          });
        
        // Add separator
        statsGroup.append('tspan')
          .attr('fill', '#4B5563')
          .text(' / ');
        
        // Add errors count with red color
        statsGroup.append('tspan')
          .attr('fill', '#ef4444')  // Red color for errors
          .text(() => {
            return `${d.errors || 0}`;
          });
      });
    }
    
    // Update the hover behavior for nodes
    node
      .on('mouseover', function(event, d) {
        // Skip interaction for infinity nodes
        if (d.type === 'infinity') return;
        
        // Don't show tooltip if context menu is visible
        if (isContextMenuActive.current) {
          return;
        }
        
        // Update currently hovered node
        hoveredNodeRef.current = d.originalId || d.id;
          
        // Notify parent of hovered node
        onHoveredNodeChange(d.originalId || d.id);
        
        // Add hover effect to node
        d3.select(this).select('.node-shape')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 3);
        
        // Show tooltip - make sure this is called
        updateTooltip(d.originalId || d.id, event);
        
        // Show node control buttons with a slight delay
        setTimeout(() => {
          // Only add controls if this is still the hovered node
          if (hoveredNodeRef.current !== (d.originalId || d.id)) return;
          
          // Only add controls if they don't already exist
          if (d3.select(this).select('.node-controls').empty()) {
            d3.select(this).classed('hovered', true);
            addNodeControls(d3.select(this), d);
          }
        }, 100);
      })
      .on('mousemove', function(event, d) {
        // Skip interaction for infinity nodes
        if (d.type === 'infinity') return;
        
        // Don't update tooltip if context menu is visible
        if (isContextMenuActive.current) {
          return;
        }
        
        // Update tooltip position
        updateTooltip(d.originalId || d.id, event);
      })
      .on('mouseout', function(event, d) {
        // Skip interaction for infinity nodes
        if (d.type === 'infinity') return;
        
        // Don't hide tooltip if it's being used as context menu
        if (isContextMenuActive.current) {
          return;
        }
        
        onHoveredNodeChange(null);
        
        // Remove hover effect from node
        d3.select(this).select('.node-shape')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        
        // Hide tooltip
        updateTooltip(null);
        
        // Get the element the mouse moved to
        const toElement = event.relatedTarget;
        
        // Only remove the hovered class if we're not moving to a child element
        if (!d3.select(this).node()?.contains(toElement as HTMLElement)) {
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
        }
      })
      .on('click', (event, d) => {
        // Skip interaction for infinity nodes
        if (d.type === 'infinity') return;
        
        event.stopPropagation();
        onNodeClick(d.originalId || d.id);
      })
      .on('dblclick', (event, d) => {
        // Skip interaction for infinity nodes
        if (d.type === 'infinity') return;
        
        event.stopPropagation();
        onNodeDoubleClick(d.originalId || d.id);
      })
      .on('contextmenu', function(event, d) {
        // Skip interaction for infinity nodes
        if (d.type === 'infinity') return;
        
        // Ensure this event handler is getting called
        console.log('Right-click detected on node:', d.originalId || d.id);
        event.preventDefault();
        event.stopPropagation();
        showContextMenu(d.originalId || d.id, event);
      });
    
    // Update the function to add node controls with improved behavior
    function addNodeControls(nodeSelection: d3.Selection<any, any, any, any>, d: Node) {
      // Skip adding controls to infinity nodes
      if (d.type === 'infinity') return;
      
      // Remove any existing controls first
      nodeSelection.select('.node-controls').remove();
      
      // Extract nodeId
      const nodeId = d.originalId || d.id;
      
      // Create controls container
      const controls = nodeSelection.append('g')
        .attr('class', 'node-controls')
        .attr('opacity', 0);
      
      // Make sure hovered flag is set
      nodeSelection.classed('hovered', true);
      
      const radius = 50; // Distance from node center
      const buttonRadius = 15; // Size of action buttons
      
      // Function to position button at given angle
      const positionButton = (angle: number) => {
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius; // Negative because SVG y-axis is inverted
        return { x, y };
      };
      
      // Get node data and check primary node status
      const nodeData = state.nodes?.[d.originalId || d.id];
      const isPrimaryNode = (d.originalId || d.id) === primaryNode;
      
      // 1. Focus button (Crosshair icon) at 1 o'clock - should trigger double-click
      // Don't show focus button for the primary node
      if (!isPrimaryNode) {
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
      }
      
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
          // IMPORTANT: Remove this check to allow primary node to have collapse/expand buttons
          // if (isPrimaryNode) return;
          
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
          // IMPORTANT: Remove this check to allow primary node to have collapse/expand buttons
          // if (isPrimaryNode) return;
          
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
  }, [primaryNode, graphData, offset, zoom, collapsedState, showStats, onNodeClick, onNodeDoubleClick, onNodeSettingsClick, onCollapse, onExpand, onFocusClick, onHoveredNodeChange, state.nodes]);
  
  // Main rendering function
  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) {
      console.log('Not rendering graph: SVG ref or nodes missing', {
        hasSvgRef: !!svgRef.current,
        nodeCount: graphData.nodes.length
      });
      return;
    }
    
    // Render the graph
    const result = renderGraph();
    
    // Update refs for next render
    previousPrimaryNode.current = primaryNode;
    previousCollapsedState.current = JSON.parse(JSON.stringify(collapsedState));
    
    // Initial layout is complete
    initialLayoutComplete.current = true;
  }, [primaryNode, graphData, offset, zoom, collapsedState, showStats, renderGraph]);
  
  // Also, let's add a safeguard in the useEffect to always make sure the primary node isn't in collapsedState
  useEffect(() => {
    // Safeguard: ensure primary node is never in the collapsed state
    if (primaryNode) {
      // If the primary node is in collapsedState.collapsed.left or right, we need to notify parent
      const isCollapsedLeft = collapsedState.collapsed.left.includes(primaryNode);
      const isCollapsedRight = collapsedState.collapsed.right.includes(primaryNode);
      
      if (isCollapsedLeft) {
        console.warn('Primary node was in collapsed left state - expanding');
        onExpand(primaryNode, 'left');
      }
      
      if (isCollapsedRight) {
        console.warn('Primary node was in collapsed right state - expanding');
        onExpand(primaryNode, 'right');
      }
    }
  }, [primaryNode, collapsedState, onExpand]);
  
  // Add a warning message at the top of the graph when nodes are auto-collapsed
  useEffect(() => {
    // Check if any nodes are auto-collapsed
    const hasAutoCollapsedNodes = graphData.nodes.some(node => node.isAutoCollapsed);
    
    if (hasAutoCollapsedNodes && svgRef.current) {
      const svg = d3.select(svgRef.current);
      // Parse the width attribute to a number or use a default value
      const svgWidth = parseFloat(svg.attr('width') || '0');
      
      const warningGroup = svg
        .append('g')
        .attr('class', 'auto-collapse-warning')
        .attr('transform', `translate(${svgWidth / 2}, 30)`);
      
      // Add background for the warning
      warningGroup
        .append('rect')
        .attr('x', -175)
        .attr('y', -15)
        .attr('width', 350)
        .attr('height', 30)
        .attr('rx', 5)
        .attr('fill', 'rgba(254, 226, 226, 0.9)') // Light red background
        .attr('stroke', '#e53e3e')
        .attr('stroke-width', 1);
      
      // Add warning text
      warningGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#e53e3e')
        .attr('font-size', '12px')
        .attr('width', 550)
        .text('Some nodes were automatically collapsed to prevent browser freezing (node limit: 125)');
      
      // Clean up on unmount
      return () => {
        svg.select('.auto-collapse-warning').remove();
      };
    }
  }, [graphData.nodes, svgRef]);
  
  return null; // This is a logic-only component, no rendering needed
} 