import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../../../stores/DataContext'; // Assuming React Context for state management
import Dialog from './dialog'; // Assuming this is the reusable Dialog component
import config from '../../../config'; // Assuming config is available for registry

function NodeSettings({ data, onClose }) {
    const { state } = useContext(DataContext);
    const [tabs, setTabs] = useState({});
    const [tabIndex, setTabIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [nodeData, setNodeData] = useState(data || {});

    useEffect(() => {
        initializeTabs();
    }, [data]);

    const initializeTabs = () => {
        switch (data.type) {
            case 'Bot':
                setTabs(config.registry.tabs.bot || {});
                setNodeData((prevNodeData) => ({
                    ...prevNodeData,
                    settings: config.registry.systems[data.system?.toLowerCase()] || {}
                }));
                setIsReady(true);
                break;
            case 'EventQueue':
                setTabs(config.registry.tabs.queue || {});
                setIsReady(true);
                break;
            default:
                setIsReady(true);
                break;
        }
    };

    const switchTabs = (index) => {
        setTabIndex(index);
    };

    return (
        <Dialog title="Node Settings" onClose={onClose}>
            {isReady ? (
                <div className="theme-tabs toggleTabs height-1-1">
                    <ul>
                        {Object.keys(tabs).map((label, index) => (
                            <li
                                key={label}
                                className={tabIndex === index ? 'active' : ''}
                                onClick={() => switchTabs(index)}
                                title={label}
                            >
                                {label}
                            </li>
                        ))}
                    </ul>
                    <div style={{ height: 'calc(100% - 45px)' }}>
                        {Object.keys(tabs).map((label, index) => (
                            <div key={label} className={(tabIndex === index ? 'active' : '') + ' height-1-1'}>
                                {tabIndex === index ? (
                                    config.registry.tabs[tabs[label]] ? (
                                        <config.registry.tabs[tabs[label]]
                                            nodeData={nodeData}
                                            onClose={onClose}
                                        />
                                    ) : (
                                        `Tab "${tabs[label]}" not configured`
                                    )
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>Loading...</div>
            )}
        </Dialog>
    );
}

export default NodeSettings;
