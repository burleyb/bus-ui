import React, { createContext, useContext, useState } from 'react';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

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
