import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import refUtil from 'leo-sdk/lib/reference.js';
import { DataContext } from '../../../stores/DataContext'; // Assuming React Context is used for global state
import { useLeoKit } from './useLeoKit'; // Assuming a custom hook for LeoKit dialogs/alerts
import moment from 'moment';

function fetchBots(event) {
    const rangeCount = window.timePeriod.interval.split('_');
    const url = `api/dashboard/${encodeURIComponent(event)}?range=${rangeCount[0]}&count=${rangeCount[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`;
    return axios.get(url).then((response) => response.data.bots.read);
}

function resubmitEvent(data) {
    return axios.post(`${window.api}/cron/save`, JSON.stringify(data));
}

function EventResubmit({ detail, onClose }) {
    const { state } = useContext(DataContext); // Use React Context for global state
    const { alert, confirm } = useLeoKit(); // Assuming custom hook for modals/alerts
    const queryClient = useQueryClient();

    const { data: bots = {}, isError } = useQuery(
        ['bots', detail.event],
        () => fetchBots(detail.event),
        {
            onError: () => alert('Failure to get data', 'error'),
        }
    );

    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: {
            payload: JSON.stringify(detail.payload, null, 2),
            botId: detail.id,
            queue: detail.event,
        },
    });

    const payloadValue = watch('payload');

    const mutation = useMutation(
        resubmitEvent,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['bots']);
                alert('Resubmit triggered successfully', 'info');
            },
            onError: () => {
                alert('Failure triggering resubmit', 'error');
            },
        }
    );

    const onSubmit = (formData) => {
        const botId = formData.botId;
        if (!botId) {
            alert('No bot selected to resubmit', 'warning');
            return false;
        }

        confirm(`Resubmit event to queue: "${formData.queue}" by botId: "${botId}".`, () => {
            const payload = JSON.parse(formData.payload);
            payload.original_eid = detail.eid;

            const data = {
                botId: refUtil.botRef(botId).id,
                queue: formData.queue,
                payload,
            };

            mutation.mutate(data);
        });
    };

    const taStyle = {
        margin: '5px 0px 15px',
        width: '750px',
        height: '255px',
    };

    useEffect(() => {
        if (isError) {
            alert('Error fetching bots data', 'error');
        }
    }, [isError, alert]);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="EventResubmitDialog theme-form">
                <div>
                    <label>Edit Event</label>
                    <textarea
                        {...register('payload')}
                        style={taStyle}
                    />
                    <input type="hidden" {...register('botId')} />
                    <input type="hidden" {...register('queue')} />
                </div>
                <div className="form-button-bar">
                    <button type="submit" className="theme-button-primary">
                        Resubmit
                    </button>
                    <button type="button" className="theme-button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
}

export default EventResubmit;
