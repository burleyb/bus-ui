import React, { useState, useEffect } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';
import refUtil from 'leo-sdk/lib/reference.js';
import moment from 'moment';
import $ from 'jquery';

const ResetStream = ({ source, forceRun, links, nodeId, label, onClose }) => {
  const [checkpoint, setCheckpoint] = useState('z' + moment.utc().format('/YYYY/MM/DD/HH/mm/ss/'));
  const [advanced, setAdvanced] = useState(false);
  const [openCustom, setOpenCustom] = useState(false);
  const [checked, setChecked] = useState(true);
  const [selected, setSelected] = useState(refUtil.refId(source !== false ? source : Object.keys(links)[0]).id);
  const [selected2, setSelected2] = useState('');
  const [shortcut, setShortcut] = useState('fromNow');

  useEffect(() => {
    const modal = LeoKit.modal($('.checkpointDialog'), {
      Save: (formData) => {
        let sourceKey = formData['checkpoint-shortcut'][0];
        if (selected === 'selectOther') {
          sourceKey = selected2;
        }
        const data = {
          id: nodeId,
          checkpoint: {
            [sourceKey]: formData.checkpoint,
          },
        };
        if (forceRun) {
          data.executeNow = true;
        }
        $.post(window.api + '/cron/save', JSON.stringify(data), () => {
          window.messageLogNotify(`Checkpoint changed on bot ${label || ''}`);
          window.fetchData();
        }).fail((result) => {
          window.messageLogModal(`Failed changing checkpoint on bot ${label || ''}`, 'error', result);
        });
      },
      cancel: false,
    }, 'Change Checkpoint', onClose);

    return () => {
      LeoKit.closeModal(modal);
    };
  }, [forceRun, nodeId, label, selected, selected2, onClose]);

  const handleSetCheckpoint = (event) => {
    const value = event.currentTarget.value;
    switch (value) {
      case 'lastRead':
        setCheckpoint('');
        setShortcut(value);
        setOpenCustom(false);
        break;
      case 'fromNow':
        setCheckpoint('z' + moment.utc().format('/YYYY/MM/DD/HH/mm/ss/'));
        setShortcut(value);
        setOpenCustom(false);
        break;
      case 'beginning':
        setCheckpoint('z/');
        setShortcut(value);
        setOpenCustom(false);
        break;
      case 'custom':
        setShortcut(value);
        setOpenCustom(true);
        handleSetCustom('now', false);
        break;
      case 'date':
        handleSetCustom('now', true);
        break;
      default:
        break;
    }
  };

  const handleSetCustom = (event, openDatePicker) => {
    let newCheckpoint = event === 'now' ? 'z' + moment.utc().format('/YYYY/MM/DD/HH/mm/ss/') : event.currentTarget.value;
    if (openDatePicker) {
      setCheckpoint(newCheckpoint);
      setShortcut('date');
      setOpenCustom(false);

      if (!$('#CheckpointDialogDateTimePicker').data('DateTimePicker')) {
        $('#CheckpointDialogDateTimePicker').datetimepicker({
          inline: true,
          sideBySide: true,
          maxDate: moment().endOf('d'),
          defaultDate: moment(),
        }).on('dp.change', (e) => {
          if (checked) {
            setCheckpoint('z' + e.date.utc().format('/YYYY/MM/DD/HH/mm/ss/'));
          } else {
            setCheckpoint('z' + e.date.format('/YYYY/MM/DD/HH/mm/ss/'));
          }
        });
      } else {
        $('#CheckpointDialogDateTimePicker').data('DateTimePicker').show();
      }
    } else {
      setCheckpoint(newCheckpoint);
    }
  };

  const handleOpenMoreOptions = (event) => {
    const value = event.currentTarget.value;
    if (value === 'selectOther') {
      setAdvanced(true);
      setSelected(value);
    } else {
      setAdvanced(false);
      setSelected(value);
    }
  };

  const handleUseUTC = () => {
    const isChecked = !checked;
    const dp = $('#CheckpointDialogDateTimePicker').data().date;
    const newCheckpoint = isChecked ? 'z' + moment(dp).utc().format('/YYYY/MM/DD/HH/mm/ss/') : 'z' + moment(dp).format('/YYYY/MM/DD/HH/mm/ss/');
    setChecked(isChecked);
    setCheckpoint(newCheckpoint);
  };

  const handleSetEventStream = (stream) => {
    if (stream) {
      const streamValue = typeof stream === 'object' ? stream.label : stream;
      setSelected2(streamValue);
    }
  };

  const nodeSearch = (
    <div className="theme-form-row">
      <label>Other Source</label>
      <NodeSearch
        key="0"
        name="sources"
        value={''}
        className="display-inline-block"
        nodeType="queues|systems"
        onChange={handleSetEventStream}
      />
    </div>
  );

  const customCheckpointStyle = openCustom ? {} : { display: 'none' };

  return (
    <div>
      <div className="checkpointDialog">
        <div className="resetBody">
          <p>This operation will change the checkpoint of the bot. Please be sure you know what you are doing.</p>
          <div className="theme-form-row">
            <label>Source</label>
            <select name="checkpoint-shortcut" value={selected} onChange={handleOpenMoreOptions}>
              {Object.keys(links).map((key, index) => (
                <option key={index} value={key}>{key}</option>
              ))}
              <option value="selectOther">select other...</option>
            </select>
          </div>
          {advanced && nodeSearch}
          <div className="theme-form-row">
            <label></label>
            <div>
              <select name="checkpoint-shortcut" onChange={handleSetCheckpoint} value={shortcut}>
                <option value="fromNow">Start from Now</option>
                <option value="beginning">From the Beginning of Time</option>
                <option value="date">Choose Date</option>
                <option value="custom">Custom</option>
              </select>
              {shortcut === 'date' && (
                <div style={{ paddingBottom: '10px' }}>
                  <label style={{ paddingRight: '10px' }}> Use UTC</label>
                  <input type="checkbox" checked={checked} onChange={handleUseUTC} />
                </div>
              )}
              <div className="input-group" id="CheckpointDialogDateTimePicker">
                <input type="hidden" name="customTimeFrame" />
              </div>
            </div>
          </div>
          <div className="theme-form-row" style={customCheckpointStyle}>
            <label>Resume Checkpoint</label>
            <input
              className="fixed-size"
              name="checkpoint"
              type="text"
              value={checkpoint}
              onChange={handleSetCustom}
            />
            <span>UTC</span>
          </div>
          {forceRun && <div className="forceWarning">Will be Force Run once Checkpoint is Saved</div>}
        </div>
      </div>
    </div>
  );
};

export default ResetStream;
