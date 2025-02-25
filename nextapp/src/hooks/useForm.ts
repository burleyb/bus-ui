import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T, string>>;
type Validator<T> = (values: T) => FormErrors<T>;

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: Validator<T>;
}

/**
 * Custom hook for handling form state and validation
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  // Handle input changes
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear error when field is changed
    if (errors[name as keyof T]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form if validator is provided
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      
      setTouched(allTouched);
      
      // Don't submit if there are errors
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
    setIsSubmitting(false);
  }, [initialValues]);

  // Set a specific field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Set multiple field values at once
  const setFieldValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldValues,
    setErrors
  };
}

export default useForm; 