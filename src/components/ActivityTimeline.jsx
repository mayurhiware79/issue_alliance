import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';

const ActivityTimeline = ({ activities = [] }) => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';

  if (!activities || activities.length === 0) {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'}`}>
        <p className="text-center">No recent activities found.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Recent Activity
      </h3>
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative"
          >
            {/* Timeline connector */}
            {index < activities.length - 1 && (
              <div 
                className={`absolute top-6 left-3 w-0.5 h-full -z-10 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
            )}
            
            <div className="flex items-start gap-3">
              {/* Dot */}
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'
                }`}
              >
                <div 
                  className={`w-3 h-3 rounded-full ${
                    isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'
                  }`}
                />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {activity.title}
                  </h4>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {typeof activity.date === 'string' 
                      ? activity.date 
                      : activity.date instanceof Date 
                        ? format(activity.date, 'MMM d, yyyy')
                        : 'Unknown date'}
                  </span>
                </div>
                
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activity.description}
                </p>
                
                {activity.details && (
                  <div 
                    className={`mt-2 p-3 text-sm rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-700/50 text-gray-300' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {activity.details}
                  </div>
                )}
                
                {activity.link && (
                  <a 
                    href={activity.link}
                    className={`mt-2 inline-block text-sm font-medium ${
                      isDarkMode 
                        ? 'text-indigo-400 hover:text-indigo-300' 
                        : 'text-indigo-600 hover:text-indigo-800'
                    }`}
                  >
                    View details →
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline; 