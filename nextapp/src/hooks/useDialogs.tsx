"use client";

import { useCallback } from 'react';
import { useDialogContext } from '@/hooks/useDialogContext';

/**
 * Hook that provides a simplified interface for opening dialogs
 * defined in the DialogContext
 */
export function useDialogs() {
  const { openDialog } = useDialogContext();

  const openNodeSettingsDialog = useCallback((nodeId: string) => {
    openDialog({ nodeId });
  }, [openDialog]);

  const openEventReplayDialog = useCallback((queueId: string, eventId: string) => {
    openDialog({ queueId, eventId, type: 'eventReplay' });
  }, [openDialog]);

  return {
    openNodeSettingsDialog,
    openEventReplayDialog
  };
} 