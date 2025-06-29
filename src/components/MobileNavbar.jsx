import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FaTachometerAlt, 
  FaSearch, 
  FaProjectDiagram, 
  FaUserEdit, 
  FaEnvelope,
  FaHome,
  FaSignInAlt
} from 'react-icons/fa';

const MobileNavbar = () => {
  const location = useLocation();
  const { currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Check if a route is active
  const isActive = (path) => location.pathname === path;
  
  // Handle navigation for protected routes
  const handleNavigation = (path) => {
    if (!currentUser && path !== '/') {
      navigate('/login');
    } else {
      navigate(path);
    }
  };
  
  // Public navigation items
  const publicNavItems = [
    {
      path: '/',
      name: 'Home',
      icon: <FaHome className="w-5 h-5" />
    }
  ];
  
  // Protected navigation items for logged-in users
  const protectedNavItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <FaTachometerAlt className="w-5 h-5" />
    },
    {
      path: '/match-issues',
      name: 'Find',
      icon: <FaSearch className="w-5 h-5" />
    },
    {
      path: '/projects',
      name: 'Projects',
      icon: <FaProjectDiagram className="w-5 h-5" />
    },
    {
      path: '/messages',
      name: 'Messages',
      icon: <FaEnvelope className="w-5 h-5" />
    },
    {
      path: '/profile',
      name: 'Profile',
      icon: <FaUserEdit className="w-5 h-5" />
    }
  ];
  
  // Choose which navigation items to show based on auth status
  const navItems = currentUser 
    ? protectedNavItems 
    : [...publicNavItems, { path: '/login', name: 'Login', icon: <FaSignInAlt className="w-5 h-5" /> }];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-theme-secondary shadow-lg z-50 border-t border-theme-border">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full px-2 transition-colors duration-150 ${
              isActive(item.path)
                ? 'text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 dark:border-blue-400 bg-theme-hover/20'
                : 'text-theme-text hover:text-blue-500 dark:hover:text-blue-300 hover:bg-theme-hover/10'
            }`}
            aria-label={item.name}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNavbar; 