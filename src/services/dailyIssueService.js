import { fetchRandomIssue } from './githubService';
import { db } from '../firebase';
import { 
  doc, 
  collection, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';

/**
 * Fetch a new daily issue and store it in Firebase
 * @returns {Promise<Object>} The daily issue data
 */
export async function fetchAndStoreDailyIssue() {
  try {
    // Fetch a random issue from GitHub
    const randomIssue = await fetchRandomIssue();
    
    if (!randomIssue) {
      throw new Error('Failed to fetch random issue from GitHub');
    }
    
    // Create a document in dailyIssues collection
    const dailyIssueRef = doc(collection(db, 'dailyIssues'));
    
    // Add the issue to Firestore
    await setDoc(dailyIssueRef, {
      id: randomIssue.id,
      title: randomIssue.title,
      number: randomIssue.number,
      html_url: randomIssue.html_url,
      repository_url: randomIssue.repository_url,
      repository_html_url: randomIssue.repository_html_url || '',
      created_at: randomIssue.created_at,
      updated_at: randomIssue.updated_at,
      state: randomIssue.state,
      labels: randomIssue.labels || [],
      repository: randomIssue.repository || {},
      body: randomIssue.body || '',
      date: Timestamp.now(),
      active: true
    });
    
    return {
      ...randomIssue,
      dailyIssueId: dailyIssueRef.id
    };
  } catch (error) {
    console.error('Error in fetchAndStoreDailyIssue:', error);
    throw error;
  }
}

/**
 * Get the current day's issue or create one if it doesn't exist
 * @returns {Promise<Object|null>} The current daily issue or null if not found
 */
export async function getCurrentDailyIssue() {
  try {
    // Get the current date at midnight
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    // First query just for active issues from today without using complex indices
    const dailyIssuesRef = collection(db, 'dailyIssues');
    const q = query(
      dailyIssuesRef,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<', Timestamp.fromDate(endOfDay))
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No daily issue found for today. Generating a new one...');
      // Create a new daily issue if one doesn't exist
      try {
        const newIssue = await fetchAndStoreDailyIssue();
        return newIssue;
      } catch (fetchError) {
        console.error('Error generating new daily issue:', fetchError);
        return null;
      }
    }
    
    // Filter for active issues in JavaScript instead of using an additional where clause
    const activeIssues = querySnapshot.docs.filter(doc => doc.data().active === true);
    
    if (activeIssues.length === 0) {
      // No active issues for today, try to activate the first one or create new
      if (querySnapshot.docs.length > 0) {
        try {
          const firstIssue = querySnapshot.docs[0];
          const issueRef = doc(db, 'dailyIssues', firstIssue.id);
          await updateDoc(issueRef, { active: true });
          
          return {
            ...firstIssue.data(),
            active: true,
            dailyIssueId: firstIssue.id
          };
        } catch (updateError) {
          console.error('Error activating existing issue:', updateError);
        }
      }
      
      // If we still don't have an issue, create a new one
      try {
        console.log('No active daily issue found for today. Generating a new one...');
        const newIssue = await fetchAndStoreDailyIssue();
        return newIssue;
      } catch (fetchError) {
        console.error('Error generating new daily issue:', fetchError);
        return null;
      }
    }
    
    // Take the first active issue
    const issueDoc = activeIssues[0];
    return {
      ...issueDoc.data(),
      dailyIssueId: issueDoc.id
    };
  } catch (error) {
    console.error('Error in getCurrentDailyIssue:', error);
    
    // If there's an index error, try creating a new issue directly
    if (error.message && error.message.includes('requires an index')) {
      try {
        console.log('Index error caught. Generating a new daily issue directly...');
        const newIssue = await fetchAndStoreDailyIssue();
        return newIssue;
      } catch (fetchError) {
        console.error('Error generating new daily issue after index error:', fetchError);
      }
    }
    
    throw error;
  }
}

/**
 * Get all previous daily issues
 * @returns {Promise<Array>} Array of previous daily issues
 */
export async function getPreviousDailyIssues() {
  try {
    // Get the current date at midnight
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Query for all issues
    const dailyIssuesRef = collection(db, 'dailyIssues');
    
    // Simplified query - let's just get all issues and filter in JavaScript
    const querySnapshot = await getDocs(dailyIssuesRef);
    
    // Filter for issues before today and sort them
    const previousIssues = querySnapshot.docs
      .map(doc => ({
        ...doc.data(),
        dailyIssueId: doc.id
      }))
      .filter(issue => {
        // Convert Firestore timestamp to JS Date
        const issueDate = issue.date.toDate();
        
        // Only include issues that:
        // 1. Have a valid date
        // 2. Are before today (previous challenges)
        // 3. Are not in the future (this fixes potential data issues)
        return issueDate && 
               issueDate < startOfDay &&
               issueDate <= now;
      })
      // Sort by date descending (most recent first)
      .sort((a, b) => b.date.toDate() - a.date.toDate())
      // Only include one issue per day to avoid duplicates
      .reduce((uniqueIssues, issue) => {
        const issueDate = issue.date.toDate();
        const dateKey = `${issueDate.getFullYear()}-${issueDate.getMonth()}-${issueDate.getDate()}`;
        
        if (!uniqueIssues.some(ui => {
          const uiDate = ui.date.toDate();
          const uiDateKey = `${uiDate.getFullYear()}-${uiDate.getMonth()}-${uiDate.getDate()}`;
          return uiDateKey === dateKey;
        })) {
          uniqueIssues.push(issue);
        }
        return uniqueIssues;
      }, []);
    
    // Return only true previous daily challenges - one per day
    return previousIssues;
  } catch (error) {
    console.error('Error in getPreviousDailyIssues:', error);
    throw error;
  }
}

/**
 * Mark a daily issue as completed for a user
 * @param {string} userId - The user's ID
 * @param {string} dailyIssueId - The daily issue ID
 * @returns {Promise<Object>} Updated user's daily issue data
 */
export async function markDailyIssueCompleted(userId, dailyIssueId) {
  try {
    // Get user's daily issues document
    const userDailyIssuesRef = doc(db, 'userDailyIssues', userId);
    const userDailyIssuesDoc = await getDoc(userDailyIssuesRef);
    
    let currentStreak = 0;
    let totalPoints = 0;
    let completedIssues = [];
    
    if (userDailyIssuesDoc.exists()) {
      const userData = userDailyIssuesDoc.data();
      currentStreak = userData.currentStreak || 0;
      totalPoints = userData.totalPoints || 0;
      completedIssues = userData.completedIssues || [];
    }
    
    // Check if this issue was already completed
    const alreadyCompleted = completedIssues.some(issue => issue.dailyIssueId === dailyIssueId);
    
    if (alreadyCompleted) {
      return {
        success: false,
        message: 'This issue has already been completed'
      };
    }
    
    // Get the daily issue to check if it's today's issue
    const dailyIssueRef = doc(db, 'dailyIssues', dailyIssueId);
    const dailyIssueDoc = await getDoc(dailyIssueRef);
    
    if (!dailyIssueDoc.exists()) {
      throw new Error('Daily issue not found');
    }
    
    const dailyIssue = dailyIssueDoc.data();
    const issueDate = dailyIssue.date.toDate();
    const today = new Date();
    
    // Check if issue date is today
    const isToday = 
      issueDate.getDate() === today.getDate() &&
      issueDate.getMonth() === today.getMonth() &&
      issueDate.getFullYear() === today.getFullYear();
    
    // Only award points if it's today's issue
    if (isToday) {
      currentStreak += 1;
      totalPoints += 10;
    }
    
    // Add to completed issues
    completedIssues.push({
      dailyIssueId,
      completedAt: Timestamp.now(),
      pointsAwarded: isToday ? 10 : 0
    });
    
    // Update user daily issues document
    await setDoc(userDailyIssuesRef, {
      userId,
      currentStreak,
      totalPoints,
      completedIssues,
      lastCompletedAt: Timestamp.now()
    }, { merge: true });
    
    // Update user badges based on streak
    await updateUserBadges(userId, currentStreak);
    
    // Update userStats collection for leaderboard
    await updateUserStats(userId, currentStreak, totalPoints, completedIssues.length);
    
    return {
      success: true,
      currentStreak,
      totalPoints,
      pointsAwarded: isToday ? 10 : 0
    };
  } catch (error) {
    console.error('Error in markDailyIssueCompleted:', error);
    throw error;
  }
}

/**
 * Update user badges based on their streak
 * @param {string} userId - The user's ID
 * @param {number} currentStreak - The user's current streak
 * @returns {Promise<void>}
 */
async function updateUserBadges(userId, currentStreak) {
  try {
    const badgesToCheck = [
      { 
        days: 1, 
        id: 'day_1', 
        name: 'First Day', 
        description: 'Completed daily issues for 1 day',
        imagePath: '/images/badges/3d/day1-3d-badge.svg' 
      },
      { 
        days: 2, 
        id: 'day_2', 
        name: '2 Day Streak', 
        description: 'Completed daily issues for 2 days',
        imagePath: '/images/badges/3d/day2-3d-badge.svg' 
      },
      { 
        days: 3, 
        id: 'day_3', 
        name: '3 Day Streak', 
        description: 'Completed daily issues for 3 days',
        imagePath: '/images/badges/3d/day3-3d-badge.svg' 
      },
      { 
        days: 7, 
        id: 'day_7', 
        name: '7 Day Streak', 
        description: 'Completed daily issues for 7 days',
        imagePath: '/images/badges/day7-badge.svg' 
      },
      { 
        days: 14, 
        id: 'day_14', 
        name: '2 Week Streak', 
        description: 'Completed daily issues for 14 days',
        imagePath: '/images/badges/day14-badge.svg' 
      },
      { 
        days: 30, 
        id: 'day_30', 
        name: '30 Day Streak', 
        description: 'Completed daily issues for 30 days',
        imagePath: '/images/badges/day30-badge.svg' 
      },
      { 
        days: 50, 
        id: 'day_50', 
        name: '50 Day Streak', 
        description: 'Completed daily issues for 50 days',
        imagePath: '/images/badges/day50-badge.svg' 
      },
      { 
        days: 100, 
        id: 'day_100', 
        name: '100 Day Streak', 
        description: 'Completed daily issues for 100 days',
        imagePath: '/images/badges/day100-badge.svg' 
      },
    ];
    
    // Get user badges
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }
    
    const userData = userDoc.data();
    const userBadges = userData.badges || [];
    
    // Check which badges user should receive
    const newBadges = [];
    
    for (const badge of badgesToCheck) {
      if (currentStreak >= badge.days) {
        // Check if user already has this badge
        const hasBadge = userBadges.some(b => b.id === badge.id);
        
        if (!hasBadge) {
          newBadges.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            imagePath: badge.imagePath,
            awardedAt: Timestamp.now()
          });
        }
      }
    }
    
    // If there are new badges, update user document
    if (newBadges.length > 0) {
      await updateDoc(userRef, {
        badges: [...userBadges, ...newBadges]
      });
    }
  } catch (error) {
    console.error('Error in updateUserBadges:', error);
    throw error;
  }
}

