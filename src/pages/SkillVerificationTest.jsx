import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import VerifySkillModal from '../components/VerifySkillModal';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function SkillVerificationTest() {
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const [skill, setSkill] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [verifiedSkills, setVerifiedSkills] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Popular programming languages and frameworks for testing
  const popularSkills = [
    'JavaScript', 'Python', 'React', 'TypeScript', 'Node.js',
    'Java', 'C++', 'Go', 'Rust', 'PHP'
  ];

  const handleSkillChange = (e) => {
    setSkill(e.target.value);
    setErrorMessage('');
  };

  const handleVerifyClick = () => {
    if (!skill.trim()) {
      setErrorMessage('Please enter a skill to verify');
      return;
    }
    
    setShowModal(true);
  };

  const handleVerificationSuccess = (verifiedSkill) => {
    setVerifiedSkills([...verifiedSkills, verifiedSkill]);
  };

  return (
    <div className={`p-8 ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Skill Verification System Test</h1>
        
        <div className="mb-8 p-4 border rounded-lg bg-opacity-20 border-blue-300 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 dark:border-blue-800">
          <h2 className="text-xl font-semibold mb-2">How it Works</h2>
          <p className="mb-4">
            This page allows you to test the skill verification system. 
            Enter a programming language or framework and click "Verify Skill" to take a quiz.
            You need to score at least 3/5 to pass the verification.
          </p>
          <p>
            <strong>Note:</strong> This is a testing interface. In the real app, this verification is triggered when a user tries to add a new skill to their profile.
          </p>
        </div>
        
        {!currentUser && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-200 flex items-start">
            <FaExclamationCircle className="mt-1 mr-3 flex-shrink-0" />
            <p>You need to be logged in to test the skill verification system. This is because verification results are saved to your user profile.</p>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-200">
            {errorMessage}
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="skill" className="block text-sm font-medium mb-2">Enter a Skill to Verify</label>
          <div className="flex">
            <input
              type="text"
              id="skill"
              value={skill}
              onChange={handleSkillChange}
              placeholder="e.g., JavaScript, Python, React"
              className={`flex-grow px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                currentTheme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            />
            <button
              onClick={handleVerifyClick}
              disabled={!currentUser || !skill.trim()}
              className={`px-4 py-2 rounded-r-lg ${
                !currentUser || !skill.trim()
                  ? currentTheme === 'dark'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : currentTheme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              } transition-colors`}
            >
              Verify Skill
            </button>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Popular Skills for Testing</h3>
          <div className="flex flex-wrap gap-2">
            {popularSkills.map((popularSkill) => (
              <button
                key={popularSkill}
                onClick={() => setSkill(popularSkill)}
                className={`px-3 py-1 rounded-full text-sm ${
                  currentTheme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } transition-colors`}
              >
                {popularSkill}
              </button>
            ))}
          </div>
        </div>
        
        {verifiedSkills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Your Verified Skills</h3>
            <div className="flex flex-wrap gap-2">
              {verifiedSkills.map((verifiedSkill, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded-full flex items-center ${
                    currentTheme === 'dark'
                      ? 'bg-green-900/50 text-green-300 border border-green-700'
                      : 'bg-green-100 text-green-800 border border-green-300'
                  }`}
                >
                  <FaCheckCircle className="mr-1 text-xs" />
                  {verifiedSkill}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showModal && currentUser && (
        <VerifySkillModal
          skill={skill}
          userId={currentUser.uid}
          onClose={() => setShowModal(false)}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
}

export default SkillVerificationTest; 