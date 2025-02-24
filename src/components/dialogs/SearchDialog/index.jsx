import React, { useState, useCallback } from 'react';
import Dialog from '../Dialog';
import { useNodes } from '../../../hooks/useNodes';
import { debounce } from 'lodash';

const SearchDialog = ({ onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [nodeType, setNodeType] = useState('all');

  const nodes = useNodes({
    search: searchTerm,
    tags: selectedTags,
    type: nodeType === 'all' ? null : nodeType
  });

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleSelect = (node) => {
    onSelect(node);
    onClose();
  };

  return (
    <Dialog title="Search Nodes" onClose={onClose} width="lg">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search nodes..."
              onChange={handleSearch}
              className="w-full px-4 py-2 border rounded-lg"
              autoFocus
            />
          </div>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="bot">Bots</option>
            <option value="queue">Queues</option>
            <option value="system">Systems</option>
          </select>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {nodes.length > 0 ? (
            <div className="space-y-2">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center">
                    <NodeIcon type={node.type} className="h-5 w-5 mr-2" />
                    <div>
                      <div className="font-medium">{node.label}</div>
                      <div className="text-sm text-gray-500">{node.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No nodes found matching your search
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default SearchDialog;