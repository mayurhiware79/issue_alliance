import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

function ForumCategoryTabs({ categories, activeCategory, onCategoryChange }) {
  const [helpCount, setHelpCount] = useState(0);
  
  // Fetch the count of Help category threads for the badge
  useEffect(() => {
    const fetchHelpCount = async () => {
      try {
        const threadsCollection = collection(db, 'threads');
        const q = query(threadsCollection, where('category', '==', 'Help'));
        const querySnapshot = await getDocs(q);
        setHelpCount(querySnapshot.size);
        console.log(`Found ${querySnapshot.size} Help category threads`);
      } catch (error) {
        console.error('Error fetching Help count:', error);
      }
    };
    
    fetchHelpCount();
  }, []);
  
  return (
    <div className="mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <div className="flex space-x-4 md:space-x-8 pb-1">
        {categories.map((category) => (
                <button
              key={category}
              className={`pb-4 px-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-600'
              }`}
              onClick={() => {
                console.log(`Category tab clicked: ${category}`); // Debug log
                onCategoryChange(category);
              }}
              >
            <div className="flex items-center">
              {category === 'All' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
              {category === 'Popular' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {category === 'Unanswered' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {category === 'Most Answered' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              )}
              {category === 'Help' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {category === 'Announcement' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              )}
              {category === 'General' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              )}
              {category}
              {category === 'Help' && helpCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  {helpCount}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ForumCategoryTabs; 