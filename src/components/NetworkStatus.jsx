import React, { useState, useEffect } from 'react';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Component to display network connection status
 */
function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show a temporary success message when coming back online
      setShowOfflineMessage(true);
      setTimeout(() => setShowOfflineMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    setShowOfflineMessage(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center px-4 py-2 rounded-lg shadow-md transition-all duration-300 ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isOnline ? (
        <>
          <FaWifi className="mr-2" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <FaExclamationTriangle className="mr-2" />
          <span>You are offline. Some features may be unavailable.</span>
        </>
      )}
    </div>
  );
}

export default NetworkStatus; 