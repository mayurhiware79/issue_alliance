import React, { useState, useEffect } from 'react';
import { FaSpinner, FaCheck, FaBell, FaUser, FaEnvelope, FaGlobe, FaMoon, FaSun, FaUserShield, FaPalette, FaDesktop } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, THEMES, THEME_CONFIG } from '../contexts/ThemeContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function Settings() {
  const { currentUser } = useAuth();
  const { currentTheme, setTheme, themes, useSystemTheme, toggleSystemTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    browserNotifications: true,
    notifyOnNewMessage: true,
    notifyOnProjectInterest: true,
    
    // Display settings
    useSystemTheme: false,
    compactView: false,
    fontSize: 'medium',
    
    // Messaging settings
    autoReplyEnabled: false,
    autoReplyMessage: "Thanks for your message! I'll get back to you as soon as possible.",
    messagePrivacy: 'all', // 'all', 'collaborators', 'none'
    
    // Privacy settings
    showEmail: true,
    showProjects: true,
    profileVisibility: 'public' // 'public', 'contributors', 'private'
  });
  
  // Fetch user settings from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const settingsRef = doc(db, 'user_settings', currentUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...settingsSnap.data(),
            useSystemTheme: useSystemTheme // Sync with context state
          }));
        } else {
          // If no settings exist yet, create default settings
          await setDoc(settingsRef, {
            ...settings,
            useSystemTheme
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setError("Failed to load settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [currentUser, useSystemTheme]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'useSystemTheme') {
      // Handle system theme toggle specifically
      toggleSystemTheme(checked);
    }
    
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle theme change
  const handleThemeChange = (theme) => {
    // Disable system theme when manually selecting a theme
    if (useSystemTheme) {
      toggleSystemTheme(false);
      setSettings(prev => ({ ...prev, useSystemTheme: false }));
    }
    
    setTheme(theme);
  };
  
  // Save settings to Firestore
  const saveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const settingsRef = doc(db, 'user_settings', currentUser.uid);
      await updateDoc(settingsRef, settings);
      
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-md p-6">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-600 dark:text-[#1F3BFF] w-8 h-8" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl shadow-md p-6 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="mb-6 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg flex items-center">
          <FaCheck className="mr-2" />
          {success}
        </div>
      )}
      
      <div className="space-y-8">
        {/* Theme Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaPalette className="mr-2 text-[#1F3BFF]" />
            Theme Settings
          </h3>
          <div className="space-y-6 pl-6">
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="useSystemTheme"
                name="useSystemTheme"
                checked={settings.useSystemTheme}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="useSystemTheme" className="ml-2 block text-sm flex items-center">
                Use System Theme 
                <FaDesktop className="ml-2" />
              </label>
            </div>
            
            <div className={useSystemTheme ? 'opacity-50 pointer-events-none' : ''}>
              <p className="mb-3 text-sm">Select a theme for the application</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {Object.values(THEMES).map((theme) => (
                  <div 
                    key={theme} 
                    onClick={() => handleThemeChange(theme)}
                    className={`
                      cursor-pointer rounded-lg p-4 transition-all duration-200
                      ${currentTheme === theme ? 'ring-2 ring-[#1F3BFF] scale-105' : 'hover:scale-105'}
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
                        <FaCheck className="text-xs mt-1" style={{ color: THEME_CONFIG[theme].accentPrimary }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaBell className="mr-2 text-[#1F3BFF]" />
            Notification Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm">
                Receive email notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="browserNotifications"
                name="browserNotifications"
                checked={settings.browserNotifications}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="browserNotifications" className="ml-2 block text-sm">
                Enable browser notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnNewMessage"
                name="notifyOnNewMessage"
                checked={settings.notifyOnNewMessage}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="notifyOnNewMessage" className="ml-2 block text-sm">
                Notify me when I receive a new message
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyOnProjectInterest"
                name="notifyOnProjectInterest"
                checked={settings.notifyOnProjectInterest}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="notifyOnProjectInterest" className="ml-2 block text-sm">
                Notify me when someone expresses interest in my project
              </label>
            </div>
          </div>
        </div>
        
        {/* Display Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaGlobe className="mr-2 text-[#1F3BFF]" />
            Display Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="compactView"
                name="compactView"
                checked={settings.compactView}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="compactView" className="ml-2 block text-sm">
                Compact View (reduced spacing)
              </label>
            </div>
            <div className="flex flex-col">
              <label htmlFor="fontSize" className="block text-sm mb-1">
                Font Size
              </label>
              <select
                id="fontSize"
                name="fontSize"
                value={settings.fontSize}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-[#1E293B] rounded-md focus:outline-none focus:ring-blue-500 dark:focus:ring-[#1F3BFF] focus:border-blue-500 dark:focus:border-[#1F3BFF]"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Messaging settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaEnvelope className="mr-2 text-[#1F3BFF]" />
            Messaging Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoReplyEnabled"
                name="autoReplyEnabled"
                checked={settings.autoReplyEnabled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="autoReplyEnabled" className="ml-2 block text-sm">
                Enable auto-reply message
              </label>
            </div>
            
            {settings.autoReplyEnabled && (
              <div className="flex flex-col mt-2">
                <label htmlFor="autoReplyMessage" className="block text-sm mb-1">
                  Auto-reply message
                </label>
                <textarea
                  id="autoReplyMessage"
                  name="autoReplyMessage"
                  value={settings.autoReplyMessage}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-[#1E293B] rounded-md focus:outline-none focus:ring-blue-500 dark:focus:ring-[#1F3BFF] focus:border-blue-500 dark:focus:border-[#1F3BFF]"
                ></textarea>
              </div>
            )}
            
            <div className="flex flex-col">
              <label htmlFor="messagePrivacy" className="block text-sm mb-1">
                Who can message you?
              </label>
              <select
                id="messagePrivacy"
                name="messagePrivacy"
                value={settings.messagePrivacy}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-[#1E293B] rounded-md focus:outline-none focus:ring-blue-500 dark:focus:ring-[#1F3BFF] focus:border-blue-500 dark:focus:border-[#1F3BFF]"
              >
                <option value="all">Everyone</option>
                <option value="collaborators">Contributors and collaborators only</option>
                <option value="none">No one (disable messaging)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Privacy settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaUserShield className="mr-2 text-[#1F3BFF]" />
            Privacy Settings
          </h3>
          <div className="space-y-3 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showEmail"
                name="showEmail"
                checked={settings.showEmail}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="showEmail" className="ml-2 block text-sm">
                Show my email to other users
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showProjects"
                name="showProjects"
                checked={settings.showProjects}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 dark:text-[#1F3BFF] focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="showProjects" className="ml-2 block text-sm">
                Show my projects publicly
              </label>
            </div>
            <div className="flex flex-col">
              <label htmlFor="profileVisibility" className="block text-sm mb-1">
                Profile visibility
              </label>
              <select
                id="profileVisibility"
                name="profileVisibility"
                value={settings.profileVisibility}
                onChange={handleChange}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-[#1E293B] rounded-md focus:outline-none focus:ring-blue-500 dark:focus:ring-[#1F3BFF] focus:border-blue-500 dark:focus:border-[#1F3BFF]"
              >
                <option value="public">Public (visible to everyone)</option>
                <option value="contributors">Contributors only</option>
                <option value="private">Private (only visible to you)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Save button */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-[#1F3BFF] hover:bg-blue-600 text-white rounded-md shadow-md hover:shadow-lg transition-all flex items-center"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings; 