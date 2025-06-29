import React from 'react';
import { FaPalette } from 'react-icons/fa';
import { useTheme, THEMES, THEME_CONFIG } from '../contexts/ThemeContext';

const ThemeSelector = () => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <div className="bg-theme-secondary p-4 rounded-lg shadow-sm border border-theme-secondary/20">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FaPalette className="mr-2 text-theme-primary" />
        Theme
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Object.values(THEMES).map((theme) => (
          <div 
            key={theme} 
            onClick={() => setTheme(theme)}
            className={`
              cursor-pointer rounded-lg p-4 transition-all duration-200
              ${currentTheme === theme ? 'ring-2 ring-theme-primary scale-105' : 'hover:scale-105'}
            `}
            style={{
              backgroundColor: THEME_CONFIG[theme].bgPrimary,
              color: THEME_CONFIG[theme].textPrimary,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-full h-12 rounded-md mb-2" style={{ backgroundColor: THEME_CONFIG[theme].bgSecondary }}>
                <div className="h-3 w-8 rounded-full mt-2 ml-2" style={{ backgroundColor: THEME_CONFIG[theme].accentPrimary }}></div>
              </div>
              <span className="text-xs font-medium">{THEME_CONFIG[theme].name}</span>
              {currentTheme === theme && (
                <span className="text-xs mt-1" style={{ color: THEME_CONFIG[theme].accentPrimary }}>✓</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector; 