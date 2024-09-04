import React, { useState, useEffect } from 'react';
import moment from 'moment';
import NodeChart from '../elements/nodeChart.jsx';
import NodeCharts from '../elements/nodeCharts.jsx';
import TimePicker from '../elements/timePicker.jsx';
import { useDataStore } from '../../../stores/dataStore';  // Assuming context is set up for dataStore

const timePeriods = { 'minute_15':'15m', 'hour':'1h', 'hour_6':'6h', 'day':'1d', 'week':'1w' };

const BotDashboard = ({ nodeData, onClose }) => {
    const { dataStore } = useDataStore();  // Retrieve dataStore from context
    const [interval, setInterval] = useState('minute_15');
    const [isPaused, setIsPaused] = useState((nodeData.settings || {}).paused);
    const [data, setData] = useState(null);

    useEffect(() => {
        let reloadTimeout;
        let currentRequest;
        
        const refreshData = () => {
            if (currentRequest) {
                currentRequest.abort();
            }
            const range_count = interval.split('_');
            currentRequest = $.get(`api/dashboard/${encodeURIComponent(nodeData.id)}?range=${range_count[0]}&count=${range_count[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`, (result) => {
                setData(result);
            }).always((xhr, status) => {
                if (status !== "abort") {
                    clearTimeout(reloadTimeout);
                    reloadTimeout = setTimeout(refreshData, 10000);
                }
            });
        };

        refreshData();  // Initial fetch

        return () => {
            clearTimeout(reloadTimeout);
            if (currentRequest) {
                currentRequest.abort();
            }
        };
    }, [interval, nodeData.id]);

    const handleIntervalChange = (newInterval, event) => {
        if (event) {
            event.preventDefault();
        }
        const selectedInterval = Object.keys(timePeriods).find(tp => timePeriods[tp] === newInterval);
        setInterval(selectedInterval);
    };

    let periodOfEvents = '';
    switch (interval) {
        case 'minute_15': periodOfEvents = '(45 Minutes)'; break;
        case 'hour': periodOfEvents = '(3 Hours)'; break;
        case 'hour_6': periodOfEvents = '(18 Hours)'; break;
        case 'day': periodOfEvents = '(3 Days)'; break;
        case 'week': periodOfEvents = '(3 Weeks)'; break;
        default: break;
    }

    return (
        <div className="node-dashboard">
            <div className="flex-column height-1-1">

                <div className="flex-row flex-wrap flex-spread">
                    <div className="flex-grow"></div>
                    <TimePicker active={timePeriods[interval]} onClick={handleIntervalChange} />
                </div>

                <div className="flex-row overflow-auto flex-grow flex-wrap flex-shrink position-relative" style={{ maxHeight: 'calc(100% - 210px)'}}>
                    {/* Events Read by Bot */}
                    <div className="flex-grow">
                        <table className="theme-table width-1-1 mobile-flex-table">
                            <caption>Events Read by Bot</caption>
                            <thead>
                                {
                                    Object.keys(((data || {}).queues || {}).read || {}).length === 0
                                        ? <tr><td></td></tr>
                                        : (<tr>
                                            <th>Queues</th>
                                            <th></th>
                                            <th></th>
                                            <th>Events Read</th>
                                            <th>Last Read</th>
                                            <th>Lag Time</th>
                                            <th>Lag Events</th>
                                        </tr>)
                                }
                            </thead>
                            <tbody>
                                {
                                    !data || Object.keys((data.queues || {}).read || {}).length === 0
                                        ? (<tr><td colSpan="8" className="text-center">No Sources</td></tr>)
                                        : Object.keys(data.queues.read).map(queueId => {
                                            const queue = data.queues.read[queueId];
                                            const node = dataStore.nodes[queue.id];
                                            if (!node || node.status === 'archived' || node.archived) {
                                                return false;
                                            }
                                            const eventsRead = queue.reads.reduce((total, read) => total + (read.value || 0), 0);
                                            const lastReadLag = queue.last_read_lag ? `${moment.duration(queue.last_read_lag).humanize()} ago`.replace("a few ", "") : '';
                                            const lagTime = queue.last_event_source_timestamp_lag ? `${moment.duration(queue.last_event_source_timestamp_lag).humanize()} ago`.replace("a few ", "") : '';

                                            return (
                                                <tr key={queueId} className="theme-tool-tip-wrapper">
                                                    <td className="no-wrap">
                                                        <img src={window.leostaticcdn + 'images/nodes/queue.png'} alt="queue icon" />
                                                        <a onClick={() => {
                                                            onClose && onClose();
                                                            window.nodeSettings({
                                                                id: queue.id,
                                                                label: dataStore.nodes[queue.id].label,
                                                                server_id: queueId,
                                                                type: 'queue'
                                                            });
                                                        }}>
                                                            {dataStore.nodes[queue.id].label}
                                                        </a>
                                                    </td>
                                                    <td onClick={() => window.jumpToNode(queue.id, onClose)}>
                                                        <a><i className="icon-flow-branch"></i></a>
                                                    </td>
                                                    <td className="position-relative">
                                                        <div className="theme-tool-tip">
                                                            <span>{dataStore.nodes[queue.id].label}</span>
                                                            <div><label>Events Read</label><span>{eventsRead}</span></div>
                                                            <div><label>Last Read</label><span>{lastReadLag}</span></div>
                                                            <div><label>Lag Time</label><span>{lagTime}</span></div>
                                                            <div><label>Lag Events</label><span>{queue.lagEvents}</span></div>
                                                        </div>
                                                        <NodeChart 
                                                            data={queue.values} 
                                                            chartKey="Events In Queue" 
                                                            interval={interval} 
                                                            className="width-1-1" 
                                                            lastRead={queue.last_read_event_timestamp || 0} 
                                                        />
                                                    </td>
                                                    <td>{eventsRead}</td>
                                                    <td>{lastReadLag}</td>
                                                    <td>{lagTime}</td>
                                                    <td>{queue.lagEvents}</td>
                                                </tr>
                                            );
                                        })
                                }
                            </tbody>
                        </table>
                    </div>

                    {/* Events Written by Bot */}
                    <div className="flex-grow">
                        <table className="theme-table width-1-1 mobile-flex-table">
                            <caption>Events Written by Bot</caption>
                            <thead>
                                {
                                    Object.keys(((data || {}).queues || {}).write || {}).length === 0
                                        ? <tr><td></td></tr>
                                        : (<tr>
                                            <th>Queues</th>
                                            <th></th>
                                            <th></th>
                                            <th>{`Events Written ${periodOfEvents}`}</th>
                                        </tr>)
                                }
                            </thead>
                            <tbody>
                                {
                                    !data || Object.keys((data.queues || {}).write || {}).length === 0
                                        ? (<tr><td colSpan="5" className="text-center">No Destinations</td></tr>)
                                        : Object.keys(data.queues.write).map(queueId => {
                                            const queue = data.queues.write[queueId];
                                            const node = dataStore.nodes[queue.id];
                                            if (!node || node.status === 'archived' || node.archived) {
                                                return false;
                                            }
                                            const eventsWritten = queue.values.reduce((total, value) => total + (value.value || 0), 0);

                                            return (
                                                <tr key={queueId} className="theme-tool-tip-wrapper">
                                                    <td className="no-wrap">
                                                        <img src={window.leostaticcdn + 'images/nodes/queue.png'} alt="queue icon" />
                                                        <a onClick={() => {
                                                            onClose && onClose();
                                                            window.nodeSettings({
                                                                id: queue.id,
                                                                label: dataStore.nodes[queue.id].label,
                                                                server_id: queueId,
                                                                type: 'queue'
                                                            });
                                                        }}>
                                                            {dataStore.nodes[queue.id].label}
                                                        </a>
                                                    </td>
                                                    <td onClick={() => window.jumpToNode(queue.id, onClose)}>
                                                        <a><i className="icon-flow-branch"></i></a>
                                                    </td>
                                                    <td className="position-relative">
                                                        <div className="theme-tool-tip">
                                                            <span>{dataStore.nodes[queue.id].label}</span>
                                                            <div><label>Events Written</label><span>{eventsWritten}</span></div>
                                                        </div>
                                                        <NodeChart 
                                                            data={queue.values} 
                                                            chartKey="Events Written" 
                                                            interval={interval} 
                                                            className="width-1-1" 
                                                        />
                                                    </td>
                                                    <td>{eventsWritten}</td>
                                                </tr>
                                            );
                                        })
                                }
                            </tbody>
                        </table>
                    </div>

                </div>

                {
                    data && <NodeCharts className="node-charts" data={data} nodeType="bot" interval={interval} showHeader="true" botId={nodeData.id} />
                }

            </div>
        </div>
    );
};

export default BotDashboard;
