"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the Dialog context
const DialogContext = createContext({
  openDialog: () => {},
  closeDialog: () => {},
});

// Custom hook to use the Dialog context
export const useDialog = () => {
  const context = useContext(DialogContext);
  
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  
  return context;
};
// Dialog provider component
export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [dialogs, setDialogs] = useState<React.ReactNode[]>([]);
  
  // Function to open a dialog
  const openDialog = useCallback((dialogContent: React.ReactNode) => {
    setDialogs((prevDialogs) => [...prevDialogs, dialogContent]);
  }, []);
  
  // Function to close a dialog
  const closeDialog = useCallback((id: number, onClose: () => boolean) => {
    // If onClose is provided and it returns false, don't close the dialog
    if (!onClose || onClose() !== false) {
      setDialogs((prevDialogs) => prevDialogs.filter((_, index) => index !== id));
    }
  }, []);
  
  // Provide the context value
  const contextValue = {
    openDialog,
    closeDialog,
  };
  
  return (
    <DialogContext.Provider value={contextValue as { openDialog: () => void; closeDialog: () => void }}>
      {children}
      {/* Render all open dialogs */}
      {dialogs.map((dialog, index) => 
        React.isValidElement(dialog)
          ? React.cloneElement(dialog, { key: index })
          : null
      )}
    </DialogContext.Provider>
  );
};

export default DialogContext;