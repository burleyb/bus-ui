"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDialogs } from '@/hooks/useDialogs';
import { WorkflowGraphEvents } from './WorkflowGraphEvents';
import { WorkflowGraphRenderer } from './WorkflowGraphRenderer';
import { WorkflowGraphData } from './WorkflowGraphData';
import { GraphData, WorkflowGraphProps } from '@/types/workflow';
import { useWorkflowGraph } from '@/hooks/useWorkflowGraph';
import { useAppContext } from '@/context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WorkflowGraphChartDrawer } from './WorkflowGraphChartDrawer';

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
  
  // Access app context
  const { state } = useAppContext();
  
  // State
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [noFocusMessage, setNoFocusMessage] = useState<boolean>(true);
  const [isArchivedMessage, setIsArchivedMessage] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isChartDrawerOpen, setIsChartDrawerOpen] = useState<boolean>(false);
  
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
  
  // Toggle chart drawer visibility
  const toggleChartDrawer = useCallback(() => {
    setIsChartDrawerOpen(prevState => !prevState);
  }, []);
  
  // Check if primary node is archived
  useEffect(() => {
    if (primaryNode && state.nodes && state.nodes[primaryNode]) {
      const nodeData = state.nodes[primaryNode];
      setIsArchivedMessage(nodeData.status === 'archived' || !!nodeData.archived);
    } else {
      setIsArchivedMessage(false);
    }
  }, [primaryNode, state.nodes]);
  
  const handleGraphDataReady = useCallback((data: GraphData) => {
    // Update graph data
    setGraphData(data);
    
    // Show no focus message if there's no data and node isn't archived
    setNoFocusMessage(data.nodes.length === 0 && !isArchivedMessage);
  }, [isArchivedMessage]);
  
  // Toggle legend expanded state
  const toggleLegend = useCallback(() => {
    setIsLegendExpanded(prev => !prev);
  }, []);
  
    return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-800"
      style={{ touchAction: 'none' }} // Prevent browser handling of touch events
    >
      {/* No focus message */}
      {noFocusMessage && !isArchivedMessage && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">No node selected</p>
            <p className="text-sm">Select a node to visualize its relationships</p>
          </div>
        </div>
      )}
      
      {/* Archived node message */}
      {isArchivedMessage && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Selected node is archived</p>
            <p className="text-sm">Archived nodes are not displayed in the workflow graph</p>
            <p className="text-sm">You can unarchive the node from its settings</p>
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
      
      {/* Toggle chart drawer button */}
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-20">
        <button
          onClick={toggleChartDrawer}
          className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 rounded-l-md shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          aria-label={isChartDrawerOpen ? "Close charts" : "Open charts"}
        >
          {isChartDrawerOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Chart drawer */}
      <WorkflowGraphChartDrawer
        isOpen={isChartDrawerOpen}
        selectedNode={selectedNodes[0] || focusNode || primaryNode}
        graphData={graphData}
        timePeriod={timePeriod}
        onClose={toggleChartDrawer}
      />
      
      {/* Legend - positioned at bottom right */}
      <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-2 rounded shadow border border-gray-200 dark:border-gray-700 max-h-[80%] overflow-y-auto">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold mb-1">Legend</div>
          <button 
            onClick={toggleLegend} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            aria-label={isLegendExpanded ? "Collapse legend" : "Expand legend"}
          >
            {isLegendExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {isLegendExpanded && (
          <>
            {/* Node Types */}
            <div className="mb-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Node Types</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
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
            
            {/* Bot Statuses */}
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Bot Statuses</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-1">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/bot-paused.png`} width="100%" height="100%" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Paused - The bot is paused and will not run</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-1">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/bot-archived.png`} width="100%" height="100%" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Archived - The bot will not run and is not monitored</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-1">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/bot-danger.png`} width="100%" height="100%" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Danger - The bot is running slowly and has a backlog of events</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-1">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/bot-blocked.png`} width="100%" height="100%" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Blocked - The bot is erroring and is not processing events</span>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-1">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <image href={`${typeof window !== 'undefined' ? window.location.origin : ''}/images/nodes/bot-rogue.png`} width="100%" height="100%" />
                    </svg>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Rogue - The bot has errored enough times that we will not try to run it again</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
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