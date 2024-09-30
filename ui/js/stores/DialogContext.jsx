import React, { createContext, useContext, useState } from 'react';

export const DialogContext = createContext();

export const useDialog = () => {
  const context = useContext(DialogContext)

  if (context === null) {
    throw new Error('useDialog must be used within a DialogProvider')
  }

  return context
}

export const DialogProvider = ({ children }) => {
    const [dialogs, setDialogs] = useState([]);

    const openDialog = (dialogContent) => {
        setDialogs((prevDialogs) => [...prevDialogs, dialogContent]);
    };

    const closeDialog = (id, onClose) => {
        if (!onClose || onClose() !== false) {
            setDialogs((prevDialogs) => prevDialogs.filter((_, index) => index !== id));
        }
    };

    return (
        <DialogContext.Provider value={{ openDialog, closeDialog }}>
            {children}
            {dialogs.map((DialogComponent, index) => (
                <DialogComponent key={index} id={index} />
            ))}
        </DialogContext.Provider>
    );
};
