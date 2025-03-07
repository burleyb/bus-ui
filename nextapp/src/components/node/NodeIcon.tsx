"use client";

import React from 'react';
import { AWSLambdaIcon } from '../icons/AWSLambdaIcon';

interface NodeProps {
  type?: string;
  status?: string;
  health?: {
    status?: string;
  };
  [key: string]: any;
}

interface NodeIconProps {
  node: NodeProps;
  size?: number;
  className?: string;
}

// This function generates an SVG string representation of a node icon
// to be used in the workflow graph renderer
export function getNodeImagesSvgString(node: NodeProps, nodes?: any, baseUrl: string = ''): string {
  if (!node) return '';
  
  const type = node.type?.toLowerCase() || 'unknown';
  const status = node.status?.toLowerCase() || 'unknown';
  const healthStatus = node.health?.status?.toLowerCase() || 'unknown';
  
  // Determine the status indicator color
  const getStatusColor = () => {
    if (status === 'paused' || status === 'stopped') {
      return '#f59e0b'; // yellow-500
    } else if (status === 'error' || healthStatus === 'error') {
      return '#ef4444'; // red-500
    } else if (status === 'running' || healthStatus === 'healthy') {
      return '#22c55e'; // green-500
    } else if (healthStatus === 'warning') {
      return '#f59e0b'; // yellow-500
    }
    return '#6b7280'; // gray-500
  };

  // Generate SVG based on node type
  let iconSvg = '';
  switch (type) {
    case 'lambda':
      // Simple representation of AWS Lambda icon
      iconSvg = `
        <svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#FF9900" rx="4" />
          <path d="M8 8L16 24L24 8" stroke="white" stroke-width="2" fill="none" />
        </svg>
      `;
      break;
    case 'queue':
      iconSvg = `
        <svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#3b82f6" rx="4" />
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="20">Q</text>
        </svg>
      `;
      break;
    case 'system':
      iconSvg = `
        <svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#8b5cf6" rx="4" />
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="20">S</text>
        </svg>
      `;
      break;
    default:
      iconSvg = `
        <svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#6b7280" rx="4" />
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="20">?</text>
        </svg>
      `;
  }

  // Add status indicator
  iconSvg += `
    <svg width="100%" height="100%" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="6" fill="${getStatusColor()}" stroke="white" stroke-width="2" />
    </svg>
  `;

  return iconSvg;
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
  
  // Render the icon based on node type
  const renderIcon = () => {
    switch (type) {
      case 'lambda':
        return <AWSLambdaIcon className={`w-full h-full`} />;
      case 'queue':
        return (
          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white rounded">
            Q
          </div>
        );
      case 'system':
        return (
          <div className="w-full h-full flex items-center justify-center bg-purple-500 text-white rounded">
            S
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-500 text-white rounded">
            ?
          </div>
        );
    }
  };
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {renderIcon()}
      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor()}`}></div>
    </div>
  );
} 