import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming React Context for state management
import Dialog from './dialog.jsx'; // Assuming this is the reusable Dialog component

import CodeEditor from "../tabs/codeEditor.jsx"
import CodeOverrides from "../tabs/codeOverrides.jsx"
import Logs from "../tabs/logs.jsx"
import BotSettings from "../tabs/botSettings.jsx"
import BotDashboard from "../tabs/botDashboard.jsx"
import QueueDashboard from "../tabs/queueDashboard.jsx"
import EventViewer from "../tabs/eventViewer.jsx"
import QueueSettings from "../tabs/queueSettings.jsx"
import Checksum from "../tabs/checksum.jsx"
import Cron from "../tabs/cron.jsx"
import Webhooks from "../tabs/webhooks.jsx"
import SystemSettings from "../tabs/systemSettings.jsx"
import QueueSchema from "../tabs/queueSchema.jsx"

const tabs = {
	CodeEditor: CodeEditor,
	CodeOverrides: CodeOverrides,
	Logs: Logs,
	BotSettings: BotSettings,
	BotDashboard: BotDashboard,
	QueueDashboard: QueueDashboard,
	EventViewer: EventViewer,
	QueueSettings: QueueSettings,
	Checksum: Checksum,
	Cron: Cron,
	Webhooks: Webhooks,
	SystemSettings: SystemSettings,
	QueueSchema: QueueSchema
}


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
                setTabs(tabs || {});
                setNodeData((prevNodeData) => ({
                    ...prevNodeData,
                    settings: [data.system?.toLowerCase()] || {}
                }));
                setIsReady(true);
                break;
            case 'EventQueue':
                setTabs(tabs || {});
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
                                        React.createElement(tabs[label], {
                                            nodeData: nodeData,
                                            onClose: onClose
                                        })
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
