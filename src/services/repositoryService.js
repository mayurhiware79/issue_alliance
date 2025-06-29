// Repository service for managing repo data in Firebase
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get or create a repository in Firestore
 * @param {Object} repositoryData - Repository data from GitHub
 * @param {string} userId - The current user's ID
 * @returns {Promise<Object>} - The repository document data
 */
export async function getOrCreateRepository(repositoryData, userId) {
  if (!repositoryData || !repositoryData.full_name) {
    throw new Error('Invalid repository data');
  }
  
  try {
    const repoId = repositoryData.full_name.replace(/\//g, '_');
    const repoRef = doc(db, 'repositories', repoId);
    const repoSnap = await getDoc(repoRef);
    
    if (repoSnap.exists()) {
      // Repository exists, update with new data
      const existingData = repoSnap.data();
      const contributorIds = existingData.contributorIds || [];
      
      if (userId && !contributorIds.includes(userId)) {
        contributorIds.push(userId);
        
        await updateDoc(repoRef, {
          contributorCount: contributorIds.length,
          contributorIds: contributorIds,
          lastActivity: Timestamp.now()
        });
      }
      
      return {
        id: repoId,
        ...existingData
      };
    } else {
      // Create new repository document
      const newRepoData = {
        id: repoId,
        name: repositoryData.name,
        fullName: repositoryData.full_name,
        owner: repositoryData.owner.login,
        url: repositoryData.html_url,
        description: repositoryData.description || '',
        stars: repositoryData.stargazers_count || 0,
        forks: repositoryData.forks_count || 0,
        language: repositoryData.language || 'Unknown',
        contributorCount: userId ? 1 : 0,
        contributorIds: userId ? [userId] : [],
        issueCount: 0,
        issueIds: [],
        createdAt: Timestamp.now(),
        lastActivity: Timestamp.now()
      };
      
      await setDoc(repoRef, newRepoData);
      
      return newRepoData;
    }
  } catch (error) {
    console.error('Error getting/creating repository:', error);
    throw error;
  }
}

/**
 * Add an issue to a repository's tracking
 * @param {Object} issueData - Issue data from GitHub
 * @param {string} userId - The current user's ID
 * @returns {Promise<Object>} - The updated repository data
 */
export async function trackIssueInRepository(issueData, userId) {
  if (!issueData || !issueData.repository || !issueData.repository.full_name) {
    throw new Error('Invalid issue data');
  }
  
  try {
    const repoId = issueData.repository.full_name.replace(/\//g, '_');
    const repoRef = doc(db, 'repositories', repoId);
    const repoSnap = await getDoc(repoRef);
    
    if (repoSnap.exists()) {
      // Repository exists, add issue to tracking
      const repoData = repoSnap.data();
      const issueIds = repoData.issueIds || [];
      
      if (!issueIds.includes(issueData.id)) {
        issueIds.push(issueData.id);
        
        await updateDoc(repoRef, {
          issueCount: issueIds.length,
          issueIds: issueIds,
          lastActivity: Timestamp.now()
        });
      }
      
      return {
        id: repoId,
        ...repoData,
        issueIds
      };
    } else {
      // Repository doesn't exist, create it with this issue
      // Ensure we have all required fields and provide defaults for missing ones
      const ownerInfo = typeof issueData.repository.owner === 'string' 
        ? { login: issueData.repository.owner }
        : (issueData.repository.owner || { login: 'unknown' });
      
      const repoData = {
        id: repoId,
        name: issueData.repository.name || repoId.split('_')[1] || 'unknown',
        fullName: issueData.repository.full_name,
        owner: ownerInfo.login || 'unknown',
        url: `https://github.com/${issueData.repository.full_name}`,
        description: issueData.repository.description || '',
        stars: issueData.repository.stargazers_count || 0,
        forks: issueData.repository.forks_count || 0, 
        language: issueData.repository.language || 'Unknown',
        contributorCount: userId ? 1 : 0,
        contributorIds: userId ? [userId] : [],
        issueCount: 1,
        issueIds: [issueData.id],
        createdAt: Timestamp.now(),
        lastActivity: Timestamp.now()
      };
      
      await setDoc(repoRef, repoData);
      
      return repoData;
    }
  } catch (error) {
    console.error('Error tracking issue in repository:', error);
    throw error;
  }
}

/**
 * Get repositories that match user skills
 * @param {Array<string>} skills - Array of user skills
 * @param {number} limit - Max number of repositories to return
 * @returns {Promise<Array>} - Matching repositories
 */
export async function getRepositoriesBySkills(skills, maxResults = 5) {
  if (!skills || skills.length === 0) {
    return [];
  }
  
  try {
    const reposRef = collection(db, 'repositories');
    const matchingRepos = [];
    const processedRepoIds = new Set();
    
    // Try to find repositories by exact language match first
    for (const skill of skills) {
      const languageQuery = query(
        reposRef,
        where('language', '==', skill),
        orderBy('stars', 'desc'),
        limit(5)
      );
      
      const languageSnapshot = await getDocs(languageQuery);
      
      languageSnapshot.forEach(doc => {
        const repoData = doc.data();
        if (!processedRepoIds.has(repoData.id)) {
          matchingRepos.push(repoData);
          processedRepoIds.add(repoData.id);
        }
      });
      
      // If we have enough repos, stop searching
      if (matchingRepos.length >= maxResults) {
        return matchingRepos.slice(0, maxResults);
      }
    }
    
    // If we don't have enough repos, get the most popular ones
    if (matchingRepos.length < maxResults) {
      const popularQuery = query(
        reposRef,
        orderBy('stars', 'desc'),
        limit(maxResults - matchingRepos.length)
      );
      
      const popularSnapshot = await getDocs(popularQuery);
      
      popularSnapshot.forEach(doc => {
        const repoData = doc.data();
        if (!processedRepoIds.has(repoData.id)) {
          matchingRepos.push(repoData);
          processedRepoIds.add(repoData.id);
        }
      });
    }
    
    return matchingRepos;
  } catch (error) {
    console.error('Error getting repositories by skills:', error);
    return [];
  }
}

export default {
  getOrCreateRepository,
  trackIssueInRepository,
  getRepositoriesBySkills
}; 