"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import NodeSettingsDialog from '@/components/dialogs/NodeSettingsDialog';
import EventReplayDialog from '@/components/dialogs/EventReplayDialog';

// Dialog states interface
interface DialogState {
  nodeSettings: {
    open: boolean;
    nodeId: string | null;
  };
  eventReplay: {
    open: boolean;
    queueId: string | null;
    eventId: string | null;
  };
}

// Context interface
interface DialogContextValue {
  dialogState: DialogState;
  openNodeSettingsDialog: (nodeId: string) => void;
  closeNodeSettingsDialog: () => void;
  openEventReplayDialog: (queueId: string, eventId: string) => void;
  closeEventReplayDialog: () => void;
}

// Create context with default value
const DialogContext = createContext<DialogContextValue | undefined>(undefined);

// Provider props
interface DialogProviderProps {
  children: ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  // Initialize dialog states
  const [dialogState, setDialogState] = useState<DialogState>({
    nodeSettings: {
      open: false,
      nodeId: null,
    },
    eventReplay: {
      open: false,
      queueId: null,
      eventId: null,
    },
  });

  // Node Settings Dialog functions
  const openNodeSettingsDialog = (nodeId: string) => {
    setDialogState(prev => ({
      ...prev,
      nodeSettings: {
        open: true,
        nodeId,
      },
    }));
  };

  const closeNodeSettingsDialog = () => {
    setDialogState(prev => ({
      ...prev,
      nodeSettings: {
        open: false,
        nodeId: null,
      },
    }));
  };

  // Event Replay Dialog functions
  const openEventReplayDialog = (queueId: string, eventId: string) => {
    setDialogState(prev => ({
      ...prev,
      eventReplay: {
        open: true,
        queueId,
        eventId,
      },
    }));
  };

  const closeEventReplayDialog = () => {
    setDialogState(prev => ({
      ...prev,
      eventReplay: {
        open: false,
        queueId: null,
        eventId: null,
      },
    }));
  };

  // Value object for the context
  const value: DialogContextValue = {
    dialogState,
    openNodeSettingsDialog,
    closeNodeSettingsDialog,
    openEventReplayDialog,
    closeEventReplayDialog,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
      
      {/* Render dialogs */}
      <NodeSettingsDialog 
        open={dialogState.nodeSettings.open} 
        onClose={closeNodeSettingsDialog}
        nodeId={dialogState.nodeSettings.nodeId || ''}
      />
      
      <EventReplayDialog
        open={dialogState.eventReplay.open}
        onClose={closeEventReplayDialog}
        queueId={dialogState.eventReplay.queueId || ''}
        eventId={dialogState.eventReplay.eventId || ''}
      />
    </DialogContext.Provider>
  );
}

// Custom hook to use dialog context
export function useDialog() {
  const context = useContext(DialogContext);
  
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  
  return context;
}

export default DialogContext;