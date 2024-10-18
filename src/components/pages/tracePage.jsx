import React, { useContext, useState, useEffect } from 'react';
import EventViewer from '../tabs/eventViewer.jsx';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const TraceViewer = () => {
    const state = useData(); 
    const [queueId, setQueueId] = useState(null);

    useEffect(() => {
        if (!state.hasData ) {
            state.fetchStats();
        }
    }, [state.hasData]);

    return (
        !state.hasData
            ? <div className="theme-spinner-large" />
            : (
                <div className="theme-form height-1-1 padding-20 border-box">
                    <div className="height-1-1 display-block">
                        <EventViewer trace={true} nodeData={{ id: queueId }} hideReply="true" tracePage="true" />
                    </div>
                </div>
            )
    );
};

export default TraceViewer;
