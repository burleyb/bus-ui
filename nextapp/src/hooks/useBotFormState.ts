import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useToast } from '@/components/ui/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import { BotData } from '@/types/bot';

// Define the form schema
export const botFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').refine(value => !!value.trim(), 'Name cannot be empty'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  tags: z.string().max(200, 'Tags must be at most 200 characters').optional(),
  triggerType: z.enum(['scheduled', 'event-stream', 'not-scheduled']),
  cronSchedule: z.string().optional(),
  eventStreamQueue: z.string().refine(value => !value || value.startsWith('queue:'), 'Queue ID must start with "queue:"').optional(),
  overrides: z.object({
    sourceLagEnabled: z.boolean(),
    sourceLag: z.number().int().positive('Source lag must be a positive integer').optional(),
    writeLagEnabled: z.boolean(),
    writeLag: z.number().int().positive('Write lag must be a positive integer').optional(),
    errorLimitEnabled: z.boolean(),
    errorLimit: z.number().int().positive('Error limit must be a positive integer').optional(),
    consecutiveErrorsEnabled: z.boolean(),
    consecutiveErrors: z.number().int().positive('Consecutive errors must be a positive integer').optional(),
  }),
}).refine(
  data => {
    // Only require cronSchedule if triggerType is 'scheduled'
    if (data.triggerType === 'scheduled') {
      return !!data.cronSchedule;
    }
    // Always pass for other trigger types
    return true;
  },
  {
    message: 'Cron schedule is required for scheduled bots',
    path: ['cronSchedule'],
  }
).refine(
  data => {
    // Only require eventStreamQueue if triggerType is 'event-stream'
    if (data.triggerType === 'event-stream') {
      return !!data.eventStreamQueue;
    }
    // Always pass for other trigger types
    return true;
  },
  {
    message: 'Queue is required for event-stream bots',
    path: ['eventStreamQueue'],
  }
).refine(
  data => {
    // Only validate the cron schedule format if the triggerType is 'scheduled'
    if (data.triggerType === 'scheduled' && data.cronSchedule) {
      const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
      return cronRegex.test(data.cronSchedule);
    }
    // Always pass for other trigger types
    return true;
  },
  {
    message: 'Invalid cron expression',
    path: ['cronSchedule'],
  }
);

// Types based on the schema
export type BotFormValues = z.infer<typeof botFormSchema>;

// Interface for the exposed hook
export interface UseBotFormStateResult {
  values: BotFormValues;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof BotFormValues>(key: K, value: BotFormValues[K]) => void;
  setNestedValue: <K extends keyof BotFormValues['overrides']>(key: K, value: BotFormValues['overrides'][K]) => void;
  validate: () => boolean;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  archiveBot: () => Promise<void>;
  unarchiveBot: () => Promise<void>;
}

// Type for the bot form submit data
export type BotFormSubmitData = {
  id: string;
  name: string;
  description: string | null;
  tags: string | null;
  time?: string | null;
  eventStreamQueue?: string;
  triggers?: string[] | null;
  health: {
    source_lag: number | null;
    write_lag: number | null;
    error_limit: number | null;
    consecutive_errors: number | null;
  };
};

/**
 * Custom hook for managing bot form state
 */
