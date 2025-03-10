"use client";

import React from 'react';
import { AWSLambdaIcon } from '../icons/AWSLambdaIcon';
import { useAppContext } from '@/context/AppContext';

export interface NodeProps {
  type?: string;
  id?: string;
  status?: string;
  health?: {
    status?: string;
  };
  paused?: boolean;
  archived?: boolean;
  isAlarmed?: boolean;
  icon?: string;
  [key: string]: any;
}

interface NodeIconProps {
  node: NodeProps;
  size?: number;
  className?: string;
}

// Helper function to determine the image path for a node
export function getNodeImagePath(node: NodeProps): string {
  if (!node) return '';

  // Handle special cases
  if (node.type === 'add') {
    return '/images/icons/addNode.png';
  }

  const type = node.type?.toLowerCase() || 'bot';

  // If node has a custom icon, use it
  if (node.icon) {
    // If icon is a full URL, use it directly, otherwise prepend the base path
    return node.icon.match(/^https?:/) ? node.icon : `/images/${node.icon.indexOf('/') !== -1 ? '' : 'nodes/'}${node.icon}`;
  }

  // For system and queue nodes
  if (type === 'system' || type === 'queue') {
    return `/images/nodes/${type}${node.archived ? '-archived' : ''}.png`;
  }

  // For bot nodes (including lambda)
  if (type === 'bot' || type === 'lambda') {
    // Handle danger status specially - either explicit danger status or alarmed running/paused bot
    if (node.status?.toLowerCase() === 'danger' || 
        (node.isAlarmed && (node.status?.toLowerCase() === 'running' || node.status?.toLowerCase() === 'paused'))) {
      const pausedSuffix = node.paused ? '-paused' : '';
      return `/images/nodes/bot-danger${pausedSuffix}.png`;
    }
    
    // Handle blocked/rogue status
    if (node.status?.toLowerCase() === 'blocked' || node.status?.toLowerCase() === 'rogue') {
      const pausedSuffix = node.paused ? '-paused' : '';
      return `/images/nodes/bot-${node.status.toLowerCase()}${pausedSuffix}.png`;
    }
    
    // Handle other statuses
    const status = (!node.status || node.status?.toLowerCase() === 'running' || node.status?.toLowerCase() === 'idle' || node.status?.toLowerCase() === 'active') ? '' : `-${node.status?.toLowerCase()}`;
    const pausedSuffix = node.paused && (node.status?.toLowerCase() !== 'paused') ? '-paused' : '';
    const filename = `${type}${status}${pausedSuffix}.png`.replace('-archived-paused', '-archived');
    return `/images/nodes/${filename}`;
  }

  // Default fallback
  return `/images/nodes/bot.png`;
}

// This function generates an SVG string representation of a node icon
// to be used in the workflow graph renderer
export function getNodeImagesSvgString(node: NodeProps, nodes?: any, baseUrl: string = ''): string {
  if (!node) return '';
  
  // Get the image path for the node
  let imgPath = getNodeImagePath(node);
  
  // Add baseUrl if the path is relative and baseUrl is provided
  if (!imgPath.match(/^https?:/) && baseUrl) {
    imgPath = baseUrl + imgPath;
  }
  
  // Add origin for relative paths when in browser
  if (!imgPath.match(/^https?:/) && typeof window !== 'undefined') {
    imgPath = `${window.location.origin}${imgPath}`;
  }
  
  // Create an SVG with the image with proper centering and scaling
  return `<image href="${imgPath}" width="90%" height="90%" x="5%" y="5%" preserveAspectRatio="xMidYMid meet" />`;
}

export default function NodeIcon({ node, size = 32, className = '' }: NodeIconProps) {
  if (!node) return null;
  
  const { state } = useAppContext();
  
  const type = node.type?.toLowerCase() || 'unknown';
  const status = node.status?.toLowerCase() || 'unknown';
  const healthStatus = node.health?.status?.toLowerCase() || 'unknown';
  
  // Determine if the node is alarmed - from the node prop or from the state
  const isAlarmed = node.isAlarmed || (node.id && state.nodes?.[node.id]?.isAlarmed);
  
  // If this is a bot, use the ShapedNodeIcon component for consistent rendering
  if (type === 'bot') {
    // Use dynamic import to avoid circular dependency
    const ShapedNodeIcon = require('./ShapedNodeIcon').default;
    return (
      <ShapedNodeIcon
        node={{...node, isAlarmed}}
        size={size}
        className={className}
        withBackground={true}
        primaryNode={false}
      />
    );
  }
  
  // For non-bot nodes, use the regular icon
  const imagePath = getNodeImagePath({ ...node, isAlarmed });
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div className="w-full h-full overflow-hidden rounded">
        <img 
          src={imagePath} 
          alt={`${type} icon`} 
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = `/images/nodes/bot.png`;
          }}
        />
      </div>
    </div>
  );
} 