import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NodeChart from '../elements/nodeChart.jsx';
import NodeCharts from '../elements/nodeCharts.jsx';
import TimePicker from '../elements/timePicker.jsx';
import { DataContext } from '../../../stores/DataContext'; // Assuming DataContext for global state
import moment from 'moment';

const timePeriods = { 'minute_15': '15m', 'hour': '1h', 'hour_6': '6h', 'day': '1d', 'week': '1w' };

function BotDashboard({ nodeData, onClose }) {
  const { state } = useContext(DataContext);
  const queryClient = useQueryClient();
  
  const [interval, setInterval] = useState('minute_15');
  const [isPaused, setIsPaused] = useState((nodeData.settings || {}).paused);

  const fetchDashboardData = async () => {
    const rangeCount = interval.split('_');
    const { data } = await axios.get(
      `api/dashboard/${encodeURIComponent(nodeData.id)}?range=${rangeCount[0]}&count=${rangeCount[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`
    );
    return data;
  };

  const { data, isFetching } = useQuery(['dashboard', nodeData.id, interval], fetchDashboardData, {
    refetchInterval: 10000,
  });

  const changeInterval = (newInterval) => {
    const filteredInterval = Object.keys(timePeriods).find((tp) => timePeriods[tp] === newInterval);
    setInterval(filteredInterval);
  };

  useEffect(() => {
    return () => {
      queryClient.cancelQueries(['dashboard', nodeData.id, interval]);
    };
  }, [nodeData.id, interval, queryClient]);

  let periodOfEvents = '';
  switch (interval) {
    case 'minute_15':
      periodOfEvents = '(45 Minutes)';
      break;
    case 'hour':
      periodOfEvents = '(3 Hours)';
      break;
    case 'hour_6':
      periodOfEvents = '(18 Hours)';
      break;
    case 'day':
      periodOfEvents = '(3 Days)';
      break;
    case 'week':
      periodOfEvents = '(3 Weeks)';
      break;
  }

  return (
    <div className="node-dashboard">
      <div className="flex-column height-1-1">
        <div className="flex-row flex-wrap flex-spread">
          <div className="flex-grow"></div>
          <TimePicker active={timePeriods[interval]} onClick={changeInterval} />
        </div>

        <div className="flex-row overflow-auto flex-grow flex-wrap flex-shrink position-relative" style={{ maxHeight: 'calc(100% - 210px)' }}>
          <div className="flex-grow">
            <table className="theme-table width-1-1 mobile-flex-table">
              <caption>Events Read by Bot</caption>
              <thead>
                {data?.queues?.read && Object.keys(data.queues.read).length > 0 ? (
                  <tr>
                    <th>Queues</th>
                    <th></th>
                    <th></th>
                    <th>Events Read</th>
                    <th>Last Read</th>
                    <th>Lag Time</th>
                    <th>Lag Events</th>
                  </tr>
                ) : (
                  <tr>
                    <td></td>
                  </tr>
                )}
              </thead>
              <tbody>
                {data?.queues?.read && Object.keys(data.queues.read).length > 0 ? (
                  Object.keys(data.queues.read).map((queueId) => {
                    const queue = data.queues.read[queueId];
                    const node = state.nodes[queue.id];
                    if (!node || node.status === 'archived' || node.archived) return null;

                    const eventsRead = queue.reads.reduce((total, read) => total + (read.value || 0), 0);
                    const lastReadLag = queue.last_read_lag ? `${moment.duration(queue.last_read_lag).humanize()} ago`.replace('a few ', '') : '';
                    const lagTime = queue.last_event_source_timestamp_lag
                      ? `${moment.duration(queue.last_event_source_timestamp_lag).humanize()} ago`.replace('a few ', '')
                      : '';

                    return (
                      <tr key={queueId}>
                        <td className="no-wrap">
                          <img src={`${window.leostaticcdn}images/nodes/queue.png`} alt="queue" />
                          <a onClick={() => window.nodeSettings({ id: queue.id, label: state.nodes[queue.id].label, server_id: queueId, type: 'queue' })}>
                            {state.nodes[queue.id].label}
                          </a>
                        </td>
                        <td onClick={() => window.jumpToNode(queue.id)}>
                          <a>
                            <i className="icon-flow-branch"></i>
                          </a>
                        </td>
                        <td>
                          <NodeChart data={queue.values} chartKey="Events In Queue" interval={interval} lastRead={queue.last_read_event_timestamp || 0} className="width-1-1" />
                        </td>
                        <td>{eventsRead}</td>
                        <td>{lastReadLag}</td>
                        <td>{lagTime}</td>
                        <td>{queue.lagEvents}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No Sources
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!isFetching ? (
            <div className="margin-10 mobile-hide">&nbsp;</div>
          ) : (
            <div className="theme-spinner-large"></div>
          )}

          <div className="flex-grow">
            <table className="theme-table width-1-1 mobile-flex-table">
              <caption>Events Written by Bot</caption>
              <thead>
                {data?.queues?.write && Object.keys(data.queues.write).length > 0 ? (
                  <tr>
                    <th>Queues</th>
                    <th></th>
                    <th></th>
                    <th>{`Events Written ${periodOfEvents}`}</th>
                  </tr>
                ) : (
                  <tr>
                    <td></td>
                  </tr>
                )}
              </thead>
              <tbody>
                {data?.queues?.write && Object.keys(data.queues.write).length > 0 ? (
                  Object.keys(data.queues.write).map((queueId) => {
                    const queue = data.queues.write[queueId];
                    const node = state.nodes[queue.id];
                    if (!node || node.status === 'archived' || node.archived) return null;

                    const eventsWritten = queue.values.reduce((total, value) => total + (value.value || 0), 0);

                    return (
                      <tr key={queueId}>
                        <td className="no-wrap">
                          <img src={`${window.leostaticcdn}images/nodes/queue.png`} alt="queue" />
                          <a onClick={() => window.nodeSettings({ id: queue.id, label: state.nodes[queue.id].label, server_id: queueId, type: 'queue' })}>
                            {state.nodes[queue.id].label}
                          </a>
                        </td>
                        <td onClick={() => window.jumpToNode(queue.id)}>
                          <a>
                            <i className="icon-flow-branch"></i>
                          </a>
                        </td>
                        <td>
                          <NodeChart data={queue.values} chartKey="Events Written" interval={interval} className="width-1-1" />
                        </td>
                        <td>{eventsWritten}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No Destinations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {data && <NodeCharts className="node-charts" data={data} nodeType="bot" interval={interval} showHeader="true" botId={nodeData.id} />}
      </div>
    </div>
  );
}

export default BotDashboard;
