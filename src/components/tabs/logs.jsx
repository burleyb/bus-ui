import React, { useEffect, useState, useContext } from 'react';
import moment from 'moment';
import axios from 'axios';
import refUtil from '../utils/reference.js';
import { useQuery } from '@tanstack/react-query';
import TimePicker from '../elements/timePicker.jsx';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

let currentRequest;

const Logs = ({ nodeData }) => {
  const { cronInfo, getCron, logs, setLogs, logDetails, setLogDetails, logSettings, logId, setLogId } = useData();

  const [activeMessage, setActiveMessage] = useState(-1);
  const [timeFrame, setTimeFrame] = useState('5m');
  const [customTimeFrame, setCustomTimeFrame] = useState(undefined);
  const [activeLog, setActiveLog] = useState(-1);

  useEffect(() => {
    if (!cronInfo) {
      getCron(nodeData.id);
    }
    fetchLogs(nodeData.id);
    return () => {
      if (currentRequest) {
        currentRequest.cancel();
      }
    };
  }, [nodeData.id, cronInfo]);

  const fetchLogs = async (nodeId) => {
    try {
      const response = await axios.get(`/api/logs/${nodeId}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const refreshData = () => {
    if (currentRequest) {
      currentRequest.abort();
    }

    setLogs(null);
    const queryString = customTimeFrame ? customTimeFrame : moment().subtract(timeFrame.slice(0, 1), timeFrame.slice(-1)).valueOf();

    const logId = cronInfo.lambdaName || (cronInfo.templateId !== 'Leo_core_custom_lambda_bot' ? cronInfo.templateId : null) || refUtil.botRef(cronInfo.id).id;
    setLogId(logId);
    fetchLogs(logId, cronInfo, queryString);
  };

  const formatTime = (timestamp, baseTime) => {
    const milliseconds = baseTime ? moment(timestamp).diff(baseTime) : moment().diff(timestamp);
    return [
      milliseconds >= 1000 ? window.humanize(milliseconds) : `${(milliseconds / 1000) % 1}s`,
      '',
    ];
  };

  const toggleMessage = (key) => {
    setActiveMessage(activeMessage === key ? -1 : key);
  };

  const showDetails = async (index, log) => {
    setActiveLog(index);
    setLogDetails(log.details || null);

    if (!log.details) {
      try {
        const response = await axios.get(`api/logs/${logId}/${logSettings.isTemplated ? encodeURIComponent(logSettings.id) : 'all'}`, log);
        response.data.logs.forEach((detail) => {
          detail.timeAgo = formatTime(detail.timestamp, log.timestamp);
        });
        const updatedLogs = logs.map((l, idx) => (idx === index ? { ...l, details: response.data } : l));
        setLogs(updatedLogs);
        setLogDetails(response.data);
      } catch (error) {
        console.error('Error fetching log details:', error);
      }
    }
  };

  const handleTimeFrameSelect = (timeFrame) => {
    timeFrame = timeFrame.replace('hr', 'h');
    setTimeFrame(timeFrame);
    refreshData();
  };

  const handleCustomTimeFrame = (date) => {
    setCustomTimeFrame(moment(date, 'MM/DD/YYYY h:mm A').valueOf());
    refreshData();
  };

  if (!logSettings) {
    return <div>No Logs Available</div>;
  }

  return (
    <div className="height-1-1 flex-column position-relative">
      <div>
        {(nodeData.logs?.notices || []).map((notice, i) => (
          notice.msg && (
            <div key={i} className={`notice-message${i === activeMessage ? ' active' : ''}`} onClick={() => toggleMessage(i)}>
              <span className="theme-badge-warning">Notice:</span>
              {i === activeMessage && (
                <i
                  className="icon-cancel pull-right padding-10 theme-color-danger cursor-pointer"
                  title="close"
                  onClick={() => toggleMessage(-1)}
                />
              )}
              <pre>{notice.msg}</pre>
            </div>
          )
        ))}
      </div>

      <div className="timeframe-search-bar text-right padding-10-0">
        <TimePicker
          onRefresh={refreshData}
          datePicker={handleCustomTimeFrame}
          customTimeFrame={customTimeFrame}
          timeFrames={['30s', '1m', '5m', '1hr', '6hr', '1d', '1w']}
          active={timeFrame}
          onClick={handleTimeFrameSelect}
        />
      </div>

      <div className="log-results flex-row flex-shrink height-1-1 border-box">
        {logs?.length > 0 ? (
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
                    <tr
                      key={index}
                      className={activeLog === index ? 'active' : ''}
                      onClick={() => showDetails(index, log)}
                    >
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
        ) : (
          <div>No Logs Found</div>
        )}

        <div className="width-1-1">
          {logDetails?.logs?.length > 0 ? (
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
                        <strong className="font-11em">{detail.timeAgo[0]}</strong>{' '}
                        <span className="font-dim">{detail.timeAgo[1]} after</span>
                        <div className="font-dim">{moment(detail.timestamp).format()}</div>
                      </td>
                      <td className="text-top user-selectable">{detail.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <strong>No Log Details Found</strong>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
