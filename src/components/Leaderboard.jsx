import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaTrophy, FaMedal, FaAward, FaInfoCircle, FaArrowUp, FaUserCircle, FaTimes, FaGithub, FaStar, FaCode, FaCheckCircle, FaFire, FaCalendarAlt, FaHistory } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import ShareAchievementButton from './ShareAchievementButton';
import { useToast } from '../contexts/ToastContext';

const Leaderboard = () => {
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const { currentUser } = useAuth();
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [timeframe, setTimeframe] = useState('allTime');
  const { currentTheme } = useTheme();
  const darkMode = currentTheme === 'dark';
  const { showSuccess, showError } = useToast();

  // Color themes
  const themes = {
    light: {
      primary: 'bg-blue-600',
      secondary: 'bg-blue-500',
      accent: 'bg-yellow-400',
      text: 'text-gray-800',
      background: 'bg-gray-50',
      card: 'bg-white',
      border: 'border-gray-200'
    },
    dark: {
      primary: 'bg-blue-700',
      secondary: 'bg-blue-600',
      accent: 'bg-yellow-500',
      text: 'text-gray-100',
      background: 'bg-gray-900',
      card: 'bg-gray-800',
      border: 'border-gray-700'
    }
  };

  const currentThemeColors = themes[darkMode ? 'dark' : 'light'];

  useEffect(() => {
    fetchUserStats();
  }, [timeframe]);

  const fetchUserStats = async () => {
    setLoading(true);
    setError(null); // Reset error state when starting a new fetch
    
    try {
      let usersQuery;
      let rankedUsers = [];
      
      // Simplify queries for weekly and monthly to avoid index issues
      if (timeframe === 'weekly' || timeframe === 'monthly') {
        // First fetch all users sorted by points (this works without complex indexes)
        usersQuery = query(
          collection(db, 'userStats'),
          orderBy('points', 'desc'),
          limit(100) // Fetch more to filter client-side
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        // Client-side filtering based on date
        const filteredUsers = [];
        const now = new Date();
        const cutoffDate = timeframe === 'weekly' 
          ? new Date(now.setDate(now.getDate() - 7)) 
          : new Date(now.setMonth(now.getMonth() - 1));
        
        querySnapshot.docs.forEach(doc => {
          const userData = doc.data();
          // Check if lastUpdated is present and more recent than cutoff date
          if (userData.lastUpdated && 
              userData.lastUpdated.toDate instanceof Function) {
            const lastUpdatedDate = userData.lastUpdated.toDate();
            if (lastUpdatedDate >= cutoffDate) {
              filteredUsers.push({
                id: doc.id,
                ...userData
              });
            }
          } else {
            // Include users without lastUpdated timestamp as fallback
            filteredUsers.push({
              id: doc.id,
              ...userData
            });
          }
        });
        
        // Sort filtered users by points and assign ranks
        rankedUsers = filteredUsers
          .sort((a, b) => b.points - a.points)
          .map((user, index) => ({
            ...user,
            rank: index + 1
          }));
        
        // Limit to top 50
        rankedUsers = rankedUsers.slice(0, 50);
      } else {
        // All-time query (works fine as is)
        usersQuery = query(
          collection(db, 'userStats'),
          orderBy('points', 'desc'),
          limit(50)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        rankedUsers = querySnapshot.docs.map((doc, index) => {
          const userData = doc.data();
          const rank = index + 1;
          
          if (currentUser && userData.uid === currentUser.uid) {
            setCurrentUserRank(rank);
          }
          
          return {
            id: doc.id,
            rank,
            ...userData,
          };
        });
      }
      
      // Set user stats from ranked users
      setUserStats(rankedUsers);
      
      // Set current user rank if user is logged in but not in top rankings
      if (currentUser && !rankedUsers.some(user => user.uid === currentUser.uid)) {
        try {
          const currentUserDoc = await getDoc(doc(db, 'userStats', currentUser.uid));
          if (currentUserDoc.exists()) {
            const currentUserData = currentUserDoc.data();
            
            // For weekly/monthly timeframes, we need different logic
            if (timeframe !== 'allTime') {
              // Just count how many filtered users have more points
              const higherRankedUsers = rankedUsers.filter(user => 
                user.points > currentUserData.points
              );
              setCurrentUserRank(higherRankedUsers.length + 1);
            } else {
              // For all-time, use the same query as before
              const higherPointsQuery = query(
                collection(db, 'userStats'),
                where('points', '>', currentUserData.points)
              );
              const higherPointsSnapshot = await getDocs(higherPointsQuery);
              const currentRank = higherPointsSnapshot.size + 1;
              setCurrentUserRank(currentRank);
            }
          }
        } catch (err) {
          console.error('Error fetching current user rank:', err);
          // Don't set error state here to prevent disrupting the whole UI
        }
      }
      
    } catch (err) {
      console.error('Error fetching user stats:', err);
      // Provide a more specific error message
      if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        setError('This query requires a Firestore index. Using a simplified version instead.');
        // Try a fallback simple query if index error
        try {
          const fallbackQuery = query(
            collection(db, 'userStats'),
            orderBy('points', 'desc'),
            limit(50)
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const fallbackUsers = fallbackSnapshot.docs.map((doc, index) => ({
            id: doc.id,
            rank: index + 1,
            ...doc.data()
          }));
          
          setUserStats(fallbackUsers);
          setError(`Showing all-time leaderboard instead of ${timeframe === 'weekly' ? 'weekly' : 'monthly'}`);
        } catch (fallbackErr) {
          console.error('Even fallback query failed:', fallbackErr);
          setError('Failed to load leaderboard data. Please try again later.');
        }
      } else {
        setError('Failed to load leaderboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getPodiumStyle = (position) => {
    const baseStyle = 'relative overflow-hidden rounded-t-lg shadow-lg';
    
    switch (position) {
      case 1:
        return {
          height: '160px',
          className: `${baseStyle} bg-gradient-to-b from-yellow-400 to-yellow-500 ${darkMode ? 'shadow-yellow-500/30' : 'shadow-yellow-500/20'}`,
          glow: 'from-yellow-200 via-yellow-100 to-yellow-200'
        };
      case 2:
        return {
          height: '120px',
          className: `${baseStyle} bg-gradient-to-b from-gray-300 to-gray-400 ${darkMode ? 'shadow-gray-500/20' : 'shadow-gray-400/20'}`,
          glow: 'from-gray-100 via-gray-50 to-gray-100'
        };
      case 3:
        return {
          height: '100px',
          className: `${baseStyle} bg-gradient-to-b from-amber-600 to-amber-700 ${darkMode ? 'shadow-amber-700/20' : 'shadow-amber-600/20'}`,
          glow: 'from-amber-200 via-amber-100 to-amber-200'
        };
      default:
        return {
          height: '80px',
          className: `${baseStyle} bg-gray-200`,
          glow: ''
        };
    }
  };

  const renderTrophy = (position) => {
    const iconSize = position === 1 ? 'text-3xl' : 'text-2xl';
    const topPosition = position === 1 ? '-top-12' : position === 2 ? '-top-10' : '-top-8';
    
    switch (position) {
      case 1:
        return <FaTrophy className={`text-yellow-600 ${iconSize} absolute ${topPosition} left-1/2 transform -translate-x-1/2 animate-bounce`} />;
      case 2:
        return <FaMedal className={`text-gray-600 ${iconSize} absolute ${topPosition} left-1/2 transform -translate-x-1/2`} />;
      case 3:
        return <FaAward className={`text-amber-800 ${iconSize} absolute ${topPosition} left-1/2 transform -translate-x-1/2`} />;
      default:
        return null;
    }
  };

  const renderLeaderboardCard = (user, showRank = true) => {
    if (!user || !user.displayName) return null;

    const isCurrentUser = currentUser && user.uid === currentUser.uid;
    const rankClass = isCurrentUser ? `${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'} ring-2 ring-blue-500` : '';

    return (
      <motion.div 
        key={user.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center p-4 rounded-xl ${rankClass} ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-sm cursor-pointer transition-all duration-200 mb-3`}
        onClick={() => handleUserClick(user)}
      >
        {showRank && (
          <div className="flex-shrink-0 w-10 text-center">
            {user.rank <= 3 ? (
              <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${user.rank === 1 ? 'bg-yellow-100 text-yellow-800' : user.rank === 2 ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}`}>
                {user.rank}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 font-medium">{user.rank}</span>
            )}
          </div>
        )}
        
        <div className="flex-shrink-0 mx-3">
          {user.photoURL ? (
            <motion.img 
              src={user.photoURL} 
              alt={user.displayName}
              className="h-12 w-12 rounded-full border-2 border-white dark:border-gray-700 shadow"
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            />
          ) : (
            <FaUserCircle className="h-12 w-12 text-gray-400" />
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.displayName}</h3>
          <div className="flex items-center space-x-3 mt-1">
            <span className="flex items-center text-xs">
              <FaStar className={`mr-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{user.streak || 0} day streak</span>
            </span>
            <span className="flex items-center text-xs">
              <FaCheckCircle className={`mr-1 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{user.completedIssues || 0} completed</span>
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-2">
          <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-blue-800' : 'bg-blue-100'} flex items-center`}>
            <span className={`font-bold ${darkMode ? 'text-blue-100' : 'text-blue-800'}`}>{user.points || 0}</span>
            <span className={`ml-1 text-xs ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>pts</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderBadgesList = (badges) => {
    if (!badges || badges.length === 0) {
      return <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>No badges earned yet</p>;
    }

    return (
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge, index) => (
          <motion.div 
            key={index} 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
            className="flex flex-col items-center"
          >
            {badge.imageUrl ? (
              <img 
                src={badge.imageUrl} 
                alt={badge.name} 
                className="h-16 w-16 mb-1 rounded-full border-2 border-yellow-400 p-1"
              />
            ) : (
              <div className={`flex items-center justify-center h-16 w-16 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-1 border-2 border-yellow-400 p-1`}>
                <FaTrophy className="text-yellow-500 text-xl" />
              </div>
            )}
            <span className={`text-xs font-medium text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{badge.name}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderPodium = () => {
    const topUsers = userStats.slice(0, 3);
    while (topUsers.length < 3) {
      topUsers.push(null);
    }
    
    const orderedForDisplay = [topUsers[1], topUsers[0], topUsers[2]];
    
    return (
      <div className="flex justify-center items-end space-x-4 md:space-x-8 mb-8">
        {orderedForDisplay.map((user, index) => {
          const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
          const { height, className, glow } = getPodiumStyle(actualRank);
          
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col items-center"
            >
              {user && (
                <motion.div 
                  className="flex flex-col items-center mb-2"
                  whileHover={{ y: -5 }}
                >
                  <div className="relative">
                    {user.photoURL ? (
                      <motion.img 
                        src={user.photoURL} 
                        alt={user.displayName}
                        className="h-16 w-16 rounded-full border-4 border-white dark:border-gray-800 shadow-lg z-10"
                        whileHover={{ scale: 1.1 }}
                      />
                    ) : (
                      <FaUserCircle className="h-16 w-16 text-gray-400" />
                    )}
                    <div className={`absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${actualRank === 1 ? 'bg-yellow-600' : actualRank === 2 ? 'bg-gray-600' : 'bg-amber-800'}`}>
                      {actualRank}
                    </div>
                  </div>
                  <span className={`mt-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.displayName}</span>
                  <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{user.points} pts</span>
                </motion.div>
              )}
              
              <div className={`w-20 md:w-24 ${className}`} style={{ height }}>
                {renderTrophy(actualRank)}
                {actualRank === 1 && glow && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${glow} opacity-30 animate-shimmer`} style={{ backgroundSize: '200% 100%' }}></div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderLeaderboardList = () => {
    const usersToRender = userStats.slice(3);
    
    if (usersToRender.length === 0) {
      return (
        <div className={`p-8 text-center rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No data available yet</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {usersToRender.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {renderLeaderboardCard(user)}
          </motion.div>
        ))}
      </div>
    );
  };
  
  // Function to get current user's data for sharing
  const getCurrentUserData = () => {
    if (!currentUser) return { username: null, rank: 1, points: 0 };
    
    // Find the current user in the stats
    const userStat = userStats.find(u => u.uid === currentUser.uid);
    
    if (userStat) {
      return {
        username: userStat.displayName || currentUser.displayName,
        rank: userStat.rank || currentUserRank || 1,
        points: userStat.points || 0
      };
    }
    
    // Return defaults if user data not available
    return {
      username: currentUser.displayName,
      rank: currentUserRank || 1,
      points: 0
    };
  };
  
  const handleShareSuccess = (imageUrl) => {
    showSuccess('Image uploaded successfully and ready to share!');
  };
  
  const handleShareError = (errorMessage) => {
    showError(`Failed to share: ${errorMessage}`);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-8`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`max-w-4xl mx-auto rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl overflow-hidden`}
        id="leaderboard-section"
      >
        {/* Header */}
        <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <motion.h2 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ type: 'spring' }}
              className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Leaderboard
            </motion.h2>
            <div className="flex space-x-3">
              {/* Get the user data for sharing */}
              {(() => {
                const userData = getCurrentUserData();
                return (
                  <ShareAchievementButton 
                    username={userData.username || (selectedUser?.displayName)} 
                    rank={userData.rank}
                    points={userData.points}
                    onSuccess={handleShareSuccess}
                    onError={handleShareError}
                  />
                );
              })()}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-100'}`}
                onClick={() => setShowInfoModal(true)}
              >
                <FaInfoCircle className="text-xl" />
              </motion.button>
            </div>
          </div>
          
          {/* Timeframe selector */}
          <motion.div 
            className="flex mt-4 space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => setTimeframe('allTime')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === 'allTime' ? 
                `${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}` : 
                `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
            >
              <FaHistory className="mr-2" />
              All Time
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === 'monthly' ? 
                `${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}` : 
                `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
            >
              <FaCalendarAlt className="mr-2" />
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeframe === 'weekly' ? 
                `${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}` : 
                `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
            >
              <FaFire className="mr-2" />
              Weekly
            </button>
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading leaderboard...</p>
            </motion.div>
          ) : error ? (
            <div className={`p-8 text-center rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <p className={darkMode ? 'text-red-400' : 'text-red-600'}>{error}</p>
            </div>
          ) : (
            <>
              {renderPodium()}
              
              {currentUser && currentUserRank > 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your Ranking</h3>
                  {renderLeaderboardCard({
                    ...userStats.find(u => u.uid === currentUser.uid) || {},
                    rank: currentUserRank
                  })}
                </motion.div>
              )}
              
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Top Contributors</h3>
              {renderLeaderboardList()}
            </>
          )}
        </div>
      </motion.div>
      
      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative rounded-2xl shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6`}
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`absolute top-4 right-4 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => setShowInfoModal(false)}
              >
                <FaTimes className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </motion.button>
              
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>How Rankings Work</h2>
              
              <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div>
                  <h3 className="font-semibold flex items-center">
                    <FaStar className={`mr-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                    Points System
                  </h3>
                  <ul className="mt-2 space-y-2 pl-6">
                    <li className="flex items-start">
                      <span className={`inline-block h-2 w-2 rounded-full mt-2 mr-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                      <span><strong>Completing Daily Issues:</strong> +10 points</span>
                    </li>
                    <li className="flex items-start">
                      <span className={`inline-block h-2 w-2 rounded-full mt-2 mr-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                      <span><strong>Daily Streak Bonus:</strong> +2 points per day of streak</span>
                    </li>
                    <li className="flex items-start">
                      <span className={`inline-block h-2 w-2 rounded-full mt-2 mr-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                      <span><strong>Earning Badges:</strong> +5 to +20 points (varies by badge)</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold flex items-center">
                    <FaCalendarAlt className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    Timeframes
                  </h3>
                  <ul className="mt-2 space-y-2 pl-6">
                    <li className="flex items-start">
                      <span className={`inline-block h-2 w-2 rounded-full mt-2 mr-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                      <span><strong>All Time:</strong> Total accumulated points since you joined</span>
                    </li>
                    <li className="flex items-start">
                      <span className={`inline-block h-2 w-2 rounded-full mt-2 mr-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                      <span><strong>Monthly:</strong> Points earned in the current calendar month</span>
                    </li>
                    <li className="flex items-start">
                      <span className={`inline-block h-2 w-2 rounded-full mt-2 mr-2 ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                      <span><strong>Weekly:</strong> Points earned in the last 7 days</span>
                    </li>
                  </ul>
                </div>
                
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-4`}>
                  Leaderboards update in real-time as users complete challenges and earn points.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* User Profile Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative rounded-2xl shadow-xl max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`absolute top-4 right-4 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => setShowUserModal(false)}
              >
                <FaTimes className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </motion.button>
              
              {/* Header */}
              <div className={`p-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center`}>
                {selectedUser.photoURL ? (
                  <motion.img 
                    src={selectedUser.photoURL} 
                    alt={selectedUser.displayName}
                    className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  />
                ) : (
                  <FaUserCircle className="h-20 w-20 text-gray-400" />
                )}
                
                <div className="ml-4">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.displayName}</h2>
                  {selectedUser.githubUsername && (
                    <a 
                      href={`https://github.com/${selectedUser.githubUsername}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} mt-1`}
                    >
                      <FaGithub className="mr-2" /> {selectedUser.githubUsername}
                    </a>
                  )}
                  <div className={`mt-2 px-3 py-1 rounded-full inline-flex items-center ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <span className={`font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>#{selectedUser.rank}</span>
                    <span className={`ml-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Rank</span>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 p-6 border-b dark:border-gray-700">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'} mb-2`}>
                    <FaStar className={`text-xl ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Streak</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.streak || 0} days</span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} mb-2`}>
                    <FaCheckCircle className={`text-xl ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.completedIssues || 0}</span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} mb-2`}>
                    <FaCode className={`text-xl ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Points</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.points || 0}</span>
                </motion.div>
              </div>
              
              {/* Badges */}
              <div className="p-6">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Badges Earned</h3>
                {renderBadgesList(selectedUser.badges)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Leaderboard;