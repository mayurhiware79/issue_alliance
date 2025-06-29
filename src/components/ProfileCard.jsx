import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const ProfileCard = ({ user, isLoading = false }) => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';

  if (isLoading) {
    return (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-600 h-14 w-14"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded w-3/4`}></div>
            <div className={`space-y-2`}>
              <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
              <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded w-5/6`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-md`}>
        <p className="text-center">User profile not found</p>
      </div>
    );
  }

  const {
    name,
    username,
    avatar,
    bio,
    stats = {},
    skills = [],
    level = { title: 'Newcomer', progress: 20 },
  } = user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-lg overflow-hidden shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      {/* Cover Photo */}
      <div className={`h-32 w-full ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-500'}`}></div>
      
      {/* Profile Info */}
      <div className="px-6 py-4 relative">
        {/* Avatar */}
        <div className="absolute -top-12 left-6 border-4 rounded-full overflow-hidden border-white bg-white">
          <img 
            src={avatar || 'https://via.placeholder.com/80'} 
            alt={`${name}'s avatar`}
            className="h-24 w-24 object-cover"
          />
        </div>
        
        <div className="mt-14">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{name}</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>@{username}</p>
          {bio && <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{bio}</p>}
          
          {/* Level Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{level.title}</span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{level.progress}%</span>
            </div>
            <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : ''}`}>
              <div 
                className="bg-indigo-600 h-2 rounded-full" 
                style={{ width: `${level.progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Stats */}
          {stats && Object.keys(stats).length > 0 && (
            <div className={`grid grid-cols-3 gap-2 mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <span className={`block text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{value}</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{key}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Skills */}
          {skills && skills.length > 0 && (
            <div className="mt-4">
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span 
                    key={index}
                    className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className={`px-6 py-3 ${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
        <button className={`text-sm font-medium ${
          isDarkMode 
            ? 'text-indigo-400 hover:text-indigo-300' 
            : 'text-indigo-600 hover:text-indigo-800'
        }`}>
          View Full Profile
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileCard; 