import axios from 'axios';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Update API URL to use port 5000 instead of 5001
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Add a flag to control whether to use Firestore fallback
const USE_FIRESTORE_FALLBACK = true;

/**
 * Upload a user profile image and save user data
 * @param {Object} userData - User data object
 * @param {File} imageFile - Optional image file to upload
 * @returns {Promise<Object>} The user data response
 */
export const updateUserProfile = async (userData, imageFile) => {
  try {
    const formData = new FormData();

    // Add all user data to formData
    Object.keys(userData).forEach(key => {
      if (key === 'skills' && Array.isArray(userData[key])) {
        // Handle arrays properly
        formData.append(key, userData[key].join(','));
      } else {
        formData.append(key, userData[key]);
      }
    });

    // Add image if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const response = await axios.post(`${API_URL}/api/users/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);

    // Fallback to Firestore if enabled
    if (USE_FIRESTORE_FALLBACK && userData.uid) {
      try {
        console.log('Falling back to Firestore for user profile update');
        // Process any special fields (like arrays) before storing in Firestore
        const processedData = { ...userData };

        // Set updated timestamp
        processedData.updatedAt = new Date();

        // Handle image upload separately if needed (not implemented here)

        // Save to users collection
        const userRef = doc(db, 'users', userData.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          await updateDoc(userRef, processedData);
        } else {
          await setDoc(userRef, {
            ...processedData,
            createdAt: new Date()
          });
        }

        // Return the updated data
        const updatedDoc = await getDoc(userRef);
        return {
          success: true,
          user: {
            id: updatedDoc.id,
            ...updatedDoc.data()
          }
        };
      } catch (fallbackError) {
        console.error('Firestore fallback failed:', fallbackError);
      }
    }

    throw error;
  }
};

/**
 * Get user profile by UID
 * @param {string} uid - The user ID
 * @returns {Promise<Object>} The user data
 */
export const getUserProfile = async (uid) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/profile/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);

    // Fallback to Firestore if enabled
    if (USE_FIRESTORE_FALLBACK && uid) {
      try {
        console.log('Falling back to Firestore for user profile fetch');
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          return {
            success: true,
            user: {
              id: userDoc.id,
              ...userDoc.data()
            }
          };
        } else {
          throw new Error('User not found in Firestore');
        }
      } catch (fallbackError) {
        console.error('Firestore fallback failed:', fallbackError);
      }
    }

    throw error;
  }
};

/**
 * Upload an image (standalone function)
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<string>} The image URL
 */
export const uploadImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(`${API_URL}/api/users/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Preferences functions
export const updateUserPreferences = async (uid, preferences) => {
  try {
    const response = await axios.put(`${API_URL}/api/users/preferences/${uid}`, preferences);
    return response.data;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

// Contribution functions
export const addContribution = async (uid, contributionData) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/contributions/${uid}`, contributionData);
    return response.data;
  } catch (error) {
    console.error('Error adding contribution:', error);
    throw error;
  }
};

export const updateContribution = async (uid, contributionId, updateData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/users/contributions/${uid}/${contributionId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating contribution:', error);
    throw error;
  }
};

export const getUserContributions = async (uid) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/contributions/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user contributions:', error);
    throw error;
  }
};

// Saved Issues functions
export const saveIssue = async (uid, issueData) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/saved-issues/${uid}`, issueData);
    return response.data;
  } catch (error) {
    console.error('Error saving issue:', error);
    throw error;
  }
};

export const removeSavedIssue = async (uid, issueId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/users/saved-issues/${uid}/${issueId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing saved issue:', error);
    throw error;
  }
};

export const getSavedIssues = async (uid) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/saved-issues/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching saved issues:', error);
    throw error;
  }
};

// Chat Session functions
export const createChatSession = async (uid, title) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/chat-sessions/${uid}`, { title });
    return response.data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

export const addMessageToChatSession = async (uid, sessionId, messageData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/users/chat-sessions/${uid}/${sessionId}/messages`,
      messageData
    );
    return response.data;
  } catch (error) {
    console.error('Error adding message to chat session:', error);
    throw error;
  }
};

export const getChatSessions = async (uid) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/chat-sessions/${uid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    throw error;
  }
};

export const getChatSession = async (uid, sessionId) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/chat-sessions/${uid}/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat session:', error);
    throw error;
  }
};

// Activity Log functions
export const logUserActivity = async (uid, activityData) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/activity/${uid}`, activityData);
    return response.data;
  } catch (error) {
    console.error('Error logging user activity:', error);
    throw error;
  }
};

export const getUserActivityLogs = async (uid, options = {}) => {
  try {
    const { limit, type } = options;
    let url = `${API_URL}/api/users/activity/${uid}`;

    // Add query parameters if provided
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (type) params.append('type', type);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    throw error;
  }
};

/**
 * Sync GitHub skills from user's GitHub profile
 * @param {string} uid - The user ID
 * @param {string} githubToken - Optional GitHub token for authenticated requests
 * @param {boolean} mergeWithSkills - Whether to merge GitHub languages with existing skills
 * @returns {Promise<Object>} The synced GitHub languages
 */
export const syncGitHubSkills = async (uid, githubToken = null, mergeWithSkills = false) => {
  try {
    let url = `${API_URL}/api/users/sync-github-skills/${uid}`;

    // Add query parameter for merging with skills if needed
    if (mergeWithSkills) {
      url += '?mergeWithSkills=true';
    }

    const response = await axios.post(url, { githubToken });
    return response.data;
  } catch (error) {
    console.error('Error syncing GitHub skills:', error);
    throw error;
  }
};

/**
 * Get personalized GitHub issues based on user's skills or GitHub languages
 * @param {string} uid - The user ID
 * @param {Object} options - Options for fetching issues
 * @param {boolean} options.preferGithub - Whether to prefer GitHub languages over manual skills
 * @param {number} options.page - Page number for pagination
 * @param {number} options.perPage - Number of issues per page
 * @returns {Promise<Object>} Personalized issues and metadata
 */
export const getPersonalizedIssues = async (uid, options = {}) => {
  try {
    const { preferGithub = true, page = 1, perPage = 10 } = options;

    let url = `${API_URL}/api/users/personalized-issues/${uid}?`;

    // Add query parameters
    const params = new URLSearchParams();
    params.append('preferGithub', preferGithub);
    params.append('page', page);
    params.append('perPage', perPage);

    url += params.toString();

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching personalized issues:', error);
    throw error;
  }
}; 