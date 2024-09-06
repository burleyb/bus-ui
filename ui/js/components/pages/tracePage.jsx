import React, { useContext, useState, useEffect } from 'react';
import EventViewer from '../tabs/eventViewer.jsx';
import { DataContext } from '../../../stores/DataContext'; // Assuming usage of React Context for global state

const TraceViewer = () => {
    const { state, dispatch } = useContext(DataContext); // Using React Context for state management
    const [queueId, setQueueId] = useState(null);

    useEffect(() => {
        if (!state.hasData) {
            // Fetch stats if not already available
            dispatch({ type: 'FETCH_STATS' });
        }
    }, [state.hasData, dispatch]);

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
}

export default TraceViewer;
