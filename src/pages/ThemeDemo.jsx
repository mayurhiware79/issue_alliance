import React from 'react';
import { useTheme, THEMES, THEME_CONFIG } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import ThemeSelector from '../components/ThemeSelector';
import { FaCode, FaInfo, FaMoon, FaSun, FaDesktop, FaPalette } from 'react-icons/fa';

const ThemeDemo = () => {
  const { currentTheme, useSystemTheme } = useTheme();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-theme">Theme System Demo</h1>
        <div className="flex items-center space-x-4">
          <span className="text-theme-secondary text-sm">
            {useSystemTheme ? (
              <div className="flex items-center">
                <FaDesktop className="mr-2" />
                System theme
              </div>
            ) : (
              <div className="flex items-center">
                <FaPalette className="mr-2" /> 
                {THEME_CONFIG[currentTheme].name}
              </div>
            )}
          </span>
          <ThemeToggle variant="dropdown" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-theme-secondary p-6 rounded-xl shadow-sm border border-theme-secondary/20">
            <h2 className="text-xl font-semibold mb-4 text-theme">Theme Toggle Component</h2>
            <p className="text-theme-secondary mb-6">
              The ThemeToggle component provides a quick way to switch between themes. It can be used in two formats:
            </p>
            
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-theme-secondary/20">
                <span className="text-theme">Icon Toggle (Minimal)</span>
                <ThemeToggle variant="icon" />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-theme-secondary/20">
                <span className="text-theme">Dropdown Menu (Full)</span>
                <ThemeToggle variant="dropdown" />
              </div>
            </div>
          </div>

          <div className="bg-theme-secondary p-6 rounded-xl shadow-sm border border-theme-secondary/20">
            <h2 className="text-xl font-semibold mb-4 text-theme">Design Elements</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-theme font-medium">Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-theme-primary text-white rounded-md hover:opacity-80">Primary</button>
                  <button className="px-4 py-2 bg-theme-accent text-white rounded-md hover:opacity-80">Accent</button>
                  <button className="px-4 py-2 border border-theme-secondary text-theme rounded-md hover:bg-theme-secondary/20">Outline</button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-theme font-medium">Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="px-2 py-1 bg-theme-primary/10 text-theme-primary text-xs rounded-full">Primary</span>
                  <span className="px-2 py-1 bg-theme-accent/10 text-theme-accent text-xs rounded-full">Accent</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300 text-xs rounded-full">Success</span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-300 text-xs rounded-full">Error</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-theme font-medium">Cards</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-theme rounded-lg border border-theme-secondary/10 shadow-sm">
                    <h4 className="text-theme text-sm font-medium">Card 1</h4>
                    <p className="text-theme-secondary text-xs">Regular card example</p>
                  </div>
                  <div className="p-4 bg-theme-primary/5 rounded-lg border border-theme-primary/10 shadow-sm">
                    <h4 className="text-theme-primary text-sm font-medium">Card 2</h4>
                    <p className="text-theme-secondary text-xs">Highlighted card</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-theme-secondary p-6 rounded-xl shadow-sm border border-theme-secondary/20">
            <h2 className="text-xl font-semibold mb-4 text-theme">Theme Implementation</h2>
            <p className="text-theme-secondary mb-4">
              This demo uses CSS variables with a class-based theme system. The ThemeContext manages which theme class is applied to the body element.
            </p>
            
            <div className="bg-theme-accent/5 p-4 rounded-lg text-sm font-mono text-theme-accent">
              <pre>{`// Apply theme class to body
document.body.classList.add('${currentTheme}');

// Use CSS variables in styles
color: var(--color-text);
background: var(--color-background);`}</pre>
            </div>
          </div>
          
          <div className="bg-theme-secondary p-6 rounded-xl shadow-sm border border-theme-secondary/20">
            <h2 className="text-xl font-semibold mb-4 text-theme">Theme Configuration</h2>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-theme-secondary text-left pb-2">Property</th>
                  <th className="text-theme-secondary text-left pb-2">Value</th>
                  <th className="text-theme-secondary text-left pb-2">Preview</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-theme py-2 border-t border-theme-secondary/10">Background</td>
                  <td className="text-theme-secondary py-2 border-t border-theme-secondary/10 font-mono">var(--color-background)</td>
                  <td className="py-2 border-t border-theme-secondary/10">
                    <div className="w-8 h-8 rounded-md bg-theme"></div>
                  </td>
                </tr>
                <tr>
                  <td className="text-theme py-2 border-t border-theme-secondary/10">Background Secondary</td>
                  <td className="text-theme-secondary py-2 border-t border-theme-secondary/10 font-mono">var(--color-background-secondary)</td>
                  <td className="py-2 border-t border-theme-secondary/10">
                    <div className="w-8 h-8 rounded-md bg-theme-secondary"></div>
                  </td>
                </tr>
                <tr>
                  <td className="text-theme py-2 border-t border-theme-secondary/10">Text</td>
                  <td className="text-theme-secondary py-2 border-t border-theme-secondary/10 font-mono">var(--color-text)</td>
                  <td className="py-2 border-t border-theme-secondary/10">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center bg-theme-secondary text-theme">A</div>
                  </td>
                </tr>
                <tr>
                  <td className="text-theme py-2 border-t border-theme-secondary/10">Text Secondary</td>
                  <td className="text-theme-secondary py-2 border-t border-theme-secondary/10 font-mono">var(--color-text-secondary)</td>
                  <td className="py-2 border-t border-theme-secondary/10">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center bg-theme-secondary text-theme-secondary">A</div>
                  </td>
                </tr>
                <tr>
                  <td className="text-theme py-2 border-t border-theme-secondary/10">Primary</td>
                  <td className="text-theme-secondary py-2 border-t border-theme-secondary/10 font-mono">var(--color-primary)</td>
                  <td className="py-2 border-t border-theme-secondary/10">
                    <div className="w-8 h-8 rounded-md bg-theme-primary"></div>
                  </td>
                </tr>
                <tr>
                  <td className="text-theme py-2 border-t border-theme-secondary/10">Accent</td>
                  <td className="text-theme-secondary py-2 border-t border-theme-secondary/10 font-mono">var(--color-accent)</td>
                  <td className="py-2 border-t border-theme-secondary/10">
                    <div className="w-8 h-8 rounded-md bg-theme-accent"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ThemeSelector />
      </div>
    </div>
  );
};

export default ThemeDemo;