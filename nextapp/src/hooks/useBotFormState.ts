import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useToast } from '@/components/ui/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/context/ApiContext';
import { BotData } from '@/types/bot';

// Define the form schema
export const botFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').refine(value => !!value.trim(), 'Name cannot be empty'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  tags: z.string().max(200, 'Tags must be at most 200 characters').optional(),
  triggerType: z.enum(['scheduled', 'event-stream']),
  cronSchedule: z.string().regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/, 'Invalid cron expression'),
  eventStreamQueue: z.string().refine(value => value.startsWith('queue:'), 'Queue ID must start with "queue:"').optional(),
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
  data => data.triggerType !== 'scheduled' || data.cronSchedule,
  {
    message: 'Cron schedule is required for scheduled bots',
    path: ['cronSchedule'],
  }
).refine(
  data => data.triggerType !== 'event-stream' || data.eventStreamQueue,
  {
    message: 'Queue is required for event-stream bots',
    path: ['eventStreamQueue'],
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
  time?: string;
  eventStreamQueue?: string;
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

  // Reset form when bot data changes
  useEffect(() => {
    if (botData) {
      setValues(getInitialValues(botData));
      setErrors({});
      setIsDirty(false);
    }
  }, [botData]);

  // Save bot mutation
  const saveBotMutation = useMutation({
    mutationFn: (data: BotFormSubmitData) => API.saveCron(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botDetails', botData?.id] });
      addToast({
        title: 'Success',
        message: 'Bot updated successfully',
        type: 'success',
      });
      setIsDirty(false);
    },
    onError: (error) => {
      console.error('Error saving bot:', error);
      addToast({
        title: 'Error',
        message: 'Failed to update bot. Please try again.',
        type: 'error',
      });
    },
  });

  // Archive/unarchive mutations
  const archiveBotMutation = useMutation({
    mutationFn: (id: string) => API.saveCron({ id, archived: true, paused: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botDetails', botData?.id] });
      addToast({
        title: 'Success',
        message: 'Bot archived successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error archiving bot:', error);
      addToast({
        title: 'Error',
        message: 'Failed to archive bot. Please try again.',
        type: 'error',
      });
    },
  });

  const unarchiveBotMutation = useMutation({
    mutationFn: (id: string) => API.saveCron({ id, archived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botDetails', botData?.id] });
      addToast({
        title: 'Success',
        message: 'Bot unarchived successfully',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Error unarchiving bot:', error);
      addToast({
        title: 'Error',
        message: 'Failed to unarchive bot. Please try again.',
        type: 'error',
      });
    },
  });

  // Form value setter
  const setValue = <K extends keyof BotFormValues>(key: K, value: BotFormValues[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    
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
      botFormSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          formattedErrors[err.path.join('.')] = err.message;
        });
        setErrors(formattedErrors);
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
        message: 'Bot ID is required for saving',
        type: 'error',
      });
      return;
    }

    if (!validate()) {
      addToast({
        title: 'Validation Error',
        message: 'Please fix the errors in the form',
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
      },
    };

    // Add trigger-specific fields
    if (values.triggerType === 'scheduled') {
      formData.time = values.cronSchedule;
    } else if (values.triggerType === 'event-stream') {
      formData.eventStreamQueue = values.eventStreamQueue;
    }

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
        message: 'Bot ID is required for archiving',
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
        message: 'Bot ID is required for unarchiving',
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
      triggerType: 'scheduled',
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

  // Determine trigger type
  const isScheduled = !!botData.time;
  const triggerType = isScheduled ? 'scheduled' : 'event-stream';

  // Parse the health overrides
  const health = botData.health || {
    source_lag: null,
    write_lag: null,
    error_limit: null,
    consecutive_errors: null,
  };

  return {
    name: botData.name || '',
    description: botData.description || '',
    tags: botData.tags || '',
    triggerType,
    cronSchedule: botData.time || '',
    eventStreamQueue: botData.triggers?.[0]?.event_source_id || '',
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
} 