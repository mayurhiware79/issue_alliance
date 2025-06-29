import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createThread } from '../services/forumService';
import { FaPlus, FaTimes } from 'react-icons/fa';

// Categories for the dropdown
const CATEGORIES = ['General', 'Help', 'Announcement'];

function AskQuestion() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/ask-question' } });
    }
  }, [currentUser, navigate]);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    if (title.length < 10) {
      setError('Title should be at least 10 characters long');
      return;
    }
    
    if (content.length < 30) {
      setError('Content should be at least 30 characters long');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Prepare thread data
      const threadData = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        // Include author data for better UI experience
        authorName: currentUser.displayName || currentUser.email.split('@')[0] || 'Anonymous',
        authorEmail: currentUser.email,
        authorPhotoURL: currentUser.photoURL || null
      };
      
      // Create the thread
      const newThread = await createThread(threadData, currentUser.uid);
      
      // Redirect to the new thread
      navigate(`/thread/${newThread.id}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      setError(`Failed to create thread: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null; // Don't render anything while redirecting

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Ask a Question</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Question Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Be specific and imagine you're asking a question to another person"
              required
              minLength={10}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {title.length}/100 characters (min 10)
            </p>
          </div>
          
          <div>
            <label htmlFor="content" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Question Details <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Include all the information someone would need to answer your question"
              rows={8}
              required
              minLength={30}
              disabled={isSubmitting}
            ></textarea>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {content.length} characters (min 30)
            </p>
          </div>
          
          <div>
            <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isSubmitting}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="tags" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags (max 5)
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Add tags (press Enter or comma to add)"
                disabled={isSubmitting || tags.length >= 5}
              />
              <button
                type="button"
                onClick={addTag}
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-800"
                disabled={!tagInput.trim() || tags.length >= 5 || isSubmitting}
              >
                <FaPlus />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tags help others find your question
            </p>
            
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div key={tag} className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900 dark:text-blue-200">
                    <span className="mr-1">{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-700 hover:text-blue-900 dark:text-blue-200 dark:hover:text-blue-100"
                      disabled={isSubmitting}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/forum')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </span>
              ) : (
                'Post Your Question'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AskQuestion; 