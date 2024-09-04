import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query'; // Use this if you want to refetch/reset API data.

const LeftNav = ({ userSettings, workflows, searches }) => {
  const [alarmedCount, setAlarmedCount] = useState(0); // Replace with actual API query or state management
  const [hover, setHover] = useState(undefined);
  const [showMenu, setShowMenu] = useState(false);
  
  const queryClient = useQueryClient(); // Use this for resetting cache or refetching if needed

  const toggleView = (view) => {
    setHover(view === hover ? undefined : view);
    // Save the view and trigger any actions necessary
    // You can call an API or trigger a prop function here
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const toggleHover = (view) => {
    setHover(view);
  };

  // Reset all cached queries and state
  const resetDataStoreState = () => {
    // In case you need to reset any data or queries:
    queryClient.clear(); // This will clear any cached data in TanStack Query if you use it

    // Additionally, you can reset local state or call a function here
    setAlarmedCount(0); // Reset alarmedCount or any other local state variables
    setHover(undefined);
    setShowMenu(false);
  };

  const savedWorkflows = workflows.order();
  const savedSearches = searches.order();

  return (
    <div className={`left-nav${showMenu ? ' active' : ''}`} onClick={toggleMenu}>
      <div className="mask" />

      <div className="page-logo" onClick={resetDataStoreState}>
        <a href="#">
          <img src="https://smartshyp-public.s3.amazonaws.com/SS-White-Icon.png" alt="logo" />
        </a>
      </div>

      <div
        className={!userSettings.view || userSettings.view === 'dashboard' ? 'active' : ''}
        onClick={() => toggleView('dashboard')}
      >
        <i className="icon-layout theme-red-bubble" data-count={alarmedCount} />
      </div>

      <div
        title="Workflow"
        className={userSettings.view === 'node' ? 'active' : ''}
        onMouseEnter={() => toggleHover('node')}
        onMouseLeave={() => toggleHover('')}
      >
        <span onClick={() => toggleView('node')}>
          <i className="icon-flow-branch" />
        </span>
        <div className={`pop-out${hover === 'node' ? ' hover' : ''}`}>
          <header>
            {savedWorkflows.length ? (
              <i
                className="icon-cog pull-right"
                style={{ fontSize: 20 }}
                onClick={() => window.showDialog('manageWorkflows')}
              />
            ) : null}
            Saved Workflows
          </header>
          <ul className="workflow-links">
            {savedWorkflows.length ? (
              savedWorkflows.map((view) => (
                <li key={view}>
                  <a onClick={() => workflows.restore(view)}>{view}</a>
                </li>
              ))
            ) : (
              <li>
                <em>There are no saved Workflows</em>
              </li>
            )}
            {userSettings.view === 'node' ? (
              <li>
                <a onClick={workflows.save}>
                  <i className="icon-bookmark" /> Save this Workflow View
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div
        title="Catalog"
        className={userSettings.view === 'list' ? 'active' : ''}
        onMouseEnter={() => toggleHover('list')}
        onMouseLeave={() => toggleHover('')}
      >
        <span onClick={() => toggleView('list')}>
          <i className="icon-list-bullet" />
        </span>
        <div className={`pop-out${hover === 'list' ? ' hover' : ''}`}>
          <header>
            {savedSearches.length ? (
              <i
                className="icon-cog pull-right"
                style={{ fontSize: 20 }}
                onClick={() => window.showDialog('manageSearches')}
              />
            ) : null}
            Saved Searches
          </header>
          <ul className="workflow-links">
            {savedSearches.length ? (
              savedSearches.map((view) => (
                <li key={view}>
                  <a onClick={() => searches.restore(view)}>{view}</a>
                </li>
              ))
            ) : (
              <li>
                <em>There are no saved Searches</em>
              </li>
            )}
            {userSettings.view === 'list' ? (
              <li>
                <a onClick={searches.save}>
                  <i className="icon-bookmark" /> Save this Search
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className={userSettings.view === 'trace' ? 'active' : ''}>
        <span onClick={() => toggleView('trace')} title="Trace">
          <i className="icon-flash" />
        </span>
      </div>

      <div title="documentation">
        <a
          href={`${window.leoDocsLink}${{
            dashboard: 'dashboard',
            node: 'workflows',
            list: 'catalog',
            trace: 'trace',
          }[userSettings.view || 'list']}`}
          target="documentation"
        >
          <i className="icon-help-circled fixed-width-icon"></i>
        </a>
      </div>
    </div>
  );
};

export default LeftNav;
