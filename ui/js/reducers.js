import React, { useState, useContext } from 'react';
import { useDataContext } from './stores/DataContext.jsx'; // Assuming DataContext is already created
import EventTrace from './components/dialogs/eventTrace.jsx';
import Header from './components/main/header.jsx';
import LeftNav from './components/main/leftNav.jsx';
import Content from './components/main/content.jsx';
import MessageCenter from './components/main/messageCenter.jsx';
import DataSourceConnect from './components/dialogs/dataSourceConnect.jsx';
import ApiData from './components/main/apiData.jsx';

function App() {
    const { state, dispatch } = useDataContext(); // Use context instead of Redux and MobX
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
