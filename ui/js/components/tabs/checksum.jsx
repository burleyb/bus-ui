import React, { useContext, useEffect, useState } from 'react';
import NodeIcon from '../elements/nodeIcon.jsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DataStoreContext } from '../../../stores/dataStore';  // Adjust the path to your dataStore context
import _ from 'lodash';
import moment from 'moment';

const Checksum = ({ nodeData }) => {
    const { nodes, getChecksums, runChecksumNow, restartChecksum } = useContext(DataStoreContext);
    const [checksums, setChecksums] = useState({});
    const [sampleData, setSampleData] = useState({});
    const systems = {};

    // Map systems from nodes
    Object.keys(nodes).forEach((node) => {
        if (nodes[node].type === 'system') {
            systems['s_' + nodes[node].id] = nodes[node].label;
        }
    });

    const { data: checksumData } = useQuery(
        ['checksums', nodeData.id],
        () => getChecksums(nodeData, nodes),
        {
            refetchInterval: 5000,
            onSuccess: (data) => {
                setChecksums(data);
            },
        }
    );

    const runNowMutation = useMutation((botId) => runChecksumNow(botId), {
        onSuccess: (botId) => {
            window.messageLogNotify(`Checksum run triggered on ${nodes[botId].label}`);
        },
        onError: (error, botId) => {
            window.messageLogModal(`Failure triggering checksum run on ${nodes[botId].label}`, 'error', error);
        },
    });

    const restartNowMutation = useMutation((botId) => restartChecksum(botId), {
        onSuccess: (botId) => {
            window.messageLogNotify(`Checksum restart triggered on ${nodes[botId].label}`);
        },
        onError: (error, botId) => {
            window.messageLogModal(`Failure triggering checksum restart on ${nodes[botId].label}`, 'error', error);
        },
    });

    const showSampleData = (columnName, botId) => {
        const data = checksums[botId]?.sample[columnName] || [];
        return (
            <div>
                {data.length > 0 ? (
                    data.map((item, ndex) => (
                        <div key={ndex}>
                            <div>ID: {item.id || item}</div>
                            {columnName === 'incorrect' && item.diff ? (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>column</th>
                                            {Object.keys(item.diff).map((diffId, index) => (
                                                Object.keys(item.diff[diffId]).map((systemId) => (
                                                    <th key={systemId}>{systemId}</th>
                                                ))
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(item.diff).map((diffId) => (
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
                            ) : null}
                        </div>
                    ))
                ) : (
                    <div>No differences</div>
                )}
            </div>
        );
    };

    return (
        <div className="height-1-1 flex-column">
            <div className="theme-table-fixed-header height-1-1">
                <table className="width-1-1">
                    <thead>
                        <tr>
                            {nodeData.type === 'bot' ? null : <th>Sync'd System</th>}
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
                        {Object.keys(checksums).sort((a, b) => checksums[a].label.localeCompare(checksums[b].label)).map((checksumId, index) => {
                            const checksum = checksums[checksumId];
                            const system = nodes[checksum.system] || {};
                            const startTime = moment(checksum.startTime);
                            const startTimeFormatted = startTime.calendar(null, {
                                sameDay: 'h:mm a [Today]',
                                lastDay: 'h:mm a [Yesterday]',
                                sameElse: 'h:mm a MM-DD-YYYY',
                            });

                            return (
                                <tr key={index}>
                                    {nodeData.type !== 'bot' && (
                                        <td>
                                            <a className="theme-link flex-row flex-wrap" onClick={() => {
                                                const bot = nodes[checksum.bot_id];
                                                window.subNodeSettings({
                                                    id: checksum.bot_id,
                                                    label: bot.label,
                                                    type: bot.type,
                                                    server_id: bot.id
                                                }, true);
                                            }}>
                                                <NodeIcon className="theme-image-thumbnail margin-0-5" node={system} />
                                                <div className="display-inline-block overflow-hidden" style={{ maxWidth: '10vw' }}>
                                                    {checksum.label}
                                                    <small className="display-block">System: {system.label || ''}</small>
                                                </div>
                                            </a>
                                        </td>
                                    )}
                                    <td className="width-1-3">
                                        {checksum.status === 'running' ? (
                                            <div>
                                                <span className="theme-color-success">{checksum.status.capitalize()}: </span>
                                                <div className="theme-progress-bar display-inline-block width-1-2">
                                                    <span style={{ width: checksum.log.percent + '%' }}></span>
                                                    <span>{checksum.log.percent}%</span>
                                                </div>
                                                <small className="display-block">
                                                    Correct: {(checksum.log.correct || {}).count || '-'},
                                                    Incorrect: {(checksum.log.incorrect || {}).count || '-'},
                                                    Missing: {(checksum.log.missing || {}).count || '-'},
                                                    Extra: {(checksum.log.extra || {}).count || '-'}
                                                </small>
                                            </div>
                                        ) : checksum.status === 'error' ? (
                                            <div>
                                                <span className="theme-color-primary">{checksum.status.capitalize()}</span>
                                                <small className="display-block">{checksum.statusReason || ''}&nbsp;</small>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="theme-color-primary">{checksum.status.capitalize()}</span>
                                                <small className="display-block">&nbsp;</small>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {checksum.startTime ? startTime.fromNow() : 'never'}
                                        <small className="display-block">{checksum.startTime ? startTimeFormatted : '-'}</small>
                                        <small className="display-block">Duration: {moment.duration((checksum.endTime || moment.now()) - checksum.startTime).humanize()}</small>
                                    </td>
                                    <td>{checksum.totals.correct || '-'}</td>
                                    <td>{checksum.totals.incorrect || '-'} <span>{showSampleData('incorrect', checksum.bot_id)}</span></td>
                                    <td>{checksum.totals.missing || '-'} <span>{showSampleData('missing', checksum.bot_id)}</span></td>
                                    <td>{checksum.totals.extra || '-'} <span>{showSampleData('extra', checksum.bot_id)}</span></td>
                                    <td className="text-center">
                                        {checksum.status !== 'complete' ? (
                                            <button type="button" className="theme-button-tiny margin-2" onClick={() => restartNowMutation.mutate(checksum.bot_id)}>
                                                <i className="icon-refresh" /> Restart
                                            </button>
                                        ) : (
                                            <button type="button" className="theme-button-tiny margin-2" onClick={() => runNowMutation.mutate(checksum.bot_id)}>
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
