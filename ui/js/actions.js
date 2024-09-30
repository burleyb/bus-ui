import { useDataContext } from './stores/DataContext.jsx'; 

// Example of using Context to replace actions

export const setIsAuthenticated = (dispatch, state) => {
    dispatch({ type: 'SET_IS_AUTHENTICATED', payload: state });
};

export const setDisplayState = (dispatch, state) => {
    dispatch({ type: 'SET_DISPLAY_STATE', payload: state });
};

export const saveSettings = (dispatch, settings, replace) => {
    dispatch({ type: 'SAVE_SETTINGS', payload: { settings, replace } });
};
