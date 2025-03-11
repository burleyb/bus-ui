import { formatDistanceToNow } from 'date-fns';
import { Node, Link, GraphData, CollapsedState, NodePosition } from '@/types/workflow';

// Store node positions across renders
export const fixedPositions: Record<string, NodePosition> = {};

/**
 * Format a timestamp as a relative time (e.g., "2 minutes ago")
 */
export function formatTimeAgo(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'unknown time ago';
  }
}

/**
 * Utility function for debouncing function calls
 */
export function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<F>) {
    const context = this;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Parse URL hash and extract workflow state
 */
export function parseUrlHash(): {
  selected?: string[],
  view?: string,
  timePeriod?: any,
  offset?: number[],
  node?: string,
  zoom?: number,
  stats?: boolean,
  collapsed?: { left: string[], right: string[] },
  expanded?: { left: string[], right: string[] }
} {
  try {
    if (typeof window === 'undefined' || !window.location.hash || window.location.hash.length <= 1) {
      return {};
    }
    
    // Remove the '#' character from the hash
    let hashStr = window.location.hash.substring(1);
    
    // Decode the URL-encoded hash
    try {
      hashStr = decodeURIComponent(hashStr);
    } catch (decodeError) {
      console.error('Error decoding hash:', decodeError);
      return {}; // If we can't decode, return empty object
    }
    
    // Validate that the hash is a proper JSON string
    if (hashStr && hashStr.trim().startsWith('{') && hashStr.trim().endsWith('}')) {
      // Parse the JSON
      return JSON.parse(hashStr);
    }
    
    return {};
  } catch (error) {
    console.error('Error parsing hash:', error);
    return {};
  }
}

/**
 * Update URL hash with new parameters
 */
export function updateUrlHash(newParams: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('updateUrlHash called with:', newParams);
    
    // Get current parameters
    const currentParams = parseUrlHash();
    console.log('Current URL hash params:', currentParams);
    
    // Merge with new parameters
    const updatedParams = { ...currentParams, ...newParams };
    console.log('Merged URL hash params:', updatedParams);
    
    // Convert to JSON string, encode, and update URL hash
    const hashStr = JSON.stringify(updatedParams);
    window.location.hash = encodeURIComponent(hashStr);
    
    console.log('URL hash updated to:', window.location.hash);
  } catch (error) {
    console.error('Error updating URL hash:', error);
  }
}

/**
 * Get node shape based on status
 */
export function getNodeShape(status: string): string {
  switch (status) {
    case 'running': return 'circle';
    case 'starting': return 'triangle';
    case 'stopped': return 'square';
    case 'error': return 'diamond';
    default: return 'circle';
  }
}

/**
 * Get path definition for node shape
 */
export function getShapePath(shape: string, radius: number): string {
  switch (shape) {
    case 'circle':
      return `M 0, 0 m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`;
    case 'square':
      return `M ${-radius},${-radius} h ${radius * 2} v ${radius * 2} h ${-radius * 2} Z`;
    case 'triangle':
      return `M 0,${radius} L ${radius},${-radius} L ${-radius},${-radius} Z`;
    case 'diamond':
      return `M 0,${-radius} L ${radius},0 L 0,${radius} L ${-radius},0 Z`;
    default:
      return `M 0, 0 m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`;
  }
}

/**
 * Get node visualization properties
 * This centralizes the logic for determining node shapes, colors, and strokes
 */
export function getNodeVisualProperties(
  nodeType: string, 
  nodeStatus: string, 
  isAlarmed?: boolean, 
  isArchived?: boolean,
  isPrimary?: boolean,
  withStroke: boolean = false
) {
  // Default values
  let shape = 'circle';
  let fillColor = '#3b82f6'; // Default blue
  let showStroke = withStroke;
  
  // For bot nodes, map status to shape and color
  if (nodeType === 'bot') {
    // Check if the node is alarmed - if so and status is running/paused, treat as danger
    const effectiveStatus = 
      (isAlarmed && (nodeStatus === 'running' || nodeStatus === 'paused')) 
        ? 'danger' 
        : nodeStatus?.toLowerCase();
        
    // Determine shape based on status
    switch (effectiveStatus) {
      case 'error':
      case 'danger':
        shape = 'triangle'; // Use triangle for error status
        showStroke = false; // Triangle and diamond never have strokes
        break;
      case 'blocked':
      case 'rogue':
        shape = 'diamond'; // Use diamond for blocked/rogue
        showStroke = false; // Triangle and diamond never have strokes
        break;
      case 'paused':
      case 'archived':
        shape = 'circle'; // Use square for paused/archived
        // showStroke = false; // Triangle and diamond never have strokes
        break;
      default:
        shape = 'circle'; // Default to circle
    }
    
    // Determine fill color
    if (isPrimary) {
      fillColor = '#3b82f6'; // Blue for primary node
    } else if (isArchived) {
      fillColor = '#9ca3af'; // Gray for archived nodes
    } else if (isAlarmed || 
        effectiveStatus === 'error' || 
        effectiveStatus === 'blocked' || 
        effectiveStatus === 'rogue') {
      fillColor = 'none'; // No color for alarmed or error nodes
    } else {
      fillColor = '#3b82f6'; // Green for normal bots
    }
  } else {
    // For non-bot nodes, use blue
    fillColor = isPrimary ? '#3b82f6' : '#3b82f6';
  }
  if(!showStroke) {
    fillColor = 'none';
  }
  
  return {
    shape,
    fillColor,
    showStroke,
    strokeColor: showStroke ? '#ffffff' : 'none'
  };
} 