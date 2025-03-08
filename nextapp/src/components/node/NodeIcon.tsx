"use client";

import React from 'react';
import { AWSLambdaIcon } from '../icons/AWSLambdaIcon';

interface NodeProps {
  type?: string;
  status?: string;
  health?: {
    status?: string;
  };
  paused?: boolean;
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
  
  if (node.type === 'infinite') {
    return '/images/icons/infinite.png';
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
    const status = (!node.status || node.status?.toLowerCase() === 'running') ? '' : `-${node.status?.toLowerCase()}`;
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
  
  // Create an SVG with the image
  return `<image href="${imgPath}" width="100%" height="100%" />`;
}

export default function NodeIcon({ node, size = 32, className = '' }: NodeIconProps) {
  if (!node) return null;
  
  const type = node.type?.toLowerCase() || 'unknown';
  const status = node.status?.toLowerCase() || 'unknown';
  const healthStatus = node.health?.status?.toLowerCase() || 'unknown';
  
  // Determine the status indicator color
  const getStatusColor = () => {
    if (status === 'paused' || status === 'stopped') {
      return 'bg-yellow-500';
    } else if (status === 'error' || healthStatus === 'error') {
      return 'bg-red-500';
    } else if (status === 'running' || healthStatus === 'healthy') {
      return 'bg-green-500';
    } else if (healthStatus === 'warning') {
      return 'bg-yellow-500';
    }
    return 'bg-gray-500';
  };
  
  // Get the image path for the node
  const imagePath = getNodeImagePath(node);
  
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