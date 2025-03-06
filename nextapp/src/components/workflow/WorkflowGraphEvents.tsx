"use client";

import React, { useEffect, useRef } from 'react';

interface WorkflowGraphEventsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onWheel: (event: WheelEvent) => void;
  onMouseDown: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: () => void;
  onResize: () => void;
  children: React.ReactNode;
}

/**
 * Component that handles all the mouse and wheel events for the workflow graph.
 * This separates the event handling logic from the main graph component.
 */
export function WorkflowGraphEvents({
  containerRef,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onResize,
  children
}: WorkflowGraphEventsProps) {
  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Add event listeners to container
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);
    
    // Clean up event listeners
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
    };
  }, [containerRef, onWheel, onMouseDown, onMouseMove, onMouseUp, onResize]);
  
  return <>{children}</>;
} 