import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing state in URL hash
 * This maintains compatibility with the original application's URL hash-based state management
 */
export function useUrlHash<T extends Record<string, any>>(initialState: T): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);

  // Initialize state from URL hash on mount
  useEffect(() => {
    const setupFromUrl = () => {
      let urlHash = decodeURIComponent(window.location.hash.substr(1));
      if (urlHash) {
        try {
          const parsed = JSON.parse(urlHash);
          setState(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Error parsing URL hash', e);
        }
      }
    };

    setupFromUrl();

    // Listen for hash changes
    window.addEventListener('hashchange', setupFromUrl);
    return () => {
      window.removeEventListener('hashchange', setupFromUrl);
    };
  }, []);

  // Update URL hash when state changes
  const updateState = useCallback((updates: Partial<T>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      window.location.hash = JSON.stringify(newState);
      return newState;
    });
  }, []);

  return [state, updateState];
}

export default useUrlHash; 