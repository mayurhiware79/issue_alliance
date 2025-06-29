import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * StatsCard component for displaying summary statistics
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Main value to display
 * @param {string} props.description - Optional description
 * @param {React.ReactNode} props.icon - Optional icon
 * @param {string} props.color - Card accent color (default: 'blue')
 */
function StatsCard({ title, value, description, icon, color = 'blue' }) {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';

  // Map color names to Tailwind classes
  const colorMap = {
    blue: {
      light: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: 'text-blue-500'
      },
      dark: {
        bg: 'bg-blue-900/30',
        text: 'text-blue-300',
        icon: 'text-blue-400'
      }
    },
    green: {
      light: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: 'text-green-500'
      },
      dark: {
        bg: 'bg-green-900/30',
        text: 'text-green-300',
        icon: 'text-green-400'
      }
    },
    purple: {
      light: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: 'text-purple-500'
      },
      dark: {
        bg: 'bg-purple-900/30',
        text: 'text-purple-300',
        icon: 'text-purple-400'
      }
    },
    red: {
      light: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: 'text-red-500'
      },
      dark: {
        bg: 'bg-red-900/30',
        text: 'text-red-300',
        icon: 'text-red-400'
      }
    },
    yellow: {
      light: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: 'text-yellow-500'
      },
      dark: {
        bg: 'bg-yellow-900/30',
        text: 'text-yellow-300',
        icon: 'text-yellow-400'
      }
    },
  };

  const themeColors = isDarkMode ? colorMap[color].dark : colorMap[color].light;

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-5 h-full`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{value || 0}</p>
          {description && (
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
          )}
        </div>
        
        {icon && (
          <div className={`${themeColors.bg} p-3 rounded-full`}>
            {React.cloneElement(icon, { className: themeColors.icon, size: 20 })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsCard; 