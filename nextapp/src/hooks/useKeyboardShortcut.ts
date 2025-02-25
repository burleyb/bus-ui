import { useEffect, useCallback, useRef } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;
type KeyMap = Record<string, KeyHandler>;
type Options = {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  keyevent?: 'keydown' | 'keyup' | 'keypress';
  disabled?: boolean;
};

/**
 * Custom hook for handling keyboard shortcuts
 * @param keyMap - Object mapping key combinations to handler functions
 * @param options - Configuration options
 */
export function useKeyboardShortcut(keyMap: KeyMap, options: Options = {}) {
  const {
    preventDefault = true,
    stopPropagation = true,
    keyevent = 'keydown',
    disabled = false,
  } = options;

  // Use a ref to store the keyMap to avoid recreating the handler on every render
  const keyMapRef = useRef<KeyMap>(keyMap);
  
  // Update the ref when keyMap changes
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  // Event handler
  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Create a key string based on modifiers and key
      const modifiers = [];
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.shiftKey) modifiers.push('shift');
      if (event.altKey) modifiers.push('alt');
      if (event.metaKey) modifiers.push('meta');

      // Get the key name (lowercase for consistency)
      const key = event.key.toLowerCase();
      
      // Skip if the key is a modifier key itself
      if (['control', 'shift', 'alt', 'meta'].includes(key)) {
        return;
      }

      // Create the key combination string
      const keyCombo = [...modifiers, key].join('+');

      // Check if we have a handler for this key combination
      const handler = keyMapRef.current[keyCombo];
      if (handler) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handler(event);
      }
    },
    [disabled, preventDefault, stopPropagation]
  );

  // Add and remove the event listener
  useEffect(() => {
    if (!disabled) {
      window.addEventListener(keyevent, handleKey);
    }
    
    return () => {
      window.removeEventListener(keyevent, handleKey);
    };
  }, [keyevent, handleKey, disabled]);
}

export default useKeyboardShortcut; 