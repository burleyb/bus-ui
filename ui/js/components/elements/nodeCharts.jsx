import React, { useContext } from 'react';
import { DataContext } from '../../stores/DataContext'; // Assuming you have a React Context for global state
import NodeChart from '../elements/nodeChart.jsx';

const NodeCharts = ({ nodeType, className, data, lastRead, interval, showHeader, botId, queueId }) => {
    const { chartSettings } = useContext(DataContext); // Replacing Redux with React Context

    const nodeCharts = {
        queue: ['Events Written', 'Events Read', 'Source Lag', 'analytics'],
        bot: ['Execution Count', 'Error Count', 'Execution Time'],
        queue_read: ['Events In Queue', 'Events Read', 'Read Source Lag'],
        queue_write: ['Events Written', 'Write Source Lag'],
        system: ['Events Written', 'Events Read', 'Source Lag'],
        system_read: ['Events Read', 'Read Source Lag'],
        system_write: ['Events Written', 'Write Source Lag'],
    };

    const selectedNodeType = nodeType === 'event' ? 'queue' : nodeType;

    return (
        <div className={className || ''}>
            {(nodeCharts[selectedNodeType] || []).map((chartKey, index) => {
                const chartData = [];
                const compare = [];

                // Populate chart data and compare data
                (chartSettings[chartKey]?.fields || []).forEach((field) => {
                    chartData.push(data[field]);
                    compare.push((data.compare || {})[field]);
                });

                return (
                    <NodeChart
                        key={chartKey}
                        data={chartData}
                        compare={compare}
                        lastRead={lastRead}
                        chartKey={chartKey}
                        interval={interval}
                        showHeader={showHeader}
                        className={`width-1-${nodeCharts[selectedNodeType].length}`}
                        nodeType={selectedNodeType}
                        botId={botId}
                        queueId={queueId}
                        isLast={index === (nodeCharts[selectedNodeType] || []).length - 1}
                    />
                );
            })}
        </div>
    );
};

export default NodeCharts;
