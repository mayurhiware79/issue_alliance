import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Github, Code, Brain, BarChart2, Sparkles, Sun, Moon } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import LoginPopup from './LoginPopup';
import { getTimeBasedGreeting, getRandomEngagementMessage } from '../utils/greetingMessages';
import GlobalThemeToggle from './GlobalThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import Footer from './Footer';

const Home = () => {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [engagementMessage, setEngagementMessage] = useState('');
  const [tomMessage, setTomMessage] = useState('Welcome to IssueAlliance! Ready to find your perfect open source match?');
  const [showTom, setShowTom] = useState(false);
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  const navigate = useNavigate();
  const controls = useAnimation();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const neonText = {
    textShadow: darkMode 
      ? '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6, 0 0 20px #3b82f6'
      : 'none'
  };

  const [featuresRef, featuresInView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  const [heroRef, heroInView] = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  useEffect(() => {
    if (featuresInView) {
      controls.start("visible");
    }
  }, [controls, featuresInView]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Update greeting and message
    updateGreetingAndMessage();
    
    // Check for user authentication status
    const checkAuthStatus = () => {
      const user = localStorage.getItem('user');
      if (user) {
        setCurrentUser(JSON.parse(user));
      }
    };
    
    checkAuthStatus();

    // Rotate Tom messages
    const tomInterval = setInterval(() => {
      const messages = [
        "Looking for your next open source project? I can help!",
        "Did you know? Regular contributors get 3x more job offers!",
        "Your skills would be perfect for React issues right now!",
        "Pro tip: Filter by 'good first issue' to get started easily!",
        "I've found 23 new issues that match your skills today!"
      ];
      setTomMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 10000);

    // Randomly show/hide Tom
    const tomVisibilityInterval = setInterval(() => {
      // Only show Tom if user is scrolling or hasn't seen him in a while
      const shouldShow = Math.random() > 0.7;
      setShowTom(shouldShow);
      
      // Hide Tom after 8-15 seconds
      if (shouldShow) {
        const hideDelay = 8000 + Math.random() * 7000;
        setTimeout(() => setShowTom(false), hideDelay);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(tomInterval);
      clearInterval(tomVisibilityInterval);
    };
  }, []);

  const updateGreetingAndMessage = () => {
    setGreeting(getTimeBasedGreeting());
    setEngagementMessage(getRandomEngagementMessage());
  };

  const getUserFirstName = () => {
    if (!currentUser) return '';
    
    if (currentUser.displayName || currentUser.name) {
      return (currentUser.displayName || currentUser.name).split(' ')[0];
    }
    
    return currentUser.email?.split('@')[0] || '';
  };

  const handleFindMatch = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      setShowLoginPopup(true);
    }
  };

  const handleTomClick = () => {
    setTomMessage("Let me check the latest issues for you... One moment!");
    setTimeout(() => {
      setTomMessage("Found 5 new perfect matches in your dashboard!");
    }, 2000);
  };

  // Glowing button effect
  const GlowButton = ({ children, onClick, className = '' }) => (
    <motion.button
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      <motion.span
        className="absolute inset-0 bg-white opacity-0"
        animate={{
          opacity: [0, 0.3, 0],
          scale: [1, 1.5, 2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop'
        }}
      />
    </motion.button>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-500'} opacity-10`}
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              x: [0, Math.random() * 100 - 50],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <motion.nav 
        className={`fixed w-full z-30 transition-all duration-300 ${scrolled ? (darkMode ? 'bg-gray-800 shadow-md py-2' : 'bg-white shadow-md py-2') : 'bg-transparent py-4'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
      
          <div className='container mx-auto px-6 flex justify-between items-center'>
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            <Github className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} text-xl`}>IssueAlliance</span>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            {/* Global Theme Toggle */}
            <GlobalThemeToggle className={`${darkMode ? 'bg-blue-900 text-yellow-300' : 'bg-gray-200 text-gray-700'}`} />
            
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="flex hidden md:flex md:flex-col flex-col items-start">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{greeting}, {getUserFirstName()}!</span>
                  <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{engagementMessage}</span>
                </div>
                <Link to="/dashboard">
                <GlowButton
                  className={`${darkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} px-4 py-2 rounded-lg transition-all`}
                >
                  Dashboard
                </GlowButton>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <GlowButton
                  onClick={() => setShowLoginPopup(true)}
                  className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} font-medium`}
                >
                  Sign In
                </GlowButton>
                <GlowButton className={`${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg transition-all`}>
                  <Link to="/register">Register</Link>
                </GlowButton>
              </div>
            )}
          </div>
       
        
          </div>
      
      </motion.nav>

      {/* Hero Section */}
      
      <section 
        className={`relative min-h-screen flex items-center justify-center overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' : 'bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100'}`}
        ref={heroRef}
      >
         <div className="flex flex-col justify-center items-center mb-4 ">
        <div className="flex md:hidden mb-4 border-2 border-blue-500 px-4 py-2 rounded-lg flex flex-col items-start">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{greeting}, {getUserFirstName()}!</span>
                  <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{engagementMessage}</span>
                </div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{ 
            backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            backgroundSize: '30px 30px'
          }}></div>
        </div>
       
        

        <div className="container mx-auto px-6 relative z-10 text-center">
          
          <motion.div 
            className="max-w-3xl mx-auto transform transition-all duration-700"
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className={`text-4xl md:text-6xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'} leading-tight`}
              whileHover={darkMode ? neonText : {}}
              transition={{ duration: 0.3 }}
            >
              Open Source Contribution Matchmaker
            </motion.h1>
            <motion.p 
              className={`text-xl md:text-2xl ${darkMode ? 'text-blue-200' : 'text-blue-800'} mb-10`}
              whileHover={{ scale: 1.02 }}
            >
              Match with the perfect GitHub issues using AI
              <motion.span 
                className="ml-2 inline-block"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className={`${darkMode ? 'text-yellow-300' : 'text-yellow-500'} inline`} />
              </motion.span>
            </motion.p>
            
            {currentUser ? (
              <Link to="/dashboard"><GlowButton
              className={`${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg`}
            >
             Go to Dashboard
            </GlowButton></Link>
            ) : (
              <div className="flex justify-center space-x-4">
                <GlowButton
                  onClick={() => setShowLoginPopup(true)}
                  className={`${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg`}
                >
                  Sign In
                </GlowButton>
                <GlowButton
                  className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-blue-400 border-blue-500' : 'bg-white hover:bg-gray-100 text-blue-600 border-blue-600'} border-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg`}
                >
                  <Link to="/register">Register</Link>
                </GlowButton>
              </div>
            )}
          </motion.div>

          <motion.div 
            className="mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/personalized-issues"><GlowButton
              onClick={handleFindMatch}
              className={`group inline-flex items-center ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-white text-blue-800'} px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-all hover:shadow-xl`}
            >
              Find My Match
              <motion.span 
                className="ml-2"
                animate={{
                  x: [0, 5, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2
                }}
              >
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.span>
            </GlowButton></Link>
          </motion.div>
        </div>
        </div>

        {/* GitHub Tom Character */}
        <AnimatePresence>
          {showTom && (
            <motion.div
              className="fixed bottom-6 right-6 z-50 cursor-pointer"
              initial={{ x: 100, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                ...(darkMode ? neonText : {})
              }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={handleTomClick}
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <div className={`${darkMode ? 'bg-gray-800 text-blue-400 border border-blue-500' : 'bg-white text-gray-800'} rounded-xl p-4 shadow-xl max-w-xs mb-2`}>
                  <p className="text-sm">{tomMessage}</p>
                  <div className={`absolute -bottom-2 right-4 w-4 h-4 ${darkMode ? 'bg-gray-800 border-b border-r border-blue-500' : 'bg-white'} transform rotate-45`}></div>
                </div>
                <div className={`w-16 h-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-800'} rounded-full flex items-center justify-center border-4 ${darkMode ? 'border-blue-500' : 'border-blue-400'}`}>
                  <Github className="text-white h-8 w-8" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path 
              fill={darkMode ? "#111827" : "#f9fafb"} 
              fillOpacity="1" 
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,181.3C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section 
        className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}
        ref={featuresRef}
      >
        {/* Animated floating elements */}
        <motion.div 
          className={`absolute top-1/4 left-1/4 w-16 h-16 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-full opacity-20`}
          animate={{
            y: [0, -20, 0],
            x: [0, 20, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        <motion.div 
          className={`absolute top-1/3 right-1/4 w-24 h-24 ${darkMode ? 'bg-purple-900' : 'bg-purple-100'} rounded-full opacity-20`}
          animate={{
            y: [0, 30, 0],
            x: [0, -30, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <h2 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>How It Works</h2>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Our AI-powered platform connects developers with open source projects that match their skills and interests.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={controls}
          >
            {/* Feature 1 */}
            <motion.div 
              className={`${darkMode ? 'bg-gray-800 hover:shadow-blue-900/40' : 'bg-white hover:shadow-blue-500/40'} rounded-xl p-8 shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1 relative overflow-hidden`}
              variants={itemVariants}
              whileHover={{
                boxShadow: darkMode ? '0 10px 25px -5px rgba(59, 130, 246, 0.4)' : '0 10px 25px -5px rgba(59, 130, 246, 0.2)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <div className={`h-14 w-14 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-lg flex items-center justify-center mb-6`}>
                <Code className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🔍 GitHub Issue Matching</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Our algorithms scan thousands of open GitHub issues to find the perfect match for your skills and experience level.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className={`${darkMode ? 'bg-gray-800 hover:shadow-green-900/40' : 'bg-white hover:shadow-green-500/40'} rounded-xl p-8 shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1 relative overflow-hidden`}
              variants={itemVariants}
              whileHover={{
                boxShadow: darkMode ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)' : '0 10px 25px -5px rgba(16, 185, 129, 0.2)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className={`h-14 w-14 ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} rounded-lg flex items-center justify-center mb-6`}>
                <Brain className={`h-8 w-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🧠 AI Smart Predictions</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                AI analyzes your GitHub profile and contribution history to understand your unique developer profile.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className={`${darkMode ? 'bg-gray-800 hover:shadow-purple-900/40' : 'bg-white hover:shadow-purple-500/40'} rounded-xl p-8 shadow-lg transition-all hover:shadow-xl hover:transform hover:-translate-y-1 relative overflow-hidden`}
              variants={itemVariants}
              whileHover={{
                boxShadow: darkMode ? '0 10px 25px -5px rgba(124, 58, 237, 0.4)' : '0 10px 25px -5px rgba(124, 58, 237, 0.2)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
              <div className={`h-14 w-14 ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'} rounded-lg flex items-center justify-center mb-6`}>
                <BarChart2 className={`h-8 w-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📊 Analytics with Google Sheets</h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Track your contributions and progress over time with detailed analytics powered by Google Sheets integration.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.5 }}
          >
            {[
              { number: "10K+", label: "Open Issues" },
              { number: "5K+", label: "Developers" },
              { number: "1K+", label: "Projects" },
              { number: "24/7", label: "Active Matching" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700 hover:shadow-blue-500/20' : 'bg-gray-50 hover:shadow-lg'}`}
                whileHover={{ 
                  y: -5,
                  boxShadow: darkMode ? '0 10px 20px rgba(59, 130, 246, 0.2)' : '0 10px 20px rgba(0,0,0,0.1)'
                }}
              >
                <motion.p 
                  className={`text-4xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}
                  initial={{ scale: 0.9 }}
                  whileInView={{ scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    delay: index * 0.1
                  }}
                >
                  {stat.number}
                </motion.p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-6">
          <motion.h2 
            className={`text-3xl font-bold text-center mb-12 ${darkMode ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            What Developers Say
          </motion.h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                quote: "Found my first open source contribution through IssueAlliance. The perfect match system really works!",
                author: "Shivam Dombe, MERN Stack Developer"
              },
              {
                quote: "As a maintainer, I've found quality contributors through this platform. It's a game changer.",
                author: "Mayur Dongare, Web Developer"
              },
              {
                quote: "The AI recommendations helped me level up my skills by finding just-right challenges.",
                author: "Bhakti Mudgal, Full Stack Developer"
              },
              {
                quote: "The leaderboard is a great way to see how I'm doing compared to others.",
                author: "Mayur Hiware, Web Developer"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className={`p-8 rounded-xl shadow-md ${darkMode ? 'bg-gray-800 hover:shadow-blue-500/20' : 'bg-white hover:shadow-lg'}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: index * 0.2
                }}
                viewport={{ once: true, amount: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className={`italic mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>"{testimonial.quote}"</p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>— {testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-gradient-to-r from-blue-600 to-indigo-700'} text-white relative overflow-hidden`}>
        {/* Animated floating elements */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full opacity-10"
          animate={{
            y: [0, -40, 0],
            x: [0, 40, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Ready to find your perfect open source match?
          </motion.h2>
          <motion.p 
            className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of developers who are contributing to meaningful projects that match their skills.
          </motion.p>
          
          <GlowButton
            onClick={handleFindMatch}
            className={`${darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-white hover:bg-blue-50'} ${darkMode ? 'text-blue-100' : 'text-blue-600'} px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all transform hover:scale-105`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Get Started Today
          </GlowButton>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      {/* Login Popup */}
      {showLoginPopup && (
        <LoginPopup onClose={() => setShowLoginPopup(false)} darkMode={darkMode} />
      )}
    </div>
  );
};

export default Home;