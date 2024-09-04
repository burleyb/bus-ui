import React, { useState, useEffect } from 'react';
import refUtil from 'leo-sdk/lib/reference.js';
import $ from 'jquery'; // Assuming jQuery is used globally in your app.
import moment from 'moment'; // Assuming moment is used globally.

const EventResubmit = ({ detail, onClose, dataStore }) => {
  const [bots, setBots] = useState({});
  const [value, setValue] = useState(detail.payload);
  const [eid, setEid] = useState(detail.eid);
  const [botId, setBotId] = useState(detail.id);
  const [queue, setQueue] = useState(detail.event);
  let currentRequest = null;

  useEffect(() => {
    // Fetch bot data when the component is mounted
    const rangeCount = window.timePeriod.interval.split('_');
    currentRequest = $.get(
      `api/dashboard/${encodeURIComponent(detail.event)}?range=${rangeCount[0]}&count=${rangeCount[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`,
      (result) => {
        setBots(result.bots.read);
      }
    ).fail((result) => {
      result.call = `api/dashboard/${encodeURIComponent(detail.event)}?range=${rangeCount[0]}&count=${rangeCount[1] || 1}&timestamp=${encodeURIComponent(moment().format())}`;
      window.messageLogModal('Failure to get data', 'error', result);
    });

    // Clean up on unmount
    return () => {
      if (currentRequest) {
        currentRequest.abort();
      }
    };
  }, [detail.event]);

  useEffect(() => {
    // Initialize modal when the component is mounted
    LeoKit.modal(
      $('.EventResubmitDialog'),
      {
        Resubmit: (formData) => {
          LeoKit.confirm(
            `Resubmit event to queue: "${queue}" by botId: "${botId}".`,
            () => {
              let payload = JSON.parse(formData.payload);
              payload.original_eid = detail.eid;

              let data = {
                botId: refUtil.botRef(botId).id,
                queue: queue,
                payload: payload,
              };

              $.post(`${window.api}/cron/save`, JSON.stringify(data), (response) => {
                window.messageLogNotify(`Resubmit triggered for ${dataStore.nodes[formData.botId].label}`, 'info');
              }).fail((result) => {
                window.messageLogModal(`Failure triggering resubmit for ${dataStore.nodes[formData.botId].label}`, 'error', result);
              });
            }
          );
        },
        cancel: false,
      },
      'Resubmit Event',
      onClose
    );
  }, [botId, queue, dataStore, detail.eid, onClose]);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const taStyle = {
    margin: '5px 0px 15px',
    width: '750px',
    height: '255px',
  };

  return (
    <div>
      <div className="EventResubmitDialog theme-form">
        <div>
          <label>Edit Event</label>
          <textarea
            id="payload"
            style={taStyle}
            name="payload"
            key="payload"
            value={JSON.stringify(value, null, 2)}
            onChange={handleChange}
          />
          <input type="hidden" id="botId" name="botId" value={botId} />
          <input type="hidden" id="queue" name="queue" value={queue} />
        </div>
      </div>
    </div>
  );
};

export default EventResubmit;
