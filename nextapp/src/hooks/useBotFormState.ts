import { useState, useEffect } from 'react';
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
  time?: string | null;
  triggers?: {
    event_source_id: string;
  }[] | null;
  health: {
    source_lag: number | null;
    write_lag: number | null;
    error_limit: number | null;
    consecutive_errors: number | null;
  };
  // Preserve other keys from the original data
  [key: string]: any;
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
      console.log("[DEBUG] Bot data changed in useBotFormState, resetting form. isDirty:", isDirty);
      setValues(getInitialValues(botData));
      setErrors({});
      setIsDirty(false);
    }
  }, [botData]);

  // Save mutations
  const saveExecutionSettingsMutation = useMutation({
    mutationFn: (data: any) => API.saveNodeSettings(data.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cron', botData?.id] });
      addToast({
        title: "Bot execution settings saved",
        description: "Bot execution settings have been saved successfully",
        type: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error saving bot execution settings",
        description: error.message || "An error occurred while saving the bot execution settings",
        type: 'error',
      });
    }
  });

  const saveMetadataMutation = useMutation({
    mutationFn: (data: any) => API.saveNodeSettings(data.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cron', botData?.id] });
      addToast({
        title: "Bot metadata saved",
        description: "Bot metadata has been saved successfully",
        type: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error saving bot metadata",
        description: error.message || "An error occurred while saving the bot metadata",
        type: 'error',
      });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (data: any) => API.saveNodeSettings(data.id, { archived: true, paused: true }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cron', botData?.id] });
      addToast({
        title: "Bot archived",
        description: "Bot has been archived successfully",
        type: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error archiving bot",
        description: error.message || "An error occurred while archiving the bot",
        type: 'error',
      });
    }
  });

  const unarchiveMutation = useMutation({
    mutationFn: (data: any) => API.saveNodeSettings(data.id, { archived: false }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cron', botData?.id] });
      addToast({
        title: "Bot unarchived",
        description: "Bot has been unarchived successfully",
        type: 'success',
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error unarchiving bot",
        description: error.message || "An error occurred while unarchiving the bot",
        type: 'error',
      });
    }
  });

  // Form value setter
  const setValue = <K extends keyof BotFormValues>(key: K, value: BotFormValues[K]) => {
    console.log(`[DEBUG] Setting form value ${String(key)}:`, value);
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

  // Convert minutes to milliseconds
  const minutesToMs = (minutes?: number): number | null => {
    if (minutes === undefined) return null;
    return minutes * 60 * 1000;
  };

  // Convert percentage to decimal
  const percentToDecimal = (percent?: number): number | null => {
    if (percent === undefined) return null;
    return percent / 100;
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

    if (!validate()) {
      addToast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    // Create a copy of the original bot data to preserve any fields we don't change
    const formData: BotFormSubmitData = {
      ...botData,
      id: botData.id,
      name: values.name,
      description: values.description || null,
      tags: values.tags || null,
      health: {
        source_lag: values.overrides.sourceLagEnabled ? minutesToMs(values.overrides.sourceLag) : null,
        write_lag: values.overrides.writeLagEnabled ? minutesToMs(values.overrides.writeLag) : null,
        error_limit: values.overrides.errorLimitEnabled ? percentToDecimal(values.overrides.errorLimit) : null,
        consecutive_errors: values.overrides.consecutiveErrorsEnabled ? values.overrides.consecutiveErrors || null : null,
      },
    };

    // Handle trigger type
    if (values.triggerType === 'scheduled') {
      formData.time = values.cronSchedule || null;
      formData.triggers = null;
    } else if (values.triggerType === 'event-stream') {
      formData.time = null;
      formData.triggers = values.eventStreamQueue ? [{ event_source_id: values.eventStreamQueue }] : null;
    } else {
      // Not scheduled - both should be null
      formData.time = null;
      formData.triggers = null;
    }

    // Filter out unchanged data to reduce payload size
    // This is important to avoid sending stale data
    const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (
        key === 'id' || 
        key === 'name' || 
        key === 'description' || 
        key === 'tags' || 
        key === 'time' || 
        key === 'triggers' || 
        key === 'health' || 
        key === 'lambda'
      ) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    await saveExecutionSettingsMutation.mutateAsync(cleanedData as BotFormSubmitData);
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
    await archiveMutation.mutateAsync(botData);
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
    await unarchiveMutation.mutateAsync(botData);
  };

  return {
    values,
    errors,
    isDirty,
    isSubmitting: saveExecutionSettingsMutation.isPending || archiveMutation.isPending || unarchiveMutation.isPending,
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
  let triggerType: 'scheduled' | 'event-stream' = 'scheduled';
  if (botData.triggers && botData.triggers.length > 0 && botData.triggers[0].event_source_id) {
    triggerType = 'event-stream';
  } else if (botData.time) {
    triggerType = 'scheduled';
  }

  // Parse the health overrides
  const health = botData.health || {
    source_lag: null,
    write_lag: null,
    error_limit: null,
    consecutive_errors: null,
  };

  // Convert milliseconds to minutes for display
  const msToMinutes = (ms: number | null): number | undefined => {
    if (ms === null) return undefined;
    return Math.round(ms / (60 * 1000));
  };

  // Convert decimal to percentage for display
  const decimalToPercent = (decimal: number | null): number | undefined => {
    if (decimal === null) return undefined;
    return decimal * 100;
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
      sourceLag: msToMinutes(health.source_lag),
      writeLagEnabled: health.write_lag !== null,
      writeLag: msToMinutes(health.write_lag),
      errorLimitEnabled: health.error_limit !== null,
      errorLimit: decimalToPercent(health.error_limit),
      consecutiveErrorsEnabled: health.consecutive_errors !== null,
      consecutiveErrors: health.consecutive_errors !== null ? health.consecutive_errors : undefined,
    },
  };
} 