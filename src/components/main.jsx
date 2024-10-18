import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import moment from 'moment';

import EventTrace from './dialogs/eventTrace.jsx';
import Header from './main/header.jsx';
import LeftNav from './main/leftNav.jsx';
import Content from './main/content.jsx';
import MessageCenter from './main/messageCenter.jsx';
import DataSourceConnect from './dialogs/dataSourceConnect.jsx';

import Dialog from './dialogs/dialog.jsx';
import LeoKit from './dialogs/LeoKit.jsx'; // Updated to use the new LeoKit component
import { useData } from '../stores/DataContext.jsx'; // Assuming DataContext is used for global state management

// Extend string prototype for capitalization (if necessary)
String.prototype.capitalize = function(lower) {
  return (lower ? this.toLowerCase() : this).replace(/(?:^|\s|\.)\S/g, f => f.toUpperCase());
};

// Math precision functions (if necessary)
['round', 'floor', 'ceil'].forEach(function(funcName) {
  if (!Math['_' + funcName]) {
    Math['_' + funcName] = Math[funcName];
    Math[funcName] = function(number, precision) {
      precision = Math.abs(parseInt(precision)) || 0;
      const coefficient = Math.pow(10, precision);
      return Math['_' + funcName](number * coefficient) / coefficient;
    };
  }
});

function App() {
  const state = useData(); 

  const [trace, setTrace] = useState(undefined);
  const [addDataSource, setAddDataSource] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [currentSearch, setCurrentSearch] = useState(null);

  // Load settings from URL hash or localStorage
  const loadSettings = () => {
    let hash = decodeURI(document.location.hash.slice(1)) || '';

    if (!hash) {
      const viewId = localStorage.getItem('default-view');
      if (viewId) {
        document.location.hash = JSON.parse(localStorage.getItem(viewId)) || '{}';
        return;
      }
    }

    let values;
    try {
      values = JSON.parse(decodeURI(hash) || '{}');
    } catch (e) {
      LeoKit.notify('Invalid Request', 'warning', e); // Use LeoKit for notifications
      values = {};
    }

    state.refetchSettings();
    
  };

  // Handle message logging
  const messageLogged = (count) => {
    setMessageCount(count);
  };

  // Use useEffect to handle hashchange and initial load
  useEffect(() => {
    const handleHashChange = () => {
      loadSettings();
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Function to handle workflow management using LeoKit Dialogs
  const workflows = {
    order: (order) => {
      if (order) {
        localStorage.setItem('saved-views-order', JSON.stringify(order));
      }
      return JSON.parse(localStorage.getItem('saved-views-order')) || Object.keys(JSON.parse(localStorage.getItem('saved-views')) || {}).sort();
    },
    views: JSON.parse(localStorage.getItem('saved-views', '{}')) || {},
    restore: (view) => {
      const viewId = workflows.views[view];
      document.location.hash = JSON.parse(localStorage.getItem(viewId));
      state.fetchStats(); 
    },
    delete: (view) => {
      LeoKit.confirm(`Delete view "${view}"?`, () => {
        const savedViews = workflows.views;
        const viewId = savedViews[view];
        localStorage.removeItem(viewId);
        delete savedViews[view];
        localStorage.setItem('saved-views', JSON.stringify(savedViews));
        workflows.order(workflows.order().filter(v => v !== view));
      });
    },
    save: () => {
      const defaultValue = (state.nodes[state.userSettings?.node] || {}).label || '';
      LeoKit.prompt('Save Workflow', 'Enter workflow name', defaultValue, (form) => {
        if (!form.prompt_value) {
          LeoKit.alert('Name is required', 'warning');
          return false;
        }

        const savedViews = workflows.views;
        const viewId = `saved-view-${Date.now()}${Math.random()}`;
        localStorage.setItem(viewId, JSON.stringify(document.location.hash));
        savedViews[form.prompt_value] = viewId;
        localStorage.setItem('saved-views', JSON.stringify(savedViews));
        workflows.order([...workflows.order(), form.prompt_value]);
        LeoKit.notify(`Saved View "${form.prompt_value}"`);
      });
    },
  };

  // Function to handle searches similarly
  const searches = {
    current: {
      archive: false,
      bot: [],
      show: ['queue', 'bot', 'system'],
      sort: { direction: 'asc', index: 0 },
      statuses: ['!archived'],
      system: [],
      text: '',
    },
    order: (order) => {
      if (order) {
        localStorage.setItem('saved-searches-order', JSON.stringify(order));
      }
      return JSON.parse(localStorage.getItem('saved-searches-order')) || Object.keys(JSON.parse(localStorage.getItem('saved-searches')) || {}).sort();
    },
    views: JSON.parse(localStorage.getItem('saved-searches')) || {},
    restore: (view) => {
      state.changeView('dashboard');
      const viewId = searches.views[view];
      setCurrentSearch(JSON.parse(localStorage.getItem(viewId)));
    },
    delete: (view) => {
      LeoKit.confirm(`Delete search "${view}"?`, () => {
        const savedViews = searches.views;
        const viewId = savedViews[view];
        localStorage.removeItem(viewId);
        delete savedViews[view];
        searches.order(searches.order().filter(v => v !== view));
      });
    },
    save: () => {
      LeoKit.prompt('Save Search', 'Enter search name', (form) => {
        if (!form.prompt_value) {
          LeoKit.alert('Name is required', 'warning');
          return false;
        }

        const savedViews = searches.views;
        const viewId = `saved-search-${Date.now()}${Math.random()}`;
        localStorage.setItem(viewId, JSON.stringify(searches.current));
        savedViews[form.prompt_value] = viewId;
        localStorage.setItem('saved-searches', JSON.stringify(savedViews));
        searches.order([...searches.order(), form.prompt_value]);
        LeoKit.notify(`Saved Search "${form.prompt_value}"`);
      });
    },
  };

  return (
    <div id="main">
      <MessageCenter messageLogged={messageLogged} />

      {trace && <EventTrace data={trace} onClose={() => setTrace(undefined)} />}

      <Header settings={state} messageCount={messageCount} />
      <LeftNav workflows={workflows} searches={searches} />
      <Content settings={state} workflows={workflows} searches={searches} currentSearch={currentSearch} />

      {addDataSource && <DataSourceConnect onClose={() => setAddDataSource(false)} />}
    </div>
  );
}

export default App;
