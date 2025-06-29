import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection references
const threadsCollection = collection(db, 'threads');
const answersCollection = collection(db, 'answers');

// Helper function to safely get Date objects from Firebase data
const getDateFromField = (field) => {
  if (!field) return new Date(0);
  
  // Handle Firebase Timestamp objects
  if (field.toDate && typeof field.toDate === 'function') {
    return field.toDate();
  }
  
  // Handle ISO strings or other date formats
  return new Date(field);
};

// Get all threads
export const getAllThreads = async () => {
  try {
    // Use a simple query without complex sorting that requires indexes
    const querySnapshot = await getDocs(threadsCollection);
    
    // Get all threads and sort them on the client side (newest first)
    const threads = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by creation date (newest first) on client side
    return threads.sort((a, b) => {
      const dateA = getDateFromField(a.createdAt);
      const dateB = getDateFromField(b.createdAt);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting threads:', error);
    throw error;
  }
};

// Get threads by category
export const getThreadsByCategory = async (category) => {
  try {
    console.log(`Fetching threads for category: "${category}"`);
    
    if (!category) {
      console.error('Invalid category provided');
      return [];
    }
    
    // Use a simple query without complex sorting that requires indexes
    const threadsCollection = collection(db, 'threads');
    
    // Use a direct query for exact category match first
    const exactQuery = query(threadsCollection, where('category', '==', category));
    const exactSnapshot = await getDocs(exactQuery);
    
    let threadResults = [];
    
    if (exactSnapshot.size > 0) {
      // We found threads with exact category match
      console.log(`Found ${exactSnapshot.size} threads with exact category match: "${category}"`);
      threadResults = exactSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        category: category // Normalize to ensure consistent casing
      }));
    } else {
      // If no exact match, try case-insensitive matching
      console.log(`No exact matches for category "${category}", trying case-insensitive search`);
      
      // Get all threads and filter on client
      const allThreadsSnapshot = await getDocs(threadsCollection);
      
      const categoryLower = category.toLowerCase();
      
      // Filter by case-insensitive category match
      threadResults = allThreadsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(thread => {
          // Log each thread for debugging
          console.log(`Checking thread "${thread.title}": category="${thread.category}"`);
          
          if (!thread.category) return false;
          
          const threadCategory = thread.category.toLowerCase();
          const isMatch = threadCategory === categoryLower;
          
          console.log(`  > Thread category: "${threadCategory}", Target: "${categoryLower}", Match: ${isMatch}`);
          
          return isMatch;
        })
        .map(thread => ({
          ...thread,
          category: category // Normalize to ensure consistent casing
        }));
      
      console.log(`Found ${threadResults.length} threads after case-insensitive filtering`);
    }
    
    // List all threads found
    if (threadResults.length > 0) {
      console.log("Threads found for category:", category);
      threadResults.forEach(thread => {
        console.log(`- "${thread.title}" (category: "${thread.category}")`);
      });
    } else {
      console.log(`No threads found for category: "${category}"`);
    }
    
    // Sort by creation date (newest first) on client side
    return threadResults.sort((a, b) => {
      const dateA = getDateFromField(a.createdAt);
      const dateB = getDateFromField(b.createdAt);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting threads by category:', error);
    throw error;
  }
};

// Get threads by popularity
export const getPopularThreads = async () => {
  try {
    // Use a simple query without complex sorting that requires indexes
    const querySnapshot = await getDocs(threadsCollection);
    
    // Get all threads and sort them on the client side
    const threads = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually by votes (highest first) then by createdAt (newest first)
    const sortedThreads = threads.sort((a, b) => {
      // First by votes (descending)
      if ((b.votes || 0) !== (a.votes || 0)) {
        return (b.votes || 0) - (a.votes || 0);
      }
      
      // Then by creation date (descending - newer first)
      const dateA = getDateFromField(a.createdAt);
      const dateB = getDateFromField(b.createdAt);
      return dateB - dateA;
    });
    
    return sortedThreads;
  } catch (error) {
    console.error('Error getting popular threads:', error);
    throw error;
  }
};

// Get a single thread by ID
export const getThread = async (threadId) => {
  try {
    const threadDoc = await getDoc(doc(threadsCollection, threadId));
    
    if (!threadDoc.exists()) {
      throw new Error('Thread not found');
    }
    
    const threadData = {
      id: threadDoc.id,
      ...threadDoc.data()
    };
    
    // Get answers for this thread - using simpler query
    const answersQuerySnapshot = await getDocs(
      query(
        answersCollection,
        where('threadId', '==', threadId)
        // Removed complex ordering that requires composite indexes
      )
    );
    
    const answersRaw = answersQuerySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort answers manually on client side
    const answers = answersRaw.sort((a, b) => {
      // First sort by isAccepted (true comes before false)
      if (a.isAccepted !== b.isAccepted) {
        return a.isAccepted ? -1 : 1;
      }
      
      // Then sort by votes (higher first)
      if (a.votes !== b.votes) {
        return (b.votes || 0) - (a.votes || 0);
      }
      
      // Finally sort by creation date (oldest first)
      const dateA = getDateFromField(a.createdAt);
      const dateB = getDateFromField(b.createdAt);
      return dateA - dateB;
    });
    
    return {
      ...threadData,
      answers
    };
  } catch (error) {
    console.error('Error getting thread:', error);
    throw error;
  }
};

// Create a new thread
export const createThread = async (threadData, userId) => {
  try {
    const newThread = {
      ...threadData,
      authorId: userId,
      votes: 0,
      answerCount: 0,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(threadsCollection, newThread);
    return {
      id: docRef.id,
      ...newThread
    };
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

// Update thread view count
export const incrementThreadView = async (threadId) => {
  try {
    const threadRef = doc(threadsCollection, threadId);
    await updateDoc(threadRef, {
      views: increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error incrementing thread view:', error);
    throw error;
  }
};

// Vote on a thread
export const voteOnThread = async (threadId, voteType, userId) => {
  try {
    const threadRef = doc(threadsCollection, threadId);
    const threadDoc = await getDoc(threadRef);
    
    if (!threadDoc.exists()) {
      throw new Error('Thread not found');
    }
    
    const threadData = threadDoc.data();
    const voters = threadData.voters || [];
    
    // Check if user already voted
    if (voters.includes(userId)) {
      return {
        voteValue: 0,
        updatedThread: {
          id: threadDoc.id,
          ...threadData
        },
        alreadyVoted: true
      };
    }
    
    const value = voteType === 'up' ? 1 : -1;
    
    // Update the thread with the new vote and add user to voters
    await updateDoc(threadRef, {
      votes: increment(value),
      voters: [...voters, userId],
      updatedAt: serverTimestamp()
    });
    
    // Get the updated thread to return with the new vote count
    const updatedThreadDoc = await getDoc(threadRef);
    if (!updatedThreadDoc.exists()) {
      throw new Error('Thread not found after update');
    }
    
    const updatedThread = {
      id: updatedThreadDoc.id,
      ...updatedThreadDoc.data()
    };
    
    return {
      voteValue: value,
      updatedThread: updatedThread,
      alreadyVoted: false
    };
  } catch (error) {
    console.error('Error voting on thread:', error);
    throw error;
  }
};

// Vote on an answer
export const voteOnAnswer = async (answerId, voteType, userId) => {
  try {
    const answerRef = doc(answersCollection, answerId);
    const answerDoc = await getDoc(answerRef);
    
    if (!answerDoc.exists()) {
      throw new Error('Answer not found');
    }
    
    const answerData = answerDoc.data();
    const voters = answerData.voters || [];
    
    // Check if user already voted
    if (voters.includes(userId)) {
      return {
        voteValue: 0,
        alreadyVoted: true
      };
    }
    
    const value = voteType === 'up' ? 1 : -1;
    
    // Update the answer with the new vote and add user to voters
    await updateDoc(answerRef, {
      votes: increment(value),
      voters: [...voters, userId],
      updatedAt: serverTimestamp()
    });
    
    // Get the updated answer
    const updatedAnswerDoc = await getDoc(answerRef);
    const updatedAnswer = {
      id: updatedAnswerDoc.id,
      ...updatedAnswerDoc.data()
    };
    
    return {
      voteValue: value,
      updatedAnswer: updatedAnswer,
      alreadyVoted: false
    };
  } catch (error) {
    console.error('Error voting on answer:', error);
    throw error;
  }
};

// Check if user has voted on a thread
export const hasUserVotedOnThread = async (threadId, userId) => {
  try {
    const threadRef = doc(threadsCollection, threadId);
    const threadDoc = await getDoc(threadRef);
    
    if (!threadDoc.exists()) {
      return false;
    }
    
    const threadData = threadDoc.data();
    const voters = threadData.voters || [];
    
    return voters.includes(userId);
  } catch (error) {
    console.error('Error checking if user voted on thread:', error);
    throw error;
  }
}

// Check if user has voted on an answer
export const hasUserVotedOnAnswer = async (answerId, userId) => {
  try {
    const answerRef = doc(answersCollection, answerId);
    const answerDoc = await getDoc(answerRef);
    
    if (!answerDoc.exists()) {
      return false;
    }
    
    const answerData = answerDoc.data();
    const voters = answerData.voters || [];
    
    return voters.includes(userId);
  } catch (error) {
    console.error('Error checking if user voted on answer:', error);
    throw error;
  }
}

// Add an answer to a thread
export const addAnswer = async (threadId, answerData, userId) => {
  try {
    // Create the answer
    const newAnswer = {
      ...answerData,
      threadId,
      authorId: userId,
      votes: 0,
      isAccepted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const answerDocRef = await addDoc(answersCollection, newAnswer);
    
    // Update answer count in thread
    const threadRef = doc(threadsCollection, threadId);
    await updateDoc(threadRef, {
      answerCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Get latest thread data after update
    const updatedThreadDoc = await getDoc(threadRef);
    const updatedThread = { 
      id: updatedThreadDoc.id, 
      ...updatedThreadDoc.data() 
    };
    
    return {
      answer: {
        id: answerDocRef.id,
        ...newAnswer
      },
      thread: updatedThread
    };
  } catch (error) {
    console.error('Error adding answer:', error);
    throw error;
  }
};

// Toggle answer acceptance
export const toggleAnswerAcceptance = async (threadId, answerId, isAccepted) => {
  try {
    // First, ensure no other answers for this thread are marked as accepted
    if (isAccepted) {
      const answersQuerySnapshot = await getDocs(
        query(
          answersCollection,
          where('threadId', '==', threadId),
          where('isAccepted', '==', true)
        )
      );
      
      // Unmark all currently accepted answers
      const batch = db.batch();
      answersQuerySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isAccepted: false, updatedAt: serverTimestamp() });
      });
      await batch.commit();
    }
    
    // Now toggle this answer's acceptance status
    const answerRef = doc(answersCollection, answerId);
    await updateDoc(answerRef, {
      isAccepted,
      updatedAt: serverTimestamp()
    });
    
    return isAccepted;
  } catch (error) {
    console.error('Error toggling answer acceptance:', error);
    throw error;
  }
};

// Search threads
export const searchThreads = async (searchTerm) => {
  try {
    // Basic implementation - in a real app, you might use Firebase Extensions like Algolia
    // or implement server-side search for better functionality
    const querySnapshot = await getDocs(threadsCollection);
    
    // Filter client-side (not efficient for large datasets)
    const results = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(thread => 
        thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
    return results;
  } catch (error) {
    console.error('Error searching threads:', error);
    throw error;
  }
};

// Get answers for a specific thread
export const getThreadAnswers = async (threadId) => {
  try {
    // Get answers for this thread with a simpler query that doesn't require complex indexes
    // Just filter by threadId and let the client sort the results
    const answersQuerySnapshot = await getDocs(
      query(
        answersCollection,
        where('threadId', '==', threadId)
        // Removed complex ordering that requires composite indexes
      )
    );
    
    // Process and sort the answers on the client side instead
    const answers = answersQuerySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      postedAt: doc.data().createdAt 
        ? new Date(doc.data().createdAt.toDate()).toISOString() 
        : new Date().toISOString()
    }));
    
    // Sort answers manually on client side (similar to the Firebase query but done in JS)
    // First by isAccepted (accepted answers first)
    // Then by votes (highest votes first)
    // Then by createdAt (oldest first)
    const sortedAnswers = answers.sort((a, b) => {
      // First sort by isAccepted (true comes before false)
      if (a.isAccepted !== b.isAccepted) {
        return a.isAccepted ? -1 : 1;
      }
      
      // Then sort by votes (higher first)
      if (a.votes !== b.votes) {
        return (b.votes || 0) - (a.votes || 0);
      }
      
      // Finally sort by creation date (oldest first)
      const dateA = getDateFromField(a.createdAt);
      const dateB = getDateFromField(b.createdAt);
      return dateA - dateB;
    });
    
    return sortedAnswers;
  } catch (error) {
    console.error('Error getting thread answers:', error);
    throw error;
  }
}; 