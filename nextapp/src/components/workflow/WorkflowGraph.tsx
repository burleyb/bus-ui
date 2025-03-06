"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDialogs } from '@/hooks/useDialogs';
import { WorkflowGraphEvents } from './WorkflowGraphEvents';
import { WorkflowGraphRenderer } from './WorkflowGraphRenderer';
import { WorkflowGraphData } from './WorkflowGraphData';
import { GraphData, WorkflowGraphProps } from '@/types/workflow';
import { useWorkflowGraph } from '@/hooks/useWorkflowGraph';

/**
 * Main WorkflowGraph component that orchestrates the workflow graph visualization.
 * This component is responsible for managing the state and interactions of the graph.
 */
export default function WorkflowGraph({ 
  selectedBot, 
  timePeriod, 
  offset = [0, 0], 
  zoom = 1,
  stats = true
}: WorkflowGraphProps) {
  // Refs for DOM elements
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [noFocusMessage, setNoFocusMessage] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Hooks
  const { openNodeSettingsDialog } = useDialogs();
  const { 
    selectedNodes, 
    focusNode, 
    collapsedState, 
    offset: currentOffset, 
    zoom: currentZoom, 
    showStats,
    startDrag, 
    updateDrag, 
    endDrag, 
    handleZoom, 
    toggleCollapsed, 
    toggleExpanded,
    updateGraphState
  } = useWorkflowGraph({
    initialOffset: offset,
    initialZoom: zoom,
    initialStats: stats
  });
  
  // Get the primary focus node
  const primaryNode = selectedBot && selectedBot.length > 0 ? selectedBot[0] : '';
  
  // Set background color for dark/light mode
  useThemeBackgroundColor();
  
  // Initialize container dimensions
  useEffect(() => {
    if (svgRef.current && containerRef.current) {
      svgRef.current.setAttribute('width', containerRef.current.clientWidth.toString());
      svgRef.current.setAttribute('height', containerRef.current.clientHeight.toString());
    }
  }, []);
  
  // Event handlers
  const handleWheel = useCallback((event: WheelEvent) => {
      event.preventDefault();
      
    // Calculate zoom factor
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // Zoom out if positive, zoom in if negative
    handleZoom(zoomFactor);
  }, [handleZoom]);
  
  const handleMouseDown = useCallback((event: MouseEvent) => {
    // Ignore if not left mouse button or if clicking on a node or control
    if (event.button !== 0 || 
        (event.target as Element).closest('.node') || 
        (event.target as Element).closest('.control-button')) {
      return;
    }
    
    // Start dragging
    startDrag(event.clientX, event.clientY);
  }, [startDrag]);
  
  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Update drag position
    updateDrag(event.clientX, event.clientY);
  }, [updateDrag]);
  
  const handleMouseUp = useCallback(() => {
    // End dragging
    endDrag();
  }, [endDrag]);
  
  const handleResize = useCallback(() => {
    // Handle window resize
      if (svgRef.current && containerRef.current) {
      svgRef.current.setAttribute('width', containerRef.current.clientWidth.toString());
      svgRef.current.setAttribute('height', containerRef.current.clientHeight.toString());
    }
  }, []);
  
  // Node interaction handlers
  const handleNodeClick = useCallback((nodeId: string) => {
    // Update selected nodes
    updateGraphState({ selectedNodes: [nodeId] });
  }, [updateGraphState]);
  
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    // Update focus node
    updateGraphState({ focusNode: nodeId });
  }, [updateGraphState]);
  
  const handleNodeSettingsClick = useCallback((nodeId: string) => {
    // Open node settings dialog
    openNodeSettingsDialog(nodeId);
  }, [openNodeSettingsDialog]);
  
  const handleCollapseNode = useCallback((nodeId: string, direction: 'left' | 'right') => {
    // Toggle collapsed state
    const newState = toggleCollapsed(nodeId, direction);
    updateGraphState({ collapsedState: newState });
  }, [toggleCollapsed, updateGraphState]);
  
  const handleExpandNode = useCallback((nodeId: string, direction: 'left' | 'right') => {
    // Toggle expanded state
    const newState = toggleExpanded(nodeId, direction);
    updateGraphState({ collapsedState: newState });
  }, [toggleExpanded, updateGraphState]);
  
  const handleFocusClick = useCallback((nodeId: string) => {
    // Update focus node
    updateGraphState({ focusNode: nodeId });
  }, [updateGraphState]);
  
  const handleGraphDataReady = useCallback((data: GraphData) => {
    // Update graph data
    setGraphData(data);
    
    // Show no focus message if there's no data
    setNoFocusMessage(data.nodes.length === 0);
  }, []);
  
    return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-800"
      style={{ touchAction: 'none' }} // Prevent browser handling of touch events
    >
      {/* No focus message */}
      {noFocusMessage && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">No node selected</p>
            <p className="text-sm">Select a node to visualize its relationships</p>
        </div>
      </div>
      )}
      
      {/* Tooltip for additional information */}
      <div
        ref={tooltipRef}
        className="absolute hidden p-2 bg-white dark:bg-gray-700 shadow-lg rounded-md text-sm z-10"
      ></div>
      
      {/* SVG container for graph */}
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        className="w-full h-full"
        style={{ userSelect: 'none' }} // Prevent text selection during drag
      ></svg>
      
      {/* Event handlers */}
      <WorkflowGraphEvents
        containerRef={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onResize={handleResize}
      >
        {/* Graph data management */}
        <WorkflowGraphData
          primaryNode={primaryNode}
          timePeriod={timePeriod}
          collapsedState={collapsedState}
          onDataReady={handleGraphDataReady}
        />
        
        {/* Graph rendering */}
        {graphData.nodes.length > 0 && (
          <WorkflowGraphRenderer
            svgRef={svgRef}
            tooltipRef={tooltipRef}
            graphData={graphData}
            primaryNode={primaryNode}
            offset={currentOffset}
            zoom={currentZoom}
            collapsedState={collapsedState}
            showStats={showStats}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeSettingsClick={handleNodeSettingsClick}
            onCollapse={handleCollapseNode}
            onExpand={handleExpandNode}
            onFocusClick={handleFocusClick}
            onHoveredNodeChange={setHoveredNode}
          />
        )}
      </WorkflowGraphEvents>
    </div>
  );
}

// Hook to set background color based on theme
function useThemeBackgroundColor() {
  React.useEffect(() => {
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
} 