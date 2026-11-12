import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import GlobalThemeToggle from './GlobalThemeToggle';

/**
 * Top navigation bar shown on /login and /register.
 * Matches the Home page navbar style and provides easy navigation.
 */
const AuthNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin    = location.pathname === '/login';
  const isRegister = location.pathname === '/register';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled
          ? darkMode ? 'bg-gray-800 shadow-md py-2' : 'bg-white shadow-md py-2'
          : darkMode ? 'bg-gray-900/80 backdrop-blur py-4' : 'bg-white/80 backdrop-blur py-4'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">

        {/* Logo — always goes home */}
        <Link to="/" className="flex items-center space-x-2 group">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
            <Github className={`h-7 w-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`font-bold text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              IssueAlliance
            </span>
          </motion.div>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <GlobalThemeToggle />

          {/* Home link */}
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Home
          </Link>

          {currentUser ? (
            /* Already logged in → go to dashboard */
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                darkMode
                  ? 'bg-blue-700 hover:bg-blue-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <>
              {/* Show Sign In only when NOT on login page */}
              {!isLogin && (
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${
                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  Sign In
                </Link>
              )}

              {/* Show Register only when NOT on register page */}
              {!isRegister && (
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    darkMode
                      ? 'bg-blue-700 hover:bg-blue-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Register
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default AuthNavbar;
