import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFire } from 'react-icons/fa';
import useUserStreak from '../hooks/useUserStreak';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Streak icon component that displays user's current streak
 * and redirects to leaderboard when clicked
 */
const StreakIcon = ({ inDashboard = false }) => {
  const { streak, loading } = useUserStreak();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';

  const handleClick = () => {
    navigate('/leaderboard');
  };

  // Show nothing while loading to avoid UI jumps
  if (loading) {
    return null;
  }

  return (
    <div 
      className="relative group cursor-pointer" 
      onClick={handleClick}
      title={`${streak} day streak - Click to view leaderboard`}
    >
      <div className={`flex items-center p-2 rounded-full ${inDashboard ? 'hover:bg-white/20' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors duration-150`}>
        <FaFire className={`${inDashboard ? 'w-6 h-6 text-yellow-300' : 'w-5 h-5 text-orange-500'}`} />
        <span className={`ml-1 ${inDashboard ? 'font-bold text-base text-white' : 'font-medium text-sm ' + (isDarkMode ? 'text-gray-200' : 'text-gray-700')}`}>
          {streak}
        </span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-10">
        {streak} day streak
      </div>
    </div>
  );
};

export default StreakIcon; 