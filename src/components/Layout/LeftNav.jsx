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
        state.setSettings( { view } );
        state.changeView({ view }); // Assuming changeView is part of the context or handled elsewhere
    };

    // Toggle the left menu visibility
    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    // Reset DataStore state
    const resetDataStoreState = () => {
        state.resetState(); // Assuming resetState is part of the context or handled elsewhere
    };

    const savedWorkflows = workflows;
    const savedSearches = searches;

    return (
        <div className={`left-nav${showMenu ? ' active' : ''}`} onClick={toggleMenu}>
            <div className="mask" />
            <div className="page-logo" onClick={resetDataStoreState}>
                <a href="#">
                    <img src="https://s3.us-east-1.amazonaws.com/symmatiq.com/botmon/3.0.5.1738302431164/images/icons/symmatiq.svg" alt="logo" />
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
                <span onClick={() => toggleView('node')}>
					<i className="icon-flow-branch" />
				</span> 
				{/* <div className={'pop-out' + (this.state.hover === 'node' ? ' hover' : '')}>
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
				</div> */}
            </div>

            <div
                title="Catalog"
                className={userSettings?.view === 'catalog' ? 'active' : ''}
                onMouseEnter={() => setHover('catalog')}
                onMouseLeave={() => setHover(undefined)}
            >
                <span onClick={() => toggleView('catalog')}>
					<i className="icon-list-bullet" />
				</span> 
				{/* <div className={'pop-out' + (this.state.hover === 'node' ? ' hover' : '')}>
                        <header>
                            {
							    savedSearches.length > 0 ? 
                                <i className="icon-cog pull-right"  /> 
                                : false
						    }
						    Saved Searches
                        </header>
                        <ul class="workflow-links">
                            {
                                savedSearches.map((view) => {
                                    return (<li key={view}>
                                        <a onClick={searches.restore.bind(this, view)}>{view}</a>
                                    </li>);
                                })
                            }
                            {
                                !savedSearches.length
                                ? <li>
                                    <em>There are no saved Searches</em>
                                </li>
                                : false
                            }
                            {
                                //this.dataStore.urlObj.view === 'catalog'
                                userSettings.view === 'catalog'
                                    ? <li>
                                    <a onClick={searches.save}>
                                        <i className="icon-bookmark" /> Save this Search View
                                    </a>
                                </li>
                                : false
                            }
                        </ul>
                    </div> */}
            </div>            

            <div className={userSettings?.view === 'trace' ? 'active' : ''}>
                <span onClick={() => toggleView('trace')} title="Trace">
                    <i className="icon-flash" />
                </span>
            </div>

            <div title="Documentation">
                <a href={`${window.leoDocsLink}${{
                    dashboard: 'dashboard',
                    node: 'node',
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
