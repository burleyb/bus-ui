import React from 'react';
import NodeChart from '../elements/nodeChart.jsx';

const NodeCharts = ({ nodeType, data, chartSettings, lastRead, interval, showHeader, className, botId, queueId }) => {
  const nodeCharts = {
    queue:        ['Events Written', "Events Read", "Source Lag", "analytics"],
    bot:          ['Execution Count', 'Error Count', 'Execution Time'],
    queue_read:   ["Events In Queue", 'Events Read', "Read Source Lag"],
    queue_write:  ['Events Written', "Write Source Lag"],
    system:       ['Events Written', "Events Read", "Source Lag"],
    system_read:  ["Events Read", "Read Source Lag"],
    system_write: ['Events Written', "Write Source Lag"],
  };

  const resolvedNodeType = nodeType === 'event' ? 'queue' : nodeType;
  const charts = nodeCharts[resolvedNodeType] || [];

  return (
    <div className={className || ''}>
      {charts.map((chartKey, index) => {
        const chartData = [];
        const compare = [];

        chartSettings[chartKey].fields.forEach((field) => {
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
            className={`width-1-${charts.length}`}
            nodeType={resolvedNodeType}
            botId={botId}
            queueId={queueId}
            isLast={index === charts.length - 1}
          />
        );
      })}
    </div>
  );
};

export default NodeCharts;
