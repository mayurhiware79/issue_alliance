import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumHeader from '../components/forum/ForumHeader';
import ForumCategoryTabs from '../components/forum/ForumCategoryTabs';
import ThreadList from '../components/forum/ThreadList';
import FirebaseDebugger from '../components/forum/FirebaseDebugger';
import CategoryDebugger from '../utils/CategoryDebugger';
import { 
  getAllThreads, 
  getThreadsByCategory, 
  getPopularThreads 
} from '../services/forumService';
import { useAuth } from '../contexts/AuthContext';
import { generateSampleThreads, checkThreadCount } from '../utils/sampleData';
import { FaComment, FaRegCommentAlt } from 'react-icons/fa';

// Categories for forum
const CATEGORIES = ['All', 'General', 'Help', 'Announcement', 'Unanswered', 'Popular'];

function Forum() {
  const [threads, setThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [sampleDataStats, setSampleDataStats] = useState(null);

  // Apply dark mode on initial load and when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  // Add keypress listener for debugger
  useEffect(() => {
    const handleKeypress = (e) => {
      // Ctrl + Shift + D to toggle debugger
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugger(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeypress);
    return () => window.removeEventListener('keydown', handleKeypress);
  }, []);

  // Fetch all threads without category filtering initially,
  // then apply category filtering in a more consistent way
  useEffect(() => {
    const fetchThreads = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let fetchedThreads;
        
        // Fetch all threads regardless of category
        fetchedThreads = await getAllThreads();
        
        // Transform timestamps to ISO strings for consistent handling
        const formattedThreads = fetchedThreads.map(thread => ({
          ...thread,
          postedAt: thread.createdAt ? new Date(thread.createdAt.toDate()).toISOString() : new Date().toISOString()
        }));
        
        setThreads(formattedThreads);
      } catch (err) {
        console.error('Error fetching threads:', err);
        setError('Failed to load threads. Please try again later.');
        setShowDebugger(true); // Automatically show debugger on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, []); // Only fetch threads once on component mount

  // Apply category filtering, sorting, and search in a separate effect
  useEffect(() => {
    if (threads.length === 0) {
      setFilteredThreads([]);
      return;
    }
    
    // Apply category filtering first
    let result = threads;
    
    if (activeCategory === 'All') {
      // No filtering needed for "All" tab
      console.log('Showing all threads');
    } else if (activeCategory === 'Popular') {
      // Sort by combining answer count and votes for "Popular" tab
      result = threads.sort((a, b) => {
        // First sort by answer count (highest first)
        const answerCountDiff = (b.answerCount || 0) - (a.answerCount || 0);
        if (answerCountDiff !== 0) return answerCountDiff;
        
        // If answer counts are the same, sort by votes (highest first)
        return (b.votes || 0) - (a.votes || 0);
      });
      
      // Limit to top 20 most popular threads
      result = result.slice(0, 20);
      console.log('Showing popular threads sorted by answers and votes');
    } else if (activeCategory === 'Unanswered') {
      // Filter to only threads with no answers
      result = threads.filter(thread => !thread.answerCount || thread.answerCount === 0);
      console.log('Showing unanswered threads');
    } else {
      // For all other categories, filter by category name OR matching tag
      const categoryLower = activeCategory.toLowerCase();
      result = threads.filter(thread => {
        // Check for exact category match (case insensitive)
        const hasCategory = thread.category?.toLowerCase() === categoryLower;
        
        // Check for matching tag (case insensitive)
        const hasMatchingTag = thread.tags?.some(tag => tag.toLowerCase() === categoryLower);
        
        return hasCategory || hasMatchingTag;
      });
      console.log(`Showing ${activeCategory} category threads: ${result.length} threads`);
    }
    
    // Then apply search filter if there is a search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(thread => 
        (thread.title && thread.title.toLowerCase().includes(searchLower)) || 
        (thread.content && thread.content.toLowerCase().includes(searchLower)) ||
        (thread.tags && thread.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        (thread.category && thread.category.toLowerCase().includes(searchLower))
      );
      console.log(`After search filtering: ${result.length} threads`);
    }
    
    // Finally apply sorting based on sort order
    result = [...result]; // Create a new array to avoid modifying the filtered array
    
    switch (sortOrder) {
      case 'newest':
        // Sort by creation date (newest first)
        result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        console.log('Sorted by newest');
        break;
      case 'active':
        // Sort by last updated (most recently active first)
        result.sort((a, b) => {
          const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.postedAt);
          const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.postedAt);
          return bDate - aDate;
        });
        console.log('Sorted by active');
        break;
      case 'votes':
        // Sort by vote count (highest first)
        result.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        console.log('Sorted by votes');
        break;
      case 'answers':
        // Sort by answer count (highest first)
        result.sort((a, b) => (b.answerCount || 0) - (a.answerCount || 0));
        console.log('Sorted by answer count');
        break;
      case 'unanswered':
        // Sort unanswered threads first, then by date
        result.sort((a, b) => {
          // First prioritize threads with no answers
          if ((a.answerCount || 0) === 0 && (b.answerCount || 0) > 0) return -1;
          if ((a.answerCount || 0) > 0 && (b.answerCount || 0) === 0) return 1;
          // Then sort by newest
          return new Date(b.postedAt) - new Date(a.postedAt);
        });
        console.log('Sorted by unanswered');
        break;
      case 'views':
        // Sort by view count (highest first)
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        console.log('Sorted by views');
        break;
      default:
        console.log(`Unknown sort order: ${sortOrder}, using default (newest)`);
        // Default to newest if sort order is unrecognized
        result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
    }
    
    console.log('Final filtered thread count:', result.length);
    setFilteredThreads(result);
  }, [threads, activeCategory, sortOrder, searchTerm]);

  const handleCategoryChange = (category) => {
    console.log(`Category changed to: "${category}"`);
    if (CATEGORIES.includes(category)) {
      setActiveCategory(category);
    } else {
      console.error(`Invalid category selected: ${category}`);
    }
  };

  const handleSortChange = (newSortOrder) => {
    console.log(`Sort order changed to: ${newSortOrder}`);
    setSortOrder(newSortOrder);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleAskQuestion = () => {
    if (!currentUser) {
      // If not logged in, redirect to login page
      navigate('/login', { state: { from: '/ask-question' } });
    } else {
      // Otherwise go to ask question page
      navigate('/ask-question');
    }
  };

  // Function to generate sample threads
  const handleGenerateSampleThreads = async () => {
    if (!currentUser) {
      alert("You need to be logged in to generate sample threads");
      return;
    }
    
    setIsGeneratingSample(true);
    try {
      await generateSampleThreads(currentUser.uid);
      const stats = await checkThreadCount();
      setSampleDataStats(stats);
      
      // Refresh the current category view
      setActiveCategory(prevCategory => prevCategory); // This will trigger a re-fetch
    } catch (error) {
      console.error("Error generating sample threads:", error);
      alert("Failed to generate sample threads");
    } finally {
      setIsGeneratingSample(false);
    }
  };
  
  // Check current thread count on mount
  useEffect(() => {
    const checkThreads = async () => {
      const stats = await checkThreadCount();
      setSampleDataStats(stats);
    };
    
    checkThreads();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <ForumHeader 
        onAskQuestion={handleAskQuestion}
        onSearchChange={handleSearchChange}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onSortChange={handleSortChange}
      />
      <ForumCategoryTabs 
        categories={CATEGORIES} 
        activeCategory={activeCategory} 
        onCategoryChange={handleCategoryChange} 
      />
      
      {/* Firebase Debugger - hidden by default, toggle with Ctrl+Shift+D */}
      {showDebugger && <FirebaseDebugger />}
      
      {error && (
        <div className="my-6 p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-200">
          {error}
          <div className="mt-2 text-sm">
            <button
              onClick={() => setShowDebugger(prev => !prev)}
              className="text-blue-600 hover:text-blue-800 underline dark:text-blue-300 dark:hover:text-blue-100"
            >
              {showDebugger ? 'Hide' : 'Show'} debugging information
            </button>
          </div>
        </div>
      )}
      
      {/* Category Debugger - only shown when main debugger is active */}
      {showDebugger && (
        <div className="mb-4">
          <CategoryDebugger threads={filteredThreads} activeCategory={activeCategory} />
        </div>
      )}
      
      {/* Debug panel for development/testing */}
      {showDebugger && (
        <div className="my-4 p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
          <h3 className="text-lg font-medium mb-2 dark:text-white">Debug Panel</h3>
          
          <div className="mb-3">
            <p className="text-sm dark:text-gray-300">
              Thread count: <span className="font-medium">{sampleDataStats?.count || 0}</span>
            </p>
            {sampleDataStats?.categories?.length > 0 && (
              <p className="text-sm dark:text-gray-300">
                Available categories: <span className="font-medium">{sampleDataStats.categories.join(', ')}</span>
              </p>
            )}
          </div>
          
          <button
            onClick={handleGenerateSampleThreads}
            disabled={isGeneratingSample}
            className={`px-3 py-1 bg-blue-600 text-white rounded-md ${isGeneratingSample ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {isGeneratingSample ? 'Generating...' : 'Generate Sample Threads'}
          </button>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : (
        filteredThreads.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4 dark:text-gray-300">
              {searchTerm ? 'No threads found matching your search.' : 'No threads found for this category.'}
            </p>
            <button
              onClick={handleAskQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Be the first to ask a question
            </button>
            {!error && (
              <div className="mt-4">
                <button
                  onClick={() => setShowDebugger(prev => !prev)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline dark:text-blue-300 dark:hover:text-blue-100"
                >
                  {showDebugger ? 'Hide' : 'Show'} debugging information
                </button>
              </div>
            )}
          </div>
        ) : (
          <ThreadList 
            threads={filteredThreads} 
            currentUser={currentUser} 
            showViewAnswersButton={true}
            isDarkMode={isDarkMode}
          />
        )
      )}
    </div>
  );
}

export default Forum; 