export function useBotFormState(botData: BotData | null): UseBotFormStateResult {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form values
  const initialValues = getInitialValues(botData);
  const [values, setValues] = useState<BotFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Use a ref to store previous botData for comparison
  const prevBotDataRef = useRef<BotData | null>(null);
  
  // Reset form when bot data changes
  useEffect(() => {
    // Skip if no bot data
    if (!botData) return;
    
    // Skip if form is dirty - we don't want to reset a form the user is editing
    if (isDirty) {
      console.log('[DEBUG] Form is dirty, not resetting with updated bot data');
      return;
    }
    
    // Skip if botData hasn't actually changed
    const prevBotData = prevBotDataRef.current;
    const botDataChanged = JSON.stringify({
      name: botData.name,
      description: botData.description,
      tags: botData.tags,
      time: botData.time,
      trigger: botData.triggers?.[0]
    }) !== JSON.stringify({
      name: prevBotData?.name,
      description: prevBotData?.description,
      tags: prevBotData?.tags,
      time: prevBotData?.time,
      trigger: prevBotData?.triggers?.[0]
    });
    
    if (!botDataChanged) {
      console.log('[DEBUG] Bot data unchanged, skipping form reset');
      return;
    }
    
    // If we get here, bot data has changed and form isn't dirty, so reset form
    console.log('[DEBUG] Bot data changed and form is not dirty, updating form values');
    setValues(getInitialValues(botData));
    setErrors({});
    
    // Update ref for future comparisons
    prevBotDataRef.current = botData;
  }, [botData, isDirty]); // values intentionally removed from dependencies

  // Add console logging for tracking form state updates
  useEffect(() => {
    console.log('[DEBUG] Form values updated:', JSON.stringify({
      name: values.name,
      triggerType: values.triggerType,
      cronSchedule: values.cronSchedule,
      eventStreamQueue: values.eventStreamQueue,
    }, null, 2));
  }, [values]);

  // Save bot mutation
  const saveBotMutation = useMutation({
    mutationFn: (data: BotFormSubmitData) => API.saveNodeSettings(data.id, data),
    onSuccess: (response) => {
      // Log detailed information about the saved data vs current form state
      console.log('[DEBUG] Bot saved successfully. Response:', response);
      console.log('[DEBUG] Current form values:', {
        triggerType: values.triggerType,
        eventStreamQueue: values.eventStreamQueue,
        cronSchedule: values.cronSchedule
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['botDetails', botData?.id] });
      
      // Mark form as not dirty to prevent unnecessary resets
      setIsDirty(false);
      
      addToast({
        title: 'Success',
        description: 'Bot updated successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error saving bot:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update bot. Please try again.',
        type: 'error',
      });
    },
  });

  // Archive/unarchive mutations
  const archiveBotMutation = useMutation({
    mutationFn: (id: string) => API.saveNodeSettings(id, { archived: true, paused: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botDetails', botData?.id] });
      addToast({
        title: 'Success',
        description: 'Bot archived successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error archiving bot:', error);
      addToast({
        title: 'Error',
        description: 'Failed to archive bot. Please try again.',
        type: 'error',
      });
    },
  });

  const unarchiveBotMutation = useMutation({
    mutationFn: (id: string) => API.saveNodeSettings(id, { archived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botDetails', botData?.id] });
      addToast({
        title: 'Success',
        description: 'Bot unarchived successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error unarchiving bot:', error);
      addToast({
        title: 'Error',
        description: 'Failed to unarchive bot. Please try again.',
        type: 'error',
      });
    },
  });

  // Form value setter
  const setValue = <K extends keyof BotFormValues>(key: K, value: BotFormValues[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    console.log(`[DEBUG] setValue called for ${String(key)}, setting isDirty to true`);
    
    // Clear error for this field if it exists
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Nested value setter (for overrides)
  const setNestedValue = <K extends keyof BotFormValues['overrides']>(key: K, value: BotFormValues['overrides'][K]) => {
    setValues(prev => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [key]: value,
      },
    }));
    setIsDirty(true);
    
    // Clear error for this field if it exists
    const errorKey = `overrides.${key}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Form validation
  const validate = (): boolean => {
    try {
      console.log('[DEBUG] Validating form values:', JSON.stringify(values, null, 2));
      botFormSchema.parse(values);
      setErrors({});
      console.log('[DEBUG] Validation successful');
      return true;
    } catch (error) {
      console.log('[DEBUG] Validation failed:', error);
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          console.log(`[DEBUG] Validation error: path=${err.path.join('.')}, message=${err.message}`);
          formattedErrors[err.path.join('.')] = err.message;
        });
        setErrors(formattedErrors);
        console.log('[DEBUG] Formatted errors:', formattedErrors);
      }
      return false;
    }
  };

  // Form submission
  const handleSubmit = async () => {
    if (!botData?.id) {
      console.error('Bot ID is required for saving');
      addToast({
        title: 'Error',
        description: 'Bot ID is required for saving',
        type: 'error',
      });
      return;
    }

    console.log('[DEBUG] About to validate form values before submission:', JSON.stringify(values, null, 2));
    
    if (!validate()) {
      const errorKeys = Object.keys(errors);
      const errorMessage = errorKeys.length > 0 
        ? `Validation errors: ${errorKeys.map(k => `${k}: ${errors[k]}`).join(', ')}`
        : 'Please fix the errors in the form';
      
      console.log('[DEBUG] Validation failed with errors:', errors);
      addToast({
        title: 'Validation Error',
        description: errorMessage,
        type: 'error',
      });
      return;
    }

    // Prepare form data for submission
    const formData: BotFormSubmitData = {
      id: botData.id,
      name: values.name,
      description: values.description || null,
      tags: values.tags || null,
      health: {
        source_lag: values.overrides.sourceLagEnabled ? values.overrides.sourceLag || null : null,
        write_lag: values.overrides.writeLagEnabled ? values.overrides.writeLag || null : null,
        error_limit: values.overrides.errorLimitEnabled ? values.overrides.errorLimit || null : null,
        consecutive_errors: values.overrides.consecutiveErrorsEnabled ? values.overrides.consecutiveErrors || null : null,
      }
    };

    // Log the current trigger type and values
    console.log('[DEBUG] Form submission - current values:', {
      triggerType: values.triggerType,
      cronSchedule: values.cronSchedule || '(empty)',
      eventStreamQueue: values.eventStreamQueue || '(empty)'
    });

    // Add trigger-specific fields based on triggerType
    if (values.triggerType === 'scheduled') {
      formData.time = values.cronSchedule;
      formData.triggers = null;// Clear triggers for scheduled bots
      console.log('[DEBUG] Setting scheduled bot with time:', formData.time);
    } else if (values.triggerType === 'event-stream') {
      formData.time = null; // Clear the time field
      // Only set triggers if we have a queue selected
      formData.triggers = values.eventStreamQueue ? [values.eventStreamQueue] : [];
      console.log('[DEBUG] Setting event-stream bot with triggers:', formData.triggers);
    } else {
      // For not-scheduled, clear both time and triggers
      formData.time = null;
      formData.triggers = null;
      console.log('[DEBUG] Setting not-scheduled bot (cleared time and triggers)');
    }

    console.log('[DEBUG] Final form data being sent to API:', JSON.stringify(formData, null, 2));
    await saveBotMutation.mutateAsync(formData);
  };

  // Reset form to initial values
  const resetForm = () => {
    setValues(getInitialValues(botData));
    setErrors({});
    setIsDirty(false);
  };

  // Archive bot function
  const archiveBot = async () => {
    if (!botData?.id) {
      console.error('Bot ID is required for archiving');
      addToast({
        title: 'Error',
        description: 'Bot ID is required for archiving',
        type: 'error',
      });
      return;
    }
    await archiveBotMutation.mutateAsync(botData.id);
  };

  // Unarchive bot function
  const unarchiveBot = async () => {
    if (!botData?.id) {
      console.error('Bot ID is required for unarchiving');
      addToast({
        title: 'Error',
        description: 'Bot ID is required for unarchiving',
        type: 'error',
      });
      return;
    }
    await unarchiveBotMutation.mutateAsync(botData.id);
  };

  return {
    values,
    errors,
    isDirty,
    isSubmitting: saveBotMutation.isPending || archiveBotMutation.isPending || unarchiveBotMutation.isPending,
    setValue,
    setNestedValue,
    validate,
    handleSubmit,
    resetForm,
    archiveBot,
    unarchiveBot,
  };
}

// Helper function to initialize form values from bot data
function getInitialValues(botData: BotData | null): BotFormValues {
  if (!botData) {
    return {
      name: '',
      description: '',
      tags: '',
      // Default to not-scheduled for new bots
      triggerType: 'not-scheduled',
      cronSchedule: '',
      eventStreamQueue: '',
      overrides: {
        sourceLagEnabled: false,
        sourceLag: undefined,
        writeLagEnabled: false,
        writeLag: undefined,
        errorLimitEnabled: false,
        errorLimit: undefined,
        consecutiveErrorsEnabled: false,
        consecutiveErrors: undefined,
      },
    };
  }

  console.log('[DEBUG] Raw botData for scheduling:', { 
    id: botData.id,
    time: botData.time,
    triggers: botData.triggers,
    eventSource: botData?.triggers?.[0],
    hasTriggersArray: Array.isArray(botData?.triggers),
    triggersLength: botData?.triggers?.length
  });

  // Determine trigger type
  const isScheduled = !!botData.time && botData.time !== '';
  const hasEventStream = !!botData?.triggers?.[0];
    
  let triggerType: BotFormValues['triggerType'];
  if (isScheduled) {
    triggerType = 'scheduled';
  } else if (hasEventStream) {
    triggerType = 'event-stream';
  } else {
    triggerType = 'not-scheduled';
  }

  console.log('[DEBUG] Determined triggerType:', triggerType, 'isScheduled:', isScheduled, 'hasEventStream:', hasEventStream);

  // Parse the health overrides
  const health = botData.health || {
    source_lag: null,
    write_lag: null,
    error_limit: null,
    consecutive_errors: null,
  };

  // Prepare the form values to return
  const formValues = {
    name: botData.name || '',
    description: botData.description || '',
    tags: botData.tags || '',
    triggerType,
    cronSchedule: botData.time || '',
    eventStreamQueue: botData.triggers?.[0] || '',
    overrides: {
      sourceLagEnabled: health.source_lag !== null,
      sourceLag: health.source_lag !== null ? health.source_lag : undefined,
      writeLagEnabled: health.write_lag !== null,
      writeLag: health.write_lag !== null ? health.write_lag : undefined,
      errorLimitEnabled: health.error_limit !== null,
      errorLimit: health.error_limit !== null ? health.error_limit : undefined,
      consecutiveErrorsEnabled: health.consecutive_errors !== null,
      consecutiveErrors: health.consecutive_errors !== null ? health.consecutive_errors : undefined,
    },
  };

  console.log('[DEBUG] Returning form values with cronSchedule:', formValues.cronSchedule, 
    'from botData.time:', botData.time, 
    'and triggerType:', formValues.triggerType);
    
  // Ensure eventStreamQueue is a string when returning
  return {
    ...formValues,
    eventStreamQueue: typeof formValues.eventStreamQueue === 'string' ? formValues.eventStreamQueue : undefined
  };
}