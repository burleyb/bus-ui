import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DynamicForm from '../elements/dynamicForm.jsx';
import NodeIcon from '../elements/nodeIcon.jsx';
import { DataContext } from '../../../stores/DataContext'; // Assuming DataContext is used for global state
import Dialog from './Dialog'; // Assuming Dialog component for modals
import moment from 'moment';
import refUtil from 'leo-sdk/lib/reference.js';

const systems = {
  'Elastic Search': {
    icon: 'elasticSearch.png',
    settings: ['host'],
  },
  CSV: {
    icon: 'text_file.png',
    settings: [],
  },
  MongoDB: {
    icon: 'mongoDB.png',
    settings: ['host', 'database'],
  },
  LeoDW: {
    icon: 'LeoMane.png',
    settings: [],
  },
  Custom: {
    icon: 'system.png',
    settings: [],
  },
};

const fetchBotSettings = async (id) => {
  const { data } = await axios.get(`/api/cron/${encodeURIComponent(id)}`);
  return data;
};

const saveBotSettings = async (data) => {
  const { id, ...payload } = data;
  const response = await axios.post(`/api/cron/save`, JSON.stringify(payload));
  return response.data;
};

function BotSettings({ action, data, nodeData, onClose, onSave }) {
  const { state } = useContext(DataContext);
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({});
  const [sourceLag, setSourceLag] = useState('');
  const [writeLag, setWriteLag] = useState('');
  const [errorLimit, setErrorLimit] = useState('');
  const [consecutiveErrors, setConsecutiveErrors] = useState('');
  const [dirty, setDirty] = useState(false);
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (nodeData) {
      fetchBotSettings(nodeData.id).then((response) => {
        const { health } = response;
        setSettings(response.settings || {});
        setSourceLag(health.source_lag / 60 / 1000 || '');
        setWriteLag(health.write_lag / 60 / 1000 || '');
        setErrorLimit(health.error_limit * 100 || '');
        setConsecutiveErrors(health.consecutive_errors || '');
        setArchived(response.archived || false);
      });
    }
  }, [nodeData]);

  const mutation = useMutation(saveBotSettings, {
    onSuccess: (response) => {
      window.messageLogNotify(`Bot settings saved successfully for "${settings.name}"`);
      queryClient.invalidateQueries(['cron', nodeData.id]);
      setDirty(false);
      onSave?.(response);
      window.fetchData();
    },
    onError: (error) => {
      window.messageLogModal(`Failure saving bot settings for "${settings.name}"`, 'error', error);
    },
  });

  const handleSave = () => {
    const data = {
      id: nodeData.id,
      name: settings.name,
      health: {
        source_lag: sourceLag ? sourceLag * 60 * 1000 : undefined,
        write_lag: writeLag ? writeLag * 60 * 1000 : undefined,
        error_limit: errorLimit ? errorLimit / 100 : undefined,
        consecutive_errors: consecutiveErrors || undefined,
      },
    };
    mutation.mutate(data);
  };

  const handleReset = () => {
    setSettings({});
    setSourceLag('');
    setWriteLag('');
    setErrorLimit('');
    setConsecutiveErrors('');
    setDirty(false);
  };

  const toggleArchived = () => {
    const archiveStatus = !archived;
    axios.post(`/api/cron/save`, { id: nodeData.id, archived: archiveStatus }).then(() => {
      setArchived(archiveStatus);
      window.messageLogNotify(`Bot ${archiveStatus ? 'Archived' : 'Unarchived'}`);
      window.fetchData();
    });
  };

  return (
    <div className="BotSettings height-1-1">
      <div className="theme-form-section">
        <label>Bot Name</label>
        <input
          type="text"
          value={settings.name || ''}
          onChange={(e) => {
            setSettings((prev) => ({ ...prev, name: e.target.value }));
            setDirty(true);
          }}
        />

        <label>Source Lag (Minutes)</label>
        <input
          type="number"
          value={sourceLag}
          onChange={(e) => {
            setSourceLag(e.target.value);
            setDirty(true);
          }}
        />

        <label>Write Lag (Minutes)</label>
        <input
          type="number"
          value={writeLag}
          onChange={(e) => {
            setWriteLag(e.target.value);
            setDirty(true);
          }}
        />

        <label>Error Limit (%)</label>
        <input
          type="number"
          value={errorLimit}
          onChange={(e) => {
            setErrorLimit(e.target.value);
            setDirty(true);
          }}
        />

        <label>Consecutive Errors</label>
        <input
          type="number"
          value={consecutiveErrors}
          onChange={(e) => {
            setConsecutiveErrors(e.target.value);
            setDirty(true);
          }}
        />
      </div>

      <div className="form-button-bar">
        <button type="button" className="theme-button" onClick={handleReset} disabled={!dirty}>
          Discard Changes
        </button>
        <button type="button" className="theme-button-primary" onClick={handleSave} disabled={!dirty}>
          Save Changes
        </button>
        <button type="button" className="theme-button" onClick={toggleArchived}>
          {archived ? 'Unarchive' : 'Archive'}
        </button>
      </div>
    </div>
  );
}

export default BotSettings;
