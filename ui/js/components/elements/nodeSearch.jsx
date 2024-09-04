import React, { useState, useEffect } from 'react';
import NodeIcon from '../elements/nodeIcon.jsx';

const NodeSearch = ({ value, nodeType, matches, onChange, placeholder, name, icon }) => {
  const [searchText, setSearchText] = useState('');
  const [searchId, setSearchId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const [foundNodeIds, setFoundNodeIds] = useState([]);
  const [showNew, setShowNew] = useState((nodeType || '').split('|').includes('new'));

  useEffect(() => {
    if (value) {
      const searchResult = Object.keys(dataStore.nodes).find(nodeId => dataStore.nodes[nodeId].id === value.replace(/^system\./, ''));
      if (searchResult) {
        setSearchText(dataStore.nodes[searchResult].id);
        setSearchId(searchResult);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        if (
          (event.keyCode >= 65 && event.keyCode <= 90 && !event.ctrlKey) ||
          (event.keyCode >= 48 && event.keyCode <= 57 && !event.shiftKey)
        ) {
          document.querySelector('.searchBox').focus();
          handleSearchKeyDown(event);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchText, searchIndex, foundNodeIds]);

  const handleSearchKeyDown = (event) => {
    switch (event.keyCode) {
      case 13: // Enter
        selectNode(foundNodeIds[searchIndex] || '');
        event.preventDefault();
        break;
      case 38: // Up
        setSearchIndex(prevIndex => Math.max(prevIndex - 1, 0));
        event.preventDefault();
        break;
      case 40: // Down
        setSearchIndex(prevIndex => Math.min(prevIndex + 1, foundNodeIds.length - 1));
        event.preventDefault();
        break;
      case 27: // Escape
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  const searchNodes = (text) => {
    setSearchText(text);
    const searchLower = text.toLowerCase();
    const filteredNodeIds = Object.keys(dataStore.nodes).filter((id) => {
      const node = dataStore.nodes[id];
      const labelLower = (node.label || '').toLowerCase();
      return (
        labelLower.includes(searchLower) ||
        id.toLowerCase().includes(searchLower)
      );
    });
    setFoundNodeIds(filteredNodeIds);
    setShowDropdown(true);
  };

  const selectNode = (id) => {
    const selectedText = dataStore.nodes[id]?.id || id;
    setSearchText(selectedText);
    setSearchId(id);
    setShowDropdown(false);
    onChange && onChange({ id, label: selectedText });
  };

  return (
    <div className="theme-autocomplete">
      <input
        type="search"
        name={name || 'undefined'}
        className="searchBox theme-form-input"
        placeholder={placeholder || 'search...'}
        value={searchText}
        onChange={(e) => searchNodes(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        onFocus={() => setShowDropdown(true)}
        autoComplete="off"
      />
      {searchText && <i className="icon-cancel" onClick={() => setSearchText('')}></i>}
      <i className={`search-icon ${icon || 'icon-search'}`} />
      {showDropdown && (
        <ul className="search-list">
          {showNew && (
            <li className={searchIndex === 0 ? 'active' : ''} onClick={() => selectNode(searchText)}>
              <i className="icon-plus display-inline-block margin-5"></i> {searchText}
            </li>
          )}
          {foundNodeIds.map((nodeId, idx) => {
            const node = dataStore.nodes[nodeId];
            return (
              <li key={nodeId} className={`flex-row flex-space ${searchIndex === idx ? 'active' : ''}`} onClick={() => selectNode(nodeId)}>
                <NodeIcon className="theme-image-tiny margin-0-5" node={nodeId} />
                <span className="flex-grow">{node.label}</span>
              </li>
            );
          })}
          {foundNodeIds.length === 0 && <li><em>no results</em></li>}
        </ul>
      )}
    </div>
  );
};

export default NodeSearch;
