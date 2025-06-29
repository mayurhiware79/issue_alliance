import { createThread } from '../services/forumService';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';

// Sample data generator for the forum
export const generateSampleThreads = async (userId) => {
  try {
    // Clear existing threads first (optional)
    console.log('Clearing existing threads...');
    const threadsCollection = collection(db, 'threads');
    const existingThreads = await getDocs(threadsCollection);
    
    // This is dangerous in production, but useful for development/testing
    for (const doc of existingThreads.docs) {
      await deleteDoc(doc.ref);
    }
    
    console.log('Creating sample threads...');
    
    // Debug constants to ensure consistency
    const CATEGORY_GENERAL = "General";
    const CATEGORY_HELP = "Help";
    const CATEGORY_ANNOUNCEMENT = "Announcement";
    
    console.log(`Using exact category names: "${CATEGORY_GENERAL}", "${CATEGORY_HELP}", "${CATEGORY_ANNOUNCEMENT}"`);
    
    // Create General category threads
    await createThread({
      title: "Welcome to the community forum!",
      content: "This is a place to ask questions, share knowledge, and connect with others.",
      category: CATEGORY_GENERAL,
      tags: ["welcome", "community", "forum"],
    }, userId);
    
    await createThread({
      title: "Forum guidelines and rules",
      content: "Please be respectful to others and follow our community guidelines.",
      category: CATEGORY_GENERAL,
      tags: ["rules", "guidelines", "community"],
      views: 120,
      votes: 15,
    }, userId);
    
    await createThread({
      title: "Introduce yourself to the community",
      content: "Tell us about yourself, your interests, and what you hope to learn or contribute.",
      category: CATEGORY_GENERAL,
      tags: ["introduction", "community", "networking"],
      views: 250,
      answerCount: 18, // Many answers for this thread
      votes: 32,
    }, userId);
    
    await createThread({
      title: "What features would you like to see next?",
      content: "We're planning our roadmap and would love to hear your feedback on what features to prioritize.",
      category: CATEGORY_GENERAL,
      tags: ["feedback", "features", "roadmap"],
      views: 175,
      answerCount: 14,
      votes: 26,
    }, userId);
    
    // Create Help category threads
    console.log('Creating Help category threads...');
    
    const helpThread1 = await createThread({
      title: "How do I change my profile picture?",
      content: "I've tried clicking on my avatar but nothing happens. Can someone help?",
      category: CATEGORY_HELP,
      tags: ["profile", "avatar", "settings"],
      views: 45,
      answerCount: 2,
      votes: 3,
    }, userId);
    
    const helpThread2 = await createThread({
      title: "Login issues after password reset",
      content: "I reset my password but now I can't log in. What should I do?",
      category: CATEGORY_HELP,
      tags: ["login", "password", "authentication"],
      views: 68,
      answerCount: 0,
      votes: 5,
    }, userId);
    
    const helpThread3 = await createThread({
      title: "Can't submit my assignment",
      content: "The submission form keeps showing an error. Anyone else having this issue?",
      category: CATEGORY_HELP,
      tags: ["assignment", "error", "submission"],
      views: 82,
      answerCount: 3,
      votes: 8,
    }, userId);
    
    const helpThread4 = await createThread({
      title: "Need urgent help with course registration",
      content: "I'm trying to register for the next semester but the system keeps giving an error. The deadline is tomorrow!",
      category: CATEGORY_HELP,
      tags: ["registration", "urgent", "error"],
      views: 120,
      answerCount: 0,
      votes: 12,
    }, userId);
    
    const helpThread5 = await createThread({
      title: "Video player not working on mobile",
      content: "I can't view lecture videos on my phone. Works fine on desktop though.",
      category: CATEGORY_HELP,
      tags: ["video", "mobile", "technical"],
      views: 56,
      answerCount: 0,
      votes: 3,
    }, userId);
    
    console.log('Created Help threads with IDs:', [
      helpThread1?.id, 
      helpThread2?.id, 
      helpThread3?.id, 
      helpThread4?.id, 
      helpThread5?.id
    ]);
    
    // Create Announcement category threads
    await createThread({
      title: "New features coming next month",
      content: "We're excited to announce several new features coming in our next update!",
      category: CATEGORY_ANNOUNCEMENT,
      tags: ["update", "features", "roadmap"],
      views: 230,
      answerCount: 5,
      votes: 27,
    }, userId);
    
    await createThread({
      title: "Scheduled maintenance this weekend",
      content: "The platform will be unavailable for maintenance from Saturday 10pm to Sunday 2am.",
      category: CATEGORY_ANNOUNCEMENT,
      tags: ["maintenance", "downtime", "schedule"],
      views: 178,
      answerCount: 1,
      votes: 12,
    }, userId);
    
    // Verify Help category threads were created
    const helpThreadsQuery = query(threadsCollection, where('category', '==', CATEGORY_HELP));
    const helpThreadsSnapshot = await getDocs(helpThreadsQuery);
    console.log(`Verified Help category threads: found ${helpThreadsSnapshot.size} threads`);
    
    console.log('Sample threads created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating sample threads:', error);
    return false;
  }
};

// Export a function to check if we have enough threads for testing
export const checkThreadCount = async () => {
  try {
    const threadsCollection = collection(db, 'threads');
    const snapshot = await getDocs(threadsCollection);
    
    // Debug log each thread and its category
    console.log("Current threads in the database:");
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Thread: "${data.title}", Category: "${data.category}" (type: ${typeof data.category})`);
    });
    
    return {
      count: snapshot.docs.length,
      categories: [...new Set(snapshot.docs.map(doc => doc.data().category))],
      tags: [...new Set(snapshot.docs.flatMap(doc => doc.data().tags || []))]
    };
  } catch (error) {
    console.error('Error checking thread count:', error);
    return { count: 0, categories: [], tags: [] };
  }
}; 