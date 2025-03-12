"use client";

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSystemFormState, systemFormSchema, SystemFormValues } from '@/hooks/useSystemFormState';
import { NodeData } from '@/types/node';
import { Archive, Undo2 } from 'lucide-react';
import {
  SimpleDialog,
  SimpleDialogContent,
  SimpleDialogHeader,
  SimpleDialogTitle,
  SimpleDialogFooter
} from '@/components/ui/simple-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TagInput } from '@/components/ui/tag-input';
import { cn } from '@/lib/utils';

interface SystemSettingsTabProps {
  nodeData: NodeData | null;
  onTabChangeRequest?: (callback: (canProceed: boolean) => boolean) => void;
  onCloseRequest?: (callback: (canProceed: boolean) => boolean) => void;
}

export default function SystemSettingsTab({ nodeData, onTabChangeRequest, onCloseRequest }: SystemSettingsTabProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Check if we're using fallback data
  const jsonParseError = nodeData && ('_jsonParseError' in nodeData);
  
  // Use a try-catch to handle any errors in useSystemFormState
  let formState;
  try {
    formState = useSystemFormState(nodeData);
  } catch (error) {
    console.error("Error initializing system form state:", error);
    setLoadError(error instanceof Error ? error.message : "Failed to load system settings");
    formState = {
      values: { label: "", tags: "", icon: "" },
      errors: null,
      isDirty: false,
      isSubmitting: false,
      setValue: () => {},
      handleSubmit: async () => {},
      resetForm: () => {},
      archiveSystem: async () => {},
      unarchiveSystem: async () => {}
    };
  }
  
  const {
    values,
    errors: formErrors,
    isDirty,
    isSubmitting,
    setValue,
    handleSubmit,
    resetForm,
    archiveSystem,
    unarchiveSystem
  } = formState;

  // For navigation confirmation
  const [showNavConfirmDialog, setShowNavConfirmDialog] = useState(false);
  const [navigationCallback, setNavigationCallback] = useState<(() => void) | null>(null);
  
  // For archive/unarchive confirmation
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  // Keep the initial values in a ref to prevent unnecessary re-renderings
  const initialValuesRef = React.useRef(values);

  // Use react-hook-form for additional validation
  const { control, handleSubmit: hookFormSubmit, formState: { errors: rhfErrors }, reset } = useForm<SystemFormValues>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: initialValuesRef.current,
    mode: 'onBlur'
  });

  // Update the form when values change significantly
  React.useEffect(() => {
    initialValuesRef.current = values;
    reset(values);
  }, [values, reset]);

  // Memoize the callbacks to prevent them from changing on every render
  const handleTabChangeCallback = React.useCallback((canProceed: boolean) => {
    if (isDirty && canProceed) {
      setShowNavConfirmDialog(true);
      return false;
    }
    return true;
  }, [isDirty, setShowNavConfirmDialog]);

  const handleCloseCallback = React.useCallback((canProceed: boolean) => {
    if (isDirty && canProceed) {
      setShowNavConfirmDialog(true);
      return false;
    }
    return true;
  }, [isDirty, setShowNavConfirmDialog]);

  // Register callbacks for navigation with unsaved changes
  React.useEffect(() => {
    if (onTabChangeRequest) {
      onTabChangeRequest(handleTabChangeCallback);
    }

    if (onCloseRequest) {
      onCloseRequest(handleCloseCallback);
    }
    
    // Important: only register these callbacks when the component mounts or when the dependencies change
    return () => {
      // No cleanup needed as the parent component will handle replacing callbacks
    };
  }, [onTabChangeRequest, onCloseRequest, handleTabChangeCallback, handleCloseCallback]);

  // Form submission handler
  const onSubmit: SubmitHandler<SystemFormValues> = async (data) => {
    console.log('[DEBUG] Form submitted with data:', data);
    await handleSubmit();
  };

  // Discard changes
  const handleDiscard = () => {
    resetForm();
    setShowNavConfirmDialog(false);
  };

  // Archive/unarchive handler
  const handleArchiveConfirm = async () => {
    try {
      // Close the dialog before starting the async operation
      setIsArchiveDialogOpen(false);
      
      // Then perform the async operation
      if (nodeData?.archived) {
        await unarchiveSystem();
      } else {
        await archiveSystem();
      }
    } catch (error) {
      console.error('Error during archive/unarchive operation:', error);
      // If an error occurs, we've already closed the dialog
    }
  };

  // Show error state if we have a load error
  if (loadError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4 text-center">
          <p className="text-xl font-semibold">Error Loading System Settings</p>
          <p className="mt-2">{loadError}</p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="mt-4"
        >
          Reload Page
        </Button>
      </div>
    );
  }

  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-1">

      <form onSubmit={hookFormSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* System Info Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">System Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Label */}
              <div className="space-y-2">
                <Label htmlFor="label">System Label</Label>
                <Controller
                  name="label"
                  control={control}
                  render={({ field }) => {
                    // Ensure field.value is always a string
                    const safeValue = field.value ? 
                      (typeof field.value === 'string' ? field.value : String(field.value)) : 
                      '';
                    
                    return (
                      <Input
                        {...field}
                        id="label"
                        placeholder="Enter system label"
                        className={cn(
                          formErrors?.label && "border-red-500"
                        )}
                        value={safeValue}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('label', e.target.value);
                        }}
                      />
                    );
                  }}
                />
                {formErrors?.label && (
                  <p className="text-sm text-red-500">{formErrors.label}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => {
                    // Ensure field.value is always a string
                    const safeValue = field.value ? 
                      (typeof field.value === 'string' ? field.value : String(field.value)) : 
                      '';
                    
                    return (
                      <TagInput
                        {...field}
                        id="tags"
                        placeholder="Enter tags (comma-separated)"
                        className={cn(
                          formErrors?.tags && "border-red-500"
                        )}
                        value={safeValue}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('tags', e.target.value);
                        }}
                      />
                    );
                  }}
                />
                {formErrors?.tags && (
                  <p className="text-sm text-red-500">{formErrors.tags}</p>
                )}
              </div>

              {/* Icon URL */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon URL</Label>
                <Controller
                  name="icon"
                  control={control}
                  render={({ field }) => {
                    // Ensure field.value is always a string
                    const safeValue = field.value ? 
                      (typeof field.value === 'string' ? field.value : String(field.value)) : 
                      '';
                    
                    return (
                      <Input
                        {...field}
                        id="icon"
                        placeholder="Enter icon URL"
                        className={formErrors?.icon ? "border-red-500" : ""}
                        value={safeValue}
                        onChange={(e) => {
                          field.onChange(e);
                          setValue('icon', e.target.value);
                        }}
                      />
                    );
                  }}
                />
                {formErrors?.icon && (
                  <p className="text-sm text-red-500">{formErrors.icon}</p>
                )}
                <p className="text-sm text-gray-500">
                  URL to an icon image for this system.
                </p>
              </div>
            </CardContent>
          </Card>

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
                  Unarchive System
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive System
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
              {nodeData.archived ? 'Unarchive System' : 'Archive System'}
            </SimpleDialogTitle>
          </SimpleDialogHeader>
          <p className="my-4">
            {nodeData.archived 
              ? 'Are you sure you want to unarchive this system? It will become available for use again.'
              : 'Are you sure you want to archive this system? It will not be available for use.'}
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