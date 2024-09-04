import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import TimeSlider from '../elements/timeSlider.jsx';
import NodeCharts from '../elements/nodeCharts.jsx';

const fetchNodeData = async ({ queryKey }) => {
    const [_, nodeId, range, count, endTime] = queryKey;
    const response = await fetch(
        `api/dashboard/${encodeURIComponent(nodeId)}?range=${range}&count=${count}&timestamp=${encodeURIComponent(endTime)}`
    );
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

const DetailsPane = ({ userSettings, dataStore, displayPaused }) => {
    const [tabIndex, setTabIndex] = useState(undefined);
    const [offset, setOffset] = useState(0);
    const [botId, setBotId] = useState(undefined);
    const [queueId, setQueueId] = useState(undefined);
    const [node, setNode] = useState(undefined);
    const [range, setRange] = useState('minute');
    const [count, setCount] = useState(15);

    useEffect(() => {
        init();
    }, [userSettings.selected, range, count, offset]);

    const init = () => {
        if (!dataStore.nodes || Object.keys(dataStore.nodes).length === 0) {
            return;
        }

        let botId, queueId, node;
        userSettings.selected.forEach((selected) => {
            const nodeData = dataStore.nodes[selected];
            if (nodeData.type === 'bot') {
                botId = selected;
            } else {
                queueId = selected;
            }
        });

        node = botId ? dataStore.nodes[botId] : dataStore.nodes[queueId];
        setBotId(botId);
        setQueueId(queueId);
        setNode(node);
    };

    const { data, isLoading, error } = useQuery(
        ['nodeData', botId || queueId, range, count, offset],
        fetchNodeData,
        {
            enabled: !!(botId || queueId) && !document.hidden && !displayPaused,
            refetchInterval: 10000,
        }
    );

    const handleTabClick = (index) => {
        setTabIndex(index);
    };

    const handleToggleDetails = () => {
        dataStore.changeDetailsBool(false);
    };

    const handleChange = (values) => {
        setCount(values.count);
        setOffset(values.offset);
    };

    if (isLoading) return <div className="theme-spinner"></div>;
    if (error) return <div>Error fetching data</div>;

    if (!node) {
        return (
            <div className="theme-color-warning">
                <div className="theme-icon-close" onClick={handleToggleDetails}></div>
                Please make a selection to see details
            </div>
        );
    }

    const tabs = [
        {
            botId,
            label: node.label,
            icon: node.type,
            type: node.type,
            data,
        },
    ];

    return (
        <div className="flex-column">
            <div className="details-pane-bottom">
                <div className="theme-icon-close" onClick={handleToggleDetails}></div>
                <div className="theme-tabs">
                    <ul>
                        {tabs.map((tab, index) => (
                            <li key={index} className={tabIndex === index ? 'active' : ''} onClick={() => handleTabClick(index)}>
                                <img src={`${window.leostaticcdn}images/nodes/${tab.icon}.png`} alt={tab.label} />
                                <span>{tab.label}</span>
                            </li>
                        ))}
                    </ul>
                    <div>
                        {tabs.map((tab, index) =>
                            tabIndex === index ? (
                                <div key={index} className="active">
                                    <div style={{ marginTop: '-1em', height: 20 }}>
                                        <TimeSlider onChange={handleChange} />
                                    </div>
                                    <NodeCharts
                                        className="node-charts"
                                        data={tab.data}
                                        nodeType={tab.type}
                                        interval={range}
                                        showHeader="true"
                                        botId={tab.botId}
                                    />
                                </div>
                            ) : null
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsPane;
