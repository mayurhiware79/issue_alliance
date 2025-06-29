import { format, parseISO } from 'date-fns';

/**
 * Count occurrences of each skill across all users
 * @param {Array} data - The data from Google Sheets
 * @returns {Array} Array of {name, count} objects for skills
 */
export const getSkillsDistribution = (data) => {
  if (!data || !data.length) return [];
  
  const skillsCount = {};
  
  data.forEach(user => {
    if (user.skills && user.skills.length) {
      user.skills.forEach(skill => {
        if (skill) {
          skillsCount[skill] = (skillsCount[skill] || 0) + 1;
        }
      });
    }
  });
  
  // Convert to array and sort by count (descending)
  return Object.entries(skillsCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 skills
};

/**
 * Count contributions by type
 * @param {Array} data - The data from Google Sheets
 * @returns {Array} Array of {name, count} objects for contribution types
 */
export const getContributionsByType = (data) => {
  if (!data || !data.length) return [];
  
  const contribCount = {};
  
  data.forEach(user => {
    if (user.contributions) {
      // Count each contribution type
      Object.keys(user.contributions).forEach(type => {
        contribCount[type] = (contribCount[type] || 0) + 1;
      });
    }
  });
  
  // Convert to array and sort by count (descending)
  return Object.entries(contribCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Process chatbot interactions over time
 * @param {Array} data - The data from Google Sheets
 * @returns {Array} Array of {date, count} objects
 */
export const getChatbotInteractionsOverTime = (data) => {
  if (!data || !data.length) return [];
  
  const interactionsByDate = {};
  
  data.forEach(user => {
    if (user.timestamp) {
      try {
        // Format the date (YYYY-MM-DD)
        const dateStr = format(parseISO(user.timestamp), 'yyyy-MM-dd');
        
        // Count interactions by date
        if (user.chatbotInteractions && Object.keys(user.chatbotInteractions).length > 0) {
          interactionsByDate[dateStr] = (interactionsByDate[dateStr] || 0) + 
            Object.keys(user.chatbotInteractions).length;
        }
      } catch (error) {
        console.error('Error processing date:', error);
      }
    }
  });
  
  // Convert to array, sort by date
  return Object.entries(interactionsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Calculate summary statistics from data
 * @param {Array} data - The data from Google Sheets
 * @returns {Object} Object with summary statistics
 */
export const getSummaryStats = (data) => {
  if (!data || !data.length) return {
    totalUsers: 0,
    uniqueSkills: 0,
    totalContributions: 0,
    totalChatbotInteractions: 0
  };
  
  // All unique skills
  const uniqueSkills = new Set();
  
  // Count total contributions and chatbot interactions
  let totalContributions = 0;
  let totalChatbotInteractions = 0;
  
  data.forEach(user => {
    // Count unique skills
    if (user.skills && user.skills.length) {
      user.skills.forEach(skill => {
        if (skill) uniqueSkills.add(skill);
      });
    }
    
    // Count contributions
    if (user.contributions) {
      totalContributions += Object.keys(user.contributions).length;
    }
    
    // Count chatbot interactions
    if (user.chatbotInteractions) {
      totalChatbotInteractions += Object.keys(user.chatbotInteractions).length;
    }
  });
  
  return {
    totalUsers: data.length,
    uniqueSkills: uniqueSkills.size,
    totalContributions,
    totalChatbotInteractions
  };
}; 