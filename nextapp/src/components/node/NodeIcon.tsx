"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';

interface NodeIconProps {
  node: string | { 
    id?: string;
    type?: string;
    status?: string;
    paused?: boolean;
    archived?: boolean;
    icon?: string;
    templateId?: string;
  };
  size?: string | number;
  width?: string | number;
  height?: string | number;
  className?: string;
  overwrites?: {
    paused?: boolean;
    [key: string]: any;
  };
}

/**
 * Get the image URLs for a node
 */
function getNodeImages(
  node: NodeIconProps['node'], 
  nodes: Record<string, any>,
  baseUrl: string,
  overwrites?: NodeIconProps['overwrites']
): string[] {
  if (node == null) {
    return [''];
  }

  // Handle special node types
  if (node === 'add') {
    node = { type: 'add' };
  }

  if (node === 'infinite') {
    node = { type: 'infinite' };
  }

  // Convert node ID to node object if string is provided
  let nodeObj: any = typeof node === 'string' ? nodes[node] || {} : node;

  // Apply overwrites if provided
  if (overwrites) {
    nodeObj = { ...nodeObj, ...overwrites };
    
    // Handle status changes based on paused override
    if (overwrites.paused === true && nodeObj.status === 'active') {
      nodeObj.status = 'paused';
    } else if (overwrites.paused === false && nodeObj.status === 'paused') {
      nodeObj.status = 'active';
    }
  }
  
  switch(nodeObj.type) {
    case 'add':
      return [`${baseUrl}/images/nodes/addNode.png`];
    
    case 'infinite':
      return [`${baseUrl}/images/nodes/infinite.png`];
    
    case 'system':
    case 'queue':
      const icon = nodeObj.icon || `${nodeObj.type}${nodeObj.archived ? '-archived' : ''}.png`;
      return [icon.startsWith('http') ? icon : `${baseUrl}/images/nodes/${icon}`];
    
    case 'icon':
      return [nodeObj.icon || ''];
    
    default:
    case 'bot':
      // Optional template icon based on templateId (commented out in original)
      let templateIcon = '';

      // Main icon based on node status
      const statusSuffix = !nodeObj.status || nodeObj.status === 'active' || nodeObj.status === 'idle'
        ? '' 
        : (nodeObj.status === 'inactive' ? '-archived' : `-${nodeObj.status}`);

      
      const pausedSuffix = nodeObj.paused && nodeObj.status !== 'paused' 
        ? '-paused' 
        : '';
      
      const mainIcon = nodeObj.icon || 
        `${nodeObj.type || 'bot'}${statusSuffix}${pausedSuffix}.png`.replace('-archived-paused', '-archived');
      
      const mainIconUrl = mainIcon.startsWith('http') 
        ? mainIcon 
        : `${baseUrl}/images/nodes/${mainIcon}`;
      
      return [
        mainIconUrl,
        nodeObj.paused ? '' : '',  // Paused overlay image (if needed)
        templateIcon || ''         // Template icon (if needed)
      ];
  }
}

/**
 * NodeIcon component displays an SVG icon for different node types
 */
export default function NodeIcon({ 
  node, 
  size = '32px', 
  width, 
  height, 
  className = '',
  overwrites 
}: NodeIconProps) {
  const { state } = useAppContext();
  
  // Determine the base URL for assets
  const baseUrl = useMemo(() => {
    // For client-side rendering, use the window location
    if (typeof window !== 'undefined') {
      // Extract the origin (protocol + hostname + port)
      return window.location.origin;
    }
    
    // For server-side rendering, use the environment variable or a default
    return process.env.NEXT_PUBLIC_BASE_URL || '';
  }, []);
  
  // Get the image URLs for this node
  const imageUrls = getNodeImages(node, state.nodes, baseUrl, overwrites);
  
  // Calculate final dimensions
  const finalWidth = width || size;
  const finalHeight = height || size;
  
  return (
    <svg 
      className={className} 
      width={finalWidth} 
      height={finalHeight}
      data-testid="node-icon"
    >
      <image 
        xlinkHref={imageUrls[0]} 
        width="100%" 
        height="100%"
      />
      
      {imageUrls[1] && (
        <image 
          xlinkHref={imageUrls[1]} 
          width="33%" 
          height="33%"
        />
      )}
      
      {imageUrls[2] && (
        <image 
          xlinkHref={imageUrls[2]} 
          x="66%" 
          y="66%" 
          width="33%" 
          height="33%"
        />
      )}
    </svg>
  );
}

/**
 * Get SVG markup string for node images (for use in D3 or other contexts)
 */
export function getNodeImagesSvgString(
  node: NodeIconProps['node'], 
  nodes: Record<string, any>,
  baseUrl: string,
  overwrites?: NodeIconProps['overwrites']
): string {
  const images = getNodeImages(node, nodes, baseUrl, overwrites);
  
  return `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[0]}" width="100%" height="100%"></image>`
    + (images[1] ? `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[1]}" width="33%" height="33%"></image>` : '')
    + (images[2] ? `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[2]}" x="66%" y="66%" width="33%" height="33%"></image>` : '');
} 