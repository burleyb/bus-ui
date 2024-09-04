import React, { useState, useEffect } from 'react';
import refUtil from 'leo-sdk/lib/reference.js';
import moment from 'moment';
import $ from 'jquery'; // Assuming jQuery is used globally in your app.

const EventReplay = ({ detail, onClose, dataStore }) => {
  const [bots, setBots] = useState({});
  let currentRequest = null;

  useEffect(() => {
    // Similar to componentWillMount
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

    // Clean up on unmount (componentWillUnmount)
    return () => {
      if (currentRequest) {
        currentRequest.abort();
      }
    };
  }, [detail.event]);

  useEffect(() => {
    // Equivalent to componentDidMount
    LeoKit.modal(
      $('.EventReplayDialog'),
      {
        Replay: (formData) => {
          if (!formData.botId) {
            window.messageModal('No bot to replay to', 'warning');
            return false;
          }

          LeoKit.confirm(`Replay bot "${dataStore.nodes[formData.botId].label}".`, () => {
            let checkpoint = detail.eid;
            checkpoint =
              checkpoint.slice(-1) === '0'
                ? checkpoint.slice(0, -1)
                : checkpoint.slice(0, -1) + (checkpoint.slice(-1) - 1);

            const id = refUtil.botRef(formData.botId).id;

            const data = {
              id: id,
              checkpoint: { [`queue:${detail.event}`]: checkpoint },
              executeNow: true,
            };

            $.post(`${window.api}/cron/save`, JSON.stringify(data), (response) => {
              window.messageLogNotify(`Replay triggered for ${dataStore.nodes[formData.botId].label}`, 'info');
            }).fail((result) => {
              window.messageLogModal(`Failure triggering replay for ${dataStore.nodes[formData.botId].label}`, 'error', result);
            });
          });
        },
        cancel: false,
      },
      'Replay Event',
      onClose
    );
  }, [dataStore, detail.eid, detail.event, onClose]);

  return (
    <div>
      <div className="EventReplayDialog theme-form">
        <div>
          <label>Select Bot</label>
          <select name="botId">
            {Object.keys(bots).map((botId) => {
              const bot = dataStore.nodes[botId] || bots[botId];
              return !bot.archived ? (
                <option key={botId} value={botId}>
                  {bot.label}
                </option>
              ) : null;
            })}
          </select>
        </div>
      </div>
    </div>
  );
};

export default EventReplay;
