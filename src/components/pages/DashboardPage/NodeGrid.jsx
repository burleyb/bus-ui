import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import NodeCard from './NodeCard';

export default function NodeGrid({ nodes = [], isLoading }) {
  const parentRef = useRef();

  const rowVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={parentRef} 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto"
      style={{ height: 'calc(100vh - 300px)' }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <NodeCard 
          key={nodes[virtualRow.index].id} 
          node={nodes[virtualRow.index]}
          style={{
            height: virtualRow.size,
            transform: `translateY(${virtualRow.start}px)`
          }}
        />
      ))}
    </div>
  );
}
