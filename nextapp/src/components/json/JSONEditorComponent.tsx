"use client";

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  focus: () => void;
  get: () => any;
  set: (json: any) => void;
  search: (text: string) => void;
}

const JSONEditorComponent = forwardRef<JSONEditorHandle, JSONEditorComponentProps>(
  ({
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
    const editorRef = useRef<any>(null);
    const [isClient, setIsClient] = useState(false);

    // This effect will run only on the client
    useEffect(() => {
      setIsClient(true);
    }, []);

    // Initialize the editor
    useEffect(() => {
      if (!isClient || !containerRef.current) return;

      // Dynamic import to avoid SSR issues
      const initEditor = async () => {
        try {
          const { default: JSONEditor } = await import('jsoneditor');
          
          if (!containerRef.current) return;
          
          const options = {
            mode,
            modes: allowedModes,
            onModeChange: (newMode: string) => {
              // This is just a mode change event
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
          
          // Create editor instance
          editorRef.current = new JSONEditor(containerRef.current, options);
          
          // Set initial data
          if (data) {
            editorRef.current.set(data);
          }
        } catch (error) {
          console.error('Failed to initialize JSONEditor', error);
          if (onError && error instanceof Error) {
            onError(error);
          }
        }
      };
      
      initEditor();
      
      // Cleanup
      return () => {
        if (editorRef.current) {
          editorRef.current.destroy();
          editorRef.current = null;
        }
      };
    }, [isClient, allowedModes, mode, onChange, onError, data, readOnly, showMainMenu, showStatusBar]);
    
    // Update editor when props change and editor exists
    useEffect(() => {
      if (!isClient || !editorRef.current) return;
      
      // Update mode if changed
      const currentMode = editorRef.current.getMode();
      if (mode !== currentMode) {
        editorRef.current?.setMode(mode);
      }
      
      // Update data if changed and not in the middle of editing
      try {
        editorRef.current?.update(data);
      } catch (e) {
        console.error('Error updating JSON editor data:', e);
      }
    }, [isClient, data, mode]);
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      expandAll: () => {
        try {
          if (editorRef.current) {
            editorRef.current?.expandAll();
          }
        } catch (err) {
          console.error('Error expanding JSON:', err);
        }
      },
      collapseAll: () => {
        try {
          if (editorRef.current) {
            editorRef.current?.collapseAll();
          }
        } catch (err) {
          console.error('Error collapsing JSON:', err);
        }
      },
      focus: () => {
        try {
          if (editorRef.current) {
            editorRef.current?.focus();
          }
        } catch (err) {
          console.error('Error focusing JSON editor:', err);
        }
      },
      get: () => {
        try {
          if (editorRef.current) {
            return editorRef.current?.get();
          }
          return null;
        } catch (err) {
          console.error('Error getting JSON data:', err);
          return null;
        }
      },
      set: (json: any) => {
        try {
          if (editorRef.current) {
            editorRef.current?.set(json);
          }
        } catch (err) {
          console.error('Error setting JSON data:', err);
        }
      },
      search: (text: string) => {
        if (!editorRef.current) return;
        
        try {
          // Handle search differently based on mode
          const currentMode = editorRef.current.getMode();
          
          if (currentMode === 'code' || currentMode === 'text') {
            // For code and text modes, search in Ace editor
            const aceEditor = editorRef.current._aceEditor;
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
            // For tree, form, and view modes, find and use the search box
            const container = containerRef.current;
            if (container) {
              const searchBox = container.querySelector('.jsoneditor-search input');
              if (searchBox) {
                (searchBox as HTMLInputElement).value = text;
                const event = new Event('input', { bubbles: true });
                searchBox.dispatchEvent(event);
              } else {
                // If search box isn't visible, try to show it
                const searchButton = container.querySelector('.jsoneditor-search button');
                if (searchButton) {
                  (searchButton as HTMLButtonElement).click();
                  
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
    }), []);

    // Render just a container div that the JSONEditor will attach to
    return (
      <div 
        ref={containerRef} 
        className={className}
        style={{ height, width }}
      />
    );
  }
);

JSONEditorComponent.displayName = 'JSONEditorComponent';

export default JSONEditorComponent; 