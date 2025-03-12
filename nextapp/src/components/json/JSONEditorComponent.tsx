"use client";

import React, { useRef, useEffect, useState } from 'react';
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
}

/**
 * A React wrapper for the JSONEditor library
 * Provides a powerful interface for viewing and editing JSON data
 */
const JSONEditorComponent: React.FC<JSONEditorComponentProps> = ({
  data,
  onChange,
  mode = 'tree',
  readOnly = false,
  height = '400px',
  width = '100%',
  className = '',
  onError,
  allowedModes = ['tree', 'view', 'form', 'code', 'text']
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);
  const [prevReadOnly, setPrevReadOnly] = useState(readOnly);

  // Initialize the editor when the component mounts
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      try {
        const options = {
          mode: mode,
          modes: allowedModes,
          onModeChange: (newMode: string) => {
            console.log('Mode changed to', newMode);
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
          statusBar: true,
          navigationBar: true,
          mainMenuBar: true,
          readOnly
        };
        
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
    }
    
    // Cleanup function to destroy the editor when the component unmounts
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);  // Only run on mount/unmount

  // Update editor data when the data prop changes
  useEffect(() => {
    if (editorRef.current && data) {
      // Only update if the data actually changed (deep comparison is expensive, so we don't do it)
      // Instead, we trust that the parent component only passes new data when it actually changes
      editorRef.current.update(data);
    }
  }, [data]);

  // Update editor mode when the mode prop changes
  useEffect(() => {
    if (editorRef.current && mode) {
      editorRef.current.setMode(mode);
    }
  }, [mode]);

  // Handle readOnly prop changes by recreating the editor with the new readOnly setting
  useEffect(() => {
    // Only proceed if readOnly has changed and the editor exists
    if (readOnly !== prevReadOnly && editorRef.current && containerRef.current) {
      setPrevReadOnly(readOnly);
      
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
          console.log('Mode changed to', newMode);
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
        statusBar: true,
        navigationBar: true,
        mainMenuBar: true,
        readOnly
      };
      
      editorRef.current = new JSONEditor(containerRef.current, options);
      
      // Restore the data
      if (currentData) {
        editorRef.current.set(currentData);
      }
    }
  }, [readOnly, allowedModes, onChange, onError]);

  return (
    <div 
      ref={containerRef} 
      className={`json-editor-container ${className}`} 
      style={{ height, width }}
    />
  );
};

export default JSONEditorComponent; 