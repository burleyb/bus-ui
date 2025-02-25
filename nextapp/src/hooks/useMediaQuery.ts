import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design with media queries
 * @param query - CSS media query string
 * @returns boolean - Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state
  const getMatches = (): boolean => {
    // Check if window is defined (so the hook works with SSR)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  // Update matches state when the media query changes
  useEffect(() => {
    // Prevent execution during SSR
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(query);
    const handler = () => setMatches(mediaQuery.matches);

    // Set initial value
    handler();

    // Add event listener
    mediaQuery.addEventListener('change', handler);

    // Remove event listener on cleanup
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Predefined breakpoints that match Tailwind CSS defaults
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

// Convenience hooks for common breakpoints
export const useIsMobile = () => !useMediaQuery(breakpoints.md);
export const useIsTablet = () => useMediaQuery(breakpoints.md) && !useMediaQuery(breakpoints.lg);
export const useIsDesktop = () => useMediaQuery(breakpoints.lg);

export default useMediaQuery; 