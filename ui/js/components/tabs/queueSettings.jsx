import React, { useEffect, useState } from 'react';
import TagsInput from '../elements/tagsInput.jsx';
import dataStore from '../../../stores/dataStore.jsx'; // Direct dataStore usage
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const fetchQueueSettings = async (nodeId) => {
  const response = await axios.get(`/eventsettings/${encodeURIComponent(nodeId)}`);
  return response.data;
};

const saveQueueSettings = async (setup) => {
  await axios.post('/eventsettings/save', setup);
};

const QueueSettings = ({ nodeData }) => {
  const [isReady, setIsReady] = useState(false);
  const [tags, setTags] = useState('');
  const [min, setMin] = useState('');
  const [name, setName] = useState('');
  const [archived, setArchived] = useState(false);
  const [dirty, setDirty] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery(['queueSettings', nodeData.id], () => fetchQueueSettings(nodeData.id), {
    onSuccess: (response) => {
      setTags((response.other || {}).tags || '');
      setMin(response.min_kinesis_number);
      setName(response.name || response.event);
      setArchived(response.archived);
      setIsReady(true);
    },
  });

  const mutation = useMutation(saveQueueSettings, {
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries(['queueSettings', nodeData.id]);
      window.messageLogNotify(`Queue settings saved successfully for ${dataStore.nodes[nodeData.id]?.label}`);
    },
    onError: (error) => {
      window.messageLogModal(`Failure saving queue ${dataStore.nodes[nodeData.id]?.label}`, 'error', error);
    },
  });

  const handleSave = () => {
    const setup = {
      id: nodeData.id,
      other: { tags: tags || null },
      name: name,
      min_kinesis_number: min || undefined,
    };
    mutation.mutate(setup);
  };

  const handleReset = () => {
    setTags((data.other || {}).tags || '');
    setMin(data.min_kinesis_number);
    setName(data.name || data.event);
    setDirty(false);
  };

  const handleArchive = () => {
    const archiveState = !archived;
    const archiveData = { id: nodeData.id, event: nodeData.id, archived: archiveState, paused: true };
    mutation.mutate(archiveData);
    setArchived(archiveState);
  };

  const handleChange = () => {
    if (!dirty) {
      setDirty(true);
    }
  };

  if (isLoading) {
    return <div className="theme-spinner-large"></div>;
  }

  if (isError) {
    return <div>Error loading settings.</div>;
  }

  return (
    <div className="QueueSettings position-relative height-1-1">
      <div className="flex-row">
        <div className="theme-form">
          <div className="theme-form-section">
            <div className="theme-form-row theme-form-group-heading">
              <div>queue info</div>
              <div>&nbsp;</div>
            </div>
            <div>&nbsp;</div>
            <div>
              <label>Name</label>
              <input type="text" name="name" value={name} onChange={(e) => { setName(e.target.value); handleChange(); }} />
            </div>
            <div>
              <label>Tags</label>
              <TagsInput name="tags" value={tags} onChange={(value) => { setTags(value); handleChange(); }} />
            </div>
            <div>
              <label>Min</label>
              <input type="text" name="min" value={min} onChange={(e) => { setMin(e.target.value); handleChange(); }} />
            </div>
            <div>
              <label>Id</label>
              <span className="text-left theme-color-disabled">{nodeData.id}</span>
            </div>
          </div>

          <div className="form-button-bar">
            <button type="button" className="theme-button" onClick={handleReset} disabled={!dirty}>
              Discard Changes
            </button>
            <button type="button" className="theme-button-primary" onClick={handleSave} disabled={!dirty}>
              Save Changes
            </button>
            <button type="button" className="theme-button pull-right" onClick={handleArchive}>
              {archived ? <i className="icon-unarchive"> Unarchive</i> : <i className="icon-archive"> Archive</i>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueSettings;
