"use client";

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

interface JSONEditorComponentProps {
  data: any;
  onChange?: (data: any) => void;
  mode?: 'tree' | 'view' | 'form' | 'code' | 'text' | 'preview';
  readOnly?: boolean;
  height?: string;
  width?: string;
  className?: string;
  onError?: (error: Error) => void;
  allowedModes?: Array<'tree' | 'view' | 'form' | 'code' | 'text' | 'preview'>;
  showMainMenu?: boolean;
  showStatusBar?: boolean;
}

export interface JSONEditorHandle {
  expandAll: () => void;
  collapseAll: () => void;
  compact: () => void;
  focus: () => void;
  get: () => any;
  getMode: () => string;
  set: (json: any) => void;
  update: (json: any) => void;
  setMode: (mode: string) => void;
  destroy: () => void;
  search: (text: string) => void;
}

/**
 * A React wrapper for the JSONEditor library
 * Provides a powerful interface for viewing and editing JSON data
 */
const JSONEditorComponent = forwardRef<JSONEditorHandle, JSONEditorComponentProps>(({
  data,
  onChange,
  mode = 'tree',
  readOnly = false,
  height = '400px',
  width = '100%',
  className = '',
  onError,
  allowedModes = ['tree', 'view', 'form', 'code', 'text'],
  showMainMenu = true,
  showStatusBar = true
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const [prevReadOnly, setPrevReadOnly] = useState(readOnly);
  const [prevMode, setPrevMode] = useState(mode);
  const [initializing, setInitializing] = useState(true);
  const [dataString, setDataString] = useState<string>('');
  
  // Expose JSONEditor methods via the ref
  useImperativeHandle(ref, () => ({
    expandAll: () => editorRef.current?.expandAll(),
    collapseAll: () => editorRef.current?.collapseAll(),
    compact: () => editorRef.current?.compact(),
    focus: () => editorRef.current?.focus(),
    get: () => editorRef.current?.get(),
    getMode: () => editorRef.current?.getMode(),
    set: (json: any) => editorRef.current?.set(json),
    update: (json: any) => editorRef.current?.update(json),
    setMode: (mode: string) => editorRef.current?.setMode(mode),
    destroy: () => editorRef.current?.destroy(),
    search: (text: string) => {
      // JSONEditor has different search implementations depending on the mode
      if (!editorRef.current) return;
      
      try {
        // The editor might be in different modes, and search works differently in each mode
        const currentMode = editorRef.current.getMode();
        
        if (currentMode === 'code' || currentMode === 'text') {
          // For code and text modes, search is implemented in the Ace editor
          // @ts-ignore: Accessing internal _aceEditor property
          const aceEditor = editorRef.current?._aceEditor;
          if (aceEditor && text) {
            aceEditor.find(text, {
              backwards: false,
              wrap: true,
              caseSensitive: false,
              wholeWord: false,
              regExp: false
            });
          }
        } else if (currentMode === 'tree' || currentMode === 'form' || currentMode === 'view') {
          // For tree, form, and view modes, we need to find the searchBox element and set the value
          // Then simulate an input event to trigger the search
          // This is hacky but necessary because JSONEditor doesn't expose a direct search API
          const container = containerRef.current;
          if (container) {
            const searchBox = container.querySelector('.jsoneditor-search input');
            if (searchBox) {
              // Set the value
              (searchBox as HTMLInputElement).value = text;
              
              // Trigger the input event
              const event = new Event('input', { bubbles: true });
              searchBox.dispatchEvent(event);
            } else {
              // If search box isn't visible, try to show it first
              // @ts-ignore: _onSearch might not be exposed in all versions
              if (typeof editorRef.current._onSearch === 'function') {
                // @ts-ignore
                editorRef.current._onSearch();
                // Try again after a short delay
                setTimeout(() => {
                  const searchBox = container.querySelector('.jsoneditor-search input');
                  if (searchBox) {
                    (searchBox as HTMLInputElement).value = text;
                    const event = new Event('input', { bubbles: true });
                    searchBox.dispatchEvent(event);
                  }
                }, 50);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error during search:', error);
      }
    }
  }), [editorRef.current]);
  
  // Compare data objects to check if they're equal
  const isDataEqual = useCallback((a: any, b: any) => {
    if (!a || !b) return a === b;
    try {
      const strA = JSON.stringify(a);
      const strB = JSON.stringify(b);
      return strA === strB;
    } catch (e) {
      console.error('Error comparing JSON data:', e);
      return false;
    }
  }, []);
  
  // Store data as string for comparison
  useEffect(() => {
    if (!initializing && data) {
      try {
        const newDataString = JSON.stringify(data);
        if (dataString !== newDataString) {
          setDataString(newDataString);
        }
      } catch (e) {
        console.error('Error stringifying JSON data:', e);
      }
    }
  }, [data, dataString, initializing]);

  // Create or destroy editor instance
  useEffect(() => {
    // Only create editor on mount or if it was destroyed
    if (containerRef.current && !editorRef.current) {
      try {
        const options = {
          mode: mode,
          modes: allowedModes,
          onModeChange: (newMode: string) => {
            setPrevMode(newMode as any);
          },
          onChange: () => {
            if (onChange && editorRef.current) {
              try {
                const updatedData = editorRef.current.get();
                // Skip update if data hasn't actually changed
                const currentDataStr = JSON.stringify(updatedData);
                if (currentDataStr !== dataString) {
                  onChange(updatedData);
                }
              } catch (e) {
                console.error('Error getting data from JSON editor', e);
                if (onError && e instanceof Error) {
                  onError(e);
                }
              }
            }
          },
          onError: (error: Error) => {
            console.error('JSONEditor error:', error);
            if (onError) {
              onError(error);
            }
          },
          statusBar: showStatusBar,
          navigationBar: true,
          mainMenuBar: showMainMenu,
          readOnly
        };
        
        editorRef.current = new JSONEditor(containerRef.current, options);
        
        // Set initial data
        if (data) {
          editorRef.current.set(data);
          setDataString(JSON.stringify(data));
        }
        
        setPrevMode(mode);
        setPrevReadOnly(readOnly);
        setInitializing(false);
      } catch (error) {
        console.error('Failed to initialize JSONEditor', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    }
    
    // Cleanup function to destroy the editor when the component unmounts
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Only on mount/unmount

  // Update editor data when the data prop changes
  useEffect(() => {
    // Skip during initialization
    if (initializing) return;
    
    // Only update editor if the props data changed and we have an editor
    if (editorRef.current && data && dataString) {
      try {
        const currentDataString = JSON.stringify(editorRef.current.get());
        
        // Only update if the data is different from what's in the editor
        if (dataString !== currentDataString) {
          editorRef.current.update(data);
        }
      } catch (e) {
        console.error('Error updating JSON editor data:', e);
      }
    }
  }, [dataString, data, initializing]);

  // Update editor mode when the mode prop changes
  useEffect(() => {
    // Skip during initialization
    if (initializing) return;
    
    // Only update if mode changed and we have an editor
    if (editorRef.current && mode && mode !== prevMode) {
      try {
        editorRef.current.setMode(mode);
        setPrevMode(mode);
      } catch (e) {
        console.error('Error setting editor mode:', e);
      }
    }
  }, [mode, prevMode, initializing]);

  // Handle readOnly prop changes by recreating the editor with the new readOnly setting
  useEffect(() => {
    // Skip during initialization
    if (initializing) return;
    
    // Only proceed if readOnly has changed and the editor exists
    if (readOnly !== prevReadOnly && editorRef.current && containerRef.current) {
      try {
        // Store the current data and mode
        const currentData = editorRef.current.get();
        const currentMode = editorRef.current.getMode();
        
        // Destroy the current editor
        editorRef.current.destroy();
        editorRef.current = null;
        
        // Create a new editor with the updated readOnly setting
        const options = {
          mode: currentMode,
          modes: allowedModes,
          onModeChange: (newMode: string) => {
            setPrevMode(newMode as any);
          },
          onChange: () => {
            if (onChange && editorRef.current) {
              try {
                const updatedData = editorRef.current.get();
                onChange(updatedData);
              } catch (e) {
                console.error('Error getting data from JSON editor', e);
                if (onError && e instanceof Error) {
                  onError(e);
                }
              }
            }
          },
          onError: (error: Error) => {
            console.error('JSONEditor error:', error);
            if (onError) {
              onError(error);
            }
          },
          statusBar: showStatusBar,
          navigationBar: true,
          mainMenuBar: showMainMenu,
          readOnly
        };
        
        // Add small delay to ensure DOM is ready
        setTimeout(() => {
          if (containerRef.current) {
            editorRef.current = new JSONEditor(containerRef.current, options);
            
            // Restore the data
            if (currentData) {
              editorRef.current.set(currentData);
            }
            
            // Update state
            setPrevReadOnly(readOnly);
          }
        }, 0);
      } catch (e) {
        console.error('Error recreating editor:', e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, initializing]);

  return (
    <div 
      ref={containerRef} 
      className={`json-editor-container ${className}`} 
      style={{ height, width }}
    />
  );
});

export default JSONEditorComponent; 