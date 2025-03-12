import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useSaveQueueSettings } from '@/context/ApiContext';
import { NodeData } from '@/types/node';

// Define the schema for queue form validation
export const queueFormSchema = z.object({
  name: z.string().trim().min(1, 'Queue name is required'),
  tags: z.string().optional(),
  minCheckpointNumber: z.string().optional()
});

// Define the form values type based on the schema
export type QueueFormValues = z.infer<typeof queueFormSchema>;

// Define additional queue data type that includes min_kinesis_number
interface QueueData {
  id: string;
  name: string;
  tags?: string;
  min_kinesis_number: string | null;
  [key: string]: any;
}

// Helper to get the queue data from node data
const getQueueData = (nodeData: NodeData | null): QueueData | null => {
  if (!nodeData) return null;

  try {
    // For queue nodes, the nodeData itself contains queue info
    if (nodeData.type === 'queue') {
      console.log('[DEBUG] Queue data from API:', nodeData);
      
      // Safely extract tags, handling various possible locations and formats
      let tags = '';
      if (typeof nodeData.tags === 'string' && nodeData.tags !== '') {
        tags = nodeData.tags;
      } else if (nodeData.other?.tags && typeof nodeData.other.tags === 'string') {
        tags = nodeData.other.tags;
      } else if (nodeData.tags && Array.isArray(nodeData.tags)) {
        tags = nodeData.tags.join(',');
      } else if (nodeData.other?.tags && Array.isArray(nodeData.other.tags)) {
        tags = nodeData.other.tags.join(',');
      }
      
      return {
        id: nodeData.id || '',
        name: nodeData.name || '',
        tags: tags,
        min_kinesis_number: nodeData.min_kinesis_number || null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting queue data from nodeData:', error);
    // Return a minimal valid object to prevent further errors
    return nodeData.id ? {
      id: nodeData.id,
      name: nodeData.id.split(':').pop() || nodeData.id,
      tags: '',
      min_kinesis_number: null
    } : null;
  }
};

// Initialize form values from queue data
const getInitialValues = (queueData: QueueData | null): QueueFormValues => {
  if (!queueData) {
    return {
      name: '',
      tags: '',
      minCheckpointNumber: ''
    };
  }

  // Log queue data to debug
  console.log('[DEBUG] Initializing form with queue data:', queueData);

  return {
    name: queueData.name || '',
    tags: queueData.tags || '',
    minCheckpointNumber: queueData.min_kinesis_number || '',
  };
};

export function useQueueFormState(nodeData: NodeData | null) {
  const queueData = getQueueData(nodeData);
  const { addToast } = useToast();
  const router = useRouter();
  
  // Track if this is the first render
  const firstRenderRef = useRef(true);
  
  // Track the previous queue data to detect changes
  const prevQueueDataRef = useRef<QueueData | null>(null);
  
  // Form state
  const [values, setValues] = useState<QueueFormValues>(getInitialValues(queueData));
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the saveQueueSettings mutation from ApiContext
  const saveQueueSettingsMutation = useSaveQueueSettings();

  // Reset form if queue data changes and form is not dirty
  useEffect(() => {
    // Only run this effect if queueData exists
    if (!queueData) return;
    
    const prevQueueData = prevQueueDataRef.current;
    
    // Skip the first render
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      prevQueueDataRef.current = queueData;
      return;
    }

    // Skip if form is dirty
    if (isDirty) {
      console.log('[DEBUG] Form is dirty, not updating values');
      return;
    }

    // Skip if queue data is the same by doing a shallow comparison of relevant fields
    const isDataUnchanged = prevQueueData && 
      prevQueueData.id === queueData.id &&
      prevQueueData.name === queueData.name &&
      prevQueueData.tags === queueData.tags &&
      prevQueueData.min_kinesis_number === queueData.min_kinesis_number;
    
    if (isDataUnchanged) {
      console.log('[DEBUG] Queue data unchanged, not updating values');
      return;
    }

    console.log('[DEBUG] Queue data changed, updating form values');
    // Use a functional update to ensure we don't depend on the current values
    setValues(getInitialValues(queueData));
    setErrors(null);
    setIsDirty(false);
    prevQueueDataRef.current = queueData;
  }, [queueData]); // Only depend on queueData, not isDirty

  // Validation function
  const validateForm = (): boolean => {
    try {
      queueFormSchema.parse(values);
      setErrors(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            formattedErrors[err.path[0]] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  // Update form values - memoize this function to prevent recreation on every render
  const setValue = useCallback((key: keyof QueueFormValues, value: string) => {
    console.log(`[DEBUG] Setting ${key} to ${value}`);
    setValues(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  // Submit the form
  const handleSubmit = async () => {
    console.log('[DEBUG] Submitting form with values:', values);
    
    if (!queueData) {
      console.error('No queue data available');
      return;
    }

    // Validate the form
    if (!validateForm()) {
      console.log('[DEBUG] Form validation failed');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map form values to the API schema - now we're using the eventsettings/save endpoint
      // which requires a different format
      const settings = {
        name: values.name,
        tags: values.tags || '', // Pass tags directly, the API adapter will format it correctly
        minCheckpointNumber: values.minCheckpointNumber || '' // Pass as minCheckpointNumber, API adapter will map to min_kinesis_number
      };

      console.log('[DEBUG] Saving queue settings:', settings);
      
      // Call the API through the context mutation
      await saveQueueSettingsMutation.mutateAsync({
        queueId: queueData.id,
        settings,
      });

      // Add success toast
      addToast({
        title: 'Success',
        description: 'Queue settings saved successfully',
        type: 'success',
      });
      setIsDirty(false);
      // Refresh page data
      router.refresh();

      console.log('[DEBUG] Queue settings saved successfully');
    } catch (error) {
      console.error('Error saving queue settings:', error);
      // Add error toast
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save queue settings',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form values to initial state
  const resetForm = () => {
    console.log('[DEBUG] Resetting form');
    setValues(getInitialValues(queueData));
    setErrors(null);
    setIsDirty(false);
  };

  // Archive queue
  const archiveQueue = async () => {
    if (!queueData) return;

    setIsSubmitting(true);
    try {
      await saveQueueSettingsMutation.mutateAsync({
        queueId: queueData.id,
        settings: { archived: true }
      });

      // Add success toast
      addToast({
        title: 'Success',
        description: 'Queue archived successfully',
        type: 'success',
      });
      router.refresh();
    } catch (error) {
      console.error('Error archiving queue:', error);
      // Add error toast
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive queue',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unarchive queue
  const unarchiveQueue = async () => {
    if (!queueData) return;

    setIsSubmitting(true);
    try {
      await saveQueueSettingsMutation.mutateAsync({
        queueId: queueData.id,
        settings: { archived: false }
      });

      // Add success toast
      addToast({
        title: 'Success',
        description: 'Queue unarchived successfully',
        type: 'success',
      });
      router.refresh();
    } catch (error) {
      console.error('Error unarchiving queue:', error);
      // Add error toast
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unarchive queue',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    isDirty,
    isSubmitting,
    setValue,
    handleSubmit,
    resetForm,
    archiveQueue,
    unarchiveQueue
  };
} 