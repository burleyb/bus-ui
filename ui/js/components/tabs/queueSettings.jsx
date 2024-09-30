import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import TagsInput from '../elements/tagsInput.jsx';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const QueueSettings = ({ nodeData, setDirtyState }) => {
  const { nodes } = useContext(DataContext); // Replacing MobX's dataStore with useContext
  const [isReady, setIsReady] = useState(false);
  const [tags, setTags] = useState('');
  const [min, setMin] = useState('');
  const [name, setName] = useState('');
  const [archived, setArchived] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    // Fetch queue settings on mount
    const fetchQueueSettings = async () => {
      try {
        const response = await axios.get(`/eventsettings/${encodeURIComponent(nodeData.id)}`);
        const { other, min_kinesis_number, name, archived } = response.data;
        setTags((other || {}).tags || '');
        setMin(min_kinesis_number);
        setName(name || response.data.event);
        setArchived(archived);
        setIsReady(true);
      } catch (error) {
        console.error('Error fetching queue settings:', error);
        setIsReady(true);
        setTags('');
        window.messageLogModal(
          `Failure retrieving queue settings ${nodes[nodeData.id]?.label}`,
          'warning',
          error
        );
      }
    };

    fetchQueueSettings();
  }, [nodeData.id, nodes]);

  const handleSetDirty = () => {
    if (!dirty) {
      setDirty(true);
      setDirtyState({
        onSave: handleSave,
        onReset: handleReset
      });
    }
  };

  const handleReset = (callback) => {
    setDirty(false);
    callback && callback();
    setDirtyState(false);
  };

  const handleSave = async (callback) => {
    const setup = {
      id: nodeData.id,
      other: {
        tags: tags || null
      },
      name,
      min_kinesis_number: min || undefined
    };

    try {
      await axios.post(`/eventsettings/save`, setup);
      setDirty(false);
      setDirtyState(false);
      callback && callback();
      window.messageLogNotify(`Queue settings saved successfully for ${nodes[nodeData.id]?.label}`);
    } catch (error) {
      console.error('Error saving queue settings:', error);
      window.messageLogModal(`Failure saving queue ${nodes[nodeData.id]?.label}`, 'error', error);
    }
  };

  const handleArchiveQueue = async () => {
    const archive = !archived;
    const data = {
      id: nodeData.id,
      event: nodeData.id,
      archived: archive,
      paused: true
    };

    try {
      await axios.post(`/eventsettings/save`, data);
      window.fetchData();
      window.messageLogNotify(
        `${archive ? 'Archived' : 'Unarchived'} queue ${nodes[nodeData.id]?.label || ''}`,
        'info'
      );
      setArchived(archive);
    } catch (error) {
      console.error('Error archiving/unarchiving queue:', error);
      window.messageLogModal(
        `Failed attempting to ${archive ? 'Archive' : 'Unarchive'} queue ${nodes[nodeData.id]?.label || ''}`,
        'error',
        error
      );
    }
  };

  return (
    <div className="QueueSettings position-relative height-1-1">
      {!isReady ? (
        <div className="theme-spinner-large"></div>
      ) : (
        <div className="flex-row">
          <div className="theme-form">
            <div className="theme-form-section">
              <div className="theme-form-row theme-form-group-heading">
                <div>Queue Info</div>
                <div>&nbsp;</div>
              </div>
              <div>&nbsp;</div>

              <div>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    handleSetDirty();
                  }}
                />
              </div>
              <div>
                <label>Tags</label>
                <TagsInput
                  name="tags"
                  defaultValue={tags}
                  onChange={(newTags) => {
                    setTags(newTags);
                    handleSetDirty();
                  }}
                />
              </div>
              <div>
                <label>Min</label>
                <input
                  type="text"
                  name="min"
                  value={min}
                  onChange={(e) => {
                    setMin(e.target.value);
                    handleSetDirty();
                  }}
                />
              </div>

              <div>
                <label>Id</label>
                <span className="text-left theme-color-disabled">{nodeData.id}</span>
              </div>
            </div>

            <div className="form-button-bar">
              <button type="button" className="theme-button" onClick={() => handleReset(false)}>
                Discard Changes
              </button>
              <button
                type="button"
                className="theme-button-primary"
                onClick={() => handleSave(false)}
                disabled={!dirty}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="theme-button pull-right"
                onClick={handleArchiveQueue}
              >
                {archived ? (
                  <i className="icon-unarchive"> Unarchive</i>
                ) : (
                  <i className="icon-archive"> Archive</i>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueSettings;
