
import React, { useReducer, useEffect } from 'react';
import moment from 'moment';
import momenttz from 'moment-timezone';

// Setting up initial state
const initialState = {
    running: true,
    tab: 'micro',
    window: {
        period: "day",
        start: moment().utc().startOf('day').valueOf(),
        end: moment.now(),
    },
    data: []
};

// Example reducer to handle state updates
function rootReducer(state, action) {
    switch (action.type) {
        case 'SET_RUNNING':
            return { ...state, running: action.payload };
        case 'SET_TAB':
            return { ...state, tab: action.payload };
        case 'SET_WINDOW':
            return { ...state, window: action.payload };
        case 'SET_DATA':
            return { ...state, data: action.payload };
        default:
            return state;
    }
}

// Context for the app's state management
const AppStateContext = React.createContext();

export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(rootReducer, initialState);

    // Side effect to simulate middleware or async actions
    useEffect(() => {
        // Any async operations can be handled here
    }, []);

    return (
        <AppStateContext.Provider value={{ state, dispatch }}>
            {children}
        </AppStateContext.Provider>
    );
};

// Usage of context would happen in components where state is needed, with useContext(AppStateContext)