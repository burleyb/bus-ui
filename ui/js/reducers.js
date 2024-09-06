import React, { useState, useContext } from 'react';
import { DataContext } from '../../../stores/DataContext'; // Assuming DataContext is already created
import EventTrace from './dialogs/eventTrace.jsx';
import Header from './main/header.jsx';
import LeftNav from './main/leftNav.jsx';
import Content from './main/content.jsx';
import MessageCenter from './main/messageCenter.jsx';
import DataSourceConnect from './dialogs/dataSourceConnect.jsx';
import ApiData from './main/apiData.jsx';

function App() {
    const { state, dispatch } = useContext(DataContext); // Use context instead of Redux and MobX
    const [trace, setTrace] = useState();
    const [addDataSource, setAddDataSource] = useState();
    const [messageCount, setMessageCount] = useState(0);
    
    // Function to handle message count updates
    const messageLogged = (messageCount) => {
        setMessageCount(messageCount);
    };

    return (
        <main id="main">
            <ApiData />
            <MessageCenter messageLogged={messageLogged} />
            {trace && <EventTrace data={trace} onClose={() => setTrace(undefined)} />}
            <Header settings={state} messageCount={messageCount} />
            <LeftNav workflows={state.workflows} searches={state.searches} />
            <Content
                settings={state}
                workflows={state.workflows}
                searches={state.searches}
                currentSearch={state.currentSearch}
            />
            {addDataSource && (
                <DataSourceConnect onClose={() => setAddDataSource(undefined)} />
            )}
        </main>
    );
}

export default App;
