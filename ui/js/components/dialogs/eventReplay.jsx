import React, { useState, useEffect, useContext } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import refUtil from 'leo-sdk/lib/reference.js';
import { DataContext } from '../../../stores/DataContext'; // Assuming React Context is used for global state
import { useLeoKit } from './useLeoKit';
import moment from 'moment';

function fetchBots(event) {
    const rangeCount = window.timePeriod.interval.split('_');
    const url = `api/dashboard/${encodeURIComponent(event)}?range=${rangeCount[0]}&count=${rangeCount[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`;
    return axios.get(url).then((response) => response.data.bots.read);
}

function triggerReplay(data) {
    return axios.post(`${window.api}/cron/save`, JSON.stringify(data));
}

function EventReplay({ detail, onClose }) {
    const { state } = useContext(DataContext); // Use React Context for global state
    const { alert, confirm } = useLeoKit(); // Using useLeoKit for dialogs
    const [bots, setBots] = useState({});
    const queryClient = useQueryClient(); // For TanStack Query cache

    const { data: botData, isError } = useQuery(
        ['bots', detail.event],
        () => fetchBots(detail.event),
        {
            onSuccess: (data) => setBots(data),
            onError: () => alert('Failure to get data', 'error'),
        }
    );

    const mutation = useMutation(
        triggerReplay,
        {
            onSuccess: (data) => {
                queryClient.invalidateQueries(['bots']); // Invalidate bot query
                alert(`Replay triggered successfully`, 'info');
            },
            onError: () => {
                alert(`Failure triggering replay`, 'error');
            },
        }
    );

    const { control, handleSubmit } = useForm(); // Initializing react-hook-form

    const onReplaySubmit = (formData) => {
        if (!formData.botId) {
            alert('No bot selected to replay', 'warning');
            return false;
        }

        const checkpoint = detail.eid.slice(0, -1) + (detail.eid.slice(-1) - 1);
        const botId = refUtil.botRef(formData.botId).id;

        confirm(`Replay bot "${state.nodes[formData.botId].label}".`, () => {
            const replayData = {
                id: botId,
                checkpoint: { [`queue:${detail.event}`]: checkpoint },
                executeNow: true,
            };

            mutation.mutate(replayData);
        });
    };

    useEffect(() => {
        alert(
            <div className="EventReplayDialog theme-form">
                <form onSubmit={handleSubmit(onReplaySubmit)}>
                    <div>
                        <label>Select Bot</label>
                        <Controller
                            name="botId"
                            control={control}
                            render={({ field }) => (
                                <select {...field} className="theme-form-input">
                                    {Object.keys(bots).map((botId) => {
                                        const bot = state.nodes[botId] || bots[botId];
                                        return !bot.archived ? (
                                            <option key={botId} value={botId}>
                                                {bot.label}
                                            </option>
                                        ) : null;
                                    })}
                                </select>
                            )}
                        />
                    </div>
                    <div className="form-button-bar">
                        <button type="submit" className="theme-button-primary">
                            Replay
                        </button>
                        <button type="button" className="theme-button" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>,
            'Replay Event'
        );
    }, [botData, control, handleSubmit, onClose]);

    if (isError) {
        return null; // Error handling
    }

    return null; // Return null since the modal content is handled by useLeoKit
}

export default EventReplay;
