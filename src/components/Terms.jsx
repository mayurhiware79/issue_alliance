import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { FaFileContract, FaUserLock, FaClipboardCheck, FaExclamationTriangle, FaBalanceScale, FaCopyright, FaGavel } from 'react-icons/fa';

const TermsSection = ({ title, children, isOpen, toggleOpen, index }) => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  
  const sectionVariants = {
    closed: { 
      opacity: 0,
      height: 0
    },
    open: { 
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.5,
        ease: [0.04, 0.62, 0.23, 0.98]
      }
    }
  };

  const iconVariants = {
    open: { rotate: 180, transition: { duration: 0.3 } },
    closed: { rotate: 0, transition: { duration: 0.3 } }
  };

  const titleVariants = {
    initial: { x: -50, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.6, 
        delay: index * 0.1 
      } 
    }
  };

  return (
    <motion.div 
      className={`mb-6 rounded-lg ${
        isDarkMode 
          ? 'bg-gray-800 shadow-gray-900/20' 
          : 'bg-white shadow-gray-200/50'
      } shadow-lg overflow-hidden`}
      initial="initial"
      animate="animate"
      variants={titleVariants}
    >
      <motion.button
        className={`w-full p-4 flex justify-between items-center text-left ${
          isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-50'
        } transition-colors duration-200`}
        onClick={toggleOpen}
        whileTap={{ scale: 0.98 }}
      >
        <h3 className="text-xl font-semibold">{title}</h3>
        <motion.div
          variants={iconVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
        >
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </motion.div>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`px-4 pb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            initial="closed"
            animate="open"
            exit="closed"
            variants={sectionVariants}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Terms = () => {
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  
  const [openSections, setOpenSections] = useState({
    introduction: true,
    accountTerms: false,
    acceptableUse: false,
    termination: false,
    limitation: false,
    intellectualProperty: false,
    data: false,
    disputes: false,
    general: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  return (
    <motion.div 
      className={`max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className={`text-3xl font-extrabold text-center mb-12 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Terms of Service
        </h1>
        <p className={`mb-8 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Please read these terms and conditions carefully before using our platform.
        </p>
      </motion.div>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
            }`}>
              <FaFileContract className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
            </div>
            <span>Introduction</span>
          </div>
        }
        isOpen={openSections.introduction}
        toggleOpen={() => toggleSection('introduction')}
        index={0}
      >
        <p className="mb-2">
          These Terms of Service govern your use of our platform, website, and services.
          By accessing or using our services, you agree to be bound by these Terms.
        </p>
        <p>
          If you disagree with any part of the terms, you may not access our services.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-purple-900/40' : 'bg-purple-100'
            }`}>
              <FaUserLock className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} />
            </div>
            <span>Account Terms</span>
          </div>
        }
        isOpen={openSections.accountTerms}
        toggleOpen={() => toggleSection('accountTerms')}
        index={1}
      >
        <p className="mb-2">
          You are responsible for maintaining the security of your account and password.
          The platform cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
        </p>
        <p>
          You are responsible for all content posted and activity that occurs under your account.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-green-900/40' : 'bg-green-100'
            }`}>
              <FaClipboardCheck className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
            </div>
            <span>Acceptable Use</span>
          </div>
        }
        isOpen={openSections.acceptableUse}
        toggleOpen={() => toggleSection('acceptableUse')}
        index={2}
      >
        <p className="mb-2">
          You may not use our services for any illegal or unauthorized purpose nor may you, in the use of the service, violate any laws in your jurisdiction.
        </p>
        <p>
          You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the services without express written permission by us.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-red-900/40' : 'bg-red-100'
            }`}>
              <FaExclamationTriangle className={isDarkMode ? 'text-red-300' : 'text-red-600'} />
            </div>
            <span>Termination</span>
          </div>
        }
        isOpen={openSections.termination}
        toggleOpen={() => toggleSection('termination')}
        index={3}
      >
        <p>
          We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'
            }`}>
              <FaBalanceScale className={isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} />
            </div>
            <span>Limitation of Liability</span>
          </div>
        }
        isOpen={openSections.limitation}
        toggleOpen={() => toggleSection('limitation')}
        index={4}
      >
        <p>
          In no event shall we be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-yellow-900/40' : 'bg-yellow-100'
            }`}>
              <FaCopyright className={isDarkMode ? 'text-yellow-300' : 'text-yellow-600'} />
            </div>
            <span>Intellectual Property</span>
          </div>
        }
        isOpen={openSections.intellectualProperty}
        toggleOpen={() => toggleSection('intellectualProperty')}
        index={5}
      >
        <p>
          The service and its original content, features, and functionality are and will remain the exclusive property of our platform and its licensors.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-600'
              }`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <span>Data Protection</span>
          </div>
        }
        isOpen={openSections.data}
        toggleOpen={() => toggleSection('data')}
        index={6}
      >
        <p>
          We will protect the data you provide to us according to our Privacy Policy, which is incorporated by reference into these Terms of Service.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-orange-900/40' : 'bg-orange-100'
            }`}>
              <FaGavel className={isDarkMode ? 'text-orange-300' : 'text-orange-600'} />
            </div>
            <span>Disputes</span>
          </div>
        }
        isOpen={openSections.disputes}
        toggleOpen={() => toggleSection('disputes')}
        index={7}
      >
        <p>
          Any disputes arising out of or relating to these Terms or the services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
        </p>
      </TermsSection>

      <TermsSection
        title={
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
              isDarkMode ? 'bg-teal-900/40' : 'bg-teal-100'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                isDarkMode ? 'text-teal-300' : 'text-teal-600'
              }`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <span>General Provisions</span>
          </div>
        }
        isOpen={openSections.general}
        toggleOpen={() => toggleSection('general')}
        index={8}
      >
        <p>
          These Terms constitute the entire agreement between you and us regarding our services, and supersede and replace any prior agreements we might have had between us regarding the services.
        </p>
      </TermsSection>
      
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Last updated: June 2023
        </p>
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          © {new Date().getFullYear()} Code Challenge Platform. All rights reserved.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Terms; 