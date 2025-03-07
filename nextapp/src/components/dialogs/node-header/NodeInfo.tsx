"use client";

import React from 'react';
import { Workflow } from 'lucide-react';
import NodeIcon from '../../node/NodeIcon';
import { AWSLambdaIcon } from '../../icons/AWSLambdaIcon';
import { NodeData } from '@/types/node';

interface NodeInfoProps {
  nodeData: NodeData;
  onViewInWorkflow: () => void;
}

export default function NodeInfo({ nodeData, onViewInWorkflow }: NodeInfoProps) {
  // Safely extract node properties
  const nodeName = nodeData?.name || 'Loading...';
  const nodeType = nodeData?.type || 'unknown';
  const nodeFullId = nodeData?.id ? `${nodeType}:${nodeData.id}` : 'Loading...';
  
  // Extract the AWS Lambda function name
  const getLambdaFunctionName = () => {
    if (nodeType !== 'lambda' || !nodeData?.id) return '';
    const botId = nodeData.id.replace('bot:', '');
    // This is a placeholder - in a real implementation, you'd map the bot ID to the actual Lambda function name
    return `siq-clients-${botId.toLowerCase()}-BotExtractSpotifySavedTracks-mzi8QDI44P9a`;
  };
  
  // Get the AWS Lambda console URL
  const getLambdaConsoleUrl = () => {
    const functionName = getLambdaFunctionName();
    if (!functionName) return '';
    return `https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/${functionName}?tab=code`;
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Bot logo with status */}
      <NodeIcon node={{ type: nodeType, status: nodeData?.status }} className="w-8 h-8" />
      
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">{nodeName}</h2>
          {/* Node data flow icon that links to workflow */}
          <button 
            onClick={onViewInWorkflow}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="View in Workflow"
          >
            <Workflow size={16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{nodeFullId}</span>
          
          {/* AWS Lambda link for bot nodes */}
          {nodeType === 'lambda' && (
            <a 
              href={getLambdaConsoleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              title="Open in AWS Console"
            >
              <AWSLambdaIcon className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
} 