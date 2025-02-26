"use client";

import { useCallback } from 'react';
import { useDialog } from '@/context/DialogContext';

/**
 * Hook that provides a simplified interface for opening dialogs
 * defined in the DialogContext
 */
export function useDialogs() {
  const { 
    openNodeSettingsDialog: contextOpenNodeSettings,
    openEventReplayDialog: contextOpenEventReplay 
  } = useDialog();

  const openNodeSettingsDialog = useCallback((nodeId: string) => {
    contextOpenNodeSettings(nodeId);
  }, [contextOpenNodeSettings]);

  const openEventReplayDialog = useCallback((queueId: string, eventId: string) => {
    contextOpenEventReplay(queueId, eventId);
  }, [contextOpenEventReplay]);

  return {
    openNodeSettingsDialog,
    openEventReplayDialog
  };
} 