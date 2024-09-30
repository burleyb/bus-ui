import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import NodeIcon from '../elements/nodeIcon.jsx';

const NodeSearch = ({ value, nodeType, placeholder, searchText, searchResults, upAndDown, onChange, name, className, icon, showArchived }) => {
    const { dataStore, dispatch } = useContext(DataContext); // Replacing MobX and Redux with Context
    const [state, setState] = useState(() => {
        let searchText = '', searchId;
        if (value) {
            Object.keys(dataStore.nodes).forEach((nodeId) => {
                const node = dataStore.nodes[nodeId];
                if (node.id === value.replace(/^system\./, '')) {
                    searchText = node.id;
                    searchId = nodeId;
                }
            });
        }
        return {
            viewEvent: false,
            showDropdown: false,
            searchId,
            searchText,
            old_searchText: searchText,
            searchIndex: 0,
            showNew: (nodeType || '').split('|').includes('new'),
        };
    });

    const toggleSearchBox = (show) => {
        if (!searchResults) {
            if (!show && state.showNew && state.searchText && state.searchText !== state.selectedText) {
                onChange && onChange(state.searchText);
            }
            setState((prevState) => ({ ...prevState, showDropdown: show }));
        }
    };

    const handleKeyDown = (event) => {
        switch (event.keyCode) {
            case 13: // Enter
                setTimeout(() => {
                    selectNode(state.searchNode || (foundNodeIds || [])[state.searchIndex] || null);
                }, 1);
                event.preventDefault();
                break;
            case 38: // Up
                setSearchIndex(state.searchIndex - 1);
                upAndDown && upAndDown(-1);
                event.preventDefault();
                break;
            case 40: // Down
                setSearchIndex(state.searchIndex + 1);
                upAndDown && upAndDown(1);
                event.preventDefault();
                break;
            case 27: // Escape
                toggleSearchBox(false);
                break;
            default:
                break;
        }
    };

    const searchNodes = (event) => {
        const newSearchText = event ? event.currentTarget.value : state.searchText;
        setState((prevState) => ({
            ...prevState,
            searchText: newSearchText,
            searchIndex: 0,
            showDropdown: !searchResults,
        }));
        if (searchResults) {
            findNodes();
            searchResults(foundNodeIds, newSearchText);
        }
    };

    const findNodes = () => {
        const searchTextLower = (state.searchText || '').toLowerCase().trim();
        const nodeTypes = (nodeType || 'queues|bots|systems').split('|');
        foundNodeIds = Object.keys(dataStore.nodes).filter((id) => {
            const node = dataStore.nodes[id] || {};
            const label = node.label || '';
            let isFound = true;

            if (((node.status || '') === 'archived' && !showArchived) || !nodeTypes.includes(node.type + 's')) {
                return false;
            }

            if (searchTextLower.split(' ').some((term) => !label.toLowerCase().includes(term) && !id.toLowerCase().includes(term))) {
                isFound = false;
                if (node.tags) {
                    node.tags.split(/, ?/g).some((tag) => {
                        if (tag.toLowerCase().includes(searchTextLower)) isFound = true;
                    });
                }
            }
            return isFound;
        });
    };

    const setSearchIndex = (index) => {
        const newIndex = Math.max(Math.min(index, foundNodeIds.length - 1), 0);
        setState((prevState) => ({ ...prevState, searchIndex: newIndex }));
    };

    const selectNode = (id) => {
        let selectedText = (dataStore.nodes[id] || {}).id || id;
        setState((prevState) => ({
            ...prevState,
            selectedText,
            searchText: selectedText,
        }));
        toggleSearchBox(false);
        onChange && onChange({ id, label: selectedText });
    };

    const clearSearch = () => {
        setState({ searchText: '' });
        searchNodes();
        onChange && onChange('');
    };

    useEffect(() => {
        if (searchResults) {
            findNodes();
            searchResults(foundNodeIds, state.searchText);
        }
    }, [state.searchText]);

    let searchIndex = 0;
    if (state.showDropdown) {
        findNodes();
    }

    let foundNodeIds = [];
    const maxResults = parseInt(localStorage.getItem('searchUiSize')) || 50;

    return (
        <div className={`theme-autocomplete ${className || ''}`}>
            {state.showDropdown && <div className="mask" onClick={() => toggleSearchBox(false)}></div>}
            <input
                type="search"
                name={name || 'undefined'}
                className="searchBox theme-form-input"
                placeholder={placeholder || 'search...'}
                onChange={searchNodes}
                onKeyDown={handleKeyDown}
                onFocus={() => toggleSearchBox(true)}
                value={state.searchText || ''}
                autoComplete="off"
            />
            {state.searchText && <i className="icon-cancel" onClick={clearSearch}></i>}
            <i className={`search-icon ${icon || 'icon-search'}`} />
            {state.showDropdown && (
                <ul className="search-list">
                    {state.showNew && (
                        <li
                            className={searchIndex++ === state.searchIndex ? 'active' : ''}
                            onClick={() => selectNode(state.searchText)}
                        >
                            <i className="icon-plus display-inline-block margin-5"></i>
                            {state.searchText !== state.selectedText && state.searchText}
                        </li>
                    )}
                    {foundNodeIds.slice(0, maxResults).map((nodeId) => {
                        const node = dataStore.nodes[nodeId] || {};
                        const tags = (node.tags || '').split(',').filter((tag) => !tag.startsWith('repo:'));

                        return (
                            <li
                                key={nodeId}
                                className={`flex-row flex-space ${searchIndex++ === state.searchIndex ? 'active' : ''}`}
                                onClick={() => selectNode(nodeId)}
                            >
                                <NodeIcon className="theme-image-tiny margin-0-5" node={nodeId} />
                                <span className="flex-grow">
                                    {node.label}
                                    <div className="theme-tags">
                                        {tags.map((tag, index) => (
                                            <span key={index}>{tag}</span>
                                        ))}
                                    </div>
                                </span>
                                <i
                                    className="icon-cog"
                                    style={{ fontSize: '1.25em' }}
                                    onClick={() => window.nodeSettings({ id: nodeId, label: node.label })}
                                />
                            </li>
                        );
                    })}
                    {foundNodeIds.length > maxResults && (
                        <li style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span>Refine Search</span>
                        </li>
                    )}
                    {foundNodeIds.length === 0 && <li><em>no results</em></li>}
                </ul>
            )}
        </div>
    );
};

export default NodeSearch;
