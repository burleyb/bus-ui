import { useReducer, useEffect } from 'react';

// Define action types
const SET_IS_AUTHENTICATED = 'SET_IS_AUTHENTICATED';
const SET_HAS_DATA = 'SET_HAS_DATA';
const SET_DISPLAY_STATE = 'SET_DISPLAY_STATE';
const SET_PAGE_VIEW = 'SET_PAGE_VIEW';
const SAVE_SETTINGS = 'SAVE_SETTINGS';

// Define individual reducer functions
const isAuthenticatedReducer = (state, action) => {
  if (action.type === SET_IS_AUTHENTICATED) {
    return true;
  }
  return state;
};

const hasDataReducer = (state, action) => {
  if (action.type === SET_HAS_DATA) {
    return true;
  }
  return state;
};

const displayPausedReducer = (state, action) => {
  switch (action.type) {
    case SET_DISPLAY_STATE:
      return !!action.state;
    default:
      return state;
  }
};

const userSettingsReducer = (state, action) => {
  switch (action.type) {
    case SET_PAGE_VIEW:
      return {
        ...state,
        view: action.view,
      };
    case SAVE_SETTINGS:
      let values;
      try {
        values = {
          ...JSON.parse(decodeURI(document.location.hash.slice(1)) || '{}'),
          ...action.settings,
        };
      } catch (e) {
        values = {};
      }
      delete values.detailsPeriod;
      if (action.replace) {
        document.location.replace(
          document.location.href.split('#')[0] + '#' + JSON.stringify(values).replace(/ /g, '%20')
        );
      } else {
        document.location.hash = JSON.stringify(values);
      }
      return values;
    default:
      return state;
  }
};

// Combine all reducers using useReducer
const useAppReducers = () => {
  const [isAuthenticated, dispatchIsAuthenticated] = useReducer(isAuthenticatedReducer, false);
  const [hasData, dispatchHasData] = useReducer(hasDataReducer, false);
  const [displayPaused, dispatchDisplayPaused] = useReducer(displayPausedReducer, false);
  const [userSettings, dispatchUserSettings] = useReducer(userSettingsReducer, {
    view: 'dashboard',
    selected: [],
    timePeriod: { interval: 'hour_6' },
  });

  // Effect example for hash-based settings update (previously in userSettings)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = document.location.hash.slice(1);
      if (hash) {
        try {
          const parsedHash = JSON.parse(decodeURI(hash));
          dispatchUserSettings({ type: SAVE_SETTINGS, settings: parsedHash, replace: false });
        } catch (e) {
          console.error('Failed to parse hash settings', e);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [dispatchUserSettings]);

  return {
    isAuthenticated,
    hasData,
    displayPaused,
    userSettings,
    dispatchIsAuthenticated,
    dispatchHasData,
    dispatchDisplayPaused,
    dispatchUserSettings,
  };
};

export default useAppReducers;
