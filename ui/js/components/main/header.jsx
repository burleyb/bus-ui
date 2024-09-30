import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming React Context is used for global state
import Dialog from '../dialogs/dialog.jsx';
import ManageAccess from '../dialogs/manageAccess.jsx';
import MessageList from '../dialogs/messageList.jsx';
import Topics from '../dialogs/topics.jsx';
import moment from 'moment';

function Header({ messageCount: initialMessageCount }) {
    const { state, dispatch } = useContext(DataContext); // Use React Context for global state management
    const [messageCount, setMessageCount] = useState(initialMessageCount);
    const [displayPaused, setDisplayPaused] = useState(false);
    const [dialog, setDialog] = useState(undefined);
    const [timeZone, setTimeZone] = useState(localStorage.getItem("defaultBotmonTimezone") || "Default");

    const timeZoneList = [
        "Default", "US/Pacific", "US/Central", "US/Eastern", "US/Mountain",
        "Europe/Madrid", "Europe/London", "Europe/Dublin", "UTC"
    ].filter(item => item !== moment.tz.guess());

    useEffect(() => {
        if (timeZone === "Default") {
            localStorage.removeItem("defaultBotmonTimezone");
            moment.tz.setDefault();
        } else {
            localStorage.setItem("defaultBotmonTimezone", timeZone);
            moment.tz.setDefault(timeZone);
        }
    }, [timeZone]);

    // Toggle display pause state
    const togglePause = () => {
        const newPausedState = !displayPaused;
        setDisplayPaused(newPausedState);
        dispatch({ type: 'SET_DISPLAY_PAUSED', payload: newPausedState });
    };

    // Handle closing dialogs
    const closeDialog = () => {
        setDialog(undefined);
    };

    // Handle deleting messages
    const handleMessageDeleted = (newMessageCount) => {
        setMessageCount(newMessageCount);
    };

    return (
        <header className="page-header">
            <nav>
                <ul>
                    <li>
                        <a onClick={togglePause}>
                            {displayPaused ? (
                                <div><i className="icon-play" /><span>Resume Display</span></div>
                            ) : (
                                <div><i className="icon-pause" /><span>Pause Display</span></div>
                            )}
                        </a>
                    </li>
                    {localStorage.getItem('enableBetaFeatures') && (
                        <li>
                            <a onClick={() => setDialog('manageAccess')}>
                                <i className="icon-key" /><span>Manage Access</span>
                            </a>
                        </li>
                    )}
                    <li>
                        <a
                            className={messageCount !== 0 ? '' : 'theme-color-gray'}
                            onClick={() => setDialog('Messages')}
                        >
                            <i className="icon-comment" /><span>Messages</span>
                        </a>
                    </li>
                    <li>
                        <a onClick={() => setDialog('Topics')}>
                            <i className="icon-volume-low font-13em" /><span>Alerts</span>
                        </a>
                    </li>
                    <li>
                        <small className="text-center display-block stroke-above margin-8" style={{ paddingTop: 8 }}>
                            Version <span>{window.botmon ? window.botmon.version : '-'}</span>
                        </small>
                    </li>
                </ul>
            </nav>

            {dialog === 'Messages' && (
                <MessageList onClose={closeDialog} messageDeleted={handleMessageDeleted} />
            )}
            {dialog === 'manageAccess' && (
                <ManageAccess onClose={closeDialog} />
            )}
            {dialog === 'Topics' && (
                <Topics onClose={closeDialog} />
            )}
        </header>
    );
}

export default Header;
