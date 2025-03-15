"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { useTrace } from '@/hooks/useTrace';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import TraceGraph from '@/components/trace/TraceGraph';

interface TraceDialogProps {
  open: boolean;
  onClose: () => void;
  queueId: string;
  eventId: string;
}

export default function TraceDialog({
  open,
  onClose,
  queueId,
  eventId
}: TraceDialogProps) {
  const { addToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<[number, number]>([0, 0]);
  const [activeTrace, setActiveTrace] = useState<string | undefined>(undefined);
  
  // Reset state when dialog opens or queue/event changes
  useEffect(() => {
    if (open) {
      setZoom(1);
      setOffset([0, 0]);
      setActiveTrace(undefined);
    }
  }, [open, queueId, eventId]);
  
  // Fetch trace data for the initial event
  const { data: traceData, isLoading, isError, error } = useTrace(queueId, eventId, activeTrace);
  
  // Handle any errors
  useEffect(() => {
    if (isError && error instanceof Error) {
      addToast({
        title: 'Error fetching trace data',
        description: error.message,
        type: 'error',
      });
    }
  }, [isError, error, addToast]);
  
  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(5, prev * 1.25));
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.25, prev / 1.25));
  };
  
  // Handle center graph
  const handleCenter = () => {
    setOffset([0, 0]);
  };
  
  // Handle tracing to a child node
  const handleTraceToChild = (path: string) => {
    // The path parameter is a comma-separated list of node IDs that represents
    // the path through the trace tree, e.g. "nodeA,nodeB,nodeC"
    // This is passed directly to useTrace which will use it in the API call:
    // api/trace/queueName/eid?children=nodeA,nodeB,nodeC
    setActiveTrace(path);
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 overflow-hidden hide-close-button"
        onInteractOutside={() => onClose()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Event Trace</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-mono">{queueId} / {eventId}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Zoom controls */}
              <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 rounded-md p-1">
                <button
                  title="Zoom In"
                  className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                  onClick={handleZoomIn}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  title="Center"
                  className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                  onClick={handleCenter}
                >
                  <Crosshair size={16} />
                </button>
                <button
                  title="Zoom Out"
                  className="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
                  onClick={handleZoomOut}
                >
                  <ZoomOut size={16} />
                </button>
              </div>
              
              {/* Close button */}
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={onClose}
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Graph container */}
          <div 
            ref={containerRef} 
            className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center h-full text-red-500">
                <p>Error loading trace data. Please try again.</p>
              </div>
            ) : !traceData ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No trace data available.</p>
              </div>
            ) : (
              <TraceGraph
                traceData={traceData}
                zoom={zoom}
                offset={offset}
                onOffsetChange={setOffset}
                onTraceToChild={handleTraceToChild}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 