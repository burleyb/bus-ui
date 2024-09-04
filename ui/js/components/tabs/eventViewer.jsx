import React, { useState, useEffect, useContext, useRef } from 'react';
import { DataStoreContext } from '../../../stores/dataStore'; // Adjust the path to your context
import { useQuery } from '@tanstack/react-query';
import EventReplay from '../dialogs/eventReplay';
import EventResubmit from '../dialogs/eventResubmit';
import PayloadSearch from '../elements/payloadSearch';
import NoSource from '../elements/noSource';
import NodeSearch from '../elements/nodeSearch';
import moment from 'moment';

const EventViewer = ({ nodeData, tracePage, trace, hideReply, userSettings }) => {
  const { nodes, fetchEvents, startTrace, fetchNodeData } = useContext(DataStoreContext);
  const [eventIndex, setEventIndex] = useState(0);
  const [node, setNode] = useState({});
  const [startRow, setStartRow] = useState(0);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');
  const [replay, setReplay] = useState(null);
  const [resubmit, setResubmit] = useState(null);

  const rowHeight = 55;
  const visibleRowCount = 100;
  const payloadSearchRef = useRef();

  const { data: nodeInfo } = useQuery(['nodeData', nodeData.id], () => fetchNodeData(nodeData.id), {
    onSuccess: (data) => setNode(data),
  });

  useEffect(() => {
    const nodeInfo = nodes[(nodeData || {}).id];
    if (nodeInfo) setNode(nodeInfo);
  }, [nodeData, nodes]);

  const toggleDetail = (index) => {
    setEventIndex(eventIndex === index ? 0 : index);
  };

  const startReplayHandler = (detail) => {
    setReplay(detail);
  };

  const startResubmitHandler = (detail) => {
    setResubmit(detail);
  };

  const startTraceHandler = async (source, start) => {
    const response = await startTrace(source, start);
    console.log(response);
  };

  const continueSearch = () => {
    if (payloadSearchRef.current) {
      payloadSearchRef.current.continueSearch();
    }
  };

  const handleKeyDown = (event) => {
    switch (event.keyCode) {
      case 38: // up
        setEventIndex(Math.max(0, eventIndex - 1));
        break;
      case 40: // down
        if (events.length) setEventIndex(Math.min(events.length - 1, eventIndex + 1));
        break;
      default:
        break;
    }
  };

  const calendarFormats = {
    sameDay: 'h:mm:ss a',
    lastDay: '[Yesterday,] h:mm:ss a',
    sameElse: 'MMM D, h:mm:ss a',
  };

  const serverId = node.type === 'system' ? node.queue : node.id;

  return (
    <div className="event-viewer" tabIndex="-3" onKeyDown={handleKeyDown}>
      <div className="flex-column height-1-1">
        <div className="flex-row mobile-flex-wrap" style={{ margin: '10px 0 20px 0', alignItems: 'flex-start' }}>
          {tracePage && (
            <div className="no-wrap" style={{ marginRight: 20 }}>
              <label className="theme-title">Selected Queue</label>
              <NodeSearch
                value={serverId}
                icon="icon-down-dir"
                className="black down-arrow display-inline-block margin-0-5 align-middle"
                placeholder="Search..."
                nodeType="queues"
                onChange={(queue) => setNode(queue)}
              />
            </div>
          )}
          <PayloadSearch
            ref={payloadSearchRef}
            hideSearch={!node.id}
            eventId={nodeData.checkpoint}
            serverId={serverId}
            returnEvents={(events, status) => {
              setEvents(events || []);
              setStatus(status);
            }}
            lastWrite={node.latest_write}
            timeFrames={['30s', '1m', '5m', '1hr', '6hr', '1d', '1w']}
          />
        </div>

        {!node.id ? (
          <div style={{ width: 550, height: 250, margin: '30vh auto', maxWidth: '100%' }}>
            <NoSource root={userSettings.node} />
          </div>
        ) : (
          <div className="flex-row height-1-1 flex-wrap overflow-auto">
            <div className="flex-auto width-1-2 mobile-height-1-2">
              <div className="theme-table-fixed-header theme-table-overflow-hidden">
                <table className="infiniteScroll" onScroll={continueSearch}>
                  <thead>
                    <tr>
                      <th className="text-left width-1-2">Event Id</th>
                      <th>Event Created</th>
                      <th>Source Time</th>
                      <th className="two-icons">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.slice(startRow, startRow + visibleRowCount).map((detail, index) => {
                      index += startRow;

                      return (
                        <tr key={index} onClick={() => toggleDetail(index)} className={eventIndex === index ? 'active' : 'cursor-pointer'}>
                          <td className="width-1-2 user-selectable">{detail.eid || 'Unspecified'}</td>
                          <td>{detail.timestamp ? moment(detail.timestamp).calendar(null, calendarFormats) : 'Unspecified'}</td>
                          <td>{detail.event_source_timestamp ? moment(detail.event_source_timestamp).calendar(null, calendarFormats) : 'Unspecified'}</td>
                          <td className="two-icons">
                            <div>
                              {detail.correlation_id && (
                                <a onClick={() => startTraceHandler(detail.event, detail.eid)} className="event-viewer-action-button" title="trace">
                                  <i className="icon-flash" style={{ fontSize: '1.25em' }}></i>
                                </a>
                              )}
                              {!hideReply && (
                                <>
                                  <a onClick={() => startReplayHandler(detail)} className="event-viewer-action-button" title="replay">
                                    <i className="icon-ccw" style={{ fontSize: '1.25em' }} />
                                  </a>
                                  <a onClick={() => startResubmitHandler(detail)} className="event-viewer-action-button" title="resubmit">
                                    <i className="icon-bullseye" style={{ fontSize: '1.25em' }} />
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {status && (
                      <tr>
                        <td colSpan="4">
                          <div className="text-center">{status}</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="width-1-2 flex-column position-relative mobile-height-1-2">
              <div className="theme-table-column-header width-1-1">Payload</div>
              <div className="flex-auto">
                {events.map((detail, index) => {
                  if (eventIndex === index) {
                    return (
                      <div key={index} className="current-payload">
                        <button type="button" className="copy-button theme-button">Copy to Clipboard</button>
                        <pre id="data-to-copy" className="user-selectable pre-wrap">
                          {JSON.stringify(detail, null, 4)}
                        </pre>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {replay && <EventReplay detail={replay} onClose={() => setReplay(null)} />}
      {resubmit && <EventResubmit detail={resubmit} onClose={() => setResubmit(null)} />}
    </div>
  );
};

export default EventViewer;
