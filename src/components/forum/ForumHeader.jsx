import React, { useState } from 'react';
import { FaSearch, FaSun, FaMoon, FaCaretDown } from 'react-icons/fa';

function ForumHeader({ onAskQuestion, onSearchChange, onSortChange, isDarkMode, toggleTheme }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'active', label: 'Most Active' },
    { value: 'votes', label: 'Most Votes' },
    { value: 'answers', label: 'Most Answers' },
    { value: 'unanswered', label: 'Unanswered' },
    { value: 'views', label: 'Most Views' }
  ];
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchChange(searchTerm);
  };
  
  const handleSortChange = (option) => {
    setSortOption(option);
    setIsDropdownOpen(false);
    if (onSortChange) onSortChange(option);
  };
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Real-time search results (with minimal debounce)
    if (!value.trim()) {
      onSearchChange(''); // Clear search results when search box is empty
    } else if (value.length >= 3) {
      // Only trigger search when at least 3 characters are typed
      onSearchChange(value);
    }
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex items-center w-full md:w-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Community Forum</h1>
      </div>
      
      <div className="flex w-full md:w-auto flex-col md:flex-row gap-3 items-stretch md:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search threads..."
              value={searchTerm}
              onChange={handleInputChange}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-600"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            {searchTerm && (
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="absolute mt-1 text-xs text-gray-500 dark:text-gray-400 pl-2">
            {searchTerm && searchTerm.length < 3 && 'Type at least 3 characters to search'}
          </div>
        </form>
        
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 flex items-center"
          >
            <span className="whitespace-nowrap">Sort by: {sortOptions.find(o => o.value === sortOption)?.label}</span>
            <FaCaretDown className="ml-2 h-4 w-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute mt-1 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg w-48 dark:bg-gray-800 dark:border-gray-700">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    sortOption === option.value ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onAskQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Ask Question
        </button>
      </div>
    </div>
  );
}

export default ForumHeader; 