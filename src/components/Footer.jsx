import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { FaGithub, FaTwitter, FaHeart } from 'react-icons/fa';

const Footer = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`py-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="mb-4 md:mb-0">
            <Link to="/" className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Code Challenge Platform
            </Link>
            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Improve your coding skills with daily challenges
            </p>
          </div>
          
          <div className="flex space-x-4">
            <a 
              href="https://github.com/your-organization" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-full ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} transition-colors`}
              aria-label="GitHub"
            >
              <FaGithub className="text-xl" />
            </a>
            <a 
              href="https://twitter.com/your-handle" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 rounded-full ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} transition-colors`}
              aria-label="Twitter"
            >
              <FaTwitter className="text-xl" />
            </a>
          </div>
        </div>

        <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} py-4`}>
          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center">
            <nav className="flex flex-wrap justify-center mb-4 md:mb-0">
              <Link 
                to="/" 
                className={`mx-3 my-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className={`mx-3 my-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                About
              </Link>
              <Link 
                to="/leaderboard" 
                className={`mx-3 my-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                Leaderboard
              </Link>
              <Link 
                to="/privacy" 
                className={`mx-3 my-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className={`mx-3 my-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                Terms of Service
              </Link>
            </nav>
            
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              © {currentYear} Code Challenge Platform. All rights reserved.
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} flex items-center justify-center`}>
              Made with <FaHeart className="mx-1 text-red-500" /> for developers everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 