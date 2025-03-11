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
  
  // Add constants for node limits
  const NODE_COUNT_LIMIT = 125; // Maximum number of nodes before auto-collapsing
  
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
    
    // Track nodes we've seen in different branches
    const visited = new Set<string>();
    
    // Track cycle nodes that we've already processed for "one more generation"
    const processedCycleNodes = new Set<string>();
    
    // Track total node count to enforce limits
    let totalNodeCount = 0;
    
    // Clone collapsed state to modify it if needed
    const effectiveCollapsedState = {
      collapsed: {
        left: [...collapsedState.collapsed.left],
        right: [...collapsedState.collapsed.right]
      },
      expanded: {
        left: [...collapsedState.expanded.left],
        right: [...collapsedState.expanded.right]
      }
    };
    
    // Maximum depth for traversal as a safety measure
    const MAX_DEPTH = 20;
    
    // Modified addNodeToGraph to track node count
    const addNodeToGraph = (nodeId: string, generation: number, group: number, branchId: string) => {
      const nodeData = state.nodes?.[nodeId];
      if (!nodeData) return null;
      
      // Skip archived nodes
      if (nodeData.status === 'archived' || nodeData.archived) {
        return null;
      }
      
      // Create a unique ID for this node within its branch
      const uniqueNodeId = `${branchId}:${nodeId}`;
      
      // Skip if we've already added this exact node instance
      if (visited.has(uniqueNodeId)) return uniqueNodeId;
      
      // Check if we're approaching node limit
      if (totalNodeCount >= NODE_COUNT_LIMIT) {
        // Auto-collapse this node if it's not the primary node
        if (generation !== 0) {
          if (generation < 0) {
            // This is an ancestor (left side)
            if (!effectiveCollapsedState.collapsed.left.includes(nodeId)) {
              effectiveCollapsedState.collapsed.left.push(nodeId);
              
              // Remove from expanded if present
              const expandedIndex = effectiveCollapsedState.expanded.left.indexOf(nodeId);
              if (expandedIndex !== -1) {
                effectiveCollapsedState.expanded.left.splice(expandedIndex, 1);
              }
              
              console.log(`Auto-collapsed ancestor node ${nodeId} due to node limit`);
            }
          } else {
            // This is a descendant (right side)
            if (!effectiveCollapsedState.collapsed.right.includes(nodeId)) {
              effectiveCollapsedState.collapsed.right.push(nodeId);
              
              // Remove from expanded if present
              const expandedIndex = effectiveCollapsedState.expanded.right.indexOf(nodeId);
              if (expandedIndex !== -1) {
                effectiveCollapsedState.expanded.right.splice(expandedIndex, 1);
              }
              
              console.log(`Auto-collapsed descendant node ${nodeId} due to node limit`);
            }
          }
          
          // Still add this node, but don't explore its connections
          visited.add(uniqueNodeId);
          totalNodeCount++;
          
          // Create node object with all necessary properties
          const node: Node = {
            id: uniqueNodeId,
            originalId: nodeId, // Store the original ID for reference
            status: nodeData.status || 'unknown',
            type: nodeData.type || 'unknown',
            group: group, // 0 = input, 1 = focus, 2 = output
            generation: generation,
            // Get executions and errors data from either stats object or direct properties
            executions: nodeData.stats?.executions || nodeData.executions || 0,
            errors: nodeData.stats?.errors || nodeData.errors || 0,
            queues: nodeData.queues,
            link_to: nodeData.link_to,
            isAutoCollapsed: true // Add a flag to indicate this node was auto-collapsed
          };
          
          // Debug log for stats data source
          if (nodeData.type === 'bot') {
            console.log(`Node stats for ${nodeId}: executions=${node.executions} (from ${nodeData.stats?.executions !== undefined ? 'stats' : nodeData.executions !== undefined ? 'direct' : 'default'}), errors=${node.errors} (from ${nodeData.stats?.errors !== undefined ? 'stats' : nodeData.errors !== undefined ? 'direct' : 'default'})`);
          }
          
          // Add node to graph
          newGraphData.nodes.push(node);
          
          return uniqueNodeId;
        }
      }
      
      visited.add(uniqueNodeId);
      totalNodeCount++;
      
      // Create node object with all necessary properties
      const node: Node = {
        id: uniqueNodeId,
        originalId: nodeId, // Store the original ID for reference
        status: nodeData.status || 'unknown',
        type: nodeData.type || 'unknown',
        group: group, // 0 = input, 1 = focus, 2 = output
        generation: generation,
        // Get executions and errors data from either stats object or direct properties
        executions: nodeData.stats?.executions || nodeData.executions || 0,
        errors: nodeData.stats?.errors || nodeData.errors || 0,
        queues: nodeData.queues,
        link_to: nodeData.link_to
      };
      
      // Debug log for stats data source
      if (nodeData.type === 'bot') {
        console.log(`Node stats for ${nodeId}: executions=${node.executions} (from ${nodeData.stats?.executions !== undefined ? 'stats' : nodeData.executions !== undefined ? 'direct' : 'default'}), errors=${node.errors} (from ${nodeData.stats?.errors !== undefined ? 'stats' : nodeData.errors !== undefined ? 'direct' : 'default'})`);
      }
      
      // Add node to graph
      newGraphData.nodes.push(node);
      
      return uniqueNodeId;
    };
    
    // Add an infinity node to represent a cycle terminator
    const addInfinityNode = (parentNodeId: string, sourceNodeId: string, generation: number, branchId: string) => {
      // Create a unique ID for this infinity node
      const infinityNodeId = `${branchId}:infinity:${sourceNodeId}`;
      
      // Skip if we've already added this infinity node
      if (visited.has(infinityNodeId)) return infinityNodeId;
      visited.add(infinityNodeId);
      
      // Create infinity node
      const infinityNode: Node = {
        id: infinityNodeId,
        originalId: `infinity:${sourceNodeId}`,
        status: 'cycle',
        type: 'infinity',
        group: 2, // output group
        generation: generation + 1,
      };
      
      // Add infinity node to graph
      newGraphData.nodes.push(infinityNode);
      
      // Add link from parent to infinity node (with dashed line indicator)
      newGraphData.links.push({
        source: parentNodeId,
        target: infinityNodeId,
        value: 1,
        relationType: 'cycle',
        
      });
      
      console.log(`Added infinity node ${infinityNodeId} for cycle detected at ${sourceNodeId}`);
      
      return infinityNodeId;
    };
    
    // Update the addAncestors function to properly define nodeData
    const addAncestors = (nodeId: string, generation: number, branchId: string, path: string[] = [], depth: number = 0) => {
      // Safety measures to prevent stack overflow
      if (depth > MAX_DEPTH) return;
      
      // Check if this node is in the effective collapsed state
      if (effectiveCollapsedState.collapsed.left.includes(nodeId)) return;
      
      // Get the current node data - add this line to ensure nodeData is defined
      const nodeData = state.nodes[nodeId];
      if (!nodeData) return;
      
      // Check for cycles in the current path
      if (path.includes(nodeId)) {
        console.log(`Cycle detected in ancestors path at node ${nodeId}, path: ${path.join(' -> ')}`);
        return;
      }
      
      // Create a new path with this node
      const newPath = [...path, nodeId];
      
      // Get node data - remove this duplicate check since we've added it above
      if (!nodeData || !nodeData.link_to?.parent) return;
      
      // Process each parent
      Object.keys(nodeData.link_to.parent).forEach(parentId => {
        const parentNode = state.nodes[parentId];
        if (!parentNode) return;
        
        // Skip archived nodes
        if (parentNode.status === 'archived' || parentNode.archived) {
          return;
        }
        
        // Create a unique branch ID for this parent
        const parentBranchId = `${branchId}:${parentId}`;
        
        // Add parent node to graph
        const parentNodeId = addNodeToGraph(parentId, generation - 1, 0, parentBranchId);
        
        if (parentNodeId) {
          // Create parent branch unique ID to check for cycles
          const parentBranchUniqueId = `${parentBranchId}:${nodeId}`;
          
          // Add link from parent to child
          const linkStats = {
            count: 0,
            last_time: '',
            lag: 0
          };

          // Now nodeData is properly in scope
          const relationType = 
            (parentNode.type === 'bot' && (nodeData.type === 'queue' || nodeData.type === 'system')) ? 'write' as const :
            ((parentNode.type === 'queue' || nodeData.type === 'system') && nodeData.type === 'bot' ) ? 'read' as const : 
            'default' as const;
          
          // For queue->bot connection (bot reading from queue)
          if (relationType === 'read' && nodeData.type === 'bot') {
            // For queue->bot, the data is in bot's link_to.parent[queueId].units
            if (nodeData.link_to?.parent && nodeData.link_to.parent[parentId] && 
                typeof nodeData.link_to.parent[parentId].units !== 'undefined') {
              linkStats.count = Number(nodeData.link_to.parent[parentId].units);
            }
            // Still use queue data for lag if available
            if (parentNode.link_to?.children && parentNode.link_to.children[nodeId] && 
                typeof parentNode.link_to.children[nodeId].last_read_lag !== 'undefined') {
              linkStats.lag = parentNode.link_to.children[nodeId].last_read_lag || 0;
            }
          }
          
          // For bot->queue connection (bot writing to queue)
          if (relationType === 'write' && parentNode.type === 'bot') {
            // For bot->queue, the data is in bot's link_to.children[queueId].units
            if (parentNode.link_to?.children && parentNode.link_to.children[nodeId] && 
                typeof parentNode.link_to.children[nodeId].units !== 'undefined') {
              linkStats.count = Number(parentNode.link_to.children[nodeId].units);
            }
            // Still use queue data for last_write time if available
            if (parentNode.link_to?.children && parentNode.link_to.children[nodeId] && 
                typeof parentNode.link_to.children[nodeId].last_write !== 'undefined') {
              linkStats.last_time = parentNode.link_to.children[nodeId].last_write || '';
            }
          }
          
          newGraphData.links.push({
            source: parentNodeId,
            target: `${branchId}:${nodeId}`,
            value: 1,
            relationType: relationType,
            stats: linkStats
          });
          
          // Check if parent exists in our current path (would create a cycle)
          const cycleDetected = newPath.includes(parentId);
          
          if (cycleDetected) {
            console.log(`Ancestor cycle detected: ${parentId} is already in the path: ${newPath.join(' -> ')}`);
            
            // Add "one more generation" for this cycle if not already processed
            if (!processedCycleNodes.has(parentBranchUniqueId)) {
              processedCycleNodes.add(parentBranchUniqueId);
              
              // Get the ancestors of this parent (which creates the cycle)
              if (parentNode.link_to?.parent) {
                Object.keys(parentNode.link_to.parent).forEach(grandparentId => {
                  if (state.nodes[grandparentId]) {
                    const gpBranchId = `${parentBranchId}:${grandparentId}`;
                    const gpNodeId = addNodeToGraph(grandparentId, generation - 2, 0, gpBranchId);
                    
                    if (gpNodeId) {
                      // Add link to parent
                      const cycleLinkStats = {
                        count: 0,
                        last_time: '',
                        lag: 0
                      };
                      
                      // Check for stats for this link
                      const gpNode = state.nodes[grandparentId];
                      const parentNode = state.nodes[parentId];
                      
                      if (gpNode && parentNode) {
                        if (gpNode.type === 'bot' && (parentNode.type === 'queue' || parentNode.type === 'system')) {
                          // Bot -> Queue relationship
                          if (gpNode.link_to?.children && gpNode.link_to.children[parentId] && 
                              typeof gpNode.link_to.children[parentId].units !== 'undefined') {
                            cycleLinkStats.count = Number(gpNode.link_to.children[parentId].units);
                          }
                        } else if ((gpNode.type === 'queue' || parentNode.type === 'system') && parentNode.type === 'bot') {
                          // Queue -> Bot relationship
                          if (parentNode.link_to?.parent && parentNode.link_to.parent[grandparentId] && 
                              typeof parentNode.link_to.parent[grandparentId].units !== 'undefined') {
                            cycleLinkStats.count = Number(parentNode.link_to.parent[grandparentId].units);
                          }
                        }
                      }
                      
                      newGraphData.links.push({
                        source: gpNodeId,
                        target: parentNodeId,
                        value: 1,
                        relationType: 'default',
                        stats: cycleLinkStats
                      });
                      
                      // Add infinity node as terminator
                      addInfinityNode(gpNodeId, parentId, generation - 2, gpBranchId);
                    }
                  }
                });
              }
            }
          } else {
            // Recursively add ancestors of this parent (unless it would create a cycle)
            addAncestors(parentId, generation - 1, parentBranchId, newPath, depth + 1);
          }
        }
      });
    };
    
    // Update the addDescendants function to properly define nodeData
    const addDescendants = (nodeId: string, generation: number, branchId: string, path: string[] = [], depth: number = 0) => {
      // Safety measures to prevent stack overflow
      if (depth > MAX_DEPTH) return;
      
      // Check if this node is in the effective collapsed state
      if (effectiveCollapsedState.collapsed.right.includes(nodeId)) return;
      
      // Get the current node data - add this line to ensure nodeData is defined
      const nodeData = state.nodes[nodeId];
      if (!nodeData) return;
      
      // Check for cycles in the current path
      if (path.includes(nodeId)) {
        console.log(`Cycle detected in descendants path at node ${nodeId}, path: ${path.join(' -> ')}`);
        return;
      }
      
      // Create a new path with this node
      const newPath = [...path, nodeId];
      
      // Get node data - remove this duplicate check since we've added it above
      if (!nodeData || !nodeData.link_to?.children) return;
      
      // Process each child
      Object.keys(nodeData.link_to.children).forEach(childId => {
        const childNode = state.nodes[childId];
        if (!childNode) return;
        
        // Skip archived nodes
        if (childNode.status === 'archived' || childNode.archived) {
          return;
        }
        
        // Create a unique branch ID for this child
        const childBranchId = `${branchId}:${childId}`;
        
        // Add child node to graph
        const childNodeId = addNodeToGraph(childId, generation + 1, 2, childBranchId);
        
        if (childNodeId) {
          // Create child branch unique ID to check for cycles
          const childBranchUniqueId = `${childBranchId}:${nodeId}`;
          
          // Add link from parent to child
          const linkStats = {
            count: 0,
            last_time: '',
            lag: 0
          };

          // Now nodeData is properly in scope
          const relationType = 
            (nodeData.type === 'bot' && childNode.type === 'queue') ? 'write' as const :
            (nodeData.type === 'queue' && childNode.type === 'bot') ? 'read' as const : 
            'default' as const;
          
          // For bot->queue connection (bot writing to queue)
          if (relationType === 'write' && nodeData.type === 'bot') {
            // For bot->queue, the data is in bot's link_to.children[queueId].units
            if (nodeData.link_to?.children && nodeData.link_to.children[childId] && 
                typeof nodeData.link_to.children[childId].units !== 'undefined') {
              linkStats.count = Number(nodeData.link_to.children[childId].units);
            }
            
            if (nodeData.link_to?.children && nodeData.link_to.children[childId] && 
              typeof nodeData.link_to.children[childId].last_write !== 'undefined') {
              linkStats.last_time = nodeData.link_to.children[childId].last_write || '';
            }
          }
          
          // For queue->bot connection (bot reading from queue)
          if (relationType === 'read' && childNode.type === 'bot') {
            // For queue->bot, the data is in bot's link_to.parent[queueId].units
            if (childNode.link_to?.parent && childNode.link_to.parent[nodeId] && 
                typeof childNode.link_to.parent[nodeId].units !== 'undefined') {
              linkStats.count = Number(childNode.link_to.parent[nodeId].units);
            }
            
            if (childNode.link_to?.parent && childNode.link_to.parent[nodeId] && 
              typeof childNode.link_to.parent[nodeId].last_write !== 'undefined') {
              linkStats.last_time = childNode.link_to.parent[nodeId].last_write || '';
            }
          }
          
          newGraphData.links.push({
            source: `${branchId}:${nodeId}`,
            target: childNodeId,
            value: 1,
            relationType,
            stats: linkStats
          });
          
          // Check if child exists in our current path (would create a cycle)
          const cycleDetected = newPath.includes(childId);
          
          if (cycleDetected) {
            console.log(`Descendant cycle detected: ${childId} is already in the path: ${newPath.join(' -> ')}`);
            
            // Add "one more generation" for this cycle if not already processed
            if (!processedCycleNodes.has(childBranchUniqueId)) {
              processedCycleNodes.add(childBranchUniqueId);
              
              // Get the descendants of this child (which creates the cycle)
              if (childNode.link_to?.children) {
                Object.keys(childNode.link_to.children).forEach(grandchildId => {
                  if (state.nodes[grandchildId]) {
                    const gcBranchId = `${childBranchId}:${grandchildId}`;
                    const gcNodeId = addNodeToGraph(grandchildId, generation + 2, 2, gcBranchId);
                    
                    if (gcNodeId) {
                      // Add link to child
                      const cycleLinkStats = {
                        count: 0,
                        last_time: '',
                        lag: 0
                      };
                      
                      // Check for stats for this link
                      const childNode = state.nodes[childId];
                      const gcNode = state.nodes[grandchildId];
                      
                      if (childNode && gcNode) {
                        if (childNode.type === 'bot' && gcNode.type === 'queue') {
                          // Bot -> Queue relationship
                          if (childNode.link_to?.children && childNode.link_to.children[grandchildId] && 
                              typeof childNode.link_to.children[grandchildId].units !== 'undefined') {
                            cycleLinkStats.count = Number(childNode.link_to.children[grandchildId].units);
                          }
                        } else if (childNode.type === 'queue' && gcNode.type === 'bot') {
                          // Queue -> Bot relationship
                          if (gcNode.link_to?.parent && gcNode.link_to.parent[childId] && 
                              typeof gcNode.link_to.parent[childId].units !== 'undefined') {
                            cycleLinkStats.count = Number(gcNode.link_to.parent[childId].units);
                          }
                        }
                      }
                      
                      newGraphData.links.push({
                        source: childNodeId,
                        target: gcNodeId,
                        value: 1,
                        relationType: 'default',
                        stats: cycleLinkStats
                      });
                      
                      // Add infinity node as terminator
                      addInfinityNode(gcNodeId, childId, generation + 2, gcBranchId);
                    }
                  }
                });
              }
            }
          } else {
            // Recursively add descendants of this child (unless it would create a cycle)
            addDescendants(childId, generation + 1, childBranchId, newPath, depth + 1);
          }
        }
      });
    };
    
    // Start building the graph from the primary node
    if (state.nodes && primaryNode && state.nodes[primaryNode]) {
      // Skip if primary node is archived
      if (state.nodes[primaryNode].status === 'archived' || state.nodes[primaryNode].archived) {
        console.log('Primary node is archived, not displaying graph');
        setGraphData(newGraphData);
        onDataReady(newGraphData);
        return;
      }
      
      // Always add the primary (focus) node first
      const rootBranchId = "branch0";
      const primaryNodeId = addNodeToGraph(primaryNode, 0, 1, rootBranchId);
      
      if (primaryNodeId) {
        // Add ancestors (inputs) at generation -1
        addAncestors(primaryNode, 0, rootBranchId, []);
        
        // Add descendants (outputs) at generation 1
        addDescendants(primaryNode, 0, rootBranchId, []);
        
        // Calculate positions and update graph data
        calculateNodePositions(newGraphData);
        
        // Update state and notify parent
        console.log('Generated graph with', newGraphData.nodes.length, 'nodes and', newGraphData.links.length, 'links', newGraphData);
        
        // Log if auto-collapsing was triggered
        if (totalNodeCount >= NODE_COUNT_LIMIT) {
          console.warn(`Graph exceeded node limit of ${NODE_COUNT_LIMIT}. Some nodes were automatically collapsed to prevent browser freezing.`);
        }
        
        setGraphData(newGraphData);
        onDataReady(newGraphData);
      }
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
    
    // STEP 1: Define constants for spacing and dimensions
    const NODE_RADIUS = 24;
    const MIN_NODE_SPACING = 130; // Vertical spacing between sibling nodes
    const GENERATION_SPACING = 220; // Horizontal spacing between generations
    
    // STEP 2: Build hierarchical tree structure with branch heights
    const nodeMap = new Map<string, {
      node: Node,
      children: string[],
      parents: string[],
      x: number,
      y: number,
      branchHeight: number, // Height of the branch starting from this node
    }>();
    
    // Initialize nodeMap with all nodes
    data.nodes.forEach(node => {
      nodeMap.set(node.id, {
        node,
        children: [],
        parents: [],
        x: 0,
        y: 0,
        branchHeight: 1, // Initially, each node has a branch height of 1 (itself)
      });
    });
    
    // Populate parent-child relationships from links
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);
      
      if (sourceNode && targetNode) {
        const sourceGen = sourceNode.node.generation || 0;
        const targetGen = targetNode.node.generation || 0;
        
        // Determine direction based on generation
        if (sourceGen < targetGen) {
          // Source is parent of target
          sourceNode.children.push(targetId);
          targetNode.parents.push(sourceId);
        } else if (targetGen < sourceGen) {
          // Target is parent of source
          targetNode.children.push(sourceId);
          sourceNode.parents.push(targetId);
        }
      }
    });
    
    // FIRST PASS: Calculate branch heights from leaf nodes to roots
    // Start from the maximum generation (leaf nodes) and work backwards
    
    // Process positive generations (descendants) first
    for (let gen = maxGeneration; gen > 0; gen--) {
      if (!nodesByGeneration[gen]) continue;
      
      const currentGenNodes = nodesByGeneration[gen];
      
      // For each node in this generation
      currentGenNodes.forEach(node => {
        const nodeInfo = nodeMap.get(node.id);
        if (!nodeInfo) return;
        
        // For leaf nodes, branch height is 1 (already set)
        // For non-leaf nodes, branch height is the sum of children's branch heights
        if (nodeInfo.children.length === 0) {
          nodeInfo.branchHeight = 1;
        } else {
          let totalChildBranchHeight = 0;
          nodeInfo.children.forEach(childId => {
            const childInfo = nodeMap.get(childId);
            if (childInfo && childInfo.node.generation! > nodeInfo.node.generation!) {
              totalChildBranchHeight += childInfo.branchHeight;
            }
          });
          // If no forward children found, set minimum height of 1
          nodeInfo.branchHeight = Math.max(1, totalChildBranchHeight);
        }
      });
    }
    
    // Process negative generations (ancestors) next, also from furthest to closest
    for (let gen = minGeneration; gen < 0; gen++) {
      if (!nodesByGeneration[gen]) continue;
      
      const currentGenNodes = nodesByGeneration[gen];
      
      // For each node in this generation
      currentGenNodes.forEach(node => {
        const nodeInfo = nodeMap.get(node.id);
        if (!nodeInfo) return;
        
        // For leaf nodes, branch height is 1 (already set)
        // For non-leaf nodes, branch height is the sum of children's branch heights
        if (nodeInfo.children.length === 0) {
          nodeInfo.branchHeight = 1;
        } else {
          let totalParentBranchHeight = 0;
          nodeInfo.parents.forEach(parentId => {
            const parentInfo = nodeMap.get(parentId);
            if (parentInfo && parentInfo.node.generation! < nodeInfo.node.generation!) {
              totalParentBranchHeight += parentInfo.branchHeight;
            }
          });
          // If no forward children found, set minimum height of 1
          nodeInfo.branchHeight = Math.max(1, totalParentBranchHeight);
        }
      });
    }
    
    // Process generation 0 nodes last, considering both ancestors and descendants
    if (nodesByGeneration[0]) {
      nodesByGeneration[0].forEach(node => {
        const nodeInfo = nodeMap.get(node.id);
        if (!nodeInfo) return;
        
        let totalBranchHeight = 0;
        
        // Add up branch heights of descendants (positive generation)
        nodeInfo.children.forEach(childId => {
          const childInfo = nodeMap.get(childId);
          if (childInfo && childInfo.node.generation! > 0) {
            totalBranchHeight += childInfo.branchHeight;
          }
        });
        
        // Add up branch heights of ancestors (negative generation)
        nodeInfo.parents.forEach(parentId => {
          const parentInfo = nodeMap.get(parentId);
          if (parentInfo && parentInfo.node.generation! < 0) {
            totalBranchHeight += parentInfo.branchHeight;
          }
        });
        
        // If no children/parents found, set minimum height of 1
        nodeInfo.branchHeight = Math.max(1, totalBranchHeight);
      });
    }
    
    // SECOND PASS: Position nodes using branch heights for spacing
    
    // Set horizontal positions based on generation
    for (let gen = minGeneration; gen <= maxGeneration; gen++) {
      if (!nodesByGeneration[gen]) continue;
      
      nodesByGeneration[gen].forEach(node => {
        // Calculate x position based on generation
        node.x = xCenter + (gen * GENERATION_SPACING);
      });
    }
    
    // First, position generation 0 nodes (usually just one focus node)
    if (nodesByGeneration[0]) {
      const gen0Nodes = nodesByGeneration[0];
      
      let yOffset = yCenter - (gen0Nodes.length * MIN_NODE_SPACING) / 2;
      gen0Nodes.forEach(node => {
        const nodeInfo = nodeMap.get(node.id);
        if (nodeInfo) {
          node.y = yOffset;
          // Add the node's branch height to the offset for the next node
          yOffset += nodeInfo.branchHeight * MIN_NODE_SPACING;
        }
      });
    }
    
    // Position negative generations (ancestors)
    for (let gen = -1; gen >= minGeneration; gen--) {
      if (!nodesByGeneration[gen]) continue;
      
      const currentGenNodes = nodesByGeneration[gen];
      
      // Group nodes by their children
      const nodesByChildren = new Map<string, Node[]>();
      
      currentGenNodes.forEach(node => {
        const nodeInfo = nodeMap.get(node.id);
        if (!nodeInfo) return;
        
        // Find children in the next generation
        const childrenInNextGen = nodeInfo.children.filter(childId => {
          const childInfo = nodeMap.get(childId);
          return childInfo && childInfo.node.generation === gen + 1;
        });
        
        if (childrenInNextGen.length > 0) {
          // Use the first child as a grouping key
          const primaryChildId = childrenInNextGen[0];
          if (!nodesByChildren.has(primaryChildId)) {
            nodesByChildren.set(primaryChildId, []);
          }
          nodesByChildren.get(primaryChildId)!.push(node);
        } else {
          // Node has no children in next gen, treat it as an independent group
          nodesByChildren.set(`orphan_${node.id}`, [node]);
        }
      });
      
      // Position nodes based on their relationships
      const sortedChildGroups = Array.from(nodesByChildren.entries())
        .sort((a, b) => {
          const aChildId = a[0].startsWith('orphan_') ? a[0].substring(7) : a[0];
          const bChildId = b[0].startsWith('orphan_') ? b[0].substring(7) : b[0];
          
          const aChildInfo = nodeMap.get(aChildId);
          const bChildInfo = nodeMap.get(bChildId);
          
          if (!aChildInfo || !bChildInfo) return 0;
          return aChildInfo.node.y! - bChildInfo.node.y!;
        });
      
      // Now position the parents
      sortedChildGroups.forEach(([childId, parentNodes]) => {
        // Sort parents for consistent ordering
        parentNodes.sort((a, b) => a.id.localeCompare(b.id));
        
        if (!childId.startsWith('orphan_')) {
          const childInfo = nodeMap.get(childId);
          if (childInfo) {
            // If only one parent, align directly with child
            if (parentNodes.length === 1) {
              parentNodes[0].y = childInfo.node.y!;
            } 
            // If multiple parents, distribute based on branch heights
            else {
              // Calculate total branch height needed
              let totalBranchHeight = 0;
              parentNodes.forEach(parentNode => {
                const parentInfo = nodeMap.get(parentNode.id);
                if (parentInfo) {
                  totalBranchHeight += parentInfo.branchHeight;
                }
              });
              
              // Calculate starting Y position to center around the child
              let startY = childInfo.node.y! - (totalBranchHeight * MIN_NODE_SPACING) / 2;
              
              // Position each parent
              parentNodes.forEach(parentNode => {
                const parentInfo = nodeMap.get(parentNode.id);
                if (parentInfo) {
                  parentNode.y = startY + (parentInfo.branchHeight * MIN_NODE_SPACING) / 2;
                  startY += parentInfo.branchHeight * MIN_NODE_SPACING;
                }
              });
            }
          }
        } else {
          // For orphan nodes, place them with enough spacing
          let currentY = yCenter - (parentNodes.length * MIN_NODE_SPACING) / 2;
          parentNodes.forEach(parentNode => {
            const parentInfo = nodeMap.get(parentNode.id);
            if (parentInfo) {
              parentNode.y = currentY;
              currentY += parentInfo.branchHeight * MIN_NODE_SPACING;
            }
          });
        }
      });
    }
    
    // Position positive generations (descendants)
    for (let gen = 1; gen <= maxGeneration; gen++) {
      if (!nodesByGeneration[gen]) continue;
      
      const currentGenNodes = nodesByGeneration[gen];
      
      // Group nodes by their parents
      const nodesByParents = new Map<string, Node[]>();
      
      currentGenNodes.forEach(node => {
        const nodeInfo = nodeMap.get(node.id);
        if (!nodeInfo) return;
        
        // Find parents in the previous generation
        const parentsInPrevGen = nodeInfo.parents.filter(parentId => {
          const parentInfo = nodeMap.get(parentId);
          return parentInfo && parentInfo.node.generation === gen - 1;
        });
        
        if (parentsInPrevGen.length > 0) {
          // Use the first parent as a grouping key
          const primaryParentId = parentsInPrevGen[0];
          if (!nodesByParents.has(primaryParentId)) {
            nodesByParents.set(primaryParentId, []);
          }
          nodesByParents.get(primaryParentId)!.push(node);
        } else {
          // Node has no parents in prev gen, treat it as an independent group
          nodesByParents.set(`orphan_${node.id}`, [node]);
        }
      });
      
      // Position nodes based on their relationships
      const sortedParentGroups = Array.from(nodesByParents.entries())
        .sort((a, b) => {
          const aParentId = a[0].startsWith('orphan_') ? a[0].substring(7) : a[0];
          const bParentId = b[0].startsWith('orphan_') ? b[0].substring(7) : b[0];
          
          const aParentInfo = nodeMap.get(aParentId);
          const bParentInfo = nodeMap.get(bParentId);
          
          if (!aParentInfo || !bParentInfo) return 0;
          return aParentInfo.node.y! - bParentInfo.node.y!;
        });
      
      // Now position the children
      sortedParentGroups.forEach(([parentId, childNodes]) => {
        // Sort children for consistent ordering
        childNodes.sort((a, b) => a.id.localeCompare(b.id));
        
        if (!parentId.startsWith('orphan_')) {
          const parentInfo = nodeMap.get(parentId);
          if (parentInfo) {
            // If only one child, align directly with parent
            if (childNodes.length === 1) {
              childNodes[0].y = parentInfo.node.y!;
            } 
            // If multiple children, distribute based on branch heights
            else {
              // Calculate total branch height needed
              let totalBranchHeight = 0;
              childNodes.forEach(childNode => {
                const childInfo = nodeMap.get(childNode.id);
                if (childInfo) {
                  totalBranchHeight += childInfo.branchHeight;
                }
              });
              
              // Calculate starting Y position to center around the parent
              let startY = parentInfo.node.y! - (totalBranchHeight * MIN_NODE_SPACING) / 2;
              
              // Position each child
              childNodes.forEach(childNode => {
                const childInfo = nodeMap.get(childNode.id);
                if (childInfo) {
                  childNode.y = startY + (childInfo.branchHeight * MIN_NODE_SPACING) / 2;
                  startY += childInfo.branchHeight * MIN_NODE_SPACING;
                }
              });
            }
          }
        } else {
          // For orphan nodes, place them with enough spacing
          let currentY = yCenter - (childNodes.length * MIN_NODE_SPACING) / 2;
          childNodes.forEach(childNode => {
            const childInfo = nodeMap.get(childNode.id);
            if (childInfo) {
              childNode.y = currentY;
              currentY += childInfo.branchHeight * MIN_NODE_SPACING;
            }
          });
        }
      });
    }
    
    // FINAL STEP: Normalize vertical positions to center the graph
    // Find the min and max Y values
    let minY = Infinity;
    let maxY = -Infinity;
    
    data.nodes.forEach(node => {
      if (node.y !== undefined) {
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      }
    });
    
    // Calculate the vertical offset to center the graph
    const heightRange = maxY - minY;
    const verticalOffset = 100 - minY; // Start with a padding of 100px from the top
    
    // Apply the offset to center the graph vertically
    data.nodes.forEach(node => {
      if (node.y !== undefined) {
        node.y += verticalOffset;
      }
    });
    
    // Horizontal spacing between generations
    const xSpacing = GENERATION_SPACING;
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