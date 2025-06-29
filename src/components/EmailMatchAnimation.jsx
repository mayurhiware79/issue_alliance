import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaGithub, FaEquals, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Styling for water drop animations
const waterDropStyles = `
  @keyframes waterDrop1 {
    0% { transform: scale(0) translate(0, 0); opacity: 0.7; }
    50% { transform: scale(1) translate(-20px, -20px); opacity: 0.3; }
    100% { transform: scale(1.5) translate(-40px, -30px); opacity: 0; }
  }
  
  @keyframes waterDrop2 {
    0% { transform: scale(0) translate(0, 0); opacity: 0.7; }
    50% { transform: scale(1) translate(20px, -15px); opacity: 0.3; }
    100% { transform: scale(1.5) translate(40px, -25px); opacity: 0; }
  }
  
  @keyframes waterDrop3 {
    0% { transform: scale(0) translate(0, 0); opacity: 0.7; }
    50% { transform: scale(1) translate(-15px, 20px); opacity: 0.3; }
    100% { transform: scale(1.5) translate(-25px, 40px); opacity: 0; }
  }
  
  @keyframes waterDrop4 {
    0% { transform: scale(0) translate(0, 0); opacity: 0.7; }
    50% { transform: scale(1) translate(15px, 20px); opacity: 0.3; }
    100% { transform: scale(1.5) translate(30px, 35px); opacity: 0; }
  }
  
  @keyframes ripple {
    0% { transform: scale(0.95); }
    50% { transform: scale(1.05); }
    100% { transform: scale(0.95); }
  }
  
  .water-drop-1 {
    animation: waterDrop1 3s ease-in-out infinite;
  }
  
  .water-drop-2 {
    animation: waterDrop2 3s ease-in-out infinite;
    animation-delay: 0.5s;
  }
  
  .water-drop-3 {
    animation: waterDrop3 3s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  .water-drop-4 {
    animation: waterDrop4 3s ease-in-out infinite;
    animation-delay: 1.5s;
  }
  
  .ripple-effect {
    animation: ripple 3s ease-in-out infinite;
  }
`;

const EmailMatchAnimation = ({ userEmail, githubEmail, isMatching, isVerifying, onAnimationComplete }) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (!isVerifying) return;
    
    // Animation sequence
    const timeline = [
      () => {
        setAnimationStep(1); // Show user email
      },
      () => {
        setAnimationStep(2); // Show GitHub email
      },
      () => {
        setAnimationStep(3); // Show comparison
        setShowCheck(true); // Show result
      },
      () => {
        // Finish animation and notify parent
        if (onAnimationComplete) onAnimationComplete();
      }
    ];
    
    let step = 0;
    const intervalId = setInterval(() => {
      if (step < timeline.length) {
        timeline[step]();
        step++;
      } else {
        clearInterval(intervalId);
      }
    }, 800);
    
    return () => clearInterval(intervalId);
  }, [isVerifying, isMatching, onAnimationComplete]);
  
  // Reset animation when verification starts
  useEffect(() => {
    if (isVerifying) {
      setAnimationStep(0);
      setShowCheck(false);
    }
  }, [isVerifying]);
  
  if (!isVerifying && animationStep === 0) return null;
  
  return (
    <>
      {/* Add the styles for water drop animations */}
      <style>{waterDropStyles}</style>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-900/10"></div>
        
        {/* Water drop animation elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Email side water drops */}
          <div className="absolute top-1/2 left-1/4 w-4 h-4 rounded-full bg-blue-500/30 dark:bg-blue-400/30 water-drop-1"></div>
          <div className="absolute top-1/2 left-1/4 w-3 h-3 rounded-full bg-blue-400/30 dark:bg-blue-300/30 water-drop-2"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-blue-300/30 dark:bg-blue-200/30 water-drop-3"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-blue-200/30 dark:bg-blue-100/30 water-drop-4"></div>
          
          {/* GitHub side water drops */}
          <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-gray-500/30 dark:bg-gray-400/30 water-drop-1"></div>
          <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-gray-400/30 dark:bg-gray-300/30 water-drop-2"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-gray-300/30 dark:bg-gray-200/30 water-drop-3"></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-gray-200/30 dark:bg-gray-100/30 water-drop-4"></div>
        </div>
        
        <div className="flex flex-col items-center space-y-4 relative z-10">
          {/* Title */}
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Email Verification
          </h4>
          
          {/* Animation container */}
          <div className="flex flex-col md:flex-row items-center justify-around w-full gap-4">
            {/* User email */}
            <div className={`flex items-center transition-all duration-500 ${
              animationStep >= 1 ? 'opacity-100 transform-none' : 'opacity-0 -translate-x-8'
            }`}>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-2 ripple-effect">
                <FaEnvelope className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Your Email</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{userEmail}</div>
              </div>
            </div>
            
            {/* Equals sign */}
            <div className={`transition-all duration-500 ${
              animationStep >= 3 ? 'opacity-100 transform-none' : 'opacity-0 scale-0'
            }`}>
              {isMatching ? (
                <FaEquals className="text-green-500 dark:text-green-400 text-xl" />
              ) : (
                <FaTimesCircle className="text-red-500 dark:text-red-400 text-xl" />
              )}
            </div>
            
            {/* GitHub email */}
            <div className={`flex items-center transition-all duration-500 ${
              animationStep >= 2 ? 'opacity-100 transform-none' : 'opacity-0 translate-x-8'
            }`}>
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full mr-2 ripple-effect">
                <FaGithub className="text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">GitHub Email</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{githubEmail || 'Fetching...'}</div>
              </div>
            </div>
          </div>
          
          {/* Verification result */}
          <div className={`transition-all duration-500 text-center ${
            showCheck ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-4'
          }`}>
            {isMatching ? (
              <div className="text-green-600 dark:text-green-400 flex items-center justify-center">
                <FaCheckCircle className="mr-2" />
                <span>Emails match! Verification successful</span>
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400 flex items-center justify-center">
                <FaTimesCircle className="mr-2" />
                <span>Emails don't match. Verification failed.</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Animation background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 bg-gradient-to-r ${
            isMatching ? 'from-green-500/5 to-blue-500/5 dark:from-green-900/10 dark:to-blue-900/10' 
            : 'from-red-500/5 to-orange-500/5 dark:from-red-900/10 dark:to-orange-900/10'
          } transition-opacity duration-1000 ${animationStep >= 3 ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>
      </div>
    </>
  );
};

export default EmailMatchAnimation; 