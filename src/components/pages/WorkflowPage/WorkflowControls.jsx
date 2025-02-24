import React from 'react';
import { useData } from '../../../stores/DataContext';

export default function WorkflowControls() {
  const { zoomLevel, setZoomLevel, layout, setLayout } = useData();

  return (
    <div className="p-4 border-b flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setZoomLevel(zoomLevel + 0.1)}
          className="p-2 rounded hover:bg-gray-100"
        >
          {/* <PlusIcon className="w-5 h-5" /> */}
        </button>
        <button
          onClick={() => setZoomLevel(zoomLevel - 0.1)}
          className="p-2 rounded hover:bg-gray-100"
        >
          {/* <MinusIcon className="w-5 h-5" /> */}
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="p-2 rounded hover:bg-gray-100"
        >
          {/* <ResetIcon className="w-5 h-5" /> */}
        </button>
      </div>
      <div className="flex items-center gap-4">
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="dagre">Hierarchical</option>
          <option value="force">Force Directed</option>
          <option value="grid">Grid</option>
        </select>
      </div>
    </div>
  );
}
