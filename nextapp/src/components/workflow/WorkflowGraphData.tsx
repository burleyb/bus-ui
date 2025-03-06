"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Node, Link, GraphData, CollapsedState } from '@/types/workflow';
import { fixedPositions } from '@/utils/workflowUtils';

interface WorkflowGraphDataProps {
  primaryNode: string;
  timePeriod?: {
    begin?: string;
    end?: string;
    interval: 'minute_15' | 'hour' | 'hour_6' | 'day' | 'week';
  };
  collapsedState: CollapsedState;
  onDataReady: (data: GraphData) => void;
}

/**
 * Component responsible for managing graph data.
 * This component fetches and processes the graph data based on the primary node and time period.
 */
export function WorkflowGraphData({
  primaryNode,
  timePeriod,
  collapsedState,
  onDataReady
}: WorkflowGraphDataProps) {
  const { state } = useAppContext();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
  // Generate graph data whenever primary node, time period, or nodes data changes
  useEffect(() => {
    if (!primaryNode) {
      console.log('No primary node selected, resetting graph data');
      setGraphData({ nodes: [], links: [] });
      onDataReady({ nodes: [], links: [] });
      return;
    }

    console.log('Generating graph data for primary node:', primaryNode, {
      hasNodesData: !!state.nodes,
      nodesCount: Object.keys(state.nodes || {}).length,
      isPrimaryNodeInData: !!state.nodes?.[primaryNode]
    });
    
    if (!state.nodes || Object.keys(state.nodes).length === 0) {
      console.log('No node data available yet, waiting for data');
      return; // Wait for node data to be available
    }
    
    if (!state.nodes[primaryNode]) {
      console.log('Primary node not found in state data:', primaryNode);
      return; // Primary node not found
    }

    // Initialize data structures
    const newGraphData: GraphData = { nodes: [], links: [] };
    const nodesInGraph = new Set<string>(); // Track nodes already added to the graph
    const processedLinks = new Set<string>(); // Track processed links to prevent duplicates
    const processedPaths = new Set<string>(); // Track processed paths for cycle detection
    
    // Track farthest nodes for layout calculation
    let maxLeftGeneration = 0;
    let maxRightGeneration = 0;
    
    // Add primary node to graph
    const addNodeToGraph = (nodeId: string, generation: number, group: number) => {
      const nodeData = state.nodes?.[nodeId];
      if (!nodeData) return false;
      
      // Create node object with all necessary properties
      const node: Node = {
        id: nodeId,
        status: nodeData.status || 'unknown',
        type: nodeData.type || 'unknown',
        group: group, // 0 = input, 1 = focus, 2 = output
        generation: generation,
        executions: nodeData.stats?.executions,
        errors: nodeData.stats?.errors,
        queues: nodeData.queues
      };
      
      // Add node to graph
      newGraphData.nodes.push(node);
      nodesInGraph.add(nodeId);
      return true;
    };
    
    // Add infinity node (just an icon, no circle or label)
    const addInfinityNode = (connectedNodeId: string, generation: number, group: number) => {
      const infinityNodeId = `${connectedNodeId}_infinity_${generation}`;
      
      // Add the infinity node
      newGraphData.nodes.push({
        id: infinityNodeId,
        status: 'infinity',
        type: 'infinity',
        group: group,
        generation: generation
      });
      
      return infinityNodeId;
    };
    
    // Add ancestors (inputs) to the graph recursively
    const addAncestors = (nodeId: string, generation: number, pathIds: string[] = []) => {
      // Stop if we're beyond the max left generation limit or the node is in the collapsed list
      if (collapsedState.collapsed.left.includes(nodeId)) {
        return;
      }
  
      // Get node data
      const nodeData = state.nodes?.[nodeId];
      if (!nodeData) return;
      
      // Check for cycles in the current path
      if (pathIds.includes(nodeId)) {
        // We have a cycle - Add an infinity node and stop
        if (generation !== 0) { // Don't add infinity for primary node
          const infinityNodeId = addInfinityNode(nodeId, generation - 1, 0);
          
          // Link infinity node to the current node
          newGraphData.links.push({
            source: infinityNodeId,
            target: nodeId,
            value: 1
          });
        }
        return;
      }
      
      // Track this node in our current path
      const currentPath = [...pathIds, nodeId];
      
      // Only add the node to the graph if it's not the primary node
      if (generation !== 0) {
        addNodeToGraph(nodeId, generation, 0); // Group 0 for ancestors
      }

      // Track farthest generation for layout purposes
      maxLeftGeneration = Math.min(maxLeftGeneration, generation);
  
      // Add parent nodes (inputs) - these are the left-side nodes
      if (nodeData.link_to?.parent) {
        Object.keys(nodeData.link_to.parent).forEach((parentId) => {
          // Create a unique link ID to track processed links
          const linkId = `${parentId}->${nodeId}`;
          
          // Skip duplicate links
          if (processedLinks.has(linkId)) {
            return;
          }
          processedLinks.add(linkId);
          
          // Check for queue-to-bot cycles (in ancestors direction)
          const parentNodeData = state.nodes?.[parentId];
          if (!parentNodeData) return;
          
          const isParentQueue = parentNodeData.type?.includes('queue');
          const isBotNode = nodeData.type?.includes('bot');
          const isQueueToBotLink = isParentQueue && isBotNode;
          
          // Check if we've seen this combination before
          const pathKey = `${parentId}->${nodeId}`;
          if (isQueueToBotLink && processedPaths.has(pathKey)) {
            // This is a queue-to-bot cycle in ancestors
            const infinityNodeId = addInfinityNode(parentId, generation - 1, 0);
            
            // Link infinity node to parent
            newGraphData.links.push({
              source: infinityNodeId,
              target: parentId,
              value: 1
            });
            
            // Still add the link from parent to current node
            newGraphData.links.push({
              source: parentId,
              target: nodeId,
              value: 1
            });
            
            return; // Stop recursion for this branch to prevent cycles
          }
          
          processedPaths.add(pathKey);
          
          // Add link to graph (always add the direct link)
          newGraphData.links.push({
            source: parentId, 
            target: nodeId,
            value: 1
          });
          
          // Only recurse further for direct parents (no grandparents in ancestors)
          addAncestors(parentId, generation - 1, currentPath);
        });
      }
    };
    
    // Add descendants (outputs) to the graph recursively
    const addDescendants = (nodeId: string, generation: number, pathIds: string[] = []) => {
      // Stop if we're beyond the max right generation limit or the node is in the collapsed list
      if (collapsedState.collapsed.right.includes(nodeId)) {
        return;
      }
      
      // Get node data
      const nodeData = state.nodes?.[nodeId];
      if (!nodeData) return;
      
      // Check for cycles in the current path
      if (pathIds.includes(nodeId)) {
        // We have a cycle - Add an infinity node connected to the last valid node
        if (generation !== 0) { // Don't add infinity for primary node
          const lastValidNodeId = pathIds[pathIds.length - 1];
          const infinityNodeId = addInfinityNode(lastValidNodeId, generation + 1, 2);
          
          // Link last valid node to infinity
          newGraphData.links.push({
            source: lastValidNodeId,
            target: infinityNodeId,
            value: 1
          });
        }
        return;
      }
      
      // Track this node in our current path
      const currentPath = [...pathIds, nodeId];
      
      // Only add the node to the graph if it's not the primary node
      if (generation !== 0) {
        addNodeToGraph(nodeId, generation, 2); // Group 2 for descendants
      }
      
      // Track farthest generation for layout purposes
      maxRightGeneration = Math.max(maxRightGeneration, generation);
      
      // Add child nodes (outputs) - these are the right-side nodes
      if (nodeData.link_to?.children) {
        Object.keys(nodeData.link_to.children).forEach((childId) => {
          const childNodeData = state.nodes?.[childId];
          if (!childNodeData) return;
          
          // Check if this is a bot-to-queue link
          const isBotNode = nodeData.type?.includes('bot');
          const isChildQueue = childNodeData.type?.includes('queue');
          const isBotToQueueLink = isBotNode && isChildQueue;
          
          // Create a unique ID for this child if it's a queue with multiple bot parents
          let targetNodeId = childId;
          
          if (isBotToQueueLink) {
            // For bot->queue links, create alias nodes for each bot->queue relationship
            // This ensures each bot writes to its own instance of the queue
            const aliasId = `${childId}_from_${nodeId}`;
            
            // Create an alias node with the same properties as the original
            const aliasNode: Node = {
              id: aliasId,
              status: childNodeData.status || 'unknown',
              type: childNodeData.type || 'unknown',
              group: 2, // Output group
              generation: generation + 1,
              executions: childNodeData.stats?.executions,
              errors: childNodeData.stats?.errors,
              queues: childNodeData.queues
            };
            
            // Add the alias node to the graph
            newGraphData.nodes.push(aliasNode);
            
            // Use the alias ID as the target
            targetNodeId = aliasId;
          } else {
            // For non-bot-to-queue links, just add the node normally if not already in graph
            if (!nodesInGraph.has(childId)) {
              addNodeToGraph(childId, generation + 1, 2);
            }
          }
          
          // Add link to graph - from current node to target (original or alias)
          newGraphData.links.push({
            source: nodeId, 
            target: targetNodeId,
            value: 1
          });
          
          // Check for cycles in bot->queue->bot paths
          const pathKey = `${nodeId}->${childId}`;
          if (processedPaths.has(pathKey)) {
            // This path has been seen before, add infinity node
            const infinityNodeId = addInfinityNode(targetNodeId, generation + 2, 2);
            
            // Link target to infinity
            newGraphData.links.push({
              source: targetNodeId,
              target: infinityNodeId,
              value: 1
            });
            
            return; // Stop recursion for this branch
          }
          
          processedPaths.add(pathKey);
          
          // Recursively add descendants with incremented generation, using the target ID
          // This handles both original nodes and alias nodes correctly
          addDescendants(targetNodeId, generation + 1, currentPath);
        });
      }
    };
    
    // Start building the graph from the primary node
    if (state.nodes && primaryNode && state.nodes[primaryNode]) {
      // Always add the primary (focus) node first
      addNodeToGraph(primaryNode, 0, 1);
      
      // Add ancestors (inputs) at generation -1
      addAncestors(primaryNode, 0, []);
      
      // Add descendants (outputs) at generation 1
      addDescendants(primaryNode, 0, []);
      
      // Calculate positions and update graph data
      calculateNodePositions(newGraphData);
      
      // Update state and notify parent
      console.log('Generated graph with', newGraphData.nodes.length, 'nodes and', newGraphData.links.length, 'links', newGraphData);
      setGraphData(newGraphData);
      onDataReady(newGraphData);
    }
  }, [primaryNode, state.nodes, timePeriod, collapsedState, onDataReady]);
  
  // Calculate node positions based on hierarchical layout
  const calculateNodePositions = useCallback((data: GraphData) => {
    if (!data.nodes.length) return;
    
    // Find min and max generations for layout
    let minGeneration = 0;
    let maxGeneration = 0;
    
    data.nodes.forEach(node => {
      if (node.generation !== undefined) {
        minGeneration = Math.min(minGeneration, node.generation);
        maxGeneration = Math.max(maxGeneration, node.generation);
      }
    });
    
    // Group nodes by generation for positioning
    const nodesByGeneration: Record<number, Node[]> = {};
    
    // Group nodes by generation
    data.nodes.forEach(node => {
      const generation = node.generation || 0;
      if (!nodesByGeneration[generation]) {
        nodesByGeneration[generation] = [];
      }
      nodesByGeneration[generation].push(node);
    });
    
    // Center point for the graph (we'll offset from center of SVG)
    const xCenter = window.innerWidth / 2;
    const yCenter = window.innerHeight / 2;
    
    // Horizontal spacing between generations
    const xSpacing = 200;
    
    // Process each generation
    for (let gen = minGeneration; gen <= maxGeneration; gen++) {
      const nodesInGeneration = nodesByGeneration[gen] || [];
      
      // Skip if no nodes in this generation
      if (nodesInGeneration.length === 0) continue;
      
      // Calculate vertical spacing
      const ySpacing = 100;
      
      // Position nodes in this generation
      positionNodesInGeneration(nodesInGeneration, gen, xSpacing, ySpacing, xCenter, yCenter);
    }
    
    // Apply fixed positions from previous layouts if available
    data.nodes.forEach(node => {
      if (fixedPositions[node.id]) {
        node.x = fixedPositions[node.id].x;
        node.y = fixedPositions[node.id].y;
      }
      
      // Store current positions for future use
      if (node.x !== undefined && node.y !== undefined) {
        fixedPositions[node.id] = { x: node.x, y: node.y };
      }
    });
  }, []);
  
  // Position nodes within a generation
  const positionNodesInGeneration = useCallback((
    nodes: Node[], 
    generation: number, 
    xSpacing: number, 
    ySpacing: number,
    xCenter: number,
    yCenter: number
  ) => {
    // Set X position based on generation (horizontal layout)
    const xPos = (generation * xSpacing) + xCenter;
    
    // Total height required for all nodes
    const totalHeight = (nodes.length - 1) * ySpacing;
    
    // Starting Y position (center the group vertically)
    const startY = yCenter - (totalHeight / 2);
    
    // Sort nodes to ensure consistent positioning
    nodes.sort((a, b) => (a.id > b.id ? 1 : -1));
    
    // Position each node in the generation
    nodes.forEach((node, index) => {
      // For odd number of nodes, position middle node at y=0,
      // then alternate above and below
      let yPos;
      
      if (nodes.length % 2 === 1) {
        // Odd number of nodes
        const middle = Math.floor(nodes.length / 2);
        if (index === middle) {
          yPos = yCenter;
        } else if (index < middle) {
          yPos = yCenter - ((middle - index) * ySpacing);
        } else {
          yPos = yCenter + ((index - middle) * ySpacing);
        }
      } else {
        // Even number of nodes
        yPos = startY + (index * ySpacing);
      }
      
      // Set node position
      node.x = xPos;
      node.y = yPos;
    });
  }, []);
  
  return null; // This component doesn't render anything
} 