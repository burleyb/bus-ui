import React, { useState, useContext } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';
import { DataContext } from '../../stores/DataContext'; // Assuming you're using React Context
import refUtil from 'leo-sdk/lib/reference';

const QueueSelector = (props) => {
    const { dataStore } = useContext(DataContext); // Replacing MobX inject with React Context
    const [systemId, setSystemId] = useState((refUtil.ref(props.value) || { owner: () => null }).owner()?.id || '');
    const [subqueue, setSubqueue] = useState((refUtil.ref(props.value) || { owner: () => null }).owner()?.queue || '');
    const [subqueues, setSubqueues] = useState([]);
    const [id, setId] = useState(props.value);
    const [showDropdown, setShowDropdown] = useState(false);

    const pickedSystem = (system) => {
        if (system.id) {
            const availableSubqueues = dataStore.queues
                .filter((queueId) => dataStore.nodes[queueId].owner === system.id)
                .map((queueId) => refUtil.ref(queueId).owner().queue)
                .filter((value, index, self) => value && self.indexOf(value) === index);

            setSubqueues(availableSubqueues);
            const newId = (refUtil.ref(system.id).queue(subqueue) || {}).toString();
            setSystemId(system.id);
            setId(newId);
        } else {
            setSubqueues([]);
            setId('');
        }
    };

    const inputChanged = (event) => {
        const newSubqueue = event.currentTarget.value;
        setSubqueue(newSubqueue);
        const newId = refUtil.ref(systemId).queue(newSubqueue).toString();
        setId(newId);
    };

    const toggleDropdown = (show) => setShowDropdown(show);

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
                onChange={pickedSystem}
            />
            <div className="theme-autocomplete">
                <input
                    value={subqueue || ''}
                    onChange={inputChanged}
                    placeholder={props.placeholder}
                    onFocus={() => toggleDropdown(true)}
                />
                {showDropdown && subqueues.length ? (
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
                ) : null}
            </div>
            <input type="hidden" name={props.name} value={id || ''} readOnly onChange={props.onChange} />
        </div>
    );
};

export default QueueSelector;
