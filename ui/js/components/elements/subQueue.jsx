import React, { useState, useEffect } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';
import refUtil from 'leo-sdk/lib/reference.js';

const QueueSelector = (props) => {
  const [systemId, setSystemId] = useState((refUtil.ref(props.value) || { owner: () => null }).owner()?.id || '');
  const [subqueue, setSubqueue] = useState((refUtil.ref(props.value) || { owner: () => null }).owner()?.queue || '');
  const [subqueues, setSubqueues] = useState([]);
  const [id, setId] = useState(props.value);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (systemId) {
      const filteredSubqueues = props.queues
        .filter((queueId) => props.nodes[queueId]?.owner === systemId)
        .map((queueId) => refUtil.ref(queueId).owner()?.queue)
        .filter((value, index, self) => value && self.indexOf(value) === index);
      setSubqueues(filteredSubqueues);
      setId(refUtil.ref(systemId)?.queue(subqueue)?.toString() || '');
    }
  }, [systemId, subqueue, props.queues, props.nodes]);

  const handleSystemPick = (system) => {
    if (system?.id) {
      setSystemId(system.id);
      setSubqueue('');
    }
  };

  const handleSubqueueChange = (event) => {
    const newSubqueue = event.currentTarget.value;
    setSubqueue(newSubqueue);
    setId(refUtil.ref(systemId).queue(newSubqueue)?.toString() || '');
  };

  const toggleDropdown = (show) => {
    setShowDropdown(show);
  };

  const selectSubqueue = (selectedSubqueue) => {
    setSubqueue(selectedSubqueue);
    setShowDropdown(false);
  };

  return (
    <div title={props.title} className="display-inline-block">
      <NodeSearch
        value={systemId}
        className="display-block"
        nodeType={props.nodeType}
        onChange={handleSystemPick}
      />
      <div className="theme-autocomplete">
        <input
          value={subqueue || ''}
          onChange={handleSubqueueChange}
          placeholder={props.placeholder}
          onFocus={() => toggleDropdown(true)}
        />
        {showDropdown && subqueues.length > 0 && (
          <>
            <div className="mask" onClick={() => toggleDropdown(false)} />
            <ul>
              {subqueues.map((subqueueItem) => (
                <li key={subqueueItem} onClick={() => selectSubqueue(subqueueItem)}>
                  {subqueueItem}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <input type="hidden" name={props.name} value={id || ''} readOnly />
    </div>
  );
};

export default QueueSelector;
