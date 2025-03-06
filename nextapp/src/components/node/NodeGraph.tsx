"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import * as d3 from 'd3';
import { getNodeImagesSvgString } from './NodeIcon';

interface NodeGraphProps {
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

export default function NodeGraph({ selectedBot }: NodeGraphProps) {
  const { state } = useAppContext();
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
      type: node.type,
      group: node.type === 'bot' ? 1 : node.type === 'queue' ? 2 : 3
    }));
    
    // Create links array for D3
    const links: Link[] = [];
    filteredNodes.forEach(node => {
      if (node.connections && node.connections.length > 0) {
        node.connections.forEach((target: string) => {
          // Only add links if both source and target are in our filtered nodes
          if (nodes.some(n => n.id === target)) {
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
  
  // Create/update the graph when data changes
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight || 500;
    const tooltip = d3.select(tooltipRef.current);
    
    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force('link', d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));
    
    // Create the links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.value));
    
    // Create the nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any
      );
    
    // Add node circles as background/hitarea
    node.append('circle')
      .attr('r', 16)
      .attr('fill', (d) => {
        switch(d.status) {
          case 'active': return '#10B981'; // green
          case 'warning': return '#F59E0B'; // yellow
          case 'error': return '#EF4444'; // red
          default: return '#6B7280'; // gray
        }
      })
      .attr('fill-opacity', 0.7);
    
    // Add node icons
    node.append('svg:g')
      .attr('transform', 'translate(-16,-16)')
      .attr('width', 32)
      .attr('height', 32)
      .html((d) => {
        // Get the base URL for assets
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : (process.env.NEXT_PUBLIC_BASE_URL || '');
        
        return getNodeImagesSvgString(d, state.nodes, baseUrl);
      });
    
    // Add labels to nodes
    const text = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .attr('dx', 15)
      .attr('dy', '.35em')
      .text((d) => d.id)
      .style('font-size', '10px')
      .style('fill', 'currentColor');
    
    // Add tooltip behavior
    node.on('mouseover', function(event, d) {
      tooltip
        .style('display', 'block')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html(`
          <div class="font-medium">${d.id}</div>
          <div class="text-xs">Type: ${d.type || 'N/A'}</div>
          <div class="text-xs">Status: ${d.status}</div>
        `);
    })
    .on('mouseout', function() {
      tooltip.style('display', 'none');
    });
    
    // Define behavior on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
      
      text
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
    
    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return () => {
      simulation.stop();
    };
  }, [graphData, state.nodes]);
  
  if (state.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No nodes available. {selectedBot ? `Bot "${selectedBot}" not found.` : ''}</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <svg 
        ref={svgRef} 
        className="w-full h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
      />
      <div 
        ref={tooltipRef} 
        className="absolute hidden bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 text-sm border border-gray-200 dark:border-gray-700 pointer-events-none"
      />
    </div>
  );
} 