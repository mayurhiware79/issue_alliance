import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { useToast, TOAST_TYPES } from '../contexts/ToastContext';

// Style configurations for different toast types
const toastConfig = {
  [TOAST_TYPES.SUCCESS]: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-800',
    icon: <FaCheckCircle className="text-green-500" />,
  },
  [TOAST_TYPES.ERROR]: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-800',
    icon: <FaExclamationCircle className="text-red-500" />,
  },
  [TOAST_TYPES.INFO]: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-800',
    icon: <FaInfoCircle className="text-blue-500" />,
  },
  [TOAST_TYPES.WARNING]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-800',
    icon: <FaExclamationTriangle className="text-yellow-500" />,
  },
};

// Format the toast timestamp
const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Individual toast item component
const ToastItem = ({ toast }) => {
  const { removeToast } = useToast();
  const config = toastConfig[toast.type] || toastConfig[TOAST_TYPES.INFO];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`${config.bg} border-l-4 ${config.border} p-4 mb-3 rounded-md shadow-md flex items-start relative max-w-xs sm:max-w-sm md:max-w-md`}
    >
      <div className="mr-3 flex-shrink-0 pt-0.5">
        {config.icon}
      </div>
      <div className="flex-1">
        <p className={`${config.text} text-sm font-medium`}>{toast.message}</p>
        <p className="text-xs text-gray-500 mt-1">{formatTime(toast.timestamp)}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Close"
      >
        <FaTimes />
      </button>
    </motion.div>
  );
};

// Toast container component
function Toast() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default Toast; 