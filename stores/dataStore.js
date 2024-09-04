
import React, { createContext, useReducer, useContext, useState } from 'react';
import _ from 'lodash';
import moment from 'moment';
import refUtil from "leo-sdk/lib/reference.js";

// Initial state of the store
const initialState = {
    action: {},
    active: null,
    activeBotCount: 0,
    alarmed: [],
    alarmedCount: 0,
    availableTags: {},
    authenticated: null,
    bots: [],
    config: null,
    changeLog: null,
    checksums: {},
    cronInfo: null,
    dashboard: null,
    displayState: null,
    eventSettings: null,
    fetchTimeout: undefined,
    fetchTimeout2: undefined,
    filterByTag: {},
    // Add other states from your original MobX store here
};

// Create a reducer function to handle state changes (similar to MobX actions)
function dataStoreReducer(state, action) {
    switch (action.type) {
        case 'SET_ACTIVE':
            return { ...state, active: action.payload };
        case 'UPDATE_ALARMED':
            return { ...state, alarmed: action.payload };
        case 'SET_BOTS':
            return { ...state, bots: action.payload };
        // Add more cases based on MobX actions in the original store
        default:
            return state;
    }
}

// Create the context
const DataStoreContext = createContext();

// Create a provider component
export const DataStoreProvider = ({ children }) => {
    const [state, dispatch] = useReducer(dataStoreReducer, initialState);

    return (
        <DataStoreContext.Provider value={{ state, dispatch }}>
            {children}
        </DataStoreContext.Provider>
    );
};

// Custom hook to use the data store
export const useDataStore = () => useContext(DataStoreContext);