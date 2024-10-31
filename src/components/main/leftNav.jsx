import React, { useState, useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming React Context for global state
import { LeoKit } from '../dialogs/LeoKit.jsx';

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
        state.resetState(); // Assuming resetState is part of the context or handled elsewhetoggleViewre
    };

    const savedWorkflows = workflows;
    const savedSearches = searches;

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
                <span onClick={this.toggleView.bind(this, 'node')}>
					<i className="icon-flow-branch" />
				</span>
				<div className={'pop-out' + (this.state.hover === 'node' ? ' hover' : '')}>
					<header>
						{
							savedWorkflows.length > 0 ? 
                            <i className="icon-cog pull-right"  /> 
                            : false
						}
						Saved Workflows
					</header>
					<ul className="workflow-links">
						{
							savedWorkflows.map((view) => {
								return (<li key={view}>
									<a onClick={workflows.restore.bind(this, view)}>{view}</a>
								</li>);
							})
						}
						{
							!savedWorkflows.length
							? <li>
								<em>There are no saved Workflows</em>
							</li>
							: false
						}
						{
                            //this.dataStore.urlObj.view === 'node'
                            userSettings.view === 'node'
                                ? <li>
								<a onClick={workflows.save}>
									<i className="icon-bookmark" /> Save this Workflow View
								</a>
							</li>
							: false
						}
					</ul>
				</div>
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
