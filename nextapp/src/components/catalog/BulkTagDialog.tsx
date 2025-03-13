"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CatalogNodeItem } from '@/types/catalog';

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNodes: CatalogNodeItem[];
  onTagsUpdate: (nodes: CatalogNodeItem[], tags: string[]) => void;
}

export default function BulkTagDialog({
  open,
  onOpenChange,
  selectedNodes,
  onTagsUpdate
}: BulkTagDialogProps) {
  const [tagsInput, setTagsInput] = useState<string>('');
  const [existingTags, setExistingTags] = useState<string[]>([]);
  
  // Extract common tags from selected nodes
  useEffect(() => {
    if (selectedNodes.length === 0) {
      setTagsInput('');
      setExistingTags([]);
      return;
    }
    
    // Collect all unique tags from all selected nodes
    const allTags = new Set<string>();
    
    // Track which tags are present in all nodes
    const tagCounts: Record<string, number> = {};
    
    selectedNodes.forEach(node => {
      if (node.tags && node.tags.length > 0) {
        node.tags.forEach(tag => {
          allTags.add(tag);
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Find tags that are present in all nodes
    const commonTags = Array.from(allTags).filter(tag => tagCounts[tag] === selectedNodes.length);
    
    setExistingTags(Array.from(allTags));
    setTagsInput(commonTags.join(', '));
  }, [selectedNodes]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse tags from input
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    onTagsUpdate(selectedNodes, tags);
    onOpenChange(false);
  };
  
  // Add a tag to the input
  const addTag = (tag: string) => {
    const currentTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setTagsInput(newTags.join(', '));
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Tag {selectedNodes.length} {selectedNodes.length === 1 ? 'Node' : 'Nodes'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags (comma separated)
            </label>
            <textarea
              id="tags"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              rows={2}
              placeholder="tag1, tag2, tag3..."
            />
          </div>
          
          {existingTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Existing Tags
              </label>
              <div className="flex flex-wrap gap-1 mt-1">
                {existingTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Tags
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 