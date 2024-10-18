import React, { useState, useEffect, useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import TimePeriod from '../elements/timePeriod.jsx';
import TimeSlider from '../elements/timeSlider.jsx';
import NodeCharts from '../elements/nodeCharts.jsx';
import axios from 'axios';
import moment from 'moment';

function DetailsPane({ userSettings, displayPaused }) {
    const state = useData(); 
    const [tabs, setTabs] = useState([]);
    const [tabIndex, setTabIndex] = useState(undefined);
    const [node, setNode] = useState({});
    const [range, setRange] = useState('');
    const [count, setCount] = useState(0);
    const [interval, setInterval] = useState('');
    const [end, setEnd] = useState('');
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        init();
    }, []);

    const init = () => {
        if (!state.nodes || Object.keys(state.nodes).length === 0) {
            setTimeout(init, 100);
            return;
        }

        const [rangeVal, countVal] = state.timePeriod.interval.split('_');
        setEnd(state.timePeriod.end);
        setInterval(state.timePeriod.interval);
        setRange(rangeVal);
        setCount(parseInt(countVal));
        setOffset(0);
        setTabIndex(undefined);

        let botId, queueId;
        userSettings.selected.forEach((selected) => {
            const node = state.nodes[selected] || {};

            if (node.type === 'bot') {
                botId = selected;
            } else if (node.type === 'system') {
                queueId = `e_${node.queue}`;
            } else {
                queueId = selected;
            }
        });

        setNode(botId ? state.nodes[botId] : state.nodes[queueId]);
        refreshData(botId, queueId);
    };

    const refreshData = (botId, queueId) => {
        if ((botId || queueId) && !document.hidden && !displayPaused) {
            const endTime = moment(state.timePeriod.end).valueOf();
            // Replace with API request using Axios
            axios.get(`${state.api}/api/nodes/stats`, {
                params: {
                    botId,
                    queueId,
                    endTime,
                    interval: state.timePeriod.interval,
                },
            })
                .then((response) => {
                    const data = response.data;
                    // Handle the fetched data (e.g., update the state)
                    console.log('Fetched data', data);
                })
                .catch((error) => {
                    console.error('Error fetching node stats', error);
                });
        }
    };

    const toggleTabs = (index) => {
        setTabIndex(index);
    };

    return (
        <div>
            <div className="theme-tabs">
                <ul>
                    {tabs.map((tab, index) => (
                        <li
                            key={index}
                            className={tabIndex === index ? 'active' : ''}
                            onClick={() => toggleTabs(index)}
                            title={`${(tab.type || '').replace('_', ' ').capitalize()}: ${tab.label}`}
                        >
                            <img src={`${window.leostaticcdn}images/nodes/${tab.icon}.png`} />
                            <span>{tab.label}</span>
                        </li>
                    ))}
                </ul>
                <div>
                    {tabs.map((tab, index) => (
                        tabIndex === index && (
                            <div key={index} className="active">
                                <div style={{ marginTop: '-1em', height: 20 }}>
                                    <TimeSlider onChange={() => {/* Handle slider change */}} />
                                    {tab.checkpoint && (
                                        <div className="event-timestamp pull-right text-ellipsis">
                                            <label>Event ID</label>
                                            <a onClick={() => {/* Handle event click */}}>{tab.checkpoint}</a>
                                        </div>
                                    )}
                                </div>
                                <NodeCharts
                                    className="node-charts"
                                    data={tab.data}
                                    nodeType={tab.type}
                                    interval={interval}
                                    showHeader="true"
                                    lastRead={tab.lastRead}
                                    botId={tab.botId}
                                    queueId={tab.queueId}
                                />
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DetailsPane;
