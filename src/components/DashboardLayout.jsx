import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { FaBars, FaBell, FaWifi, FaExclamationTriangle, FaUser, FaCog, FaSignOutAlt, FaTimes, FaCheck, FaComment, FaEnvelope } from 'react-icons/fa';
import { collection, query, where, onSnapshot, updateDoc, doc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

function DashboardLayout() {
  const { currentUser, logout } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [reconnecting, setReconnecting] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationSound] = useState(new Audio('/notification.mp3'));
  const [hasNewNotification, setHasNewNotification] = useState(false);
  
  // Refs for dropdown menus (used for click outside detection)
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  
  // Check if user is logged in
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setReconnecting(true);
      // Add a short delay to allow connections to reestablish
      setTimeout(() => {
        setIsOffline(false);
        setReconnecting(false);
      }, 2000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Fetch notifications for the current user
  useEffect(() => {
    if (!currentUser) return;
    
    const notificationsRef = collection(db, 'notifications');
    
    // Create a simpler query that doesn't require a composite index
    // First query for unread notifications without ordering
    const q = query(
      notificationsRef, 
      where('recipientId', '==', currentUser.uid), 
      where('read', '==', false)
    );
    
    let initialLoad = true;
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsList = [];
      let hasNew = false;
      
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !initialLoad) {
          hasNew = true;
          // Play notification sound for new notifications
          try {
            notificationSound.play();
          } catch (error) {
            console.log("Notification sound could not play:", error);
          }
        }
      });
      
      // After checking for new notifications, populate the full list
      // Sort the results in memory instead of using orderBy in the query
      querySnapshot.forEach((doc) => {
        notificationsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by timestamp in memory
      notificationsList.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
        return timeB - timeA; // Descending order (newest first)
      });
      
      // Limit to most recent 20 notifications
      const limitedList = notificationsList.slice(0, 20);
      
      setNotifications(limitedList);
      
      if (hasNew) {
        setHasNewNotification(true);
      }
      
      initialLoad = false;
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });
    
    // Also listen for new messages with a simpler query
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false)
    );
    
    const messageUnsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !initialLoad) {
          const messageData = change.doc.data();
          
          // Play notification sound
          try {
            notificationSound.play();
          } catch (error) {
            console.log("Notification sound could not play:", error);
          }
          
          setHasNewNotification(true);
        }
      });
    });
    
    return () => {
      unsubscribe();
      messageUnsubscribe();
    };
  }, [currentUser, notificationSound]);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      // Update the local state to reflect the change
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // If no more unread notifications, reset the indicator
      if (notifications.length <= 1) {
        setHasNewNotification(false);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'new_message') {
      navigate('/messages');
    } else if (notification.type === 'project_update') {
      navigate('/projects');
    } else if (notification.type === 'mention') {
      navigate(`/issues/${notification.data?.issueId || ''}`);
    } else if (notification.link) {
      navigate(notification.link);
    }
    
    // Close notification panel
    setShowNotifications(false);
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const promises = notifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      
      await Promise.all(promises);
      setNotifications([]);
      setHasNewNotification(false);
      setShowNotifications(false);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  
  // Format notification time
  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_message':
        return <FaEnvelope className="text-blue-500" />;
      case 'mention':
        return <FaComment className="text-green-500" />;
      case 'project_update':
        return <FaCheck className="text-green-500" />;
      default:
        return <FaBell className="text-blue-500" />;
    }
  };
  
  // Count unread notifications
  const unreadCount = notifications.length;
  
  // Create sample notifications if none exist (for development purposes)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && notifications.length === 0) {
      // This is just for UI testing, in production these would come from the database
      setNotifications([
        {
          id: 'sample1',
          title: 'New project invitation',
          message: 'You have been invited to contribute to the React UI Library project',
          type: 'project_invite',
          timestamp: Timestamp.now(),
          read: false
        },
        {
          id: 'sample2',
          title: 'Daily challenge reminder',
          message: 'Don\'t forget to complete today\'s coding challenge!',
          type: 'challenge_reminder',
          timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
          read: false
        }
      ]);
    }
  }, []);
  
  return (
    <div className={`flex h-screen bg-theme transition-colors duration-200`}>
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isOffline || reconnecting ? 'mt-10' : ''}`}>
        {/* Top navigation */}
        <header className="bg-theme-secondary shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={toggleSidebar}
              className="text-theme-secondary hover:text-theme focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            {/* Right Side Nav Items */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      setHasNewNotification(false);
                    }
                  }}
                  className="relative p-1 rounded-full hover:bg-theme-hover transition-colors focus:outline-none"
                >
                  <FaBell className={`h-6 w-6 ${hasNewNotification ? 'text-red-500 animate-pulse' : 'text-theme'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
                </button>
                
                {/* Notifications Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-theme-primary">Notifications</h3>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        <div>
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-none"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <span className="mr-2">{getNotificationIcon(notification.type)}</span>
                                  <p className="text-sm font-medium text-theme-primary">{notification.title}</p>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{formatNotificationTime(notification.timestamp)}</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 ml-6">{notification.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                        <Link 
                          to="/notifications" 
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center focus:outline-none p-1 rounded-full hover:bg-theme-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-theme-secondary-hover">
                {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-blue-500 flex items-center justify-center text-white">
                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 
                         currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                </button>
                
                {/* Profile Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-theme-primary truncate">
                        {currentUser.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {currentUser.email}
                      </p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FaUser className="mr-2 text-gray-500 dark:text-gray-400" />
                      Profile
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FaCog className="mr-2 text-gray-500 dark:text-gray-400" />
                      Settings
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2 text-red-600 dark:text-red-400" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-theme p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout; 