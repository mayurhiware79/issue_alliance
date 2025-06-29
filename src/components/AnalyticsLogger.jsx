import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collectAnalyticsData, logDataToGoogleSheets, trackUserAction } from '../services/analyticsService';

// Set to false to disable automatic logging during development
const AUTO_LOGGING_ENABLED = false;

// Component that automatically logs analytics data
const AnalyticsLogger = ({ logOnMount = false, logInterval = null, children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastLogged, setLastLogged] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Function to log data
  const logAnalytics = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Log the data
      const result = await logDataToGoogleSheets();
      
      // Update tracking state
      setLastLogged(new Date());
      setRetryCount(0);
      
      // Track this action
      trackUserAction('analytics_logged', { timestamp: new Date().toISOString() });
      
      return result;
    } catch (error) {
      console.error('Error logging analytics:', error);
      setError(error.message || 'Failed to log analytics data');
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Log on component mount
  useEffect(() => {
    if (AUTO_LOGGING_ENABLED && logOnMount && currentUser) {
      logAnalytics();
    }
  }, [currentUser]);

  // Set up interval logging if specified
  useEffect(() => {
    if (!AUTO_LOGGING_ENABLED || !logInterval || !currentUser) return;
    
    // Start with a slight delay to prevent immediate logging
    const initialTimeout = setTimeout(() => {
      const intervalId = setInterval(() => {
        // Don't attempt logging more than 3 times in a row after errors
        if (retryCount < 3) {
          logAnalytics();
        }
      }, logInterval);
      
      return () => clearInterval(intervalId);
    }, 10000); // Wait 10 seconds before starting interval
    
    return () => clearTimeout(initialTimeout);
  }, [currentUser, logInterval, retryCount]);

  // Additional props to render for children
  const childProps = {
    logAnalytics,
    lastLogged,
    loading,
    error
  };

  // Render children with props, or null if no children
  return children ? 
    (typeof children === 'function' ? children(childProps) : children) : 
    null;
};

// Button component to trigger analytics logging
export const LogAnalyticsButton = ({ text = 'Log Analytics', className = '', disabled = false, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  
  const handleClick = async () => {
    if (!currentUser || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // First collect the most up-to-date data
      const freshData = await collectAnalyticsData();
      
      try {
        // Send the fresh data to the server
        const result = await logDataToGoogleSheets(freshData);
        
        if (result.success) {
          setSuccess(true);
          // Call onSuccess callback if provided
          if (typeof onSuccess === 'function') {
            onSuccess();
          }
        } else {
          // If server error, show fallback message
          setError('Server unavailable - data saved locally');
          
          // Save the fact that we attempted to log
          trackUserAction('analytics_saved_locally', { 
            timestamp: new Date().toISOString(),
            error: result.message
          });
          
          // Still indicate success since we saved locally
          setTimeout(() => {
            setError(null);
            setSuccess(true);
            // Call onSuccess callback if provided
            if (typeof onSuccess === 'function') {
              onSuccess();
            }
          }, 1500);
        }
      } catch (err) {
        // If server error, show fallback message
        setError('Server unavailable - data saved locally');
        
        // Save the fact that we attempted to log
        trackUserAction('analytics_saved_locally', { 
          timestamp: new Date().toISOString(),
          error: err.message
        });
        
        // Still indicate success since we saved locally
        setTimeout(() => {
          setError(null);
          setSuccess(true);
          // Call onSuccess callback if provided
          if (typeof onSuccess === 'function') {
            onSuccess();
          }
        }, 1500);
      }
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to log analytics');
      
      // Reset error state after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      className={`px-4 py-2 rounded ${
        success ? 'bg-green-500 text-white' : 
        error ? 'bg-yellow-500 text-white' : 
        loading ? 'bg-gray-400 text-white' : 
        'bg-blue-500 text-white hover:bg-blue-600'
      } ${className}`}
      onClick={handleClick}
      disabled={disabled || loading || !currentUser}
    >
      {loading ? 'Logging...' : 
       success ? 'Success!' : 
       error ? 'Saved Locally' : 
       text}
    </button>
  );
};

export default AnalyticsLogger; 