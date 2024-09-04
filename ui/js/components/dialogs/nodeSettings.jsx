import React, { useState, useEffect } from 'react';
import ResetStream from './resetStream.jsx';
import { NodeImages } from '../elements/nodeIcon.jsx';
import moment from 'moment';
import $ from 'jquery';

// var config = require("leo-sdk/leoConfigure.js");
var config = window;

config.registry.tabs = Object.assign({
  CodeEditor: require("../tabs/codeEditor.jsx").default,
  CodeOverrides: require("../tabs/codeOverrides.jsx").default,
  Logs: require("../tabs/logs.jsx").default,
  BotSettings: require("../tabs/botSettings.jsx").default,
  BotDashboard: require("../tabs/botDashboard.jsx").default,
  QueueDashboard: require("../tabs/queueDashboard.jsx").default,
  EventViewer: require("../tabs/eventViewer.jsx").default,
  QueueSettings: require("../tabs/queueSettings.jsx").default,
  Checksum: require("../tabs/checksum.jsx").default,
  Cron: require("../tabs/cron.jsx").default,
  Webhooks: require("../tabs/webhooks.jsx").default,
  SystemSettings: require("../tabs/systemSettings.jsx").default,
}, config.registry.tabs);

let currentRequest = null;

const Settings = ({ data, nodeType, onClose }) => {
  const [nodeData, setNodeData] = useState(data);
  const [nodeTabs, setNodeTabs] = useState(getTabsForNodeType(nodeType));
  const [tabIndex, setTabIndex] = useState(data.openTab ? Object.keys(getTabsForNodeType(nodeType)).indexOf(data.openTab) || 0 : 0);
  const [isDirty, setIsDirty] = useState(false);
  const [paused, setPaused] = useState(dataStore.nodes[data.id]?.paused || false);
  const [resetStream, setResetStream] = useState(undefined);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const dialogTagKey = Date.now();

  useEffect(() => {
    refreshData();
    setupModal();
    return () => {
      if (currentRequest) {
        currentRequest.abort();
      }
      if (modal) {
        LeoKit.close(modal);
      }
    };
  }, []);

  const setupModal = () => {
    const dialog = $(`.settingsDialog.dialog${dialogTagKey}`).closest('.theme-dialog').focus();
    const modal = dialog.closest('.theme-modal').click((event) => {
      if ($(event.target).hasClass('theme-modal')) {
        dialog.focus();
      }
    });
    modal.css({ zIndex: (1000 + (data.zIndex || 0)) });
    dialog.addClass('theme-dialog-open');
    dialog.find('input:not([type=hidden]), select, textarea, button').first().focus().select();
    dialog.find('textarea').bind('keydown', function (e) {
      if (e.keyCode == 9) {
        e.preventDefault();
        const val = this.value;
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = val.substring(0, start) + '\t' + val.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
        return false;
      }
    });
    LeoKit.center(dialog);
    setTimeout(() => {
      LeoKit.center(dialog);
    }, 500);
  };

  const getTabsForNodeType = (nodeType) => {
    const tabs = {
      MapperBot: {
        Dashboard: 'BotDashboard',
        Code: 'CodeEditor',
        Logs: 'Logs',
        Settings: 'BotSettings'
      },
      AWSBot: {
        Dashboard: 'BotDashboard',
        Code: 'CodeOverrides',
        Logs: 'Logs',
        Settings: 'BotSettings'
      },
      ChecksumBot: {
        Dashboard: 'BotDashboard',
        Code: 'CodeEditor',
        Checksum: 'Checksum',
        Logs: 'Logs',
        Settings: 'BotSettings'
      },
      EventQueue: {
        Dashboard: 'QueueDashboard',
        Events: 'EventViewer',
        Settings: 'QueueSettings'
      },
      System: {
        Dashboard: 'QueueDashboard',
        Events: 'EventViewer',
        Checksum: 'Checksum',
        Cron: 'Cron',
        Webhook: 'Webhooks',
        Settings: 'SystemSettings'
      }
    };
    return tabs[nodeType];
  };

  const refreshData = () => {
    const newData = { ...data, settings: {} };
    setNodeData(newData);
    LeoKit.center(modal);
  };

  const togglePause = () => {
    const node = dataStore.nodes[data.id] || {};
    const pausedStatus = !node.paused;
    const updatedNode = { ...node, paused: pausedStatus };
    dataStore.nodes[node.id] = updatedNode;
    $.post(window.api + '/cron/save', JSON.stringify({ id: node.id, paused: pausedStatus }), () => {
      dataStore.getStats();
      window.messageLogNotify(`Bot ${!pausedStatus ? 'Unpaused' : 'Paused'}`, 'info');
    }).fail((result) => {
      dataStore.nodes[node.id].paused = !pausedStatus;
      window.messageLogModal(`Failed to ${pausedStatus ? 'Pause' : 'Unpause'} bot ${node.label || ''}`, 'error', result);
    });
  };

  const runNow = () => {
    $.post(window.api + '/cron/save', JSON.stringify({ id: nodeData.id, executeNow: true }), () => {
      window.messageLogNotify(`Run triggered for bot ${data.label || ''}`, 'info');
      window.fetchData();
    }).fail((result) => {
      window.messageLogModal(`Failed attempting to run bot ${data.label || ''}`, 'error', result);
    });
  };

  const resetStreamAction = (forceRun) => {
    if (data.id) {
      $.get(`api/dashboard/${encodeURIComponent(data.id)}?range=minute&count=15&timestamp=${encodeURIComponent(moment().format())}`, (result) => {
        let lastRead = result?.queues?.read?.reduce((acc, queue) => acc || queue.last_read, false);
        setResetStream({
          forceRun,
          nodeId: data.id,
          value: data.settings.checkpoint,
          lastRead,
          label: data.label,
          links: dataStore.nodes[data.id]?.link_to?.parent || {},
          source: dataStore.nodes[data.id]?.source || false
        });
      }).fail((result) => {
        result.call = `api/dashboard/${encodeURIComponent(data.id)}?range=minute&count=15&timestamp=${encodeURIComponent(moment().format())}`;
        window.messageLogNotify('Failed to get bot settings', 'warning', result);
      });
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="theme-modal">
      <div
        tabIndex="-1"
        className="theme-dialog"
        onKeyDown={(e) => {
          if (e.keyCode === 27) {
            onClose();
          }
        }}
      >
        <header tabIndex="-2" className="theme-dialog-header flex-row flex-spread">
          {/* Dialog header and content */}
        </header>

        {/* Modal body */}
        <form className="theme-form">
          <main>
            <div className={`settingsDialog dialog${dialogTagKey}`}>
              {/* Render tabs and content */}
            </div>
          </main>
        </form>
      </div>

      {resetStream && <ResetStream {...resetStream} onClose={() => setResetStream(undefined)} />}
    </div>
  );
};

export default Settings;
