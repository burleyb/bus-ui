"use client";

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { getNodeImagePath, NodeProps } from './NodeIcon';
import { getShapePath, getNodeVisualProperties } from '@/utils/workflowUtils';

interface ShapedNodeIconProps {
  node: NodeProps;
  size?: number;
  className?: string;
  withBackground?: boolean;
  primaryNode?: boolean;
}

/**
 * Component to display a node with its correct shape and icon
 * This ensures consistency across all uses of node icons in the UI
 */
export default function ShapedNodeIcon({ 
  node, 
  size = 32, 
  className = '', 
  withBackground = true,
  primaryNode = false
}: ShapedNodeIconProps) {
  if (!node) return null;
  
  const { state } = useAppContext();
  
  const type = node.type?.toLowerCase() || 'unknown';
  const status = node.status?.toLowerCase() || 'unknown';
  
  // Debugging for system nodes with icons
  if (type === 'system' && node.icon) {
    console.log('ShapedNodeIcon rendering system node:', {
      id: node.id,
      icon: node.icon,
      isUrlIcon: node.icon.startsWith('http://') || node.icon.startsWith('https://')
    });
  }
  
  // Determine if the node is alarmed
  const isAlarmed = node.isAlarmed || (node.id && state.nodes?.[node.id]?.isAlarmed);
  
  // Get the node's visual properties
  const { shape, fillColor, showStroke, strokeColor } = getNodeVisualProperties(
    type,
    status,
    isAlarmed,
    node.archived,
    primaryNode,
    true,
    node.icon
  );
  
  // Set radius and adjust for shape
  let radius = size / 2;
  if (shape === 'triangle' || shape === 'diamond') {
    radius *= 1.15; // 15% larger for triangle and diamond
  }
  
  // Get the icon image path
  const imagePath = getNodeImagePath({ ...node, isAlarmed });
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`-${radius} -${radius} ${radius * 2} ${radius * 2}`}>
        {/* Shape */}
        <path 
          d={getShapePath(shape, radius)}
          fill={!withBackground ? fillColor : 'none'}
          stroke={showStroke && !withBackground ? strokeColor : 'none'}
          strokeWidth={showStroke ? 2 : 0}
        />
        
        {/* Background for icon that matches the shape */}
        {withBackground && (
          <path 
            d={getShapePath(shape, radius * 0.9)}
            fill="#ffffff"
            stroke="none"
            strokeWidth={0}
          />
        )}
        
        {/* Icon image */}
        <image 
          href={imagePath}
          width={radius * 1.6}
          height={radius * 1.6}
          x={-radius * 0.8}
          y={-radius * 0.8}
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    </div>
  );
} 