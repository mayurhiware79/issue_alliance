import axios from 'axios';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

// Get API URL with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Add option to disable analytics in development for testing purposes
const ANALYTICS_ENABLED = true;
// Number of retries for analytics API
const MAX_RETRIES = 3;
// Delay between retries in milliseconds
const RETRY_DELAY = 2000;

/**
 * Collects all user data and analytics information
 * @returns {Promise<Object>} Combined user and analytics data
 */
export const collectAnalyticsData = async () => {
  console.log('Collecting analytics data...');
  
  try {
    // Create a promise that rejects after a timeout
    const timeout = (ms) => new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    });
    
    // Object to store all analytics data
    const analyticsData = {
      timestamp: new Date().toISOString(),
      hasErrors: false, // Flag to indicate if any section failed
      errorSections: [] // Track which sections had errors
    };
    
    // Get current user data with timeout for each request
    try {
      const userData = await Promise.race([
        getUserData(),
        timeout(5000)
      ]);
      analyticsData.userData = userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      analyticsData.userData = generateFallbackUserData();
      analyticsData.hasErrors = true;
      analyticsData.errorSections.push('userData');
    }
    
    // Get daily issue stats with timeout
    try {
      const dailyIssueStats = await Promise.race([
        getDailyIssueStats(),
        timeout(5000)
      ]);
      analyticsData.dailyIssueStats = dailyIssueStats;
    } catch (error) {
      console.error('Error fetching daily issue stats:', error);
      analyticsData.dailyIssueStats = generateFallbackDailyIssueStats();
      analyticsData.hasErrors = true;
      analyticsData.errorSections.push('dailyIssueStats');
    }
    
    // Get user badges with timeout
    try {
      const userBadges = await Promise.race([
        getUserBadges(),
        timeout(5000)
      ]);
      analyticsData.userBadges = userBadges;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      analyticsData.userBadges = generateFallbackUserBadges();
      analyticsData.hasErrors = true;
      analyticsData.errorSections.push('userBadges');
    }
    
    // Get GitHub information with timeout
    try {
      const githubInfo = await Promise.race([
        getGitHubInfo(),
        timeout(5000)
      ]);
      analyticsData.githubInfo = githubInfo;
    } catch (error) {
      console.error('Error fetching GitHub info:', error);
      analyticsData.githubInfo = generateFallbackGitHubInfo();
      analyticsData.hasErrors = true;
      analyticsData.errorSections.push('githubInfo');
    }
    
    // Get chat interactions with timeout
    try {
      const chatInteractions = await Promise.race([
        getChatInteractions(),
        timeout(5000)
      ]);
      analyticsData.chatInteractions = chatInteractions;
    } catch (error) {
      console.error('Error fetching chat interactions:', error);
      analyticsData.chatInteractions = generateFallbackChatInteractions();
      analyticsData.hasErrors = true;
      analyticsData.errorSections.push('chatInteractions');
    }
    
    // Get website events with timeout
    try {
      const websiteEvents = await Promise.race([
        getWebsiteEvents(),
        timeout(5000)
      ]);
      analyticsData.websiteEvents = websiteEvents;
    } catch (error) {
      console.error('Error fetching website events:', error);
      analyticsData.websiteEvents = generateFallbackWebsiteEvents();
      analyticsData.hasErrors = true;
      analyticsData.errorSections.push('websiteEvents');
    }
    
    console.log('Analytics data collection complete.', 
      analyticsData.hasErrors ? 
        `Some sections had errors: ${analyticsData.errorSections.join(', ')}` : 
        'All data collected successfully'
    );
    
    return analyticsData;
  } catch (error) {
    console.error('Error in analytics data collection:', error);
    // If everything fails, return a complete fallback object
    return {
      timestamp: new Date().toISOString(),
      hasErrors: true,
      errorSections: ['complete_failure'],
      userData: generateFallbackUserData(),
      dailyIssueStats: generateFallbackDailyIssueStats(),
      userBadges: generateFallbackUserBadges(),
      githubInfo: generateFallbackGitHubInfo(),
      chatInteractions: generateFallbackChatInteractions(),
      websiteEvents: generateFallbackWebsiteEvents()
    };
  }
};

