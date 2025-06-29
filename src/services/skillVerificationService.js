/**
 * Service for handling skill verification data and storing quiz attempts
 */

import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  collection, 
  addDoc, 
  arrayUnion, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  getDocs
} from 'firebase/firestore';

/**
 * Add a verified skill to a user's profile
 * @param {string} userId - User ID
 * @param {string} skill - Skill name
 * @returns {Promise<void>}
 */
export async function addVerifiedSkill(userId, skill) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      verifiedSkills: arrayUnion(skill),
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error adding verified skill:', error);
    throw error;
  }
}

/**
 * Get a user's verified skills
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of verified skills
 */
export async function getVerifiedSkills(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().verifiedSkills || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting verified skills:', error);
    throw error;
  }
}

/**
 * Save a quiz attempt in the database
 * @param {Object} attemptData - Quiz attempt data
 * @param {string} attemptData.userId - User ID
 * @param {string} attemptData.skill - Skill name
 * @param {number} attemptData.score - Quiz score
 * @param {boolean} attemptData.passed - Whether the quiz was passed
 * @param {Array} attemptData.questions - Quiz questions
 * @param {Array} attemptData.selectedOptions - Selected options
 * @returns {Promise<string>} - ID of the created document
 */
export async function saveQuizAttempt(attemptData) {
  try {
    const quizAttemptsRef = collection(db, 'skillQuizAttempts');
    const docRef = await addDoc(quizAttemptsRef, {
      ...attemptData,
      timestamp: Timestamp.now()
    });
    
    //jhhjvbj
    return docRef.id;
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }
}

/**
 * Get a user's quiz attempts for a specific skill
 * @param {string} userId - User ID
 * @param {string} skill - Skill name (optional, if not provided returns all attempts)
 * @param {number} limit - Maximum number of attempts to return (default: 10)
 * @returns {Promise<Array>} - Array of quiz attempts
 */
export async function getQuizAttempts(userId, skill = null, attemptLimit = 10) {
  try {
    let q;
    
    if (skill) {
      q = query(
        collection(db, 'skillQuizAttempts'),
        where('userId', '==', userId),
        where('skill', '==', skill),
        orderBy('timestamp', 'desc'),
        limit(attemptLimit)
      );
    } else {
      q = query(
        collection(db, 'skillQuizAttempts'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(attemptLimit)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting quiz attempts:', error);
    throw error;
  }
}

/**
 * Check if a user has already verified a skill
 * @param {string} userId - User ID
 * @param {string} skill - Skill name
 * @returns {Promise<boolean>} - Whether the skill is verified
 */
export async function isSkillVerified(userId, skill) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const verifiedSkills = userDoc.data().verifiedSkills || [];
      return verifiedSkills.includes(skill);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if skill is verified:', error);
    throw error;
  }
}

/**
 * Initialize the verified skills array for a user if it doesn't exist
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function initializeVerifiedSkills(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (!userData.verifiedSkills) {
        await updateDoc(userRef, {
          verifiedSkills: []
        });
      }
    } else {
      // User document doesn't exist, create it
      await setDoc(userRef, {
        verifiedSkills: [],
        createdAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error initializing verified skills:', error);
    throw error;
  }
}

export default {
  addVerifiedSkill,
  getVerifiedSkills,
  saveQuizAttempt,
  getQuizAttempts,
  isSkillVerified,
  initializeVerifiedSkills
}; 