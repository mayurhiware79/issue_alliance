import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const PricingCard = ({ 
  plan = {}, 
  isPopular = false, 
  className = '',
  onSelect = () => {}
}) => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  
  const { 
    title, 
    price, 
    description, 
    features = [], 
    cta = 'Get Started'
  } = plan;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className={`relative rounded-2xl ${
        isDarkMode
          ? isPopular ? 'bg-gray-800 border border-indigo-500' : 'bg-gray-800 border border-gray-700'
          : isPopular ? 'bg-white border border-indigo-500' : 'bg-white border border-gray-200'
      } shadow-xl overflow-hidden ${className}`}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 -mr-2 -mt-2">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium leading-4 
            text-white bg-indigo-600 rounded-full shadow-sm transform rotate-12">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="p-6">
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <div className="mt-4 flex items-baseline">
          <span className={`text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${price}</span>
          <span className={`ml-1 text-xl font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
        </div>
        <p className={`mt-5 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{description}</p>
        
        <ul className="mt-6 space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex">
              <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" aria-hidden="true" />
              <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-8">
          <button
            onClick={onSelect}
            className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent 
              text-base font-medium rounded-md shadow-sm ${
                isPopular 
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                  : isDarkMode 
                    ? 'text-white bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              } transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {cta}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingCard; 