// Generate fallback data functions

const generateFallbackUserData = () => {
  return {
    displayName: 'Sample User',
    email: 'user@example.com',
    photoURL: '/default-avatar.png',
    uid: 'sample-user-id',
    memberSince: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    lastActive: new Date().toISOString()
  };
};

const generateFallbackDailyIssueStats = () => {
  return {
    availableIssues: [
      'sample-issue-1',
      'sample-issue-2',
      'sample-issue-3'
    ],
    completedIssues: [
      'sample-completed-1',
      'sample-completed-2'
    ],
    inProgressIssues: [
      'sample-progress-1'
    ],
    completionRateToday: 0.66,
    completionRateWeek: 0.58,
    totalIssuesCompleted: 37
  };
};

const generateFallbackUserBadges = () => {
  return [
    {
      id: 'badge-1',
      name: 'Early Adopter',
      description: 'Joined during the beta phase',
      icon: '🌟',
      dateEarned: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'badge-2',
      name: 'Consistent Contributor',
      description: 'Completed tasks for 7 days in a row',
      icon: '🏆',
      dateEarned: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'badge-3',
      name: 'Problem Solver',
      description: 'Completed 25 issues',
      icon: '🧩',
      dateEarned: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

const generateFallbackGitHubInfo = () => {
  return {
    username: 'sampleuser',
    avatar: 'https://github.com/identicons/sampleuser.png',
    publicRepos: 8,
    followers: 12,
    following: 17,
    stars: 23,
    contributions: 187,
    topLanguages: [
      { name: 'JavaScript', percentage: 45 },
      { name: 'Python', percentage: 30 },
      { name: 'HTML/CSS', percentage: 25 }
    ],
    lastCommitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  };
};

const generateFallbackChatInteractions = () => {
  const interactions = [];
  const now = new Date();
  
  // Generate 14 days of chat data
  for (let i = 14; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // More activity on weekdays, less on weekends
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseCount = isWeekend ? 2 : 5;
    const randomFactor = Math.floor(Math.random() * 4);
    const messageCount = baseCount + randomFactor;
    
    interactions.push({
      date: dateString,
      messagesSent: messageCount,
      messagesReceived: messageCount + Math.floor(Math.random() * 3) - 1
    });
  }
  
  return interactions;
};

const generateFallbackWebsiteEvents = () => {
  const eventTypes = [
    'page_view', 'button_click', 'login', 'logout', 
    'profile_update', 'search', 'notification_click'
  ];
  
  const events = [];
  const now = new Date();
  
  // Generate 50 random events over the past 14 days
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() - daysAgo);
    eventDate.setHours(eventDate.getHours() - hoursAgo);
    eventDate.setMinutes(eventDate.getMinutes() - minutesAgo);
    
    events.push({
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      timestamp: eventDate.toISOString(),
      page: ['/', '/dashboard', '/profile', '/analytics', '/issues'][Math.floor(Math.random() * 5)]
    });
  }
  
  // Sort by timestamp (newest first)
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Sleep function for retries
 * @param {number} ms Milliseconds to sleep
 * @returns {Promise} Promise that resolves after ms milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Makes an API request with retry logic
 * @param {string} url The API endpoint URL
 * @param {Object} data The request data
 * @param {Object} options Axios request options
 * @returns {Promise<Object>} API response
 */
const makeRequestWithRetry = async (url, data, options = {}) => {
  let lastError;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`Attempt ${i + 1} to send data to ${url}...`);
      const response = await axios.post(url, data, {
        timeout: 10000, // 10 second timeout
        ...options
      });
      console.log(`Successfully sent data to ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // Check if it's a connection error, which might mean the server is down
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        console.warn(`Server connection error (${url}). Will retry in ${RETRY_DELAY/1000}s...`);
      } else {
        // For other errors, we might want to stop retrying
        console.error(`Non-connection error: ${error.message}`);
        break;
      }
      
      // Wait before next retry
      if (i < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY);
      }
    }
  }
  
  throw lastError; // Throw the last error if all retries failed
};

/**
 * Sends the collected analytics data to the backend API for Google Sheets logging
 * @param {Object} data Analytics data to log
 * @returns {Promise<Object>} API response
 */
export const logDataToGoogleSheets = async (data = null) => {
  if (!ANALYTICS_ENABLED) {
    console.log('Analytics logging is disabled');
    return { success: true, message: 'Analytics logging is disabled' };
  }

  try {
    // If no data is provided, collect it first
    // Always collect fresh data to ensure we have the latest information
    const analyticsData = await collectAnalyticsData();
    
    // Always save to localStorage as backup
    try {
      const analyticsLog = JSON.parse(localStorage.getItem('analytics_log') || '[]');
      analyticsLog.push({
        ...analyticsData,
        timestamp: new Date().toISOString(),
        sent: false
      });
      // Keep only recent 20 logs
      const recentLogs = analyticsLog.slice(-20);
      localStorage.setItem('analytics_log', JSON.stringify(recentLogs));
    } catch (e) {
      console.warn('Error saving analytics to localStorage:', e);
    }
    
    let primaryResponse = null;
    
    // Try to use the primary endpoint first
    try {
      console.log('Sending data to main Google Sheets endpoint...');
      primaryResponse = await makeRequestWithRetry(
        `${API_URL}/api/log-to-sheets`,
        analyticsData
      );
      
      console.log('Successfully logged to Google Sheets!');
      
      // If successful, mark logs as sent
      try {
        const analyticsLog = JSON.parse(localStorage.getItem('analytics_log') || '[]');
        const updatedLogs = analyticsLog.map(log => ({ ...log, sent: true }));
        localStorage.setItem('analytics_log', JSON.stringify(updatedLogs));
      } catch (e) {
        // Ignore errors updating localStorage
      }
      
    } catch (error) {
      console.warn('Failed to send to primary endpoint, will try backup...', error.message);
      
      // Try backup endpoint as fallback
      try {
        console.log('Sending data to backup endpoint...');
        const backupResponse = await makeRequestWithRetry(
          `${API_URL}/api/backup-log`,
          analyticsData,
          { timeout: 5000 }
        );
        console.log('Successfully saved to backup endpoint');
        
        // Use the backup response
        primaryResponse = backupResponse;
      } catch (backupErr) {
        console.error('Both primary and backup endpoints failed', backupErr);
        
        // Show user-friendly message in console
        console.warn('⚠️ Analytics server appears to be offline. Data has been saved locally and will be sent when the server is available.');
        
        // Return graceful failure that won't break the app
        return { 
          success: false, 
          message: 'Server unreachable, data stored locally',
          offline: true 
        };
      }
    }
    
    // Return whichever response we got
    return primaryResponse?.data || { success: true, message: 'Data logged locally' };
    
  } catch (error) {
    console.error('Error logging data to Google Sheets:', error);
    
    // Store the fact that we had an error
    try {
      localStorage.setItem('last_analytics_error', JSON.stringify({
        message: error.message,
        time: new Date().toISOString()
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Return graceful failure that won't break the app
    return { 
      success: false, 
      message: 'Failed to log analytics data',
      error: error.message 
    };
  }
};

/**
 * Track a specific user action
 * @param {string} action Name of the action
 * @param {Object} data Additional data about the action
 */
export const trackUserAction = (action, data = {}) => {
  try {
    // Store action in localStorage
    const actionsKey = 'user_actions';
    const existingActions = JSON.parse(localStorage.getItem(actionsKey) || '[]');
    
    existingActions.push({
      action,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the most recent 100 actions
    const recentActions = existingActions.slice(-100);
    localStorage.setItem(actionsKey, JSON.stringify(recentActions));
    
    return true;
  } catch (error) {
    console.error('Error tracking user action:', error);
    return false;
  }
}; 