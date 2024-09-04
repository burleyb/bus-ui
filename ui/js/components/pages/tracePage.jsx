import React, { useState, useEffect } from 'react';
import EventViewer from '../tabs/eventViewer.jsx';
import { useDataStore } from '../../../stores/dataStore'; // Corrected path to dataStore.js

const TraceViewer = () => {
    const { dataStore, getStats } = useDataStore(); // Use context or hook from the correct dataStore
    const [queueId, setQueueId] = useState(null); // Local state for queueId

    useEffect(() => {
        if (!dataStore.hasData) {
            getStats(); // Fetch stats on mount
        }
    }, [dataStore, getStats]); // Dependency array ensures effect runs only when needed

    return (
        !dataStore.hasData
            ? <div className="theme-spinner-large" />
            : (
                <div className="theme-form height-1-1 padding-20 border-box">
                    <div className="height-1-1 display-block">
                        <EventViewer trace={true} nodeData={{ id: queueId }} hideReply={true} tracePage={true} />
                    </div>
                </div>
            )
    );
};

export default TraceViewer;
