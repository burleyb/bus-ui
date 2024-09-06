import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import momenttz from 'moment-timezone';
import { DataProvider } from '../../..//stores/DataContext'; 
import { DialogProvider } from '../../..//stores/DialogContext'; 
import App from './components/main.jsx';

// Set up moment timezone
window.moment = moment;
if (window.botmon.timezone) {
    moment.tz.setDefault(window.botmon.timezone);
} else if (localStorage.getItem("defaultBotmonTimezone")) {
    moment.tz.setDefault(localStorage.getItem("defaultBotmonTimezone"));
}

// Main application component wrapped in DataProvider
function Root() {
    return (
        <DataProvider>
            <DialogProvider>
                <App />
            </DialogProvider>
        </DataProvider>
    );
}

// Load necessary CSS and JavaScript files
import "../css/main.less";
import "../static/js/data.js";
import "../static/js/dialogs.js";

// Initialize the application with authentication logic
LEOCognito.start(
    window.leoAws.cognitoId, 
    (window.leo && window.leo.getToken) || false, 
    { apiUri: "api/", region: window.leoAws.region, cognito_region: window.leoAws.cognito_region }, 
    function () {
        ReactDOM.render(<Root />, document.getElementById('EventBus'));
    }
);
