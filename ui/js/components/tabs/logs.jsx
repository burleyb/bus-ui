import React, { useState, useEffect } from 'react';
import moment from 'moment';
import refUtil from 'leo-sdk/lib/reference.js';
import { useQuery } from 'react-query';
import TimePicker from '../elements/timePicker.jsx';

const Logs = ({ nodeData }) => {
  const [logs, setLogs] = useState(false);
  const [activeMessage, setActiveMessage] = useState(-1);
  const [timeFrame, setTimeFrame] = useState('5m');
  const [customTimeFrame, setCustomTimeFrame] = useState(undefined);
  const [activeLog, setActiveLog] = useState(-1);
  const [logDetails, setLogDetails] = useState(false);

  const logId = nodeData.id;

  // Fetch cron info using react-query
  const { data: cronInfo, isLoading: cronLoading } = useQuery(['cronInfo', logId], () => getCron(logId));

  // Fetch logs based on cronInfo and timeFrame
  const { data: fetchedLogs, refetch: refetchLogs, isLoading: logsLoading } = useQuery(
    ['logs', logId, cronInfo, timeFrame, customTimeFrame],
    () => getLogs(logId, cronInfo, customTimeFrame || moment().subtract(timeFrame.slice(0, 1), timeFrame.slice(-1)).valueOf()),
    { enabled: !!cronInfo }
  );

  useEffect(() => {
    if (fetchedLogs) {
      setLogs(fetchedLogs);
    }
  }, [fetchedLogs]);

  const refreshData = () => {
    refetchLogs();
  };

  const showDetails = (index, log) => {
    setActiveLog(index);
    if (!log.details) {
      getLogDetails(logId, log).then((details) => {
        details.logs.forEach((detail) => {
          detail.timeAgo = formatTime(detail.timestamp, log.timestamp);
        });
        log.details = details;
        setLogDetails(details);
      });
    }
  };

  const selectTimeFrame = (timeFrame) => {
    setTimeFrame(timeFrame.replace('hr', 'h'));
    setCustomTimeFrame(undefined);
    refreshData();
  };

  const customTimeFrameChange = (event) => {
    const customFrame = moment(event.target.value, 'MM/DD/YYYY h:mm A').valueOf();
    setCustomTimeFrame(customFrame);
    refreshData();
  };

  const formatTime = (timestamp, baseTime) => {
    const milliseconds = baseTime ? moment(timestamp).diff(baseTime) : moment().diff(timestamp);
    return [milliseconds >= 1000 ? window.humanize(milliseconds) : `${(milliseconds / 1000) % 1}s`, ''];
  };

  if (cronLoading || logsLoading) {
    return <div className="theme-spinner-large" />;
  }

  return (
    <div className="height-1-1 flex-column position-relative">
      <div>
        {(nodeData.logs?.notices || []).map((notice, i) => (
          notice.msg ? (
            <div key={i} className={`notice-message${i === activeMessage ? ' active' : ''}`} onClick={() => setActiveMessage(i)}>
              <span className="theme-badge-warning">Notice:</span>
              {i === activeMessage && <i className="icon-cancel pull-right padding-10 theme-color-danger cursor-pointer" title="close" onClick={() => setActiveMessage(-1)}></i>}
              <pre>{notice.msg}</pre>
            </div>
          ) : null
        ))}
      </div>

      <div className="timeframe-search-bar text-right padding-10-0">
        <TimePicker onRefresh={refreshData} customTimeFrame={customTimeFrame} timeFrames={['30s', '1m', '5m', '1hr', '6hr', '1d', '1w']} active={timeFrame} onClick={selectTimeFrame} />
      </div>

      <div className="log-results flex-row flex-shrink height-1-1 border-box">
        {logs && logs.length ? (
          <div className="height-1-1 border-box">
            <div className="theme-table-fixed-header theme-table-dark theme-table-auto">
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Run time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index} className={activeLog === index ? 'active' : ''} onClick={() => showDetails(index, log)}>
                      <td className={activeLog === index ? 'xarrow-inset-right' : 'cursor-pointer'}>
                        <strong className="font-11em">{log.timeAgo[0]}</strong> <span className="font-dim">{log.timeAgo[1]} ago</span>
                        <div className="font-dim">{moment(log.timestamp).format()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <strong>No Logs Found</strong>}

        <div className="width-1-1">
          {logDetails && logDetails.logs ? (
            <div className="theme-table-fixed-header">
              <table>
                <thead>
                  <tr>
                    <th className="detail-timestamp">Timestamp</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logDetails.logs.map((detail, key) => (
                    <tr key={key}>
                      <td className="detail-timestamp text-top">
                        <strong className="font-11em">{detail.timeAgo[0]}</strong> <span className="font-dim">{detail.timeAgo[1]} after</span>
                        <div className="font-dim">{moment(detail.timestamp).format()}</div>
                      </td>
                      <td className="text-top user-selectable">{detail.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="theme-spinner" />}
        </div>
      </div>
    </div>
  );
};

export default Logs;
