import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import momenttz from 'moment-timezone';
import { DataProvider } from './stores/DataContext.jsx'; 
import { DialogProvider } from './stores/DialogContext.jsx'; 
import App from './components/main.jsx';

// Set up moment timezone
window.moment = moment;


// Main application component wrapped in DataProvider and DialogProvider
function Root() {
    
    useEffect(() => {
        if (window.botmon.timezone) {
            moment.tz.setDefault(window.botmon.timezone);
        } else if (localStorage.getItem("defaultBotmonTimezone")) {
            moment.tz.setDefault(localStorage.getItem("defaultBotmonTimezone"));
        }
        
        LEOCognito.start(
            window.leoAws.cognitoId,
            (window.leo && window.leo.getToken) || false,
            { apiUri: "api/", region: window.leoAws.region, cognito_region: window.leoAws.cognito_region },
            function () {
                ReactDOM.render(<Root />, document.getElementById('EventBus'));
            }
        );

    }, []);

    return (
        <DataProvider>
            <DialogProvider>
                <App />
            </DialogProvider>
        </DataProvider>
    );
}

// Load necessary CSS and JavaScript files (ensure proper import syntax)
import "../css/main.less";
import "../static/js/data.js";
// import "../static/js/dialogs.js";

// Initialize LEOCognito authentication and render the React app
