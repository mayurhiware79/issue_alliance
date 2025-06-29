import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { FaGithub, FaCode, FaLaptopCode, FaCalendarAlt } from 'react-icons/fa';

const About = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`mb-12 text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          <h1 className="text-4xl font-bold mb-4">About Our Platform</h1>
          <p className={`text-lg max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            A community-driven platform helping developers improve their coding skills through daily challenges
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-md`}
          >
            <div className={`rounded-full w-14 h-14 flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100'
            }`}>
              <FaCode className={`text-2xl ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`} />
            </div>
            <h2 className={`text-xl font-bold mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Our Mission</h2>
            <p className={`${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              We believe consistent practice is the key to becoming a better developer. Our platform offers daily coding challenges designed to help you build a strong coding habit while improving your problem-solving skills and technical knowledge.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-md`}
          >
            <div className={`rounded-full w-14 h-14 flex items-center justify-center mb-4 ${
              theme === 'dark' ? 'bg-purple-900/40' : 'bg-purple-100'
            }`}>
              <FaLaptopCode className={`text-2xl ${
                theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
              }`} />
            </div>
            <h2 className={`text-xl font-bold mb-3 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>How It Works</h2>
            <p className={`${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Each day, we present a new coding challenge that focuses on different aspects of software development. Complete challenges, maintain your streak, and compete with other developers on our leaderboard. Track your progress and earn badges as you enhance your skills.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`rounded-xl p-8 mb-16 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-md`}
        >
          <h2 className={`text-2xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Key Features</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className={`rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center mr-4 ${
                theme === 'dark' ? 'bg-green-900/40' : 'bg-green-100'
              }`}>
                <FaCalendarAlt className={`${
                  theme === 'dark' ? 'text-green-300' : 'text-green-600'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                }`}>Daily Challenges</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  New coding problems every day across various difficulty levels and technologies
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center mr-4 ${
                theme === 'dark' ? 'bg-yellow-900/40' : 'bg-yellow-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
                  theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'
                }`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                }`}>Streak Reminders</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Optional notifications to help you maintain your daily coding habit
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center mr-4 ${
                theme === 'dark' ? 'bg-red-900/40' : 'bg-red-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
                  theme === 'dark' ? 'text-red-300' : 'text-red-600'
                }`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                }`}>Achievement System</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Earn badges and points as you solve challenges and maintain your streak
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className={`rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center mr-4 ${
                theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                }`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                }`}>Community Leaderboard</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Compare your progress with other developers and celebrate achievements
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`rounded-xl p-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-md`}
        >
          <h2 className={`text-2xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Our Team</h2>
          
          <p className={`mb-8 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            We're a group of passionate developers who believe in the power of consistent practice and community learning. Our diverse team brings experience from various tech backgrounds to create the best learning experience for you.
          </p>
          
          <div className="text-center">
            <a 
              href="https://github.com/your-organization" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`inline-flex items-center px-6 py-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              <FaGithub className="mr-2" />
              Visit Our GitHub
            </a>
          </div>
        </motion.div>

        <div className={`mt-12 text-center text-sm ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <p>© {new Date().getFullYear()} Code Challenge Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default About; 