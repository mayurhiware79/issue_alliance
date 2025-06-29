import React, { useState, useEffect } from 'react';
import { FaSearch, FaCode, FaStar, FaCodeBranch, FaUser, FaExclamationCircle, FaFilter, FaHeart, FaRegHeart, FaSpinner, FaEnvelope, FaTags, FaGithub } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function ProjectMatching() {
  const { currentUser } = useAuth();
  const { currentTheme, themeConfig } = useTheme();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [difficultyLevel, setDifficultyLevel] = useState('all');
  const [helpWanted, setHelpWanted] = useState(false);
  const [goodFirstIssue, setGoodFirstIssue] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedProjects, setLikedProjects] = useState([]);

  // Theme configuration
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  
  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { 
      y: -5, 
      boxShadow: isDarkTheme ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)' : 
                             '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    }
  };

  // Available filter options
  const languages = ['JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'PHP', 'Go', 'Ruby', 'C++', 'Rust'];
  const categories = ['Web Development', 'Data Science', 'Machine Learning', 'Mobile Apps', 'DevOps', 'Security', 'UI/UX', 'Game Development', 'Blockchain'];
  
  // Fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError('');
        
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef,
          where('isPublic', '==', true),
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedProjects = querySnapshot.docs.map(doc => {
          const projectData = doc.data();
          
          // Create a properly structured project object with owner data
          return {
            id: doc.id,
            ...projectData,
            lastUpdated: projectData.lastUpdated?.toDate() || new Date(),
            // Ensure owner data is properly structured
            owner: projectData.owner || {
              id: projectData.userId || 'unknown',
              name: projectData.userName || 'Unknown',
              avatar: projectData.userPhotoURL || `https://ui-avatars.com/api/?name=${projectData.userName || 'U'}`
            }
          };
        });
        
        setProjects(fetchedProjects.sort((a, b) => b.lastUpdated - a.lastUpdated));
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  // Filter toggle functions
  const toggleLanguage = (language) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(lang => lang !== language) 
        : [...prev, language]
    );
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
  };

  const toggleLike = (projectId) => {
    setLikedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId) 
        : [...prev, projectId]
    );
  };

  // Apply filters to projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLanguage = selectedLanguages.length === 0 || 
      selectedLanguages.includes(project.language);
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(project.category);
    
    const matchesDifficulty = difficultyLevel === 'all' || 
      project.difficulty === difficultyLevel;
    
    const matchesHelpWanted = !helpWanted || project.helpWanted;
    const matchesGoodFirstIssue = !goodFirstIssue || project.goodFirstIssue;
    
    return matchesSearch && matchesLanguage && matchesCategory && 
           matchesDifficulty && matchesHelpWanted && matchesGoodFirstIssue;
  });

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  return (
    <div 
      className="rounded-xl shadow-md overflow-hidden p-6 transition-colors duration-300"
      style={{ 
        backgroundColor: themeConfig[currentTheme].bgTertiary,
        color: themeConfig[currentTheme].textPrimary,
        backgroundImage: isDarkTheme 
          ? 'radial-gradient(circle at 80% 20%, rgba(64, 64, 180, 0.04) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(64, 180, 64, 0.04) 0%, transparent 40%)'
          : 'radial-gradient(circle at 80% 20%, rgba(229, 231, 235, 0.6) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(243, 244, 246, 0.6) 0%, transparent 40%)'
      }}
    >
      {/* Header */}
      <div 
        className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b"
        style={{ borderColor: `${themeConfig[currentTheme].textSecondary}20` }}
      >
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: themeConfig[currentTheme].textPrimary }}>
            Discover Open Source Projects
          </h2>
          <p className="text-base" style={{ color: themeConfig[currentTheme].textSecondary }}>
            Find projects that match your skills and interests
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div 
        className="p-4 mb-8 rounded-xl"
        style={{ 
          backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(243, 244, 246, 0.7)',
          boxShadow: isDarkTheme 
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.2)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="md:w-2/3 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch style={{ color: themeConfig[currentTheme].textSecondary }} />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:outline-none"
              style={{ 
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                color: themeConfig[currentTheme].textPrimary,
                borderColor: `${themeConfig[currentTheme].textSecondary}20`,
                borderWidth: '1px',
                boxShadow: 'none'
              }}
            />
          </div>
          <div className="md:w-1/3">
            <motion.button 
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(243, 244, 246, 1)',
                color: themeConfig[currentTheme].textPrimary,
                borderColor: `${themeConfig[currentTheme].textSecondary}20`,
                borderWidth: '1px'
              }}
              whileHover={{ 
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 231, 235, 1)' 
              }}
            >
              <FaFilter />
              <span>Filters {showFilters ? '(Hide)' : '(Show)'}</span>
            </motion.button>
          </div>
        </div>
        
        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div 
                className="mt-4 p-4 rounded-lg"
                style={{ 
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)',
                  borderColor: `${themeConfig[currentTheme].textSecondary}20`,
                  borderWidth: '1px'
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Languages */}
                  <div>
                    <h3 className="font-semibold mb-3" style={{ color: themeConfig[currentTheme].textPrimary }}>
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map(language => (
                        <motion.button
                          key={language}
                          onClick={() => toggleLanguage(language)}
                          className="px-3 py-1 rounded-full text-sm border"
                          style={{ 
                            backgroundColor: selectedLanguages.includes(language)
                              ? isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 1)'
                              : isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(243, 244, 246, 0.7)',
                            color: selectedLanguages.includes(language)
                              ? isDarkTheme ? 'rgb(147, 197, 253)' : 'rgb(30, 64, 175)'
                              : themeConfig[currentTheme].textPrimary,
                            borderColor: selectedLanguages.includes(language)
                              ? isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(147, 197, 253, 1)'
                              : `${themeConfig[currentTheme].textSecondary}20`
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {language}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Categories */}
                  <div>
                    <h3 className="font-semibold mb-3" style={{ color: themeConfig[currentTheme].textPrimary }}>
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <motion.button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className="px-3 py-1 rounded-full text-sm border"
                          style={{ 
                            backgroundColor: selectedCategories.includes(category)
                              ? isDarkTheme ? 'rgba(16, 185, 129, 0.2)' : 'rgba(209, 250, 229, 1)'
                              : isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(243, 244, 246, 0.7)',
                            color: selectedCategories.includes(category)
                              ? isDarkTheme ? 'rgb(110, 231, 183)' : 'rgb(4, 120, 87)'
                              : themeConfig[currentTheme].textPrimary,
                            borderColor: selectedCategories.includes(category)
                              ? isDarkTheme ? 'rgba(16, 185, 129, 0.4)' : 'rgba(167, 243, 208, 1)'
                              : `${themeConfig[currentTheme].textSecondary}20`
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {category}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Difficulty */}
                  <div>
                    <h3 className="font-semibold mb-3" style={{ color: themeConfig[currentTheme].textPrimary }}>
                      Difficulty
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'easy', 'medium', 'hard'].map(level => {
                        let bgColor, textColor, borderColor;
                        
                        if (difficultyLevel === level) {
                          if (level === 'easy') {
                            bgColor = isDarkTheme ? 'rgba(16, 185, 129, 0.2)' : 'rgba(209, 250, 229, 1)';
                            textColor = isDarkTheme ? 'rgb(110, 231, 183)' : 'rgb(4, 120, 87)';
                            borderColor = isDarkTheme ? 'rgba(16, 185, 129, 0.4)' : 'rgba(167, 243, 208, 1)';
                          } else if (level === 'medium') {
                            bgColor = isDarkTheme ? 'rgba(245, 158, 11, 0.2)' : 'rgba(254, 243, 199, 1)';
                            textColor = isDarkTheme ? 'rgb(252, 211, 77)' : 'rgb(146, 64, 14)';
                            borderColor = isDarkTheme ? 'rgba(245, 158, 11, 0.4)' : 'rgba(252, 211, 77, 1)';
                          } else if (level === 'hard') {
                            bgColor = isDarkTheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 1)';
                            textColor = isDarkTheme ? 'rgb(248, 113, 113)' : 'rgb(185, 28, 28)';
                            borderColor = isDarkTheme ? 'rgba(239, 68, 68, 0.4)' : 'rgba(248, 113, 113, 1)';
                          } else {
                            bgColor = isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 1)';
                            textColor = isDarkTheme ? 'rgb(147, 197, 253)' : 'rgb(30, 64, 175)';
                            borderColor = isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(147, 197, 253, 1)';
                          }
                        } else {
                          bgColor = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(243, 244, 246, 0.7)';
                          textColor = themeConfig[currentTheme].textPrimary;
                          borderColor = `${themeConfig[currentTheme].textSecondary}20`;
                        }
                        
                        return (
                          <motion.button
                            key={level}
                            onClick={() => setDifficultyLevel(level)}
                            className="px-3 py-1 rounded-full text-sm capitalize border"
                            style={{ 
                              backgroundColor: bgColor,
                              color: textColor,
                              borderColor: borderColor
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {level}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Additional Filters */}
                <div 
                  className="mt-6 pt-6 border-t"
                  style={{ borderColor: `${themeConfig[currentTheme].textSecondary}20` }}
                >
                  <h3 className="font-semibold mb-3" style={{ color: themeConfig[currentTheme].textPrimary }}>
                    Additional Filters
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={helpWanted}
                        onChange={() => setHelpWanted(!helpWanted)}
                        className="w-4 h-4 rounded focus:ring-offset-0"
                        style={{ 
                          accentColor: themeConfig[currentTheme].accentPrimary 
                        }}
                      />
                      <span style={{ color: themeConfig[currentTheme].textPrimary }}>
                        Help Wanted
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={goodFirstIssue}
                        onChange={() => setGoodFirstIssue(!goodFirstIssue)}
                        className="w-4 h-4 rounded focus:ring-offset-0"
                        style={{ 
                          accentColor: themeConfig[currentTheme].accentPrimary 
                        }}
                      />
                      <span style={{ color: themeConfig[currentTheme].textPrimary }}>
                        Good First Issue
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Clear Filters */}
                <div className="flex justify-end mt-6">
                  <motion.button
                    onClick={() => {
                      setSelectedLanguages([]);
                      setSelectedCategories([]);
                      setDifficultyLevel('all');
                      setHelpWanted(false);
                      setGoodFirstIssue(false);
                    }}
                    className="px-4 py-2 text-sm rounded-lg"
                    style={{ 
                      color: themeConfig[currentTheme].textSecondary,
                      border: '1px solid',
                      borderColor: `${themeConfig[currentTheme].textSecondary}30`
                    }}
                    whileHover={{ 
                      color: themeConfig[currentTheme].textPrimary,
                      borderColor: `${themeConfig[currentTheme].textSecondary}50`
                    }}
                  >
                    Clear All Filters
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Section */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <FaSpinner className="animate-spin mx-auto w-10 h-10 mb-4" style={{ color: themeConfig[currentTheme].accentPrimary }} />
              <p className="text-lg">Loading projects...</p>
            </div>
          </div>
        ) : error ? (
          <div 
            className="p-6 rounded-lg flex flex-col items-center text-center"
            style={{ 
              backgroundColor: isDarkTheme ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 0.7)',
              color: isDarkTheme ? 'rgb(248, 113, 113)' : 'rgb(185, 28, 28)'
            }}
          >
            <FaExclamationCircle className="text-3xl mb-3" />
            <p>{error}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div 
            className="text-center py-16 rounded-lg border border-dashed"
            style={{ 
              borderColor: `${themeConfig[currentTheme].textSecondary}30`,
              color: themeConfig[currentTheme].textSecondary 
            }}
          >
            <FaSearch className="mx-auto w-16 h-16 mb-4 opacity-30" />
            <h3 className="text-xl font-medium mb-2">No projects found</h3>
            <p className="max-w-md mx-auto">
              Try adjusting your search criteria or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div 
                key={project.id} 
                className="overflow-hidden rounded-xl flex flex-col h-full"
                style={{ 
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'white',
                  boxShadow: isDarkTheme 
                    ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)' 
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                transition={{ delay: index * 0.05 }}
              >
                {/* Project Cover Image with Gradient Overlay */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"
                    style={{ mixBlendMode: isDarkTheme ? 'overlay' : 'normal' }}
                  ></div>
                  {project.coverImage ? (
                    <img 
                      src={project.coverImage} 
                      alt={project.name} 
                      className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <FaCode className="text-white text-5xl opacity-20" />
                    </div>
                  )}
                  
                  {/* Like button */}
                  <motion.button 
                    onClick={() => toggleLike(project.id)}
                    className="absolute top-3 right-3 z-20 p-2 rounded-full"
                    style={{ 
                      backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {likedProjects.includes(project.id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart style={{ color: isDarkTheme ? 'white' : 'rgba(0, 0, 0, 0.7)' }} />
                    )}
                  </motion.button>
                </div>
                
                {/* Project Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-2" style={{ color: themeConfig[currentTheme].textPrimary }}>
                    {project.name}
                  </h3>
                  
                  <p className="mb-4 line-clamp-3" style={{ color: themeConfig[currentTheme].textSecondary }}>
                    {project.description || 'No description available'}
                  </p>
                  
                  {/* Tags */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {project.tags && project.tags.length > 0 ? 
                      project.tags.slice(0, 3).map((tag, index) => {
                        const tagColor = {
                          bg: isDarkTheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 1)',
                          text: isDarkTheme ? 'rgb(147, 197, 253)' : 'rgb(30, 64, 175)',
                          border: isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(147, 197, 253, 1)'
                        };
                        
                        if (index === 0 && tag.toLowerCase().includes('react')) {
                          tagColor.bg = isDarkTheme ? 'rgba(97, 218, 251, 0.2)' : 'rgba(224, 242, 254, 1)';
                          tagColor.text = isDarkTheme ? 'rgb(125, 211, 252)' : 'rgb(2, 132, 199)';
                          tagColor.border = isDarkTheme ? 'rgba(125, 211, 252, 0.4)' : 'rgba(186, 230, 253, 1)';
                        } else if (index === 1) {
                          tagColor.bg = isDarkTheme ? 'rgba(16, 185, 129, 0.2)' : 'rgba(209, 250, 229, 1)';
                          tagColor.text = isDarkTheme ? 'rgb(110, 231, 183)' : 'rgb(4, 120, 87)';
                          tagColor.border = isDarkTheme ? 'rgba(16, 185, 129, 0.4)' : 'rgba(167, 243, 208, 1)';
                        } else if (index === 2) {
                          tagColor.bg = isDarkTheme ? 'rgba(245, 158, 11, 0.2)' : 'rgba(254, 243, 199, 1)';
                          tagColor.text = isDarkTheme ? 'rgb(252, 211, 77)' : 'rgb(146, 64, 14)';
                          tagColor.border = isDarkTheme ? 'rgba(245, 158, 11, 0.4)' : 'rgba(252, 211, 77, 1)';
                        }
                        
                        return (
                          <span 
                            key={`${project.id}-${tag}-${index}`} 
                            className="px-2.5 py-1 text-xs rounded-full border"
                            style={{ 
                              backgroundColor: tagColor.bg,
                              color: tagColor.text,
                              borderColor: tagColor.border
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })
                    : (
                      <span className="text-xs" style={{ color: themeConfig[currentTheme].textSecondary }}>
                        No tags specified
                      </span>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <FaStar className="mr-1" style={{ color: isDarkTheme ? '#fbbf24' : '#eab308' }} />
                        <span style={{ color: themeConfig[currentTheme].textSecondary }}>{formatNumber(project.stars || 0)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCodeBranch className="mr-1" style={{ color: themeConfig[currentTheme].textSecondary }} />
                        <span style={{ color: themeConfig[currentTheme].textSecondary }}>{formatNumber(project.forks || 0)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaExclamationCircle className="mr-1" style={{ color: isDarkTheme ? '#f87171' : '#ef4444' }} />
                        <span style={{ color: themeConfig[currentTheme].textSecondary }}>{project.openIssues || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 mt-auto" style={{ 
                    borderTop: '1px solid',
                    borderColor: `${themeConfig[currentTheme].textSecondary}15` 
                  }}>
                    <div className="flex items-center gap-2">
                      <img 
                        src={project.owner?.avatar || project.userPhotoURL || `https://ui-avatars.com/api/?name=${project.owner?.name || project.userName || 'U'}`} 
                        alt={(project.owner?.name || project.userName || 'User')} 
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm" style={{ color: themeConfig[currentTheme].textSecondary }}>
                        {project.owner?.name || project.userName || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <motion.a 
                        href={project.repoUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                        style={{ 
                          backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(243, 244, 246, 1)',
                          color: themeConfig[currentTheme].textPrimary
                        }}
                        whileHover={{ 
                          backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 231, 235, 1)',
                          y: -2
                        }}
                      >
                        <FaGithub className="mr-1" /> View Repo
                      </motion.a>
                      {currentUser && (
                        <motion.div>
                          <Link 
                            to={`/messages?recipient=${project.owner?.id || project.userId || ''}&recipientName=${project.owner?.name || project.userName || ''}&subject=Interested in ${project.name}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 text-white"
                            style={{ backgroundColor: themeConfig[currentTheme].accentPrimary }}
                          >
                            <FaEnvelope size={12} /> Contact
                          </Link>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectMatching;