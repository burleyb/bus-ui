'use client'
import { useEffect, useRef, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useNode, useNodes } from '@/hooks/useQueries';
import * as d3 from 'd3';

// Define types for node data
interface NodeData {
  id: string;
  name?: string;
  label?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  status?: string;
  type?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

// Define a type for the nodes object
interface NodesMap {
  [key: string]: NodeData;
}

export default function NodeViewPage() {
  const { node: selectedNodeId, changeNode, zoom: contextZoom, offset: contextOffset } = useData();
  const { data: nodesData, isLoading: nodesLoading } = useNodes();
  const { data: selectedNode, isLoading: nodeLoading } = useNode(selectedNodeId);
  
  // Cast nodes data to the correct type
  const nodes = nodesData as NodesMap | undefined;
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(contextZoom || 1);
  const [offset, setOffset] = useState<[number, number]>(contextOffset || [0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number]>([0, 0]);

  // Initialize the D3 visualization
  useEffect(() => {
    if (nodesLoading || !nodes || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Clear previous content
    svg.selectAll('*').remove();
    
    // Create a group for the graph
    const g = svg.append('g')
      .attr('transform', `translate(${offset[0]},${offset[1]}) scale(${zoom})`);
    
    // Create links data
    const links: { source: string; target: string }[] = [];
    
    // Process nodes to extract links
    Object.values(nodes).forEach((node: NodeData) => {
      if (node.outputs) {
        Object.keys(node.outputs).forEach(outputId => {
          links.push({
            source: node.id,
            target: outputId
          });
        });
      }
    });
    
    // Create a force simulation
    const simulation = d3.forceSimulation<NodeData>()
      .force('link', d3.forceLink<NodeData, {source: string; target: string}>().id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody<NodeData>().strength(-300))
      .force('center', d3.forceCenter<NodeData>(width / 2, height / 2));
    
    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);
    
    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(Object.values(nodes) as NodeData[])
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, NodeData>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add circles to nodes
    node.append('circle')
      .attr('r', 10)
      .attr('fill', (d: NodeData) => d.id === selectedNodeId ? '#ff5722' : '#1976d2')
      .on('click', (event: any, d: NodeData) => {
        changeNode(d.id, 'node', offset);
      });
    
    // Add labels to nodes
    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text((d: NodeData) => d.name || d.label || d.id)
      .attr('fill', '#333');
    
    // Update positions on simulation tick
    simulation
      .nodes(Object.values(nodes) as NodeData[])
      .on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);
        
        node
          .attr('transform', (d: NodeData) => `translate(${d.x},${d.y})`);
      });
    
    // Apply the links force
    simulation.force<d3.ForceLink<NodeData, {source: string; target: string}>>('link')?.links(links);
    
    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, NodeData, NodeData>, d: NodeData) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, NodeData, NodeData>, d: NodeData) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: d3.D3DragEvent<SVGGElement, NodeData, NodeData>, d: NodeData) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, nodesLoading, selectedNodeId, zoom, offset, changeNode]);

  // Handle SVG mouse events for panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart([e.clientX, e.clientY]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart[0];
      const dy = e.clientY - dragStart[1];
      const newOffset: [number, number] = [offset[0] + dx, offset[1] + dy];
      setOffset(newOffset);
      setDragStart([e.clientX, e.clientY]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
  };

  const handleResetView = () => {
    setZoom(1);
    setOffset([0, 0]);
  };

  if (nodesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Cast selectedNode to NodeData type to fix TypeScript errors
  const typedSelectedNode = selectedNode as NodeData | undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Node View</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300"
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300"
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={handleResetView}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300"
            title="Reset View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        ></svg>
      </div>
      
      {selectedNodeId && !nodeLoading && typedSelectedNode && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">{typedSelectedNode.name || typedSelectedNode.label || typedSelectedNode.id}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Inputs</h3>
              <ul className="text-sm">
                {typedSelectedNode.inputs ? (
                  Object.keys(typedSelectedNode.inputs).map(input => (
                    <li key={input} className="py-1">{input}</li>
                  ))
                ) : (
                  <li className="text-gray-400">No inputs</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Outputs</h3>
              <ul className="text-sm">
                {typedSelectedNode.outputs ? (
                  Object.keys(typedSelectedNode.outputs).map(output => (
                    <li key={output} className="py-1">{output}</li>
                  ))
                ) : (
                  <li className="text-gray-400">No outputs</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 