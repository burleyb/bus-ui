"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Archive, Undo2 } from 'lucide-react';
import { BotData } from '@/types/bot';
import { useBotFormState, BotFormValues } from '@/hooks/useBotFormState';
import { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TooltipSimple } from '@/components/ui/simple-tooltip';
import { cn } from '@/lib/utils';
import { TagInput } from '@/components/ui/tag-input';
import { 
  SimpleDialog,
  SimpleDialogContent, 
  SimpleDialogHeader, 
  SimpleDialogTitle, 
  SimpleDialogFooter 
} from '@/components/ui/simple-dialog';

interface BotSettingsTabProps {
  nodeData: BotData;
  onTabChangeRequest?: (callback: (canProceed: boolean) => boolean) => void;
  onCloseRequest?: (callback: (canProceed: boolean) => boolean) => void;
}

// Custom schema for our form with support for not-scheduled
const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>;

export default function BotSettingsTab({ nodeData, onTabChangeRequest, onCloseRequest }: BotSettingsTabProps) {
  // Dialog state for navigation confirmation
  const [showNavConfirmDialog, setShowNavConfirmDialog] = useState(false);
  const [navigationCallback, setNavigationCallback] = useState<(() => void) | null>(null);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  
  console.log("[DEBUG] BotSettingsTab rendering with nodeData:", nodeData?.id);
  
  // IMPORTANT: For the cron schedule preset buttons, we use React Hook Form's setValue with
  // shouldDirty: true to ensure the form is properly marked as dirty when these quick-select
  // buttons are used. This enables the Save button and properly tracks changes.
  // Previously, we were using reset() which resets the form to its initial state,
  // losing the dirty status.
  
  // Use the bot form state hook
  const {
    values,
    isDirty,
    isSubmitting,
    setValue,
    setNestedValue,
    handleSubmit,
    resetForm,
    archiveBot,
    unarchiveBot,
    errors
  } = useBotFormState(nodeData);

  console.log("[DEBUG] Form state: isDirty =", isDirty, "isSubmitting =", isSubmitting);

  // Add additional debug logs for form values
  useEffect(() => {
    console.log("[DEBUG] Form values changed:", values);
  }, [values]);

  // Add debug logs for form state
  useEffect(() => {
    console.log("[DEBUG] Form isDirty changed:", isDirty);
  }, [isDirty]);

  // Add debug logs for errors from both useBotFormState and React Hook Form
  useEffect(() => {
    console.log("[DEBUG] BotFormState errors:", errors);
  }, [errors]);

  // Transform triggerType if needed
  // If values.triggerType is 'not-scheduled' OR we explicitly determine this bot should not be scheduled,
  // then we use 'not-scheduled' as the adapted value
  const shouldBeNotScheduled = !nodeData?.time || nodeData.time === '';
  const adaptedTriggerType = values.triggerType === 'not-scheduled' || 
    (!values.triggerType && shouldBeNotScheduled) ||
    (values.triggerType !== 'scheduled' && values.triggerType !== 'event-stream')
    ? 'not-scheduled'
    : values.triggerType;
    
  console.log("[DEBUG] Adapting triggerType:", { 
    originalTriggerType: values.triggerType,
    adaptedTriggerType,
    shouldBeNotScheduled,
    hasEmptyTime: !nodeData?.time || nodeData.time === '',
    time: nodeData?.time,
    rawBotData: {
      id: nodeData?.id,
      time: nodeData?.time,
      triggerType: values.triggerType,
      hasTime: !!nodeData?.time && nodeData?.time !== '',
      hasEventStream: !!nodeData?.triggers?.[0]?.event_source_id
    }
  });

  // Setup React Hook Form with our custom schema and adapted values
  const { control, formState: { errors: formErrors }, watch, handleSubmit: hookFormSubmit, reset, setValue: rhfSetValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...values,
      triggerType: adaptedTriggerType,
      // Ensure string values are never undefined
      tags: values.tags || '',
      description: values.description || '',
      cronSchedule: values.cronSchedule || '',
      eventStreamQueue: values.eventStreamQueue || ''
    },
    mode: 'onChange'
  });

  // Force triggerType to match adaptedTriggerType on initial render
  useEffect(() => {
    // Set the triggerType directly once on mount to ensure consistency
    rhfSetValue('triggerType', adaptedTriggerType);
    console.log('[DEBUG] Forced triggerType to match adaptedTriggerType on initial render:', adaptedTriggerType);
  }, [rhfSetValue, adaptedTriggerType]);

  // Log React Hook Form errors
  useEffect(() => {
    console.log("[DEBUG] React Hook Form errors:", formErrors);
  }, [formErrors]);

  // Update form when values change
  useEffect(() => {
    // Only reset the form if it's not dirty (user hasn't made changes)
    // This prevents data loss during editing when refetches happen
    if (!isDirty) {
      console.log('[DEBUG] Resetting form with triggerType:', adaptedTriggerType, 
        'values.triggerType:', values.triggerType, 
        'values:', values);
        
      reset({
        ...values,
        triggerType: adaptedTriggerType,
        // Ensure string values are never undefined
        tags: values.tags || '',
        description: values.description || '',
        cronSchedule: values.cronSchedule || '',
        eventStreamQueue: values.eventStreamQueue || ''
      });
      
      // Also directly set triggerType via rhfSetValue to ensure it's definitely updated
      rhfSetValue('triggerType', adaptedTriggerType);
    }
  }, [values, reset, adaptedTriggerType, isDirty, rhfSetValue]);

  // Watch for form changes
  const triggerType = watch('triggerType');
  
  console.log('[DEBUG] Current watched triggerType value:', triggerType, 
    'adaptedTriggerType:', adaptedTriggerType, 
    'values.triggerType:', values.triggerType);

  // Effect to clear fields when triggerType changes
  useEffect(() => {
    console.log("[DEBUG] triggerType effect triggered with value:", triggerType, 
      "adaptedTriggerType:", adaptedTriggerType, 
      "values.triggerType:", values.triggerType);
    
    if (triggerType === 'not-scheduled') {
      // Clear both fields for not-scheduled
      rhfSetValue('cronSchedule', '', { shouldDirty: true });
      rhfSetValue('eventStreamQueue', '', { shouldDirty: true });
      console.log("[DEBUG] Trigger type changed to not-scheduled: cleared both fields");
    } else if (triggerType === 'scheduled') {
      // Clear eventStreamQueue for scheduled
      rhfSetValue('eventStreamQueue', '', { shouldDirty: true });
      console.log("[DEBUG] Trigger type changed to scheduled: cleared eventStreamQueue");
    } else if (triggerType === 'event-stream') {
      // Clear cronSchedule for event-stream
      rhfSetValue('cronSchedule', '', { shouldDirty: true });
      console.log("[DEBUG] Trigger type changed to event-stream: cleared cronSchedule");
    }
  }, [triggerType, rhfSetValue, adaptedTriggerType, values.triggerType]);

  // Handle form submission
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    console.log("[DEBUG] Form submitted with data:", JSON.stringify(data, null, 2));
    try {
      // Update values in the hook
      Object.keys(data).forEach((key) => {
        if (key === 'overrides') {
          Object.keys(data.overrides).forEach((nestedKey) => {
            setNestedValue(
              nestedKey as keyof BotFormValues['overrides'],
              data.overrides[nestedKey as keyof BotFormValues['overrides']]
            );
          });
        } else {
          // Handle not-scheduled case
          if (key === 'triggerType') {
            setValue('triggerType', data.triggerType);
            
            // For 'not-scheduled', clear both cronSchedule and eventStreamQueue
            if (data.triggerType === 'not-scheduled') {
              setValue('cronSchedule', '');
              setValue('eventStreamQueue', '');
              console.log("[DEBUG] Handling not-scheduled: cleared cronSchedule and eventStreamQueue");
            } 
            // For scheduled, clear eventStreamQueue
            else if (data.triggerType === 'scheduled') {
              setValue('eventStreamQueue', '');
              console.log("[DEBUG] Handling scheduled: cleared eventStreamQueue");
            } 
            // For event-stream, clear cronSchedule
            else if (data.triggerType === 'event-stream') {
              setValue('cronSchedule', '');
              console.log("[DEBUG] Handling event-stream: cleared cronSchedule");
            }
          } else {
            setValue(key as keyof BotFormValues, data[key as keyof BotFormValues]);
          }
        }
      });

      // Call the hook's submit handler
      console.log("[DEBUG] Final values being submitted:", JSON.stringify(values, null, 2));
      await handleSubmit();
    } catch (error) {
      console.error("[DEBUG] Error during form submission:", error);
    }
  };

  // Handle discard changes
  const handleDiscard = () => {
    console.log("[DEBUG] Discarding changes...");
    resetForm();
  };

  // Handle archive/unarchive confirmation
  const handleArchiveConfirm = async () => {
    if (nodeData.archived) {
      await unarchiveBot();
    } else {
      await archiveBot();
    }
    setIsArchiveDialogOpen(false);
  };

  // Handle reset overrides - directly reset values without confirmation
  const handleResetOverrides = () => {
    // Update all overrides to be disabled and clear their values
    rhfSetValue('overrides.sourceLagEnabled', false, { shouldDirty: true });
    rhfSetValue('overrides.writeLagEnabled', false, { shouldDirty: true });
    rhfSetValue('overrides.errorLimitEnabled', false, { shouldDirty: true });
    rhfSetValue('overrides.consecutiveErrorsEnabled', false, { shouldDirty: true });
    
    // Clear values
    rhfSetValue('overrides.sourceLag', undefined, { shouldDirty: true });
    rhfSetValue('overrides.writeLag', undefined, { shouldDirty: true });
    rhfSetValue('overrides.errorLimit', undefined, { shouldDirty: true });
    rhfSetValue('overrides.consecutiveErrors', undefined, { shouldDirty: true });
    
    // Also update our custom form state
    setValue('overrides', {
      sourceLagEnabled: false,
      sourceLag: undefined,
      writeLagEnabled: false,
      writeLag: undefined,
      errorLimitEnabled: false,
      errorLimit: undefined,
      consecutiveErrorsEnabled: false,
      consecutiveErrors: undefined
    });
    
    console.log("[DEBUG] Reset all overrides");
  };

  // Handle navigation confirmation
  const confirmNavigation = useCallback((callback: () => void) => {
    if (isDirty) {
      setNavigationCallback(() => callback);
      setShowNavConfirmDialog(true);
      return false;
    }
    return true;
  }, [isDirty]);

  // Register callbacks for tab change and dialog close
  useEffect(() => {
    // Register callbacks if the parent component provides the handlers
    if (onTabChangeRequest) {
      onTabChangeRequest((canProceed) => {
        if (canProceed) return true;
        return confirmNavigation(() => true);
      });
    }

    if (onCloseRequest) {
      onCloseRequest((canProceed) => {
        if (canProceed) return true;
        return confirmNavigation(() => true);
      });
    }
  }, [confirmNavigation, onTabChangeRequest, onCloseRequest]);

  // Format the cron expression for display
  const formatCronExpression = (cron: string) => {
    if (!cron) return 'Not set';
    
    try {
      // Basic parsing of cron expression
      const parts = cron.split(' ');
      if (parts.length !== 6) return cron;
      
      const [second, minute, hour] = parts;
      
      if (second === '0' && minute === '*' && hour === '*') {
        return 'Run every minute';
      } else if (second === '0' && minute.includes('/')) {
        const interval = minute.split('/')[1];
        return `Run every ${interval} minutes`;
      } else if (second === '0' && hour.includes('/')) {
        const interval = hour.split('/')[1];
        return `Run every ${interval} hours`;
      } else {
        return cron;
      }
    } catch {
      return cron;
    }
  };

  // Add a console log for switch change events
  // Somewhere after the overrides HTML but before the end of the component
  useEffect(() => {
    console.log("[DEBUG] Override settings:", {
      sourceLagEnabled: values.overrides.sourceLagEnabled,
      writeLagEnabled: values.overrides.writeLagEnabled,
      errorLimitEnabled: values.overrides.errorLimitEnabled,
      consecutiveErrorsEnabled: values.overrides.consecutiveErrorsEnabled
    });
  }, [values.overrides]);

  // Add log for triggerType changes
  useEffect(() => {
    console.log("[DEBUG] TriggerType changed:", triggerType);
  }, [triggerType]);

  // Monitor save button state
  useEffect(() => {
    console.log("[DEBUG] Save button state - isDirty:", isDirty, "isSubmitting:", isSubmitting, "disabled:", !isDirty || isSubmitting);
  }, [isDirty, isSubmitting]);

  // If nodeData is not available yet
  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={hookFormSubmit(onSubmit)}>
        {/* Display all validation errors regardless of field visibility */}
        {(Object.keys(formErrors).length > 0 || Object.keys(errors).length > 0) && (
          <Card className="mb-6 border-red-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-red-500">Validation Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-red-500 list-disc pl-5 space-y-1">
                {Object.entries(formErrors).map(([field, error]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {error?.message?.toString() || 'Invalid value'}
                  </li>
                ))}
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Execution Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Execution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="triggerType">Trigger</Label>
                  <Controller
                    name="triggerType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          console.log('[DEBUG] Select onValueChange with value:', value);
                          field.onChange(value);
                          // Set the form state directly
                          setValue('triggerType', value as any);
                          // Reset related fields
                          if (value === 'scheduled') {
                            setValue('eventStreamQueue', '');
                          } else if (value === 'event-stream') {
                            setValue('cronSchedule', '');
                          } else {
                            setValue('cronSchedule', '');
                            setValue('eventStreamQueue', '');
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="event-stream">Event Stream</SelectItem>
                          <SelectItem value="scheduled">Run On a Schedule</SelectItem>
                          <SelectItem value="not-scheduled">Not Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {formErrors?.triggerType && (
                    <p className="text-sm text-red-500">{formErrors.triggerType.message}</p>
                  )}
                </div>

                {/* Event Stream Queue Selection */}
                {triggerType === 'event-stream' && (
                  <div className="space-y-2">
                    <Label htmlFor="eventStreamQueue">Queue</Label>
                    <Controller
                      name="eventStreamQueue"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <Input
                            {...field}
                            placeholder="Search for a queue (e.g. queue:name)"
                            className={cn(
                              formErrors?.eventStreamQueue && "border-red-500"
                            )}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue('eventStreamQueue', e.target.value);
                            }}
                          />
                          {/* A more advanced queue search would be implemented here */}
                        </div>
                      )}
                    />
                    {formErrors?.eventStreamQueue && (
                      <p className="text-sm text-red-500">{formErrors.eventStreamQueue.message}</p>
                    )}
                  </div>
                )}

                {/* Cron Schedule */}
                {triggerType === 'scheduled' && (
                  <div className="w-full space-y-1">
                    <Label htmlFor="cronSchedule">
                      Cron Schedule
                    </Label>
                    <div className="flex flex-col space-y-2">
                      <Controller
                        control={control}
                        name="cronSchedule"
                        render={({ field }) => (
                          <Input
                            id="cronSchedule"
                            placeholder="* * * * *"
                            {...field}
                            className={cn(
                              formErrors?.cronSchedule ? "border-red-500" : ""
                            )}
                            onChange={(e) => {
                              field.onChange(e);
                              setValue('cronSchedule', e.target.value);
                            }}
                          />
                        )}
                      />
                      {formErrors?.cronSchedule && (
                        <p className="text-sm text-red-500">
                          {formatCronExpression(formErrors.cronSchedule.message?.toString() || 'Invalid cron schedule')}
                        </p>
                      )}
                      
                      {/* Cron Helper UI */}
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        <p>Format: Minute Hour Day Month DayOfWeek</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const newValue = "*/15 * * * *";
                              // Update form values and mark as dirty using React Hook Form's setValue
                              rhfSetValue('cronSchedule', newValue, { 
                                shouldDirty: true,
                                shouldValidate: true 
                              });
                              // Also update our custom form state
                              setValue('cronSchedule', newValue);
                              console.log("[DEBUG] Set cronSchedule to:", newValue);
                            }}
                          >
                            Every 15 minutes
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const newValue = "0 * * * *";
                              // Update form values and mark as dirty using React Hook Form's setValue
                              rhfSetValue('cronSchedule', newValue, { 
                                shouldDirty: true,
                                shouldValidate: true 
                              });
                              // Also update our custom form state
                              setValue('cronSchedule', newValue);
                              console.log("[DEBUG] Set cronSchedule to:", newValue);
                            }}
                          >
                            Hourly
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const newValue = "0 0 * * *";
                              // Update form values and mark as dirty using React Hook Form's setValue
                              rhfSetValue('cronSchedule', newValue, { 
                                shouldDirty: true,
                                shouldValidate: true 
                              });
                              // Also update our custom form state
                              setValue('cronSchedule', newValue);
                              console.log("[DEBUG] Set cronSchedule to:", newValue);
                            }}
                          >
                            Daily at midnight
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const newValue = "0 0 * * 1";
                              // Update form values and mark as dirty using React Hook Form's setValue
                              rhfSetValue('cronSchedule', newValue, { 
                                shouldDirty: true,
                                shouldValidate: true 
                              });
                              // Also update our custom form state
                              setValue('cronSchedule', newValue);
                              console.log("[DEBUG] Set cronSchedule to:", newValue);
                            }}
                          >
                            Weekly (Monday)
                          </Button>
                        </div>
                        <p className="mt-2">
                          <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Need help? Use Crontab Guru
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overrides Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Overrides</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetOverrides}
                >
                  Reset Overrides
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Source Lag */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sourceLag" className="flex items-center">
                      <span>Source Lag (Minutes)</span>
                      <TooltipSimple text="Maximum allowed lag time for source queues">
                        <AlertCircle className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipSimple>
                    </Label>
                    <Controller
                      name="overrides.sourceLagEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setNestedValue('sourceLagEnabled', checked);
                            // Force update React Hook Form's internal state
                            console.log("[DEBUG] Toggled sourceLagEnabled to:", checked);
                          }}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    name="overrides.sourceLag"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          field.onChange(value);
                          setNestedValue('sourceLag', value);
                        }}
                        disabled={!watch('overrides.sourceLagEnabled')}
                        placeholder="Enter minutes"
                      />
                    )}
                  />
                  {formErrors?.overrides?.sourceLag && (
                    <p className="text-sm text-red-500">{formErrors?.overrides?.sourceLag?.message}</p>
                  )}
                </div>

                {/* Write Lag */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="writeLag" className="flex items-center">
                      <span>Write Lag (Minutes)</span>
                      <TooltipSimple text="Maximum allowed lag time for destination queues">
                        <AlertCircle className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipSimple>
                    </Label>
                    <Controller
                      name="overrides.writeLagEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setNestedValue('writeLagEnabled', checked);
                            console.log("[DEBUG] Toggled writeLagEnabled to:", checked);
                          }}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    name="overrides.writeLag"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          field.onChange(value);
                          setNestedValue('writeLag', value);
                        }}
                        disabled={!watch('overrides.writeLagEnabled')}
                        placeholder="Enter minutes"
                      />
                    )}
                  />
                  {formErrors?.overrides?.writeLag && (
                    <p className="text-sm text-red-500">{formErrors?.overrides?.writeLag?.message}</p>
                  )}
                </div>

                {/* Error Limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="errorLimit" className="flex items-center">
                      <span>Error Limit (%)</span>
                      <TooltipSimple text="Maximum allowed error percentage before pausing the bot">
                        <AlertCircle className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipSimple>
                    </Label>
                    <Controller
                      name="overrides.errorLimitEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setNestedValue('errorLimitEnabled', checked);
                            console.log("[DEBUG] Toggled errorLimitEnabled to:", checked);
                          }}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    name="overrides.errorLimit"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          field.onChange(value);
                          setNestedValue('errorLimit', value);
                        }}
                        disabled={!watch('overrides.errorLimitEnabled')}
                        placeholder="Enter percentage"
                      />
                    )}
                  />
                  {formErrors?.overrides?.errorLimit && (
                    <p className="text-sm text-red-500">{formErrors?.overrides?.errorLimit?.message}</p>
                  )}
                </div>

                {/* Consecutive Errors */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="consecutiveErrors" className="flex items-center">
                      <span>Consecutive Errors</span>
                      <TooltipSimple text="Maximum allowed consecutive errors before pausing the bot">
                        <AlertCircle className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipSimple>
                    </Label>
                    <Controller
                      name="overrides.consecutiveErrorsEnabled"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setNestedValue('consecutiveErrorsEnabled', checked);
                            console.log("[DEBUG] Toggled consecutiveErrorsEnabled to:", checked);
                          }}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    name="overrides.consecutiveErrors"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          field.onChange(value);
                          setNestedValue('consecutiveErrors', value);
                        }}
                        disabled={!watch('overrides.consecutiveErrorsEnabled')}
                        placeholder="Enter number"
                      />
                    )}
                  />
                  {formErrors?.overrides?.consecutiveErrors && (
                    <p className="text-sm text-red-500">{formErrors?.overrides?.consecutiveErrors?.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Bot Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Bot Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bot Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Bot Name</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter bot name"
                        className={cn(
                          formErrors?.name && "border-red-500"
                        )}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('name', e.target.value);
                        }}
                      />
                    )}
                  />
                  {formErrors?.name && (
                    <p className="text-sm text-red-500">{formErrors.name.message}</p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        {...field}
                        value={field.value || ''}
                        placeholder="Enter tags (comma-separated)"
                        className={cn(
                          formErrors?.tags && "border-red-500"
                        )}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('tags', e.target.value);
                        }}
                      />
                    )}
                  />
                  {formErrors?.tags && (
                    <p className="text-sm text-red-500">{formErrors.tags.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Describe what this bot does"
                        rows={4}
                        className={cn(
                          formErrors?.description && "border-red-500"
                        )}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('description', e.target.value);
                        }}
                      />
                    )}
                  />
                  {formErrors?.description && (
                    <p className="text-sm text-red-500">{formErrors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Flow Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Source */}
                <div className="space-y-1">
                  <Label className="text-sm text-gray-500">Source</Label>
                  <div className="text-sm font-medium">
                    {nodeData.lambda?.settings?.[0]?.source || 'Not configured'}
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <Label className="text-sm text-gray-500">Destination</Label>
                  <div className="text-sm font-medium">
                    {nodeData.lambda?.settings?.[0]?.destination || 'Not configured'}
                  </div>
                </div>

                {/* Template */}
                <div className="space-y-1">
                  <Label className="text-sm text-gray-500">Template</Label>
                  <div className="text-sm font-medium">
                    {nodeData.templateId || 'Custom'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-between mt-6">
          {/* Archive/Unarchive button */}
          <Button
            type="button"
            variant={nodeData.archived ? "outline" : "danger"}
            onClick={() => setIsArchiveDialogOpen(true)}
            className="flex items-center"
          >
            {nodeData.archived ? (
              <>
                <Undo2 className="mr-2 h-4 w-4" />
                Unarchive Bot
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive Bot
              </>
            )}
          </Button>

          {/* Save/Discard buttons */}
          <div className="space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={!isDirty}
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>

      {/* Navigation Confirmation Dialog */}
      <Dialog open={showNavConfirmDialog} onOpenChange={setShowNavConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <p>You have unsaved changes. What would you like to do?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNavConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleDiscard}>
              Discard Changes
            </Button>
            <Button onClick={async () => {
              hookFormSubmit(onSubmit)();
              setShowNavConfirmDialog(false);
              if (navigationCallback) {
                navigationCallback();
                setNavigationCallback(null);
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive/Unarchive Confirmation Dialog */}
      <SimpleDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <SimpleDialogContent>
          <SimpleDialogHeader>
            <SimpleDialogTitle>
              {nodeData.archived ? 'Unarchive Bot' : 'Archive Bot'}
            </SimpleDialogTitle>
          </SimpleDialogHeader>
          <p className="my-4">
            {nodeData.archived 
              ? 'Are you sure you want to unarchive this bot? It will become available for use again.'
              : 'Are you sure you want to archive this bot? It will be stopped and not available for use.'}
          </p>
          <SimpleDialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={nodeData.archived ? "primary" : "danger"} 
              onClick={handleArchiveConfirm}
            >
              {nodeData.archived ? 'Unarchive' : 'Archive'}
            </Button>
          </SimpleDialogFooter>
        </SimpleDialogContent>
      </SimpleDialog>
    </div>
  );
}