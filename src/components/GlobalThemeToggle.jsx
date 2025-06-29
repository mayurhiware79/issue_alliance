import React from 'react';
import { FaMoon, FaSun, FaDesktop } from 'react-icons/fa';
import { useTheme, THEMES } from '../contexts/ThemeContext';

const GlobalThemeToggle = ({ className = '' }) => {
  const { currentTheme, setTheme, useSystemTheme, toggleSystemTheme } = useTheme();

  // Toggle between light and dark theme quickly
  const toggleDarkMode = () => {
    if (useSystemTheme) {
      toggleSystemTheme(false);
    }
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
  };

  return (
    <button
      aria-label={
        useSystemTheme 
          ? 'System theme (click to switch to manual)' 
          : currentTheme === THEMES.LIGHT 
            ? 'Switch to dark mode' 
            : 'Switch to light mode'
      }
      onClick={toggleDarkMode}
      className={`p-2 rounded-full text-theme-secondary hover:text-theme hover:bg-theme-secondary/20 transition-colors ${className}`}
    >
      {useSystemTheme ? (
        <FaDesktop className="w-5 h-5" />
      ) : currentTheme === THEMES.LIGHT ? (
        <FaMoon className="w-5 h-5" />
      ) : (
        <FaSun className="w-5 h-5" />
      )}
    </button>
  );
};

export default GlobalThemeToggle; 