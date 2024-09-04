import React, { useState, useEffect } from 'react';
import Tree from '../elements/tree.jsx';
import numeral from 'numeral';
import moment from 'moment';
import $ from 'jquery';

const EventTrace = ({ data, dataStore, onClose }) => {
  const [source, setSource] = useState({});
  const [settings, setSettings] = useState({
    collapsed: {
      left: [],
      right: []
    }
  });
  const [nodeData, setNodeData] = useState({});

  useEffect(() => {
    if (data) {
      parseData(data.response);
    }
  }, [data]);

  useEffect(() => {
    const modal = LeoKit.modalFull(
      $('.eventTrace'),
      {},
      'Event Trace',
      onClose
    );

    return () => {
      LeoKit.closeModal(modal); // Clean up modal on unmount
    };
  }, [onClose]);

  const parseData = (data) => {
    const nodeData = {};
    const collapsed = { left: [], right: [] };

    nodeData[data.event.id] = data.event;

    const sourceNode = {
      below: [moment(data.event.timestamp).format('MM/DD/YY h:mm:ss a')],
      checkpoint: data.event.checkpoint || data.event.kinesis_number,
      icon: 'queue.png',
      id: data.event.id,
      is_root: true,
      label: (dataStore.nodes[data.event.id] || {}).label,
      payload: data.event.payload,
      server_id: data.event.server_id,
      type: data.event.type
    };

    let parents = [];
    data.parents.forEach((parent, index) => {
      nodeData[parent.id] = parent;
      const lag = index > 0 ? data.parents[index - 1].lag : '';

      const node = {
        below: parent.type === 'queue' ? [moment(parent.timestamp).format('h:mm:ss a')] : [],
        checkpoint: parent.checkpoint || parent.kinesis_number,
        icon: `${parent.type}.png`,
        id: parent.id,
        kids: [],
        label: (dataStore.nodes[parent.id] || {}).label,
        parents: parents,
        payload: parent.payload,
        server_id: parent.server_id,
        type: parent.type,
        relation: {
          below: lag ? [formatTime(lag)] : [],
          type: 'read'
        }
      };
      parents = [node];
    });

    sourceNode.parents = parents;
    sourceNode.kids = parseChildren(data.children, collapsed, true);
    setSource(sourceNode);
    setSettings((prevSettings) => ({ ...prevSettings, collapsed }));
    setNodeData(nodeData);
  };

  const parseChildren = (children, collapsed, parentProcessed) => {
    let kids = [];

    Object.keys(children).forEach((childId) => {
      const child = children[childId];
      const node = dataStore.nodes[childId];

      if (node && node.status !== 'archived' && !node.archived) {
        child.missingData = true;
        setNodeData((prevNodeData) => ({ ...prevNodeData, [child.id]: child }));

        kids.push({
          below: child.type === 'queue' ? [moment(child.timestamp).format('h:mm:ss a')] : [child.has_processed ? 'Processed' : { errors: 'Not Processed' }],
          checkpoint: child.checkpoint || child.kinesis_number,
          icon: `${child.type}.png`,
          id: child.id,
          kids: parseChildren(child.children, collapsed, !!child.has_processed),
          label: node.label,
          parents: [],
          payload: child.payload,
          server_id: child.server_id,
          type: child.type,
          relation: {
            below: (child.type === 'queue' && parentProcessed) ? ['click to trace'] : [],
            fill: 'gray',
            type: 'write'
          }
        });

        if (child.type === 'bot' && !child.has_processed && child.id && Object.keys(child.children).length) {
          collapsed.right.push(child.id);
        }
      }
    });

    return kids;
  };

  const linkClicked = (selection, data) => {
    if (nodeData[data.target.id].missingData) {
      let lookups = [data.target.id];
      let parent = data.source;

      while (!parent.checkpoint || typeof parent.checkpoint !== 'string' || (dataStore.nodes[parent.id] || {}).type === 'bot') {
        lookups.unshift(parent.id);
        parent = parent.parent;
      }

      const showProcessing = (source) => {
        if (source.kids) {
          source.kids = source.kids.map((kid) => {
            if (lookups.includes(kid.id)) {
              if (kid.type === 'queue') {
                kid.relation.below = ['tracing...'];
              }
              kid.relation.fill = 'working';
            }
            kid = showProcessing(kid);
            return kid;
          });
        }
        return source;
      };

      setSource(showProcessing(source));

      const href = `${window.api}/trace/${encodeURIComponent(parent.id)}/${encodeURIComponent(parent.checkpoint)}`;
      $.get(href, { children: lookups.join(',') }, (newData) => {
        const updateKids = (source) => {
          if (source.kids) {
            source.kids = source.kids.map((kid) => {
              if (newData[kid.id]) {
                kid.payload = newData[kid.id].payload;
                kid.lag = newData[kid.id].lag;
                kid.checkpoint = newData[kid.id].checkpoint;
                delete kid.missingData;
                kid.relation.below = [(kid.type === 'queue' ? formatTime(kid.lag) : 'n/a')];
                delete kid.relation.fill;
                setNodeData((prevNodeData) => ({ ...prevNodeData, [kid.id]: kid }));
              }
              kid = updateKids(kid);
              return kid;
            });
          }
          return source;
        };
        setSource(updateKids(source));
      }).fail((result) => {
        result.call = href;
        window.messageLogModal(`Failure calling trace on ${(dataStore.nodes[parent.id] || {}).label}`, 'error', result);
      });
    } else {
      setSettings((prevSettings) => ({ ...prevSettings, selection }));
    }
  };

  const formatTime = (milliseconds) => {
    return `${numeral(Math.floor(milliseconds / 1000)).format('00:00:00')}${numeral((milliseconds / 1000) % 1).format('.0')}`.replace(/^0:/, '').replace(/^00:/g, '').replace(/^00\./g, '.') + 's';
  };

  const rotators = [
    false, // For future additional button
    (data, which, me) => ({
      'icon-cog': function (data) {
        return function () {
          data.openTab = data.type === 'bot' ? 'Mapping' : 'Events';
          window.traceSettings(data);
        };
      }(data)
    }),
    'tree-collapse-right',
    false, // For future additional button
    false, // For future additional button
    'tree-collapse-left',
    false, // For future additional button
    false  // For future additional button
  ];

  return (
    <div>
      <div className="event-trace eventTrace">
        <Tree
          id="traceTree"
          root={source.id}
          source={source}
          settings={settings}
          collapsed={settings.collapsed}
          rotators={rotators}
          onLinkClick={linkClicked}
          force="true"
        />
      </div>
    </div>
  );
};

export default EventTrace;
