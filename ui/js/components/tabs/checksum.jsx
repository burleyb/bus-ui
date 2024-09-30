import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import NodeIcon from '../elements/nodeIcon.jsx';
import moment from 'moment';
import _ from 'lodash';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const Checksum = ({ nodeData }) => {
    const { state } = useContext(DataContext); // Use React Context instead of MobX
    const [checksums, setChecksums] = useState({});
    const [systems, setSystems] = useState({});
    const [refreshRequest, setRefreshRequest] = useState(null);

    useEffect(() => {
        const nodeSystems = {};
        for (let node in state.nodes) {
            if (state.nodes[node].type === 'system') {
                nodeSystems['s_' + state.nodes[node].id] = state.nodes[node].label;
            }
        }
        setSystems(nodeSystems);

        // Fetch checksums initially and set up an interval for refreshing data
        fetchChecksums();
        const intervalId = setInterval(() => fetchChecksums(), 1000 * 5);
        setRefreshRequest(intervalId);

        return () => {
            clearInterval(intervalId); // Clean up interval on unmount
        };
    }, [nodeData, state.nodes]);

    const fetchChecksums = async () => {
        try {
            const checksumsData = await axios.get('/api/checksums', {
                params: {
                    nodeDataId: nodeData.id,
                },
            });
            setChecksums(checksumsData.data);
        } catch (error) {
            console.error('Error fetching checksums:', error);
        }
    };

    const runNow = async (botId) => {
        try {
            await axios.post('/api/cron/save', {
                id: botId,
                executeNow: true,
            });
            window.messageLogNotify('Checksum run triggered on ' + state.nodes[botId].label);
        } catch (error) {
            window.messageLogModal('Failure triggering checksum run on ' + state.nodes[botId].label, 'error', error);
        }
    };

    const restartNow = async (botId) => {
        try {
            await axios.post('/api/cron/save', {
                id: botId,
                executeNow: true,
                checksumReset: true,
            });
            window.messageLogNotify('Checksum restart triggered on ' + state.nodes[botId].label);
        } catch (error) {
            window.messageLogModal('Failure triggering checksum restart on ' + state.nodes[botId].label, 'error', error);
        }
    };

    const showSampleData = (columnName, botId) => {
        const data = checksums[botId]?.sample[columnName] || [];
        return (
            <div>
                {data.length > 0
                    ? data.map((item, index) => (
                          <div key={index}>
                              <div>ID: {item.id || item}</div>
                              {columnName === 'incorrect' && (
                                  <table>
                                      <thead>
                                          <tr>
                                              <th>Column</th>
                                              {item.diff &&
                                                  Object.keys(item.diff).map((diffId, index) =>
                                                      Object.keys(item.diff[diffId]).map((systemId) => (
                                                          <th key={systemId}>{systemId}</th>
                                                      ))
                                                  )}
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {item.diff &&
                                              Object.keys(item.diff).map((diffId) => (
                                                  <tr key={diffId}>
                                                      <td>{diffId}</td>
                                                      {Object.keys(item.diff[diffId]).map((systemId) => (
                                                          <td key={systemId}>
                                                              {item.diff[diffId][systemId] === null ? 'NULL' : item.diff[diffId][systemId]}
                                                          </td>
                                                      ))}
                                                  </tr>
                                              ))}
                                      </tbody>
                                  </table>
                              )}
                          </div>
                      ))
                    : 'No differences'}
            </div>
        );
    };

    return (
        <div className="height-1-1 flex-column">
            <div className="theme-table-fixed-header height-1-1">
                <table className="width-1-1">
                    <thead>
                        <tr>
                            {nodeData.type !== 'bot' && <th>Sync'd System</th>}
                            <th className="width-1-3">Status</th>
                            <th>Last Run</th>
                            <th>Correct</th>
                            <th>Incorrect</th>
                            <th>Missing</th>
                            <th>Extra</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(checksums)
                            .sort((a, b) => checksums[a].label.localeCompare(checksums[b].label))
                            .map((checksumId, index) => {
                                const checksum = checksums[checksumId];
                                const system = state.nodes[checksum.system] || {};
                                const startTime = moment(checksum.startTime);
                                const startTimeFormatted = startTime.calendar(null, {
                                    sameDay: 'h:mm a [Today]',
                                    nextDay: 'h:mm a MM-DD-YYYY',
                                    nextWeek: 'h:mm a MM-DD-YYYY',
                                    lastDay: 'h:mm a [Yesterday]',
                                    lastWeek: 'h:mm a MM-DD-YYYY',
                                    sameElse: 'h:mm a MM-DD-YYYY',
                                });

                                return (
                                    <tr key={index}>
                                        {nodeData.type !== 'bot' && (
                                            <td>
                                                <a
                                                    className="theme-link flex-row flex-wrap"
                                                    onClick={() =>
                                                        window.subNodeSettings(
                                                            {
                                                                id: checksum.bot_id,
                                                                label: state.nodes[checksum.bot_id].label,
                                                                type: state.nodes[checksum.bot_id].type,
                                                                server_id: checksum.bot_id,
                                                            },
                                                            true
                                                        )
                                                    }
                                                >
                                                    <NodeIcon className="theme-image-thumbnail margin-0-5" node={system} />
                                                    <div className="display-inline-block overflow-hidden" style={{ maxWidth: '10vw' }}>
                                                        {checksum.label}
                                                        <small className="display-block">System: {system.label || ''}</small>
                                                    </div>
                                                </a>
                                            </td>
                                        )}
                                        <td className="width-1-3">
                                            {(() => {
                                                switch (checksum.status) {
                                                    case 'running':
                                                        return (
                                                            <div>
                                                                <span className="theme-color-success">{checksum.status.capitalize()}: </span>
                                                                <div className="theme-progress-bar display-inline-block width-1-2">
                                                                    <span style={{ width: `${checksum.log.percent}%` }}></span>
                                                                    <span>{checksum.log.percent}%</span>
                                                                </div>
                                                                <small className="display-block">
                                                                    Correct: {(checksum.log.correct || {}).count || '-'}, Incorrect: {(checksum.log.incorrect || {}).count || '-'},
                                                                    Missing: {(checksum.log.missing || {}).count || '-'}, Extra: {(checksum.log.extra || {}).count || '-'}
                                                                </small>
                                                            </div>
                                                        );
                                                    case 'starting':
                                                    case 'initializing':
                                                        return (
                                                            <div>
                                                                <span className="theme-color-success">{checksum.status.capitalize()}: </span>
                                                                <div className="theme-progress-bar display-inline-block width-1-2"></div>
                                                                <small className="display-block">&nbsp;</small>
                                                            </div>
                                                        );
                                                    case 'error':
                                                        return (
                                                            <div>
                                                                <span className="theme-color-primary">{checksum.status.capitalize()}</span>
                                                                <small className="display-block">{checksum.statusReason || ''}&nbsp;</small>
                                                            </div>
                                                        );
                                                    default:
                                                        return (
                                                            <div>
                                                                <span className="theme-color-primary">{checksum.status.capitalize()}</span>
                                                                <small className="display-block">&nbsp;</small>
                                                            </div>
                                                        );
                                                }
                                            })()}
                                        </td>
                                        <td>
                                            {checksum.startTime ? startTime.fromNow() : 'never'}
                                            <small className="display-block">{checksum.startTime ? startTimeFormatted : '-'}</small>
                                            <small className="display-block">
                                                Duration: {moment.duration((checksum.endTime || moment.now()) - checksum.startTime).humanize()}
                                            </small>
                                        </td>
                                        <td>
                                            {checksum.totals.correct || '-'}
                                            <small className="display-block">
                                                {checksum.total ? `${(checksum.totals.correct / checksum.total * 100).toFixed(2)}%` : '-'}
                                            </small>
                                        </td>
                                        <td className="hover-tool-tip">
                                            {checksum.totals.incorrect || '-'}
                                            <small className="display-block">
                                                {checksum.total ? `${(checksum.totals.incorrect / checksum.total * 100).toFixed(2)}%` : '-'}
                                            </small>
                                            <span className="checksum">
                                                <dd>{showSampleData('incorrect', checksum.bot_id)}</dd>
                                            </span>
                                        </td>
                                        <td className="hover-tool-tip">
                                            {checksum.totals.missing || '-'}
                                            <small className="display-block">
                                                {checksum.total ? `${(checksum.totals.missing / checksum.total * 100).toFixed(2)}%` : '-'}
                                            </small>
                                            <dd>{showSampleData('missing', checksum.bot_id)}</dd>
                                        </td>
                                        <td className="hover-tool-tip">
                                            {checksum.totals.extra || '-'}
                                            <small className="display-block">
                                                {checksum.total ? `${(checksum.totals.extra / checksum.total * 100).toFixed(2)}%` : '-'}
                                            </small>
                                            <dd>{showSampleData('extra', checksum.bot_id)}</dd>
                                        </td>
                                        <td className="text-center">
                                            {checksum.status && checksum.status !== 'complete' ? (
                                                <button
                                                    type="button"
                                                    className="theme-button-tiny margin-2"
                                                    onClick={() => restartNow(checksum.bot_id)}
                                                >
                                                    <i className="icon-refresh" /> Restart
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="theme-button-tiny margin-2"
                                                    onClick={() => runNow(checksum.bot_id)}
                                                >
                                                    <i className="icon-play" /> Run Now
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Checksum;
