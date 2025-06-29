import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPopup from './LoginPopup';
import { FaGithub } from 'react-icons/fa';
import { getTimeBasedGreeting, getRandomEngagementMessage } from '../utils/greetingMessages';
import { FiMenu, FiX, FiHome, FiTrendingUp, FiAward, FiInfo, FiUser, FiLogOut, FiEdit, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBar from './ProgressBar';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [engagementMessage, setEngagementMessage] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Update greeting and message on component mount and every 2 hours
  useEffect(() => {
    updateGreetingAndMessage();
    
    // Update messages every 2 hours if the user stays on the page
    const intervalId = setInterval(updateGreetingAndMessage, 2 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Update greeting and engagement message
  const updateGreetingAndMessage = () => {
    setGreeting(getTimeBasedGreeting());
    setEngagementMessage(getRandomEngagementMessage());
  };

  // Get user's first name or username
  const getUserFirstName = () => {
    if (!currentUser) return '';
    
    if (currentUser.displayName) {
      // Use first name if available
      return currentUser.displayName.split(' ')[0];
    }
    
    // Fallback to username from email
    return currentUser.email.split('@')[0];
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 p-2 md:py-3 md:px-6 shadow-md transition-all duration-200 ${showMobileMenu ? 'bg-opacity-100' : 'bg-opacity-95'} ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Greeting */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Apex Typer Logo" className="h-8 w-auto" />
            <span className={`ml-2 font-bold text-xl hidden md:inline ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Apex Typer
            </span>
          </Link>

          {currentUser && (
            <div className="ml-4 hidden md:block">
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {greeting}, {getUserFirstName()}!
              </motion.p>
            </div>
          )}
        </div>

        {/* Center Navigation - Desktop */}
        <div className="hidden md:flex space-x-1">
          <Link
            to="/"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
              location.pathname === '/'
                ? (currentTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
            }`}
          >
            <span className="mr-1"><FiHome /></span>
            Home
          </Link>
          {currentUser && (
            <>
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                  location.pathname === '/dashboard'
                    ? (currentTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                    : (currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                }`}
              >
                <span className="mr-1"><FiTrendingUp /></span>
                Dashboard
              </Link>
              <Link
                to="/user-analytics"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                  location.pathname === '/user-analytics'
                    ? (currentTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                    : (currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                }`}
              >
                <span className="mr-1"><FiAward /></span>
                My Analytics
              </Link>
            </>
          )}
        </div>

        {/* Right side - Auth, Theme Toggle */}
        <div className="flex items-center">
          {/* Theme Toggle */}
          <ThemeToggle variant="icon" />
          
          {/* Auth Button */}
          {currentUser ? (
            <div className="relative ml-3 hidden md:block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center text-sm focus:outline-none ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  <img
                    src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=random`}
                    alt={currentUser.displayName || 'User'}
                    className="h-8 w-8 rounded-full object-cover border-2 border-blue-500"
                  />
                  <span className="ml-1 hidden lg:inline-block">{currentUser.displayName || 'User'}</span>
                </button>
              </motion.div>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                      currentTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}
                    ref={userMenuRef}
                  >
                    <Link
                      to="/profile"
                      className={`block px-4 py-2 text-sm ${
                        currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiUser className="inline mr-2" /> Profile
                    </Link>
                    <Link
                      to="/settings"
                      className={`block px-4 py-2 text-sm ${
                        currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiSettings className="inline mr-2" /> Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FiLogOut className="inline mr-2" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginPopup(true)}
              className="hidden md:flex ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </button>
          )}

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            {currentUser && (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="mr-2"
              >
                <img
                  src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=random`}
                  alt={currentUser.displayName || 'User'}
                  className="h-8 w-8 rounded-full object-cover border-2 border-blue-500"
                />
              </button>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {showMobileMenu ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden overflow-hidden ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 mt-1">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/'
                    ? (currentTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                    : (currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="mr-2 inline-block align-text-bottom"><FiHome /></span>
                Home
              </Link>
              {currentUser && (
                <>
                  <Link
                    to="/dashboard"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === '/dashboard'
                        ? (currentTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                        : (currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="mr-2 inline-block align-text-bottom"><FiTrendingUp /></span>
                    Dashboard
                  </Link>
                  <Link
                    to="/user-analytics"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === '/user-analytics'
                        ? (currentTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                        : (currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="mr-2 inline-block align-text-bottom"><FiAward /></span>
                    My Analytics
                  </Link>
                </>
              )}
              {!currentUser && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowLoginPopup(true);
                  }}
                  className="w-full block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Popup */}
      <AnimatePresence>
        {showLoginPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowLoginPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative rounded-lg shadow-xl max-w-md w-full ${
                currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-xl font-semibold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sign in to Apex Typer</h3>
                  <button
                    onClick={() => setShowLoginPopup(false)}
                    className={`p-1 rounded-full ${
                      currentTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                
                <p className={`mb-6 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Sign in to track your progress, compete on leaderboards, and unlock more features.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleSignIn('google')}
                    className={`w-full flex items-center justify-center px-4 py-2 border rounded-md ${
                      currentTheme === 'dark' 
                        ? 'border-gray-700 text-white hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <img src="/icons/google.svg" alt="Google" className="h-5 w-5 mr-2" />
                    Continue with Google
                  </button>
                  
                  <button
                    onClick={() => handleSignIn('github')}
                    className={`w-full flex items-center justify-center px-4 py-2 border rounded-md ${
                      currentTheme === 'dark' 
                        ? 'border-gray-700 text-white hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <img src="/icons/github.svg" alt="GitHub" className="h-5 w-5 mr-2" />
                    Continue with GitHub
                  </button>
                  
                  <button
                    onClick={() => handleSignIn('anonymous')}
                    className={`w-full flex items-center justify-center px-4 py-2 border rounded-md ${
                      currentTheme === 'dark' 
                        ? 'border-gray-700 text-white hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FiUser className="h-5 w-5 mr-2" />
                    Continue as Guest
                  </button>
                </div>
                
                <div className="mt-6 text-center">
                  <p className={`text-xs ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    By signing in, you agree to our
                    <Link to="/terms" className="mx-1 text-blue-500 hover:text-blue-600">
                      Terms of Service
                    </Link>
                    and
                    <Link to="/privacy" className="ml-1 text-blue-500 hover:text-blue-600">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar at the bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <ProgressBar value={loadingProgress} color="blue" height={2} />
      </div>
    </nav>
  );
}

export default Navbar;