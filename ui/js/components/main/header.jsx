import React, { useState, useEffect } from 'react';
import Dialog from '../dialogs/dialog.jsx';
import ManageAccess from '../dialogs/manageAccess.jsx';
import MessageList from '../dialogs/messageList.jsx';
import Topics from '../dialogs/topics.jsx';
import { useQuery, useMutation } from '@tanstack/react-query';

const Header = ({ messageCount: initialMessageCount, displayPaused: initialDisplayPaused, view, onTogglePause }) => {
  const [messageCount, setMessageCount] = useState(initialMessageCount || 0);
  const [displayPaused, setDisplayPaused] = useState(initialDisplayPaused || false);
  const [dialog, setDialog] = useState(undefined);

  // If props change, sync state
  useEffect(() => {
    setMessageCount(initialMessageCount);
    setDisplayPaused(initialDisplayPaused);
  }, [initialMessageCount, initialDisplayPaused]);

  // Query to fetch settings if needed
  const { data: settingsData } = useQuery(['fetchSettings'], fetchSettings);

  const togglePause = () => {
    const newState = !displayPaused;
    setDisplayPaused(newState);
    if (onTogglePause) {
      onTogglePause(newState);
    }
  };

  const closeDialog = () => {
    setDialog(undefined);
  };

  const manageAccess = () => {
    setDialog('manageAccess');
  };

  const messageDeleted = (newMessageCount) => {
    setMessageCount(newMessageCount);
  };

  return (
    <header className="page-header">
      <div className="page-logo-wrapper">
        <div className="page-logo theme-dropdown-left">
          <a href="#">
            <img src="https://app.lablpx.com/assets/img/pl/lablpx.com/logo-white-full-left.svg" alt="logo" />
          </a>
        </div>
        <div className="page-title">
          {(() => {
            switch (view || 'dashboard') {
              case 'dashboard':
                return 'Dashboard';
              case 'list':
                return 'Catalog';
              case 'node':
                return 'Workflow';
              case 'trace':
                return 'Trace';
              case 'sdk':
                return 'SDK';
              default:
                return 'Dashboard';
            }
          })()}
        </div>
      </div>

      <div>
        <nav className="page-sub-nav">
          <ul>
            <li className="theme-dropdown-right">
              <a>
                <i className="icon-ellipsis"></i>
              </a>
              <ul>
                <li>
                  <a onClick={togglePause}>
                    {displayPaused ? (
                      <div>
                        <i className="icon-play" />
                        <span className="theme-color-danger text-bold">Resume Display</span>
                      </div>
                    ) : (
                      <div>
                        <i className="icon-pause" />
                        <span>Pause Display</span>
                      </div>
                    )}
                  </a>
                </li>
                {localStorage.getItem('enableBetaFeatures') && (
                  <li>
                    <a onClick={manageAccess}>
                      <i className="icon-key" />
                      <span>Manage Access</span>
                    </a>
                  </li>
                )}
                <li>
                  <a
                    className={messageCount !== 0 ? '' : 'theme-color-gray'}
                    onClick={() => setDialog('Messages')}
                  >
                    <i className="icon-comment" />
                    <span>Messages</span>
                  </a>
                </li>
                <li>
                  <a onClick={() => setDialog('Topics')}>
                    <i className="icon-volume-low font-13em" />
                    <span>Alerts</span>
                  </a>
                </li>
                <li>
                  <small className="text-center display-block stroke-above margin-8" style={{ paddingTop: 8 }}>
                    Version <span>{window.botmon ? window.botmon.version : '-'}</span>
                  </small>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>

      {(() => {
        switch (dialog) {
          case 'Messages':
            return <MessageList onClose={closeDialog} messageDeleted={messageDeleted} />;
          case 'manageAccess':
            return <ManageAccess onClose={closeDialog} />;
          case 'Topics':
            return <Topics onClose={closeDialog} />;
          default:
            return null;
        }
      })()}
    </header>
  );
};

// Example fetch function for TanStack Query
async function fetchSettings() {
  const response = await fetch('/api/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
}

export default Header;
