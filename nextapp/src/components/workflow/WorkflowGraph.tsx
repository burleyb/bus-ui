"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import * as d3 from 'd3';
import { useDialogs } from '@/hooks/useDialogs';

interface WorkflowGraphProps {
  selectedBot: string;
}

type Node = {
  id: string;
  status: string;
  type?: string;
  group?: number;
};

type Link = {
  source: string;
  target: string;
  value: number;
};

type GraphData = {
  nodes: Node[];
  links: Link[];
};

export default function WorkflowGraph({ selectedBot }: WorkflowGraphProps) {
  const { state } = useAppContext();
  const { openNodeSettingsDialog } = useDialogs();
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
  // Prepare graph data when nodes change
  useEffect(() => {
    if (!state.nodes || Object.keys(state.nodes).length === 0) return;
    
    // Filter nodes if a specific bot is selected
    const filteredNodes = selectedBot 
      ? Object.values(state.nodes).filter(node => 
          node.id === selectedBot || 
          node.connections?.includes(selectedBot) ||
          selectedBot === ''
        )
      : Object.values(state.nodes);
    
    // Create nodes array for D3
    const nodes: Node[] = filteredNodes.map(node => ({
      id: node.id,
      status: node.status || 'inactive',
      type: node.type || 'unknown',
      group: node.type === 'bot' ? 1 : node.type === 'queue' ? 2 : 3
    }));
    
    // Create links array for D3 based on node connections
    const links: Link[] = [];
    
    filteredNodes.forEach(node => {
      if (node.connections && node.connections.length > 0) {
        node.connections.forEach(target => {
          // Only add links where both source and target are in our filtered nodes
          if (filteredNodes.some(n => n.id === target)) {
            links.push({
              source: node.id,
              target,
              value: 1
            });
          }
        });
      }
    });
    
    setGraphData({ nodes, links });
  }, [state.nodes, selectedBot]);
  
  // Draw the graph when data changes
  useEffect(() => {
    if (!graphData.nodes.length || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous graph
    
    const width = svgRef.current.clientWidth;
    const height = 500; // Fixed height or you can make it dynamic
    
    // Create the simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force("link", d3.forceLink(graphData.links as any)
        .id((d: any) => d.id)
        .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50));
    
    // Create a group for the graph
    const g = svg.append("g");
    
    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value));
    
    // Create nodes
    const node = g.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        // Open node settings dialog when a node is clicked
        openNodeSettingsDialog(d.id);
      })
      .on("mouseover", (event, d) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("display", "block")
          .html(`
            <div class="font-medium">${d.id}</div>
            <div>Type: ${d.type}</div>
            <div>Status: ${d.status}</div>
          `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mouseout", () => {
        d3.select(tooltipRef.current).style("display", "none");
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any
      );
    
    // Add circles to nodes
    node.append("circle")
      .attr("r", 20)
      .attr("fill", (d) => {
        if (d.type === 'bot') return "#4299e1"; // Blue for bots
        if (d.type === 'queue') return "#805ad5"; // Purple for queues
        return "#38a169"; // Green for systems
      })
      .attr("stroke", (d) => {
        if (d.status === 'active') return "#38a169"; // Green for active
        if (d.status === 'paused') return "#ecc94b"; // Yellow for paused
        return "#e53e3e"; // Red for inactive or error
      })
      .attr("stroke-width", 2);
    
    // Add text labels
    node.append("text")
      .attr("dx", 25)
      .attr("dy", 5)
      .attr("font-size", "12px")
      .text((d) => d.id);
    
    // Add type indicator
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", "10px")
      .attr("fill", "white")
      .text((d) => d.type?.charAt(0).toUpperCase());
    
    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      
      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);
    
    return () => {
      simulation.stop();
    };
  }, [graphData, openNodeSettingsDialog]);
  
  if (state.updatingStats && !graphData.nodes.length) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-500 dark:text-gray-400">Loading workflow...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full h-[500px] bg-white dark:bg-gray-800"></svg>
      <div
        ref={tooltipRef}
        className="absolute hidden bg-white dark:bg-gray-900 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs z-10"
      ></div>
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-2 rounded shadow border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold mb-1">Legend</div>
        <div className="flex space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-gray-700 dark:text-gray-300">Bot</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            <span className="text-gray-700 dark:text-gray-300">Queue</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-gray-700 dark:text-gray-300">System</span>
          </div>
        </div>
      </div>
    </div>
  );
} 