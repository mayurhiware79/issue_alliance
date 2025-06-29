import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaUserShield, FaCookieBite } from 'react-icons/fa';

const Privacy = () => {
  const { theme } = useTheme();
  
  const sections = [
    {
      id: 'information-collected',
      title: 'Information We Collect',
      icon: <FaUserShield />,
      content: `
        <p>We collect information to provide better services to our users. The types of information we collect include:</p>
        <ul>
          <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and optional profile picture.</li>
          <li><strong>Usage Data:</strong> We collect data about how you use our platform, including challenges completed, submission times, and interaction with features.</li>
          <li><strong>Performance Data:</strong> Information about your coding performance, streak history, and achievement records.</li>
          <li><strong>Technical Information:</strong> Information about your browser, device, IP address, and how you interact with our platform.</li>
        </ul>
      `
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      icon: <FaShieldAlt />,
      content: `
        <p>We use the information we collect for the following purposes:</p>
        <ul>
          <li>To create and maintain your account</li>
          <li>To provide, maintain, and improve our services</li>
          <li>To personalize your experience on our platform</li>
          <li>To process and track your progress and achievements</li>
          <li>To communicate with you about new features, updates, and promotions (if you opt in)</li>
          <li>To prevent fraud and abuse of our platform</li>
        </ul>
      `
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing',
      icon: <FaLock />,
      content: `
        <p>We do not sell your personal information. We may share your information in the following limited circumstances:</p>
        <ul>
          <li><strong>With your consent:</strong> We will share your information when you have explicitly consented to the sharing.</li>
          <li><strong>For leaderboard purposes:</strong> Your username, profile picture, and performance metrics appear on our public leaderboards.</li>
          <li><strong>For legal reasons:</strong> We may share information if we believe it's necessary to comply with applicable laws, regulations, legal processes, or governmental requests.</li>
          <li><strong>With service providers:</strong> We work with trusted service providers who help us provide our services, subject to strict confidentiality agreements.</li>
        </ul>
      `
    },
    {
      id: 'cookies',
      title: 'Cookies & Similar Technologies',
      icon: <FaCookieBite />,
      content: `
        <p>We use cookies and similar technologies to:</p>
        <ul>
          <li>Keep you logged in to your account</li>
          <li>Remember your preferences</li>
          <li>Understand how you use our platform</li>
          <li>Improve the quality of our services</li>
        </ul>
        <p>You can configure your browser to reject cookies, but some features of our service may not function properly without cookies.</p>
      `
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: <FaLock />,
      content: `
        <p>We take the security of your data seriously and employ industry-standard measures to protect your information:</p>
        <ul>
          <li>Data encryption in transit and at rest</li>
          <li>Regular security audits and testing</li>
          <li>Restricted access to personal information</li>
          <li>Continuous monitoring for potential vulnerabilities</li>
        </ul>
        <p>While we implement safeguards, no system is 100% secure. We strive to protect your data, but cannot guarantee absolute security.</p>
      `
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      icon: <FaShieldAlt />,
      content: `
        <p>We retain your information for as long as your account is active or as needed to provide you services. If you wish to delete your account or request that we no longer use your information, please contact us. We will retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.</p>
      `
    }
  ];

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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className={`text-lg max-w-3xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`rounded-xl p-6 mb-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-md`}
        >
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            This Privacy Policy describes how we collect, use, and handle your personal information when you use our platform. We take your privacy seriously and are committed to protecting your personal information. Please read this policy carefully to understand our practices regarding your data.
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div 
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + (index * 0.1) }}
              className={`rounded-xl overflow-hidden ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-md`}
            >
              <div className={`p-6 flex items-center ${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
              }`}>
                <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-4 ${
                  theme === 'dark' ? 'bg-indigo-900/40' : 'bg-indigo-100'
                }`}>
                  <span className={theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}>
                    {section.icon}
                  </span>
                </div>
                <h2 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{section.title}</h2>
              </div>
              
              <div className={`p-6 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
                dangerouslySetInnerHTML={{ 
                  __html: section.content
                    .replace(/<ul>/g, `<ul class="list-disc pl-5 mt-2 space-y-2">`)
                    .replace(/<li>/g, `<li class="ml-2">`) 
                    .replace(/<p>/g, `<p class="mb-4">`)
                    .replace(/<strong>/g, `<strong class="${theme === 'dark' ? 'text-white' : 'text-gray-800'}">`)
                }}
              />
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className={`rounded-xl p-6 mt-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-md`}
        >
          <h2 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Changes to This Privacy Policy
          </h2>
          <p className={`mb-4 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`rounded-xl p-6 mt-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-md`}
        >
          <h2 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Contact Us
          </h2>
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <div className={`mt-4 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <p className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Email: shivamdombe1@gmail.com
            </p>
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

export default Privacy; 