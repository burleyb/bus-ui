import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

// Replace the MobX and Redux setup
const fetchSettings = async () => {
    const response = await fetch('/api/settings/');
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
};

const Content = ({ userSettings, searches, workflows }) => {
    const [dialogState, setDialogState] = useState({});
    const queryClient = useQueryClient(); // Access the query cache

    // Using TanStack Query for fetching settings
    const { data: settings, isLoading, isError } = useQuery(['settings'], fetchSettings);

    useEffect(() => {
        // Assign necessary window functions
        window.showDialog = (dialogType, settings) => {
            setDialogState((prev) => ({ ...prev, [dialogType]: settings || {} }));
        };

        window.createBot = (data) => {
            setDialogState((prev) => ({ ...prev, createBot: data }));
        };

        window.duplicateNode = (data) => {
            const node = settings?.nodes[data.id] || {};
            if (node.type === 'system') {
                setDialogState({ createSystem: node });
            } else if (node.type === 'bot') {
                setDialogState({ createBot: { ...node, id: data.id, server_id: '', group: 'bot' } });
            }
        };

        window.createSystem = (data) => {
            setDialogState({ createSystem: data });
        };

        window.nodeSettings = (data) => {
            setDialogState({ nodeSettings: data });
        };

        window.traceSettings = (data) => {
            setDialogState({ traceSettings: { ...data, zIndex: 10 } });
        };
    }, [settings]);

    const handleSaveBotSettings = (response) => {
        setDialogState({
            nodeSettings: {
                id: `b_${response.refId}`,
                openTab: 'Code',
                label: response.label,
                type: 'bot',
                server_id: response.refId,
            },
            createBot: undefined,
        });
    };

    const handleSaveSystemSettings = (response) => {
        // Invalidate the settings cache so they refresh after system creation
        queryClient.invalidateQueries(['settings']);
        setDialogState({ createSystem: undefined });
    };

    const handleCreateNode = () => {
        setDialogState({
            createNode: {
                Bot: () => {
                    window.createBot({ server_id: '', groups: ['bot', 'cron'] });
                },
                System: () => {
                    window.createSystem({});
                },
            },
        });
    };

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading data</div>;

    return (
        <div className="page-main-wrapper">
            {(() => {
                switch (userSettings.view || 'dashboard') {
                    case 'dashboard':
                        return <DashboardPage />;
                    case 'list':
                        return <CatalogPage searches={searches} />;
                    case 'node':
                        return <WorkflowPage workflows={workflows} />;
                    case 'trace':
                        return <TracePage />;
                    case 'sdk':
                        return <SDKPage />;
                    default:
                        return userSettings.view;
                }
            })()}

            {dialogState.createBot && (
                <BotSettings
                    action="create"
                    data={dialogState.createBot}
                    onSave={handleSaveBotSettings}
                    onClose={() => setDialogState({ createBot: undefined })}
                />
            )}
            {dialogState.createSystem && (
                <SystemSettings
                    action="create"
                    data={dialogState.createSystem}
                    onSave={handleSaveSystemSettings}
                    onClose={() => setDialogState({ createSystem: undefined })}
                />
            )}
            {dialogState.nodeSettings && (
                <NodeSettings
                    nodeType={{ bot: 'AWSBot', queue: 'EventQueue', system: 'System' }[dialogState.nodeSettings.type]}
                    data={dialogState.nodeSettings}
                    onClose={() => setDialogState({ nodeSettings: undefined })}
                />
            )}
            {dialogState.traceSettings && (
                <NodeSettings
                    nodeType={dialogState.traceSettings.type === 'bot' ? 'MapperBot' : 'EventQueue'}
                    data={dialogState.traceSettings}
                    onClose={() => setDialogState({ traceSettings: undefined })}
                />
            )}
            {dialogState.createNode && (
                <div className="createNode flex-row flex-space">
                    {Object.keys(dialogState.createNode).map((buttonLabel) => (
                        <button key={buttonLabel} type="button" className="theme-button" onClick={dialogState.createNode[buttonLabel]}>
                            {buttonLabel}
                        </button>
                    ))}
                </div>
            )}
            {dialogState.manageWorkflows && <SavedWorkflows workflows={workflows} />}
            {dialogState.manageSearches && <SavedSearches searches={searches} />}
        </div>
    );
};

export default Content;
