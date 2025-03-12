import { useState, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useSaveSystemSettings } from '@/context/ApiContext';
import { NodeData } from '@/types/node';

// Define the schema for system form validation
export const systemFormSchema = z.object({
  label: z.string().trim().min(1, 'System label is required'),
  name: z.string().trim().optional(),
  tags: z.string().optional(),
  icon: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Allow empty values
      try {
        new URL(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: 'Icon must be a valid URL' }
  )
});

// Define the form values type based on the schema
export type SystemFormValues = z.infer<typeof systemFormSchema>;

// Define additional system data type
interface SystemData {
  id: string;
  label: string;
  name: string;
  tags?: string;
  icon: string | null;
  [key: string]: any;
}

// Helper to get the system data from node data
const getSystemData = (nodeData: NodeData | null): SystemData | null => {
  if (!nodeData) return null;

  try {
    // For system nodes, the nodeData itself contains system info
    if (nodeData.type === 'system') {
      console.log('[DEBUG] System data from API:', nodeData);
      
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
        label: nodeData.label || nodeData.name || '',
        name: nodeData.name || nodeData.label || '',
        tags: tags,
        icon: nodeData.icon || null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting system data from nodeData:', error);
    // Return a minimal valid object to prevent further errors
    return nodeData.id ? {
      id: nodeData.id,
      label: nodeData.id.split(':').pop() || nodeData.id,
      name: nodeData.id.split(':').pop() || nodeData.id,
      tags: '',
      icon: null
    } : null;
  }
};

// Initialize form values from system data
const getInitialValues = (systemData: SystemData | null): SystemFormValues => {
  if (!systemData) {
    return {
      label: '',
      name: '',
      tags: '',
      icon: ''
    };
  }

  // Log system data to debug
  console.log('[DEBUG] Initializing form with system data:', systemData);

  return {
    label: systemData.label || '',
    name: systemData.name || '',
    tags: systemData.tags || '',
    icon: systemData.icon || '',
  };
};

export function useSystemFormState(nodeData: NodeData | null) {
  const systemData = getSystemData(nodeData);
  const { addToast } = useToast();
  const router = useRouter();
  
  // Track if this is the first render
  const firstRenderRef = useRef(true);
  
  // Track the previous system data to detect changes
  const prevSystemDataRef = useRef<SystemData | null>(null);
  
  // Form state
  const [values, setValues] = useState<SystemFormValues>(getInitialValues(systemData));
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the saveSystemSettings mutation from ApiContext
  const saveSystemSettingsMutation = useSaveSystemSettings();

  // Reset form if system data changes and form is not dirty
  useEffect(() => {
    // Only run this effect if systemData exists
    if (!systemData) return;
    
    const prevSystemData = prevSystemDataRef.current;
    
    // Skip the first render
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      prevSystemDataRef.current = systemData;
      return;
    }

    // Skip if form is dirty
    if (isDirty) {
      console.log('[DEBUG] Form is dirty, not updating values');
      return;
    }

    // Skip if system data is the same by doing a shallow comparison of relevant fields
    const isDataUnchanged = prevSystemData && 
      prevSystemData.id === systemData.id &&
      prevSystemData.label === systemData.label &&
      prevSystemData.name === systemData.name &&
      prevSystemData.tags === systemData.tags &&
      prevSystemData.icon === systemData.icon;
    
    if (isDataUnchanged) {
      console.log('[DEBUG] System data unchanged, not updating values');
      return;
    }

    console.log('[DEBUG] System data changed, updating form values');
    // Use a functional update to ensure we don't depend on the current values
    setValues(getInitialValues(systemData));
    setErrors(null);
    setIsDirty(false);
    prevSystemDataRef.current = systemData;
  }, [systemData]); // Only depend on systemData, not isDirty

  // Validation function
  const validateForm = (): boolean => {
    try {
      systemFormSchema.parse(values);
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
  const setValue = useCallback((key: keyof SystemFormValues, value: string) => {
    console.log(`[DEBUG] Setting ${key} to ${value}`);
    setValues(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  // Submit the form
  const handleSubmit = async () => {
    console.log('[DEBUG] Submitting form with values:', values);
    
    if (!systemData) {
      console.error('No system data available');
      return;
    }

    // Validate the form
    if (!validateForm()) {
      console.log('[DEBUG] Form validation failed');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map form values to the API schema
      const settings = {
        label: values.label,
        name: values.name || values.label || '',
        tags: values.tags || '', // Pass tags directly, the API adapter will format it correctly
        icon: values.icon || '' // Pass icon URL
      };

      console.log('[DEBUG] Saving system settings:', settings);
      
      // Call the API through the context mutation
      await saveSystemSettingsMutation.mutateAsync({
        systemId: systemData.id,
        settings,
      });

      // Add success toast
      addToast({
        title: 'Success',
        description: 'System settings saved successfully',
        type: 'success',
      });
      setIsDirty(false);
      // Refresh page data
      router.refresh();

      console.log('[DEBUG] System settings saved successfully');
    } catch (error) {
      console.error('Error saving system settings:', error);
      // Add error toast
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save system settings',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form values to initial state
  const resetForm = () => {
    console.log('[DEBUG] Resetting form');
    setValues(getInitialValues(systemData));
    setErrors(null);
    setIsDirty(false);
  };

  // Archive system
  const archiveSystem = async () => {
    if (!systemData) {
      console.error('Cannot archive system: No system data available');
      return Promise.reject(new Error('No system data available'));
    }

    setIsSubmitting(true);
    try {
      await saveSystemSettingsMutation.mutateAsync({
        systemId: systemData.id,
        settings: { archived: true }
      });

      // Add success toast
      addToast({
        title: 'Success',
        description: 'System archived successfully',
        type: 'success',
      });
      
      // Update local state to match the updated state
      setIsDirty(false);
      
      // Refresh page data
      router.refresh();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error archiving system:', error);
      // Add error toast
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive system',
        type: 'error',
      });
      return Promise.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unarchive system
  const unarchiveSystem = async () => {
    if (!systemData) {
      console.error('Cannot unarchive system: No system data available');
      return Promise.reject(new Error('No system data available'));
    }

    setIsSubmitting(true);
    try {
      await saveSystemSettingsMutation.mutateAsync({
        systemId: systemData.id,
        settings: { archived: false }
      });

      // Add success toast
      addToast({
        title: 'Success',
        description: 'System unarchived successfully',
        type: 'success',
      });
      
      // Update local state to match the updated state
      setIsDirty(false);
      
      // Refresh page data
      router.refresh();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error unarchiving system:', error);
      // Add error toast
      addToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unarchive system',
        type: 'error',
      });
      return Promise.reject(error);
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
    archiveSystem,
    unarchiveSystem
  };
} 