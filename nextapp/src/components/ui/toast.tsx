"use client"

import React, { createContext, useContext, useState, useCallback, FC, ReactNode } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

// Define toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Define toast object structure
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

// Create context
interface ToastContextProps {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

// Provider component
interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate a unique ID for each toast
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Add a new toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast = { ...toast, id };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto-remove toast after duration (default: 5000ms)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  // Remove a toast by ID
  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Simplified function to add toast
export const toast = (props: { 
  title: string; 
  description?: string; 
  type: ToastType; 
  duration?: number 
}) => {
  const { addToast } = useToast();
  addToast(props);
};

// Toast item component
const ToastItem: FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const { title, description, type } = toast;

  // Get icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // Get background color based on toast type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-white dark:bg-gray-800';
    }
  };

  return (
    <div
      className={`rounded-lg shadow-lg p-4 mb-3 border transform transition-all duration-300 ease-in-out ${getBackgroundColor()}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-gray-100">{title}</div>
          {description && <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</div>}
        </div>
        <button
          type="button"
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

// Toast container
const ToastContainer: FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default ToastProvider; 