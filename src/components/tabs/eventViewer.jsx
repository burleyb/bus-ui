import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EventReplay from '../dialogs/eventReplay.jsx';
import EventResubmit from '../dialogs/eventResubmit.jsx';
import PayloadSearch from '../elements/payloadSearch.jsx';
import NoSource from '../elements/noSource.jsx';
import NodeSearch from '../elements/nodeSearch.jsx';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ToggleSwitch from '../elements/toggleSwitch.jsx';
import DiffLegend from '../elements/diffLegend.jsx';
import { useData } from '../../stores/DataContext.jsx';
import { diffJson, jsonDiff, canonicalize } from 'diff/lib/diff/json';

const timeFormat = '/YYYY/MM/DD/HH/mm/';

const EventViewer = ({ nodeData, trace, tracePage, hideReply, userSettings }) => {
  const { nodes, queueInfo } = useData();
  const state = useData();
  const [eventIndex, setEventIndex] = useState(0);
  const [node, setNode] = useState({});
  const [startRow, setStartRow] = useState(0);
  const [checked, setChecked] = useState(false);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');
  const [replay, setReplay] = useState(undefined);
  const [resubmit, setResubmit] = useState(undefined);
  const payloadSearchRef = useRef(null);
  const rowHeight = 55;
  const visibleRowCount = 100;

  const queryClient = useQueryClient();

  useEffect(() => {
    setNodeData();
  }, [nodeData]);

  useEffect(() => {
    if (events.length) {
      validateEvents(events);
    }
  }, [events]);

  const setNodeData = () => {
    const selectedNode = nodes[nodeData?.id];
    if (selectedNode) {
      setNode(selectedNode);
    }
  };

  const validateEvents = (events) => {
    if (!queueInfo) return;

    const ajvs = {};
    const defaultVersion = Object.keys(queueInfo || {})[0];

    events.forEach((event) => {
      if (event.is_valid === null) {
        const version = event.version || defaultVersion;
        event.version = version;
        if (!ajvs[version]) {
          const ajv = new Ajv({ allErrors: true, strict: false });
          addFormats(ajv);
          const { schema, definitionsSchema } = queueInfo[version] || {};
          const validate = ajv.addSchema(definitionsSchema || {}).compile(schema || {});
          ajvs[version] = validate;
        }
        const validate = ajvs[version];
        const valid = validate(event.payload);
        event.is_valid = valid;

        if (!valid) {
          const errorMessages = validate.errors.map((e) => `payload${e.instancePath || e.dataPath} ${e.message}`);
          event.validation_errors = errorMessages;
        }
      }
    });
  };

  const handleReplay = (detail, index, event) => {
    event.stopPropagation();
    setReplay(detail);
  };

  const handleResubmit = (detail, index) => {
    setResubmit(detail);
  };

  const handleTrace = async (source, start, index, event) => {
    event.stopPropagation();
    setEventIndex(index);

    try {
      const response = await axios.get(`${state.api}/trace/${encodeURIComponent(source)}/${encodeURIComponent(start)}`);
      window.startTrace({
        source,
        start,
        response,
      });
    } catch (error) {
      const nodeId = Object.keys(nodes).find((node) => nodes[node].id === `${nodes[node].type}:${source}`);
      window.messageLogModal(
        `Failure starting trace on ${(nodes[nodeId] || {}).type} "${(nodes[nodeId] || {}).label}"`,
        'error',
        error
      );
    }
  };

  const handleEventValidation = (detail, index, event) => {
    event.stopPropagation();
    const version = detail.version || Object.keys(queueInfo)[0];
    const valid = detail.is_valid;

    let message, details, type;

    if (valid) {
      message = 'Event is valid';
      details = 'No validation errors';
      type = 'info';
    } else {
      message = 'Errors';
      details = detail.validation_errors.join('\n');
      type = 'error';
    }

    window.messageModal(`${node.label}@${version} - ${message} : ${detail.eid}`, type, details, { open: true });
  };

  const handleCheckedChange = (newValue) => {
    setChecked(newValue);
  };

  const renderEventPayload = () => {
    if (!events.length) return null;

    return events.map((detail, index) => {
      if (eventIndex === index) {
        const isOldNewVariant = detail.payload.old !== undefined && detail.payload.new !== undefined;
        const oldPayload = isOldNewVariant ? detail.payload.old : null;
        const newPayload = isOldNewVariant ? detail.payload.new : null;
        const detailString = JSON.stringify(detail, null, 4);

        return (
          <div key={index}>
            {isOldNewVariant && <ToggleSwitch id="toggleSwitch" checked={checked} onChange={handleCheckedChange} />}
            {checked ? (
              <div className="current-payload">
                <DiffLegend />
                <button type="button" id="copy-button" className="copy-button theme-button">
                  Copy to Clipboard
                </button>
                <pre id="data-to-copy" className="user-selectable pre-wrap">
                  {getOldNewDiff(oldPayload, newPayload)}
                </pre>
              </div>
            ) : (
              <div className="current-payload">
                <button type="button" id="copy-button" className="copy-button theme-button">
                  Copy to Clipboard
                </button>
                <pre id="data-to-copy" className="user-selectable pre-wrap">
                  {detailString}
                </pre>
              </div>
            )}
          </div>
        );
      }
    });
  };

  return (
    <div className="event-viewer">
      <div className="flex-column height-1-1" tabIndex="-3">
        <div className="flex-row mobile-flex-wrap" style={{ margin: '10px 0 20px 0', alignItems: 'flex-start' }}>
          {tracePage && (
            <div className="no-wrap" style={{ marginRight: 20 }}>
              <label className="theme-title">Selected Queue</label>
              <NodeSearch value={node.id} icon="icon-down-dir" placeholder="Search..." nodeType="queues" onChange={setNodeData} />
            </div>
          )}
          <PayloadSearch ref={payloadSearchRef} hideSearch={!node.id} serverId={node.id} />
        </div>

        {!node.id ? (
          <div style={{ width: 550, height: 250, margin: '30vh auto', maxWidth: '100%' }}>
            <svg width="550" height="250" style={{ maxWidth: '100%', maxHeight: 'none' }}>
              <NoSource root={userSettings.node} />
            </svg>
          </div>
        ) : (
          <div className="flex-row height-1-1 flex-wrap">
            <div style={{ height: 'calc(100% - 59px)' }} className="flex-auto width-1-2 mobile-height-1-2">
              <div className="theme-table-fixed-header theme-table-overflow-hidden">
                <table className="infiniteScroll">
                  <thead>
                    <tr>
                      <th className="text-left width-1-2">Event Id</th>
                      <th>Event Created</th>
                      <th>Source Time</th>
                      <th className="two-icons">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>{renderEventPayload()}</tbody>
                </table>
              </div>
            </div>
            <div style={{ height: 'calc(100% - 59px)' }} className="width-1-2 flex-column position-relative mobile-height-1-2">
              <div className="theme-table-column-header width-1-1">Payload</div>
              <div className="flex-auto">{renderEventPayload()}</div>
            </div>
          </div>
        )}
      </div>

      {replay && <EventReplay detail={replay} onClose={() => setReplay(undefined)} />}
      {resubmit && <EventResubmit detail={resubmit} onClose={() => setResubmit(undefined)} />}
    </div>
  );
};

export default EventViewer;

// Helper function for diffing old and new payloads
function getOldNewDiff(oldData, newData) {
  jsonDiff.castInput = function (value) {
    const { undefinedReplacement, stringifyReplacer = (k, v) => (typeof v === 'undefined' ? undefinedReplacement : v) } = this.options;
    return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '    ');
  };

  const diff = diffJson(oldData, newData);
  return (
    <div className="diff">
      {diff.map((part, index) => (
        <span key={index} className={part.added ? 'green' : part.removed ? 'red' : 'grey'}>
          {part.value}
        </span>
      ))}
    </div>
  );
}
