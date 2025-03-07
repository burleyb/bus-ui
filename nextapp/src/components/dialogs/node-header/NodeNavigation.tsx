"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface NodeNavigationProps {
  parentNodes: string[];
  childNodes: string[];
  onNavigateToParent: (nodeId: string) => void;
  onNavigateToChild: (nodeId: string) => void;
}

export default function NodeNavigation({ 
  parentNodes, 
  childNodes, 
  onNavigateToParent, 
  onNavigateToChild 
}: NodeNavigationProps) {
  return (
    <div className="flex items-center space-x-2">
      {/* Parent node navigation */}
      {parentNodes.length > 0 && (
        parentNodes.length === 1 ? (
          <button
            title="Go to Parent Node"
            onClick={() => onNavigateToParent(parentNodes[0])}
            className="p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="Parent Nodes"
                className="p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded relative"
              >
                <ChevronLeft size={18} />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {parentNodes.length}
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {parentNodes.map((parentId: string) => (
                <DropdownMenuItem 
                  key={parentId}
                  onClick={() => onNavigateToParent(parentId)}
                >
                  {parentId}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      )}
      
      {/* Child node navigation */}
      {childNodes.length > 0 && (
        childNodes.length === 1 ? (
          <button
            title="Go to Child Node"
            onClick={() => onNavigateToChild(childNodes[0])}
            className="p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight size={18} />
          </button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="Child Nodes"
                className="p-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded relative"
              >
                <ChevronRight size={18} />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {childNodes.length}
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {childNodes.map((childId: string) => (
                <DropdownMenuItem 
                  key={childId}
                  onClick={() => onNavigateToChild(childId)}
                >
                  {childId}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      )}
    </div>
  );
} 