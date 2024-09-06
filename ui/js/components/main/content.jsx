import React, { useState, useContext } from 'react';
import { DataContext } from '../../../stores/DataContext'; // Assuming Context API for global state
import DashboardPage from '../pages/dashboardPage.jsx';
import CatalogPage from '../pages/catalogPage.jsx';
import WorkflowPage from '../pages/workflowPage.jsx';
import TracePage from '../pages/tracePage.jsx';
import SDKPage from '../pages/sdkPage.jsx';
import NodeSettings from '../dialogs/nodeSettings.jsx';
import BotSettings from '../tabs/botSettings.jsx';
import SystemSettings from '../tabs/systemSettings.jsx';
import SavedWorkflows from '../dialogs/savedWorkflows.jsx';
import SavedSearches from '../dialogs/savedSearches.jsx';

function Content() {
    const { state, dispatch } = useContext(DataContext); // Use Context for global state management
    const [dialogs, setDialogs] = useState({});
    const [createBot, setCreateBot] = useState();
    const [createSystem, setCreateSystem] = useState();
    const [nodeSettings, setNodeSettings] = useState();
    const [subNodeSettings, setSubNodeSettings] = useState();
    const [traceSettings, setTraceSettings] = useState();
    const [createNode, setCreateNode] = useState({});
    const [manageWorkflows, setManageWorkflows] = useState(false);
    const [manageSearches, setManageSearches] = useState(false);

    // Handle showing dialogs
    const showDialog = (dialogType, settings) => {
        switch (dialogType) {
            case 'manageSearches':
                setManageSearches(settings || {});
                break;
            case 'manageWorkflows':
                setManageWorkflows(settings || {});
                break;
            case 'createBot':
                setCreateBot(settings || {});
                break;
            case 'createSystem':
                setCreateSystem(settings || {});
                break;
            case 'subNodeSettings':
                setSubNodeSettings(settings || {});
                break;
            case 'traceSettings':
                setTraceSettings(settings || {});
                break;
            default:
                break;
        }
    };

    // Handle creating bots
    const handleCreateBot = (data) => {
        setCreateBot(data);
    };

    // Handle duplicating nodes
    const duplicateNode = (data) => {
        const node = state.nodes[data.id] || {};
        if (node.type === 'system') {
            setCreateSystem(node);
        } else if (node.type === 'bot') {
            node.id = data.id; // Use correct id
            node.server_id = ''; // Show source
            node.group = 'bot';
            setNodeSettings(undefined); // Hide node settings
            setCreateBot(node); // Show bot creation form
        }
    };

    return (
        <div>
            <DashboardPage />
            <CatalogPage />
            <WorkflowPage />
            <TracePage />
            <SDKPage />

            {createBot && <BotSettings data={createBot} onClose={() => setCreateBot(undefined)} />}
            {createSystem && <SystemSettings data={createSystem} onClose={() => setCreateSystem(undefined)} />}
            {nodeSettings && <NodeSettings nodeType={nodeSettings.type} data={nodeSettings} onClose={() => setNodeSettings(undefined)} />}
            {subNodeSettings && <NodeSettings nodeType={subNodeSettings.type} data={subNodeSettings} onClose={() => setSubNodeSettings(undefined)} />}
            {traceSettings && <NodeSettings nodeType={traceSettings.type === 'bot' ? 'MapperBot' : 'EventQueue'} data={traceSettings} onClose={() => setTraceSettings(undefined)} />}
            {createNode && (
                <div className="createNode flex-row flex-space">
                    {Object.keys(createNode).map((buttonLabel) => (
                        <button key={buttonLabel} type="button" className="theme-button" onClick={createNode[buttonLabel]}>
                            <img className="theme-image-tiny text-middle margin-5" src={`${window.leostaticcdn}images/nodes/${buttonLabel.toLowerCase()}.png`} />
                            {buttonLabel}
                        </button>
                    ))}
                </div>
            )}
            {manageWorkflows && <SavedWorkflows workflows={state.workflows} />}
            {manageSearches && <SavedSearches searches={state.searches} />}
        </div>
    );
}

export default Content;
