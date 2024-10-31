import React, { useContext, useEffect, useState } from 'react';
import { useData } from '../stores/DataContext'; // Assuming DataContext is already defined
import EventTrace from './dialogs/eventTrace.jsx';
import Header from './main/header.jsx';
import LeftNav from './main/leftNav.jsx';
import Content from './main/content.jsx';
import MessageCenter from './main/messageCenter.jsx';
import DataSourceConnect from './dialogs/dataSourceConnect.jsx';
import moment from 'moment';

// Utility functions preserved as global helpers
String.prototype.capitalize = function(lower) {
  return (lower ? this.toLowerCase() : this).replace(/(?:^|\s|\.)\S/g, f => f.toUpperCase());
};

['round', 'floor', 'ceil'].forEach((funcName) => {
  if (!Math['_' + funcName]) {
    Math['_' + funcName] = Math[funcName];
    Math[funcName] = (number, precision) => {
      precision = Math.abs(parseInt(precision)) || 0;
      const coefficient = Math.pow(10, precision);
      return Math['_' + funcName](number * coefficient) / coefficient;
    };
  }
});

String.prototype.htmlEncode = function() {
  const div = document.createElement('div');
  div.textContent = this;
  return div.innerHTML;
};

const useResponsiveFont = () => {
  useEffect(() => {
    const responsiveFont = () => {
      // Your original function logic without jQuery
      if (!document.hidden) {
        const elements = document.querySelectorAll('.responsive-font');
        
        elements.forEach((element) => {
          element.style.overflow = 'auto';
          element.style.fontSize = '';

          // Decrease font size until content fits the parent width
          while (element.scrollWidth > element.parentElement.clientWidth) {
            const currentFontSize = parseInt(window.getComputedStyle(element).fontSize);
            element.style.fontSize = `${currentFontSize - 1}px`;
          }

          element.style.overflow = '';
        });
      }
    };

    // Add event listener on mount
    window.addEventListener('resize', responsiveFont);

    // Initial call to set font size correctly
    responsiveFont();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', responsiveFont);
    };
  }, []); // Empty dependency array ensures it runs once
};


// Main App Component
const App = () => {
  const { 
    changeAllStateValues, 
    setSettings, 
    settings, 
    nodeTree, 
    setNodeTree, 
    workflows, 
    searches, 
    messageLogNotify,
  } = useData();

  const [trace, setTrace] = useState(null);
  const [addDataSource, setAddDataSource] = useState(false);
  const [messageCount, setMessageCount] = useState(
    JSON.parse(sessionStorage.getItem('messageQueue') || '[]').length
  );

  function loadSettings() {
    let hash = decodeURI(document.location.hash.slice(1)) || '';

    if (hash === '') {
      const viewId = localStorage.getItem('default-view');
      if (viewId) {
        document.location.hash = JSON.parse(localStorage.getItem(viewId)) || '{}';
        return;
      }
    }

    let values;
    try {
      values = JSON.parse(decodeURI(hash || '') || '{}');
    } catch (e) {
      const msg = 'Invalid Request';
      messageLogNotify ? messageLogNotify(msg, 'warning', e) : alert(msg);
      values = {};
    }

    let me = nodeTree || { left: { collapsed: [] }, right: { collapsed: [] } };

    me.selected = values.selected || [];

    changeAllStateValues(
      values.selected,
      values.timePeriod,
      values.view,
      values.offset,
      values.node,
      me.zoom,
      values.details
    );
    setSettings(values);

    me.toggle_stats = values.stats || { all: true };
    me.zoom = values.zoom || 1;

    // Set zoom status
    setNodeTree((prev) => ({
      ...prev,
      zoom: me.zoom,
      left: { collapsed: values.collapsed ? values.collapsed.left || [] : [] },
      right: { collapsed: values.collapsed ? values.collapsed.right || [] : [] },
      offsetDistance: values.offset || [0, 0],
      root: me.root || values.node,
    }));

    if (values.timePeriod && values.timePeriod.begin && !values.timePeriod.end) {
      const interval = (values.timePeriod.interval || 'hour_6').split('_');
      values.timePeriod.end = moment(values.timePeriod.begin)
        .add(parseInt(interval[1]) || 1, interval[0])
        .format('Y-MM-DD h:mm:ss');
    }

    return {
      details: values.details && values.selected && values.selected.length > 0,
      view: values.view || 'dashboard',
      list: values.list || 'bots',
      sort: values.sort || { index: 0, direction: 'asc' },
      selected: values.selected || [],
      node: values.node || '',
      stats: values.stats || { all: true },
      timePeriod: values.timePeriod || { interval: 'hour_6' },
    };
  }

  useEffect(() => {
    const handleHashChange = () => {
      const newState = loadSettings();
      if(settings) {
        setSettings(newState);
      }
      if (newState.view === 'node') {
        nodeTree.updateDiagram(newState.node || null, true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Utility functions for App actions
  const messageLogged = (count) => setMessageCount(count);

  const handleStartTrace = (traceData) => {
    setTrace(undefined); // Reset trace
    setTrace(traceData); // Set new trace
  };

  const handleAddDataSource = () => setAddDataSource(true);

  return (
    <main id="main">

      <MessageCenter messageLogged={messageLogged} />

      {trace && <EventTrace data={trace} onClose={() => setTrace(undefined)} />}

      <Header messageCount={messageCount} />

      <LeftNav workflows={workflows} searches={searches} userSettings={settings} />

      <Content
      />

      {addDataSource && <DataSourceConnect onClose={() => setAddDataSource(false)} />}
    </main>
  );
};

export default App;
