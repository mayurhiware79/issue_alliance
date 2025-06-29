import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where, 
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

/**
 * Fetches leaderboard data from Firestore
 * @param {number} limitCount - Number of entries to fetch (default: 10)
 * @param {string} period - Time period to filter by (all, week, month)
 * @returns {Promise<Array>} - Leaderboard entries
 */
export const fetchLeaderboardData = async (limitCount = 10, period = 'all') => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    let leaderboardQuery;

    // Apply time filter if needed
    if (period === 'week') {
      // Get data from the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      leaderboardQuery = query(
        leaderboardRef,
        where('timestamp', '>=', Timestamp.fromDate(oneWeekAgo)),
        orderBy('timestamp', 'desc'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
    } else if (period === 'month') {
      // Get data from the last 30 days
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      leaderboardQuery = query(
        leaderboardRef,
        where('timestamp', '>=', Timestamp.fromDate(oneMonthAgo)),
        orderBy('timestamp', 'desc'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
    } else {
      // Get all-time data
      leaderboardQuery = query(
        leaderboardRef,
        orderBy('score', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(leaderboardQuery);
    
    const leaderboard = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        rank: index + 1,
        displayName: data.displayName || 'Anonymous User',
        photoURL: data.photoURL || '/default-avatar.png',
        score: data.score || 0,
        achievements: data.achievements || [],
        timestamp: data.timestamp?.toDate() || new Date(),
        userId: data.userId || '',
        isCurrentUser: data.userId === auth.currentUser?.uid
      };
    });

    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    // Return fallback data in case of error
    return generateFallbackLeaderboardData(limitCount);
  }
};

/**
 * Updates a user's leaderboard score
 * @param {number} score - New score to set or add
 * @param {boolean} isIncrement - Whether to increment or set the score
 * @returns {Promise<void>}
 */
export const updateUserScore = async (score, isIncrement = true) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No authenticated user found');

    // Find current user entry in leaderboard
    const leaderboardRef = collection(db, 'leaderboard');
    const userQuery = query(
      leaderboardRef,
      where('userId', '==', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      // User not in leaderboard yet, create new entry
      await addDoc(leaderboardRef, {
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous User',
        photoURL: currentUser.photoURL || '/default-avatar.png',
        score: score,
        achievements: [],
        timestamp: serverTimestamp()
      });
    } else {
      // User exists in leaderboard, update their score
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      await updateDoc(doc(db, 'leaderboard', userDoc.id), {
        score: isIncrement ? (userData.score || 0) + score : score,
        timestamp: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard score:', error);
    throw error;
  }
};

/**
 * Adds an achievement to a user's leaderboard entry
 * @param {string} achievement - Achievement title/description
 * @param {number} bonusPoints - Optional bonus points for this achievement
 * @returns {Promise<void>}
 */
export const addUserAchievement = async (achievement, bonusPoints = 0) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No authenticated user found');

    // Find current user entry in leaderboard
    const leaderboardRef = collection(db, 'leaderboard');
    const userQuery = query(
      leaderboardRef,
      where('userId', '==', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      // User not in leaderboard yet, create new entry with achievement
      await addDoc(leaderboardRef, {
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous User',
        photoURL: currentUser.photoURL || '/default-avatar.png',
        score: bonusPoints,
        achievements: [{ title: achievement, timestamp: new Date() }],
        timestamp: serverTimestamp()
      });
    } else {
      // User exists in leaderboard, update their achievements and score if bonus points
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      const newAchievements = [...(userData.achievements || []), {
        title: achievement,
        timestamp: new Date()
      }];
      
      const updates = {
        achievements: newAchievements,
        timestamp: serverTimestamp()
      };
      
      // Add bonus points if specified
      if (bonusPoints > 0) {
        updates.score = (userData.score || 0) + bonusPoints;
      }
      
      await updateDoc(doc(db, 'leaderboard', userDoc.id), updates);
    }
  } catch (error) {
    console.error('Error adding user achievement:', error);
    throw error;
  }
};

/**
 * Clears the entire leaderboard or specific entries (admin function)
 * @param {string} userId - Optional specific user ID to clear
 * @returns {Promise<boolean>} - Success status
 */
export const clearLeaderboard = async (userId = null) => {
  try {
    // Check if user is an admin
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('No authenticated user found');
    
    // In a real app, you would check admin status from a separate collection
    // This is a placeholder for demonstration - in production, implement proper role-based checks
    // For example, checking if the user's UID is in an admins collection
    const isAdmin = await checkUserIsAdmin(currentUser.uid);
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin privileges required to clear leaderboard');
    }
    
    const leaderboardRef = collection(db, 'leaderboard');
    let leaderboardQuery;
    
    if (userId) {
      // Delete specific user's leaderboard entry
      leaderboardQuery = query(
        leaderboardRef,
        where('userId', '==', userId)
      );
    } else {
      // Delete all leaderboard entries
      leaderboardQuery = query(leaderboardRef);
    }
    
    const querySnapshot = await getDocs(leaderboardQuery);
    
    if (querySnapshot.empty) {
      console.log('No leaderboard entries to delete');
      return true;
    }
    
    // Delete each document
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    
    console.log(`Successfully cleared ${querySnapshot.size} leaderboard entries`);
    return true;
  } catch (error) {
    console.error('Error clearing leaderboard:', error);
    return false;
  }
};

/**
 * Check if a user has admin privileges
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} - Whether user is admin
 */
const checkUserIsAdmin = async (userId) => {
  try {
    // In a real application, you would check this against a Firestore collection
    // This is a simplified example
    const adminRef = doc(db, 'admins', userId);
    const adminDoc = await getDocs(adminRef);
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Generate fallback leaderboard data for testing or when DB access fails
 * @param {number} count - Number of entries to generate
 * @returns {Array} - Generated leaderboard data
 */
const generateFallbackLeaderboardData = (count = 10) => {
  const leaderboard = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Generate random dates within the last month
    const daysAgo = Math.floor(Math.random() * 30);
    const entryDate = new Date(now);
    entryDate.setDate(entryDate.getDate() - daysAgo);
    
    leaderboard.push({
      id: `sample-${i}`,
      rank: i + 1,
      displayName: `User ${i + 1}`,
      photoURL: '/default-avatar.png',
      score: 1000 - (i * 50) + Math.floor(Math.random() * 20),
      achievements: [
        { title: 'Joined the platform', timestamp: entryDate },
        { title: 'Completed first task', timestamp: entryDate }
      ],
      timestamp: entryDate,
      userId: `sample-user-${i}`,
      isCurrentUser: i === 0 // Make the top user the current user
    });
  }
  
  return leaderboard;
}; 