/**
 * Check if a user has viewed a daily issue
 * @param {string} userId - The user's ID
 * @param {string} dailyIssueId - The daily issue ID
 * @returns {Promise<void>}
 */
export async function trackIssueView(userId, dailyIssueId) {
  try {
    const userIssueViewsRef = doc(db, 'userIssueViews', `${userId}_${dailyIssueId}`);
    
    await setDoc(userIssueViewsRef, {
      userId,
      dailyIssueId,
      viewedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error in trackIssueView:', error);
    throw error;
  }
}

/**
 * Get user's daily issue stats
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User's daily issue stats
 */
export async function getUserDailyIssueStats(userId) {
  try {
    const userDailyIssuesRef = doc(db, 'userDailyIssues', userId);
    const userDailyIssuesDoc = await getDoc(userDailyIssuesRef);
    
    if (!userDailyIssuesDoc.exists()) {
      return {
        currentStreak: 0,
        totalPoints: 0,
        totalCompleted: 0,
        badges: []
      };
    }
    
    const userData = userDailyIssuesDoc.data();
    
    // Get user badges
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const badges = userDoc.exists() ? (userDoc.data().badges || []) : [];
    
    return {
      currentStreak: userData.currentStreak || 0,
      totalPoints: userData.totalPoints || 0,
      totalCompleted: (userData.completedIssues || []).length,
      badges
    };
  } catch (error) {
    console.error('Error in getUserDailyIssueStats:', error);
    throw error;
  }
}

/**
 * Update user stats in userStats collection for the leaderboard
 * @param {string} userId - The user's ID
 * @param {number} streak - Current streak
 * @param {number} points - Total points
 * @param {number} completedCount - Number of completed issues
 * @returns {Promise<void>}
 */
async function updateUserStats(userId, streak, points, completedCount) {
  try {
    // First get the user's basic info
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn('User document not found when updating userStats');
      return;
    }
    
    const userData = userDoc.data();
    
    // Update the userStats document
    const userStatsRef = doc(db, 'userStats', userId);
    
    await setDoc(userStatsRef, {
      uid: userId,
      displayName: userData.displayName || 'Anonymous User',
      photoURL: userData.photoURL || null,
      email: userData.email || null,
      streak: streak,
      points: points,
      completedIssues: completedCount,
      lastUpdated: Timestamp.now()
    }, { merge: true });
    
    console.log('Updated userStats for leaderboard:', userId);
  } catch (error) {
    console.error('Error updating userStats:', error);
    // Don't throw here to prevent affecting the main operation
  }
}

/**
 * Sync user daily issues data to userStats collection for leaderboard
 * This ensures all existing daily coding data is reflected in the leaderboard
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} Success status
 */
export async function syncUserStatsForLeaderboard(userId) {
  try {
    // Get user's daily issues document
    const userDailyIssuesRef = doc(db, 'userDailyIssues', userId);
    const userDailyIssuesDoc = await getDoc(userDailyIssuesRef);
    
    if (!userDailyIssuesDoc.exists()) {
      // No daily issues data for this user
      return false;
    }
    
    // Get the data from userDailyIssues
    const dailyIssuesData = userDailyIssuesDoc.data();
    const currentStreak = dailyIssuesData.currentStreak || 0;
    const totalPoints = dailyIssuesData.totalPoints || 0;
    const completedIssues = (dailyIssuesData.completedIssues || []).length;
    
    // Update userStats collection
    await updateUserStats(userId, currentStreak, totalPoints, completedIssues);
    
    return true;
  } catch (error) {
    console.error('Error syncing user stats for leaderboard:', error);
    return false;
  }
}

/**
 * Verify user data consistency across collections and sync if needed
 * This function checks that both userDailyIssues and userStats collections
 * have consistent data for the user, and fixes any inconsistencies
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Verification results with status
 */
export async function verifyUserDataConsistency(userId) {
  try {
    let result = {
      userDailyIssuesExists: false,
      userStatsExists: false,
      consistent: false,
      syncPerformed: false,
      userDailyIssuesData: null,
      userStatsData: null
    };
    
    // Check userDailyIssues collection
    const userDailyIssuesRef = doc(db, 'userDailyIssues', userId);
    const userDailyIssuesDoc = await getDoc(userDailyIssuesRef);
    
    if (userDailyIssuesDoc.exists()) {
      result.userDailyIssuesExists = true;
      result.userDailyIssuesData = userDailyIssuesDoc.data();
    }
    
    // Check userStats collection
    const userStatsRef = doc(db, 'userStats', userId);
    const userStatsDoc = await getDoc(userStatsRef);
    
    if (userStatsDoc.exists()) {
      result.userStatsExists = true;
      result.userStatsData = userStatsDoc.data();
    }
    
    // Check consistency if both exist
    if (result.userDailyIssuesExists && result.userStatsExists) {
      const dailyData = result.userDailyIssuesData;
      const statsData = result.userStatsData;
      
      // Check if points and streak match
      const pointsMatch = dailyData.totalPoints === statsData.points;
      const streakMatch = dailyData.currentStreak === statsData.streak;
      const completedMatch = 
        (dailyData.completedIssues?.length || 0) === statsData.completedIssues;
      
      result.consistent = pointsMatch && streakMatch && completedMatch;
      
      // If not consistent, sync the data
      if (!result.consistent) {
        await updateUserStats(
          userId, 
          dailyData.currentStreak || 0, 
          dailyData.totalPoints || 0, 
          (dailyData.completedIssues || []).length
        );
        result.syncPerformed = true;
      }
    } 
    // If only userDailyIssues exists, create userStats
    else if (result.userDailyIssuesExists && !result.userStatsExists) {
      await syncUserStatsForLeaderboard(userId);
      result.syncPerformed = true;
    }
    // If only userStats exists but no userDailyIssues, create empty userDailyIssues
    else if (!result.userDailyIssuesExists && result.userStatsExists) {
      // Get user document for additional user info
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Create empty userDailyIssues document with stats from userStats
        await setDoc(userDailyIssuesRef, {
          userId,
          currentStreak: result.userStatsData.streak || 0,
          totalPoints: result.userStatsData.points || 0,
          completedIssues: [],
          lastCompletedAt: Timestamp.now()
        });
        
        result.syncPerformed = true;
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Error verifying user data consistency:', error);
    return {
      error: error.message,
      consistent: false,
      syncPerformed: false
    };
  }
} 