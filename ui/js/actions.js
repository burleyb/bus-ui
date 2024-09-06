import { useContext } from 'react';
import { DataContext } from './path/to/DataContext';

// Example of using Context to replace actions

export const setIsAuthenticated = (state) => {
    const { dispatch } = useContext(DataContext);
    dispatch({ type: 'SET_IS_AUTHENTICATED', payload: state });
};

export const setDisplayState = (state) => {
    const { dispatch } = useContext(DataContext);
    dispatch({ type: 'SET_DISPLAY_STATE', payload: state });
};

export const saveSettings = (settings, replace) => {
    const { dispatch } = useContext(DataContext);
    dispatch({ type: 'SAVE_SETTINGS', payload: { settings, replace } });
};
