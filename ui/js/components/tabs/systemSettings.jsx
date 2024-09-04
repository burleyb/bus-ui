import React, { useState, useEffect } from 'react';
import TagsInput from '../elements/tagsInput.jsx';
import dataStore from '../../../stores/dataStore.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const systemOptions = {
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

const fetchSystemSettings = async (nodeId) => {
  const response = await axios.get(`/system/${encodeURIComponent(nodeId)}`);
  return response.data;
};

const saveSystemSettings = async (data) => {
  const response = await axios.post(`/system/${data.id || ''}`, data);
  return response.data;
};

const SystemSettings = ({ nodeData, action, onSave }) => {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');
  const [tags, setTags] = useState('');
  const [settings, setSettings] = useState({});
  const [system, setSystem] = useState('Custom');
  const [dirty, setDirty] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery(
    ['systemSettings', nodeData.id],
    () => fetchSystemSettings(nodeData.id),
    {
      enabled: action !== 'create',
      onSuccess: (response) => {
        const systemType = response.settings.system || 'Custom';
        setLabel(response.label);
        setIcon(response.icon || systemOptions[systemType].icon);
        setTags(response.tags || '');
        setSettings(response.settings || {});
        setSystem(systemType);
        setIsReady(true);
      },
    }
  );

  const mutation = useMutation(saveSystemSettings, {
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries(['systemSettings', nodeData.id]);
      window.messageLogNotify(`System settings saved successfully for "${label}"`);
      if (onSave) {
        onSave();
      }
    },
    onError: (error) => {
      window.messageLogModal(`Failure saving system settings for "${label}"`, 'error', error);
    },
  });

  useEffect(() => {
    if (action === 'create') {
      setIsReady(true);
    }
  }, [action]);

  const handleSave = () => {
    const data = {
      id: nodeData?.id || '',
      label,
      icon: icon || systemOptions[system].icon,
      tags,
      settings: { ...settings, system },
    };
    mutation.mutate(data);
  };

  const handleReset = () => {
    if (data) {
      const systemType = data.settings.system || 'Custom';
      setLabel(data.label);
      setIcon(data.icon || systemOptions[systemType].icon);
      setTags(data.tags || '');
      setSettings(data.settings || {});
      setSystem(systemType);
      setDirty(false);
    }
  };

  const handleSetDirty = () => {
    if (!dirty) {
      setDirty(true);
    }
  };

  if (isLoading || !isReady) {
    return <div className="theme-spinner-large"></div>;
  }

  if (isError) {
    return <div>Error loading system settings.</div>;
  }

  return (
    <div className="SystemSettings position-relative height-1-1">
      <div className="flex-row">
        <div className="theme-form">
          <div className="theme-form-section">
            <div className="theme-form-row theme-form-group-heading">
              <div>System Info</div>
              <div>&nbsp;</div>
            </div>

            <div>
              <label>System</label>
              <select value={system} onChange={(e) => { setSystem(e.target.value); handleSetDirty(); }}>
                {Object.keys(systemOptions).map((sys) => (
                  <option key={sys} value={sys}>
                    {sys}
                  </option>
                ))}
              </select>
            </div>

            {systemOptions[system].settings.map((setting) => (
              <div key={setting} className="theme-required">
                <label>{setting}</label>
                <input
                  name={setting}
                  value={settings[setting] || ''}
                  onChange={(e) => { setSettings({ ...settings, [setting]: e.target.value }); handleSetDirty(); }}
                />
              </div>
            ))}

            <div className="theme-required">
              <label>Label</label>
              <input type="text" name="label" value={label} onChange={(e) => { setLabel(e.target.value); handleSetDirty(); }} />
            </div>

            <div>
              <label>Icon</label>
              <input type="url" name="icon" value={icon} placeholder="http://" onChange={(e) => { setIcon(e.target.value); handleSetDirty(); }} />
            </div>

            <div>
              <label>Tags</label>
              <TagsInput name="tags" value={tags} onChange={(value) => { setTags(value); handleSetDirty(); }} />
            </div>

            {action !== 'create' && (
              <div>
                <label>Id</label>
                <span className="text-left theme-color-disabled">{nodeData.id}</span>
              </div>
            )}
          </div>

          {action !== 'create' && (
            <div className="form-button-bar">
              <button type="button" className="theme-button" onClick={handleReset}>
                Discard Changes
              </button>
              <button type="button" className="theme-button-primary" onClick={handleSave} disabled={!dirty}>
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="flow-icons">
          <img
            className="theme-image"
            src={icon ? `${!icon.match(/^https?:/) ? window.leostaticcdn + 'images/nodes/' : ''}${icon}` : `${window.leostaticcdn}images/nodes/${systemOptions[system].icon}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
