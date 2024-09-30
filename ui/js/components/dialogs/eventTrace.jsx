import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import moment from 'moment';
import numeral from 'numeral';
import Tree from '../elements/tree.jsx'; // Assuming Tree component exists
import { DataContext } from '../../stores/DataContext.jsx'; // Use React Context for state management
import { useLeoKit } from './LeoKit.jsx'; // Assuming a custom hook for dialog/alert management

// Fetch trace data based on the event ID
const fetchTraceData = async (id) => {
    const { data } = await axios.get(`/api/trace/${id}`);
    return data;
};

function EventTrace({ data, onClose }) {
    const { state } = useContext(DataContext); // Access global state via context
    const { alert } = useLeoKit(); // Custom hook for handling alerts
    const [source, setSource] = useState({});
    const [settings, setSettings] = useState({
        collapsed: { left: [], right: [] }
    });
    const [collapsed, setCollapsed] = useState({ left: [], right: [] });

    useEffect(() => {
        if (data) {
            parseData(data.response);
        }

        return () => {
            onClose(); // Close the modal when the component is unmounted
        };
    }, [data, onClose]);

    // Parse event data and set it to state
    const parseData = (response) => {
        let nodeData = {};
        let collapsedState = { left: [], right: [] };
        let event = response.event;

        nodeData[event.id] = event;

        let sourceData = {
            below: [moment(event.timestamp).format('MM/DD/YY h:mm:ss a')],
            checkpoint: event.checkpoint || event.kinesis_number,
            icon: 'queue.png',
            id: event.id,
            is_root: true,
            label: (state.nodes[event.id] || {}).label,
            payload: event.payload,
            server_id: event.server_id,
            type: event.type,
        };

        setSource(sourceData);
        setCollapsed(collapsedState);
    };

    // Formatting time in seconds for display
    const formatTime = (milliseconds) => {
        return (
            numeral(Math.floor(milliseconds / 1000)).format('00:00:00') +
            numeral((milliseconds / 1000) % 1).format('.0')
        )
            .replace(/^0:/, '')
            .replace(/^00:/g, '')
            .replace(/^00\./g, '.') + 's';
    };

    // Handle link click to load trace data
    const handleLinkClick = (id) => {
        fetchTraceData(id)
            .then((response) => {
                const newSource = updateKids(response);
                setSource(newSource);
            })
            .catch((error) => {
                alert(`Failure calling trace on ${state.nodes[id]?.label || 'unknown'}`, 'error');
            });
    };

    // Recursively update kids data
    const updateKids = (source) => {
        if (source.kids) {
            source.kids = source.kids.map((kid) => {
                if (kid.type === 'queue') {
                    kid.relation = { below: [formatTime(kid.lag || 0)] };
                }
                return updateKids(kid);
            });
        }
        return source;
    };

    return (
        <div className="event-trace eventTrace">
            <Tree
                id="traceTree"
                root={source.id}
                source={source}
                settings={settings}
                collapsed={collapsed}
                onLinkClick={handleLinkClick}
                force="true"
            />
        </div>
    );
}

export default EventTrace;
