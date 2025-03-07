"use client";

import React, { createContext, useState, ReactNode } from 'react';

interface DialogContextProps {
  isOpen: boolean;
  dialogData: any;
  openDialog: (data?: any) => void;
  closeDialog: () => void;
}

export const DialogContext = createContext<DialogContextProps | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogData, setDialogData] = useState<any>(null);

  const openDialog = (data?: any) => {
    setDialogData(data);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    // Optional: Clear data with a delay to prevent UI flicker
    setTimeout(() => {
      setDialogData(null);
    }, 300);
  };

  return (
    <DialogContext.Provider
      value={{
        isOpen,
        dialogData,
        openDialog,
        closeDialog,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}