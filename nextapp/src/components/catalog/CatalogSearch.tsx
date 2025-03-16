"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { NodeData } from '@/types/nodes';
import NodeIcon from '@/components/node/NodeIcon';

interface CatalogSearchProps {
  initialSearch: string;
  onSearchChange: (search: string) => void;
}

export default function CatalogSearch({ 
  initialSearch = '',
  onSearchChange
}: CatalogSearchProps) {
  const { state } = useAppContext();
  const [searchText, setSearchText] = useState(initialSearch);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [nodeOptions, setNodeOptions] = useState<{ value: string; label: string; type: string }[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<{ value: string; label: string; type: string }[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Prepare node options for the dropdown
  useEffect(() => {
    if (state.nodes && Object.keys(state.nodes).length > 0) {
      const options = Object.values(state.nodes)
        .filter((node: NodeData) => {
          // Only include queues, filter out bots and other node types
          const idParts = node.id.split(':');
          return idParts[0] === 'queue';
        })
        .map((node: NodeData) => {
          // Extract the name part (everything after the colon)
          const idParts = node.id.split(':');
          const name = idParts.length > 1 ? idParts.slice(1).join(':') : node.id;
          
          return {
            value: node.id,
            label: name,
            type: 'queue'
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      
      setNodeOptions(options);
    }
  }, [state.nodes]);
  
  // Filter options based on search text
  useEffect(() => {
    // Show all queue options when the field is clicked, even if no search text
    if (!searchText.trim() && isOpen) {
      setFilteredOptions([...nodeOptions]);
      return;
    } else if (!searchText.trim()) {
      setFilteredOptions([]);
      return;
    }
    
    const filtered = nodeOptions.filter(option => 
      option.label.toLowerCase().includes(searchText.toLowerCase()) ||
      option.value.toLowerCase().includes(searchText.toLowerCase())
    );
    
    setFilteredOptions(filtered);
    
    // Reset highlighted index
    setHighlightedIndex(-1);
  }, [searchText, nodeOptions, isOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setIsOpen(true);
  };
  
  // Handle focus on the input field
  const handleInputFocus = () => {
    setIsOpen(true);
    // When focused, show all options immediately
    setFilteredOptions([...nodeOptions]);
  };
  
  // Handle option selection
  const handleSelectOption = (option: { value: string; label: string; type: string }) => {
    setSearchText(option.label);
    onSearchChange(option.label);
    setIsOpen(false);
  };
  
  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If dropdown is not open, open it on arrow down
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true);
      return;
    }
    
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else if (searchText) {
          onSearchChange(searchText);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };
  
  // Handle submit of the form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchText);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={searchInputRef}
          type="text"
          className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search queues..."
          value={searchText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button 
          type="submit"
          className="absolute inset-y-0 left-0 pl-3 flex items-center"
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </button>
      </form>
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
          <ul>
            {filteredOptions.map((option, index) => (
              <li 
                key={option.value}
                className={`px-4 py-2 cursor-pointer flex items-center ${
                  index === highlightedIndex
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleSelectOption(option)}
              >
                <div className="mr-2">
                  <NodeIcon 
                    node={{ 
                      id: option.value, 
                      type: option.type
                    }} 
                    size={20} 
                  />
                </div>
                <span>{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 