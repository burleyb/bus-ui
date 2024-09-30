import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import TagsInput from '../elements/tagsInput.jsx';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext is used for global state
import Dialog from '../dialogs/dialog.jsx'; // Assuming Dialog component for modals

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

// Function to fetch system data
const fetchSystem = async (id) => {
  const { data } = await axios.get(`/api/system/${encodeURIComponent(id)}`);
  return data;
};

// Function to save system settings
const saveSystemSettings = async (data) => {
  const { id, ...payload } = data;
  const response = await axios.post(`/api/system/${id || ''}`, JSON.stringify(payload));
  return response.data;
};

function SystemSettings({ action, data, nodeData, onClose, onSave }) {
  const { state } = useContext(DataContext); // Accessing global state from DataContext
  const queryClient = useQueryClient();
  const [label, setLabel] = useState(data?.label || '');
  const [icon, setIcon] = useState(data?.icon || '');
  const [tags, setTags] = useState(data?.tags || []);
  const [settings, setSettings] = useState(data?.settings || {});
  const [dirty, setDirty] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Fetch existing system settings if not creating
  const { data: systemData, isLoading } = useQuery(
    ['system', nodeData?.id],
    () => fetchSystem(nodeData?.id),
    {
      enabled: action !== 'create',
      onSuccess: (data) => {
        const systemSettings = {
          ...data,
          settings: {
            ...data.settings,
            system: data.settings.system === 'Vanilla' ? 'Custom' : data.settings.system,
          },
        };
        setLabel(systemSettings.label);
        setIcon(systemSettings.icon);
        setTags(systemSettings.tags || []);
        setSettings(systemSettings.settings || {});
        setIsReady(true);
      },
      onError: () => {
        setIsReady(true);
      },
    }
  );

  // Mutation to save system settings
  const mutation = useMutation(saveSystemSettings, {
    onSuccess: (response) => {
      window.messageLogNotify(`System settings saved successfully for "${label}"`);
      queryClient.invalidateQueries(['system', nodeData?.id]);
      setDirty(false);
      onSave?.(response);
      window.fetchData();
    },
    onError: (error) => {
      window.messageLogModal(`Failure saving system settings for "${label}"`, 'error', error);
    },
  });

  useEffect(() => {
    if (action === 'create') {
      Dialog.modal('.SystemSettings', {
        Save: handleSave,
        cancel: false,
      }, 'Create System', onClose);
    }
  }, [action, onClose]);

  const handleSave = () => {
    const systemInfo = {
      label,
      icon: icon || systems[settings.system]?.icon,
      tags,
      settings,
      id: nodeData?.id,
    };

    mutation.mutate(systemInfo);
  };

  const handleReset = () => {
    setLabel(systemData.label);
    setIcon(systemData.icon);
    setTags(systemData.tags || []);
    setSettings(systemData.settings || {});
    setDirty(false);
  };

  const handleSetIcon = (event) => {
    setIcon(event.target.value);
    setDirty(true);
  };

  const handleSetSystem = (event) => {
    setSettings((prev) => ({
      ...prev,
      system: event.target.value,
    }));
    setDirty(true);
  };

  if (isLoading || !isReady) {
    return <div className="theme-spinner-large"></div>;
  }

  const systemName = settings.system === 'Vanilla' ? 'Custom' : settings.system;
  const selectedSystem = systems[settings.system] || systems.Custom;

  return (
    <div className="height-1-1">
      <div className="SystemSettings position-relative height-1-1">
        <div className="flex-row">
          <div className="theme-form">
            <div className="theme-form-section">
              <div className="theme-form-row theme-form-group-heading">
                <div>System Info</div>
              </div>

              <div>
                <label>System</label>
                <select value={systemName} onChange={handleSetSystem}>
                  {Object.keys(systems).map((system) => (
                    <option key={system} value={system}>{system}</option>
                  ))}
                </select>
              </div>

              {selectedSystem.settings.map((setting) => (
                <div key={setting} className="theme-required">
                  <label>{setting}</label>
                  <input
                    name={setting}
                    value={settings[setting] || ''}
                    onChange={(e) => setSettings({ ...settings, [setting]: e.target.value })}
                  />
                </div>
              ))}

              <div className="theme-required">
                <label>Label</label>
                <input
                  type="text"
                  name="label"
                  value={label}
                  onChange={(e) => { setLabel(e.target.value); setDirty(true); }}
                />
              </div>

              <div>
                <label>Icon</label>
                <input
                  type="url"
                  name="icon"
                  value={icon}
                  placeholder="http://"
                  onChange={handleSetIcon}
                />
              </div>

              <div>
                <label>Tags</label>
                <TagsInput name="tags" value={tags} onChange={setTags} />
              </div>

              {action !== 'create' && (
                <div>
                  <label>Id</label>
                  <span className="text-left theme-color-disabled">{nodeData?.id}</span>
                </div>
              )}
            </div>

            {action !== 'create' && (
              <div className="form-button-bar">
                <button type="button" className="theme-button" onClick={handleReset}>Discard Changes</button>
                <button type="button" className="theme-button-primary" onClick={handleSave} disabled={!dirty}>Save Changes</button>
              </div>
            )}
          </div>

          <div className="flow-icons">
            <img className="theme-image" src={icon || `${window.leostaticcdn}images/nodes/${selectedSystem.icon}`} alt="System Icon" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;
