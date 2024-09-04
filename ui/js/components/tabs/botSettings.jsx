import React, { useContext, useState, useEffect } from 'react';
import DynamicForm from '../elements/dynamicForm.jsx';
import NodeIcon from '../elements/nodeIcon.jsx';
import refUtil from 'leo-sdk/lib/reference.js';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DataStoreContext } from '../../../stores/dataStore';  // Corrected path for dataStore

const BotSettings = ({ nodeData, data, action, onClose, onSave }) => {
    const { nodes, getNodeHealth, saveCronSettings, getCronInfo } = useContext(DataStoreContext);
    const [state, setState] = useState({
        settingsId: nodeData?.type === 'bot' ? nodeData.id : undefined,
        defaults: {},
        archived: nodes[nodeData?.id]?.archived || false,
        source_lag: '',
        write_lag: '',
        error_limit: '',
        consecutive_errors: '',
        check1: false,
        check2: false,
        check3: false,
        check4: false,
    });

    const { data: nodeHealth } = useQuery(['nodeHealth', nodeData?.id], () => getNodeHealth(nodeData.id), {
        enabled: !!nodeData?.id,
        onSuccess: (health) => {
            setState((prev) => ({
                ...prev,
                source_lag: health?.source_lag / 60 / 1000 || '',
                write_lag: health?.write_lag / 60 / 1000 || '',
                error_limit: health?.error_limit * 100 || '',
                consecutive_errors: health?.consecutive_errors || '',
            }));
        },
    });

    const { data: cronInfo } = useQuery('cronInfo', getCronInfo);

    const saveSettingsMutation = useMutation((newSettings) => saveCronSettings(newSettings), {
        onSuccess: (response) => {
            if (onSave) {
                onSave(response);
            }
        },
        onError: (error) => {
            console.error('Error saving bot settings', error);
        },
    });

    const handleSave = () => {
        const newSettings = {
            id: state.settingsId,
            source_lag: state.source_lag * 60 * 1000,
            write_lag: state.write_lag * 60 * 1000,
            error_limit: state.error_limit / 100,
            consecutive_errors: state.consecutive_errors,
            // Add more fields as needed
        };
        saveSettingsMutation.mutate(newSettings);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setState((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="overflow-auto height-1-1">
            <div className="BotSettings height-1-1">
                <div className="flex-row flex-wrap height-1-1 bottom-padding-40">
                    <div>
                        <DynamicForm
                            className="theme-form"
                            id={refUtil.botRef(state.settingsId).id}
                            form={state.defaults}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ width: '5vw' }}>&nbsp;</div>

                    <div>
                        <DynamicForm
                            className="theme-form"
                            form={state.defaults}
                            onChange={handleChange}
                        />
                        <div className="flow-icons">
                            <NodeIcon className="text-middle" node={{ type: 'bot', icon: nodes[state.settingsId]?.icon }} />
                        </div>
                    </div>

                    <div className="form-button-bar mobile-hide">
                        <button type="button" className="theme-button" onClick={onClose}>
                            Discard Changes
                        </button>
                        <button type="button" className="theme-button-primary" onClick={handleSave}>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotSettings;
