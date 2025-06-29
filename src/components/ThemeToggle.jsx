import React, { useState } from 'react';
import { FaMoon, FaSun, FaPalette, FaDesktop } from 'react-icons/fa';
import { useTheme, THEMES } from '../contexts/ThemeContext';

const ThemeToggle = ({ variant = 'icon' }) => {
  const { currentTheme, setTheme, themeConfig, themes, useSystemTheme, toggleSystemTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Toggle between light and dark theme quickly
  const toggleDarkMode = () => {
    if (useSystemTheme) {
      toggleSystemTheme(false);
    }
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
  };

  // Select a specific theme
  const handleThemeChange = (theme) => {
    setTheme(theme);
    setShowThemeMenu(false);
  };

  // Toggle system theme
  const handleSystemThemeToggle = () => {
    toggleSystemTheme();
    setShowThemeMenu(false);
  };

  // Handle click outside to close dropdown
  const handleClickOutside = () => {
    if (showThemeMenu) {
      setShowThemeMenu(false);
    }
  };

  // Simple icon toggle for quick light/dark switch
  if (variant === 'icon') {
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
        className="p-2 rounded-full text-theme-secondary hover:text-theme hover:bg-theme-secondary/20 transition-colors"
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
  }

  // Full dropdown for all themes
  return (
    <div className="relative">
      <button
        aria-label="Change theme"
        onClick={() => setShowThemeMenu(!showThemeMenu)}
        className="flex items-center gap-1 p-2 rounded-md text-theme-secondary hover:text-theme hover:bg-theme-secondary/20 transition-colors"
      >
        <FaPalette className="w-5 h-5" />
        {variant === 'full' && (
          <span className="ml-2 text-sm font-medium">Theme</span>
        )}
      </button>

      {showThemeMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={handleClickOutside}
          />
          <div className="absolute right-0 mt-1 w-56 bg-theme-secondary border border-theme-secondary/20 rounded-md shadow-lg overflow-hidden z-20">
            <div className="p-2">
              <div className="text-sm font-medium text-theme p-2">Select Theme</div>
              
              {/* System theme option */}
              <button
                onClick={handleSystemThemeToggle}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md mb-2 border-b border-theme-secondary/20 pb-3
                  ${useSystemTheme ? 'bg-theme-primary/10 text-theme-primary' : 'text-theme hover:bg-theme-secondary/50'}
                `}
              >
                <FaDesktop className="w-4 h-4 mr-3 flex-shrink-0" />
                Use System Theme
              </button>
              
              {/* Theme options */}
              <div className="space-y-1">
                {Object.values(THEMES).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md 
                      ${(!useSystemTheme && currentTheme === theme) ? 'bg-theme-primary/10 text-theme-primary' : 'text-theme hover:bg-theme-secondary/50'}
                      ${useSystemTheme ? 'opacity-75' : ''}
                    `}
                  >
                    <div 
                      className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                      style={{ backgroundColor: themeConfig[theme].accentPrimary }}
                    />
                    {themeConfig[theme].name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle; 