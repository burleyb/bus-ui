import React, { Component } from 'react';
import { Provider, connect } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit'; // Change this import
import thunk from 'redux-thunk'; // Change this import
import rootReducer from './reducers.js';
import moment from 'moment';
import momenttz from 'moment-timezone';

window.registry = {
	tabs: {},
	systems: {
		csv: {
			'Bob the Builder': 'EventViewer'
		}
	}
};

window.moment = moment;

if (window.botmon.timezone) {
    moment.tz.setDefault(window.botmon.timezone);
} else if (localStorage.getItem("defaultBotmonTimezone")){
	moment.tz.setDefault(localStorage.getItem("defaultBotmonTimezone"))
}

/*
const loggerMiddleware = createLogger();

var preloadedState = {
	state: {
		running: true,
	},
	navigation: {
		tab: 'micro'
	},
	window: {
		period: "day",
		start: moment().utc().startOf('day').valueOf(),
		end: moment.now(),
	},
	data: []
};
*/

const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false // Add this if you're using non-serializable values
        })
});

//window.store = store

//watcher.setStore(store);

var App = require("./components/main.jsx").default;
class Root extends Component {
	render() {
		return ( 
			<Provider store={store}>
				<App />
			</Provider>
		);
	}
}

//Set up CSS required
import "../css/main.less";

import "../static/js/data.js";
import "../static/js/dialogs.js";
$(function () {
    LEOCognito.start(window.leoAws.cognitoId, (window.leo && window.leo.getToken) || false, {apiUri: "api/", region: window.leoAws.region, cognito_region: window.leoAws.cognito_region}, function () {
        require("react-dom").render( < Root /> , document.getElementById('EventBus'));
    })
})