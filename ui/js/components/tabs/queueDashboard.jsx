import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import NodeCharts from '../elements/nodeCharts.jsx';
import NodeChart from '../elements/nodeChart.jsx';
import NodeIcon from '../elements/nodeIcon.jsx';
import TimePicker from '../elements/timePicker.jsx';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const timePeriods = { 'minute_15': '15m', 'hour': '1h', 'hour_6': '6h', 'day': '1d', 'week': '1w' };

const QueueDashboard = ({ nodeData, onClose }) => {
  const { nodes } = useContext(DataContext);
  const [interval, setInterval] = useState('minute_15');
  const [data, setData] = useState(null);
  const [lagEvents, setLagEvents] = useState({});

  const nodeId = nodeData.id;
  const node = nodes[nodeId] || nodeData || {};

  // Function to fetch data from the API
  const fetchData = async () => {
    const [range, count] = interval.split('_');
    const response = await axios.get(
      `api/dashboard/${encodeURIComponent(nodeId)}?range=${range}&count=${count || 1}&timestamp=${encodeURIComponent(moment().format())}`
    );
    return response.data;
  };

  const { data: queryData, refetch } = useQuery(['dashboardData', nodeId, interval], fetchData, {
    refetchInterval: 10000, // Poll every 10 seconds
  });

  useEffect(() => {
    if (queryData) {
      setData(queryData);
    }
  }, [queryData]);

  const handleChangeInterval = (newInterval) => {
    setInterval(newInterval);
    refetch();
  };

  const handleLagEvents = (refId, eventCount) => {
    setLagEvents((prevLagEvents) => ({
      ...prevLagEvents,
      [refId]: eventCount,
    }));
  };

  return (
    <div className="node-dashboard">
      <div className="flex-column height-1-1">
        <div className="clear-fix flex-row flex-spread">
          <div className="node-name">
            <small> Last event written {node.latest_write ? moment(node.latest_write).fromNow() : ': unknown'}</small>
          </div>

          <div className="flex-grow"></div>

          <TimePicker active={timePeriods[interval]} onClick={handleChangeInterval} />
        </div>

        <div className="flex-row overflow-auto flex-grow flex-wrap flex-shrink position-relative" style={{ maxHeight: 'calc(100% - 210px)' }}>
          <div className="flex-grow">
            <table className="theme-table width-1-1 mobile-flex-table">
              <caption>Events Written by a Bot to this {node.type}</caption>
              <thead>
                {!data || Object.keys(data.bots.write).length === 0 ? (
                  <tr><td /></tr>
                ) : (
                  <tr>
                    <th>Bots</th>
                    <th></th>
                    <th></th>
                    <th>Events Written</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {!data || Object.keys(data.bots.write).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No Sources</td>
                  </tr>
                ) : (
                  Object.keys(data.bots.write).map((botId) => {
                    const bot = data.bots.write[botId];
                    if (!nodes[bot.id] || nodes[bot.id].status === 'archived' || nodes[bot.id].archived) {
                      return false;
                    }

                    const eventsWritten = bot.values.reduce((total, value) => total + (value.value || 0), 0);

                    return (
                      <tr key={botId} className="theme-tool-tip-wrapper">
                        <td className="no-wrap">
                          <NodeIcon node={bot.id} />
                          <a onClick={() => {
                            onClose && onClose();
                            window.nodeSettings({
                              id: bot.id,
                              label: nodes[bot.id].label,
                              server_id: botId,
                              type: 'bot'
                            });
                          }}>{nodes[bot.id].label}</a>
                        </td>
                        <td onClick={() => window.jumpToNode(bot.id, onClose)}>
                          <a><i className="icon-flow-branch"></i></a>
                        </td>
                        <td className="position-relative">
                          <div className="theme-tool-tip">
                            <span>{nodes[bot.id].label}</span>
                            <div>
                              <label>Events Written</label>
                              <span>{eventsWritten}</span>
                            </div>
                          </div>
                          <NodeChart data={bot.values} chartKey="Events Written" interval={interval} className="width-1-1" />
                        </td>
                        <td>{eventsWritten}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!data ? (
            <div className="theme-spinner-large"></div>
          ) : (
            <div className="margin-10 mobile-hide">&nbsp;</div>
          )}

          <div className="flex-grow">
            <table className="theme-table width-1-1 mobile-flex-table">
              <caption>Events Read by a Bot from this {node.type}</caption>
              <thead>
                {!data || Object.keys(data.bots.read).length === 0 ? (
                  <tr><td /></tr>
                ) : (
                  <tr>
                    <th>Bots</th>
                    <th></th>
                    <th></th>
                    <th>Events Read</th>
                    <th>Last Read</th>
                    <th>Lag Time</th>
                    <th>Lag Events</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {!data || Object.keys(data.bots.read).length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center">No Destinations</td>
                  </tr>
                ) : (
                  Object.keys(data.bots.read).map((botId) => {
                    const bot = data.bots.read[botId];
                    if (!nodes[bot.id] || nodes[bot.id].status === 'archived' || nodes[bot.id].archived) {
                      return false;
                    }

                    const eventsRead = bot.values.reduce((total, value) => total + (value.value || 0), 0);
                    const lastReadLag = bot.last_read_lag ? moment.duration(bot.last_read_lag).humanize() + ' ago' : '';
                    const lagTime = bot.last_event_source_timestamp_lag ? moment.duration(bot.last_event_source_timestamp_lag).humanize() + ' ago' : '';

                    return (
                      <tr key={botId}>
                        <td className="no-wrap theme-tool-tip-wrapper">
                          <NodeIcon node={bot.id} />
                          <a onClick={() => {
                            onClose && onClose();
                            window.nodeSettings({
                              id: bot.id,
                              label: nodes[bot.id].label,
                              server_id: botId,
                              type: 'bot'
                            });
                          }}>{nodes[bot.id].label}</a>
                        </td>
                        <td onClick={() => window.jumpToNode(bot.id, onClose)}>
                          <a><i className="icon-flow-branch"></i></a>
                        </td>
                        <td className="position-relative">
                          <div className="theme-tool-tip">
                            <span>{nodes[bot.id].label}</span>
                            <div>
                              <label>Events Read</label>
                              <span>{eventsRead}</span>
                            </div>
                            <div>
                              <label>Last Read</label>
                              <span>{lastReadLag}</span>
                            </div>
                            <div>
                              <label>Lag Time</label>
                              <span>{lagTime}</span>
                            </div>
                            <div>
                              <label>Lag Events</label>
                              <span>{bot.lagEvents}</span>
                            </div>
                          </div>
                          <NodeChart data={bot.values} chartKey="Events In Queue" interval={interval} className="width-1-1" lastRead={bot.last_read || 0} />
                        </td>
                        <td>{eventsRead}</td>
                        <td>{lastReadLag}</td>
                        <td>{lagTime}</td>
                        <td>{bot.lagEvents}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {data && <NodeCharts className="node-charts" data={data} nodeType="queue" interval={interval} showHeader="true" />}
      </div>
    </div>
  );
};

export default QueueDashboard;
