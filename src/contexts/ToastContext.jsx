import React, { createContext, useContext, useState, useCallback } from 'react';

// Create a context for toast notifications
const ToastContext = createContext();

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Generate a unique ID for each toast
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = generateId();
    const newToast = {
      id,
      message,
      type,
      timestamp: new Date(),
    };

    setToasts(prevToasts => [...prevToasts, newToast]);

    // Auto dismiss after duration
    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Shorthand methods for different toast types
  const showSuccess = useCallback((message, duration) => {
    return addToast(message, TOAST_TYPES.SUCCESS, duration);
  }, [addToast]);

  const showError = useCallback((message, duration) => {
    return addToast(message, TOAST_TYPES.ERROR, duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration) => {
    return addToast(message, TOAST_TYPES.INFO, duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration) => {
    return addToast(message, TOAST_TYPES.WARNING, duration);
  }, [addToast]);

  // Context value
  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// Hook for using the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext; 