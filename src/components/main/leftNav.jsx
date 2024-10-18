import React, { useState, useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming React Context for global state

function LeftNav({ workflows, searches, userSettings }) {
    const state = useData(); 
    const [hover, setHover] = useState(undefined);
    const [showMenu, setShowMenu] = useState(false);

    // Toggle the active view
    const toggleView = (view) => {
        setHover(hover === view ? undefined : view);
        state.setSettings( view );
        state.changeView(view); // Assuming changeView is part of the context or handled elsewhere
    };

    // Toggle the left menu visibility
    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    // Reset DataStore state
    const resetDataStoreState = () => {
        state.resetState(); // Assuming resetState is part of the context or handled elsewhere
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
                className={!userSettings?.view || userSettings?.view === 'dashboard' ? 'active' : ''}
                onClick={() => toggleView('dashboard')}
            >
                <i className="icon-layout theme-red-bubble" data-count={state.alarmedCount} />
            </div>

            <div
                title="Workflow"
                className={userSettings?.view === 'node' ? 'active' : ''}
                onMouseEnter={() => setHover('node')}
                onMouseLeave={() => setHover(undefined)}
            >
                {/* Render workflow details here */}
            </div>

            <div className={userSettings?.view === 'trace' ? 'active' : ''}>
                <span onClick={() => toggleView('trace')} title="Trace">
                    <i className="icon-flash" />
                </span>
            </div>

            <div title="Documentation">
                <a href={`${window.leoDocsLink}${{
                    dashboard: 'dashboard',
                    node: 'workflows',
                    list: 'catalog',
                    trace: 'trace',
                }[userSettings?.view || 'list']}`} target="documentation">
                    <i className="icon-help-circled fixed-width-icon" />
                </a>
            </div>
        </div>
    );
}

export default LeftNav;
