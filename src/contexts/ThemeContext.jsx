import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

// Define available themes
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  BLUE: 'blue',
  PURPLE: 'purple',
  GREEN: 'green',
};

// Theme configuration
export const THEME_CONFIG = {
  [THEMES.DARK]: {
    name: 'Dark',
    bgPrimary: '#0A0A0A',
    bgSecondary: '#111827',
    bgTertiary: '#0D1425',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    accentPrimary: '#1F3BFF',
    accentSecondary: '#FFA500',
  },
  [THEMES.LIGHT]: {
    name: 'Light',
    bgPrimary: '#F9FAFB',
    bgSecondary: '#F3F4F6',
    bgTertiary: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    accentPrimary: '#1F3BFF',
    accentSecondary: '#FFA500',
  },
  [THEMES.BLUE]: {
    name: 'Blue',
    bgPrimary: '#0F172A',
    bgSecondary: '#1E293B',
    bgTertiary: '#0F3460',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    accentPrimary: '#38BDF8',
    accentSecondary: '#F472B6',
  },
  [THEMES.PURPLE]: {
    name: 'Purple',
    bgPrimary: '#13111C',
    bgSecondary: '#1F1A2E',
    bgTertiary: '#2D2B55',
    textPrimary: '#F5F3FF',
    textSecondary: '#DDD6FE',
    accentPrimary: '#8B5CF6',
    accentSecondary: '#EC4899',
  },
  [THEMES.GREEN]: {
    name: 'Green',
    bgPrimary: '#0F1922',
    bgSecondary: '#132E32',
    bgTertiary: '#0D372C',
    textPrimary: '#ECFDF5',
    textSecondary: '#A7F3D0',
    accentPrimary: '#10B981',
    accentSecondary: '#F59E0B',
  },
};

// Create the context
const ThemeContext = createContext();

// Hook for using theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(THEMES.LIGHT);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [useSystemTheme, setUseSystemTheme] = useState(false);
  const { currentUser } = useAuth();

  // Check for system dark mode preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEMES.DARK;
    }
    return THEMES.LIGHT;
  };

  // Watch for system theme changes
  useEffect(() => {
    if (!useSystemTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setCurrentTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [useSystemTheme]);

  // Load theme preference from localStorage and Firestore
  useEffect(() => {
    const loadTheme = async () => {
      // First try from localStorage
      const localTheme = localStorage.getItem('theme');
      const localUseSystem = localStorage.getItem('useSystemTheme') === 'true';

      // Set system theme preference
      setUseSystemTheme(localUseSystem);

      // If using system theme, set the theme accordingly
      if (localUseSystem) {
        setCurrentTheme(getSystemTheme());
        setThemeLoaded(true);
        return;
      }

      // If user is logged in, try to get from Firestore
      if (currentUser) {
        try {
          const settingsRef = doc(db, 'user_settings', currentUser.uid);
          const settingsDoc = await getDoc(settingsRef);

          if (settingsDoc.exists()) {
            const data = settingsDoc.data();

            // Check if useSystemTheme is set in Firestore
            if (data.useSystemTheme !== undefined) {
              setUseSystemTheme(data.useSystemTheme);
              localStorage.setItem('useSystemTheme', data.useSystemTheme.toString());

              if (data.useSystemTheme) {
                setCurrentTheme(getSystemTheme());
                setThemeLoaded(true);
                return;
              }
            }

            // Check if theme is set in Firestore
            if (data.theme && Object.values(THEMES).includes(data.theme)) {
              setCurrentTheme(data.theme);
              localStorage.setItem('theme', data.theme);
              setThemeLoaded(true);
              return;
            }
          }

          // If no valid Firestore settings but localStorage has valid theme
          if (localTheme && Object.values(THEMES).includes(localTheme)) {
            setCurrentTheme(localTheme);
            // Save to Firestore
            await setDoc(settingsRef, {
              theme: localTheme,
              useSystemTheme: localUseSystem,
            }, { merge: true });
          } else {
            // Default to light theme if nothing found
            setCurrentTheme(THEMES.LIGHT);
            localStorage.setItem('theme', THEMES.LIGHT);
            await setDoc(settingsRef, {
              theme: THEMES.LIGHT,
              useSystemTheme: false,
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error loading theme from Firestore:', error);

          // Fallback to localStorage or default
          if (localTheme && Object.values(THEMES).includes(localTheme)) {
            setCurrentTheme(localTheme);
          } else {
            setCurrentTheme(THEMES.DARK);
            localStorage.setItem('theme', THEMES.DARK);
          }
        }
      } else {
        // For non-logged in users, just use localStorage or default
        if (localTheme && Object.values(THEMES).includes(localTheme)) {
          setCurrentTheme(localTheme);
        } else {
          localStorage.setItem('theme', THEMES.DARK);
        }
      }

      setThemeLoaded(true);
    };

    loadTheme();
  }, [currentUser]);

  // Save theme preference to localStorage and Firestore
  const setTheme = async (theme) => {
    if (!Object.values(THEMES).includes(theme)) {
      console.error('Invalid theme:', theme);
      return;
    }

    // If using system theme, disable it first
    if (useSystemTheme) {
      setUseSystemTheme(false);
      localStorage.setItem('useSystemTheme', 'false');
    }

    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);

    // If user is logged in, save to Firestore
    if (currentUser) {
      try {
        const settingsRef = doc(db, 'user_settings', currentUser.uid);
        await setDoc(settingsRef, {
          theme,
          useSystemTheme: false,
        }, { merge: true });
      } catch (error) {
        console.error('Error saving theme to Firestore:', error);
      }
    }
  };

  // Toggle system theme preference
  const toggleSystemTheme = async (value) => {
    const useSystem = value !== undefined ? value : !useSystemTheme;

    setUseSystemTheme(useSystem);
    localStorage.setItem('useSystemTheme', useSystem.toString());

    if (useSystem) {
      // Apply system theme
      const systemTheme = getSystemTheme();
      setCurrentTheme(systemTheme);
    }

    // If user is logged in, save to Firestore
    if (currentUser) {
      try {
        const settingsRef = doc(db, 'user_settings', currentUser.uid);
        await setDoc(settingsRef, {
          useSystemTheme: useSystem,
          // Save current theme to return to when disabling system theme
          theme: currentTheme,
        }, { merge: true });
      } catch (error) {
        console.error('Error saving theme settings to Firestore:', error);
      }
    }
  };

  // Apply theme to the document body
  useEffect(() => {
    if (!themeLoaded) return;

    // Remove all theme classes
    document.body.classList.remove(...Object.values(THEMES));

    // Add current theme class
    document.body.classList.add(currentTheme);

    // Update meta theme color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', THEME_CONFIG[currentTheme].bgPrimary);
    }
  }, [currentTheme, themeLoaded]);

  const value = {
    currentTheme,
    setTheme,
    themeConfig: THEME_CONFIG,
    themes: THEMES,
    useSystemTheme,
    toggleSystemTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 