import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaUserGraduate, FaUserAlt, FaExternalLinkAlt } from 'react-icons/fa';

function LoginPopup({ onClose }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileWarning, setProfileWarning] = useState('');
  const { loginWithGoogle, loginWithGithub, currentUser } = useAuth();
  const navigate = useNavigate();

  // Close popup if user is already logged in
  useEffect(() => {
    if (currentUser) {
      handleClose();
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleClose = () => {
    setShowPopup(false);
    if (onClose) onClose();
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      handleClose();
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  // For experienced developers - direct GitHub login
  const handleGithubSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGithub();
      
      if (result.user) {
        // Successfully logged in
        console.log('GitHub login successful:', result.user.displayName);
      }
      
      handleClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      
      // Use custom error message if available
      if (error.customMessage) {
        setError(error.customMessage);
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email. Try another login method.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Authentication was cancelled. Please try again.');
      } else {
        setError('Failed to sign in with GitHub. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // For beginners - Check GitHub profile after login
  const handleBeginnerGithubSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGithub();
      
      if (result.user) {
        // Check if GitHub profile is complete
        setCheckingProfile(true);
        
        // Get the GitHub data from user provider data
        const githubProfile = result.user.providerData.find(
          provider => provider.providerId === 'github.com'
        );
        
        // Get username from provider data
        const username = githubProfile?.displayName;
        
        if (username) {
          try {
            // Fetch full GitHub profile data
            const response = await fetch(`https://api.github.com/users/${username}`);
            const profileData = await response.json();
            
            // Fetch repositories to check if user has any
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`);
            const reposData = await reposResponse.json();
            
            // Check if profile is incomplete (no bio or no avatar or no repos)
            const hasIncompleteProfile = 
              !profileData.bio || 
              profileData.avatar_url.includes('gravatar') || // Default GitHub avatar
              !reposData || reposData.length === 0;
            
            if (hasIncompleteProfile) {
              setProfileWarning('Please complete your GitHub profile with a bio, profile picture, and at least one public repository before proceeding.');
              return; // Don't redirect yet
            }
          } catch (profileError) {
            console.error('Error checking GitHub profile:', profileError);
            // If we can't check the profile, we'll let them proceed anyway
          }
        }
        
        // Profile is complete or we couldn't check it, proceed to dashboard
        handleClose();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      
      if (error.customMessage) {
        setError(error.customMessage);
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email. Try another login method.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Authentication was cancelled. Please try again.');
      } else {
        setError('Failed to sign in with GitHub. Please try again.');
      }
    } finally {
      setLoading(false);
      setCheckingProfile(false);
    }
  };

  // Open GitHub signup page in a new tab
  const openGitHubSignup = () => {
    window.open('https://github.com/signup', '_blank');
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-blue-900 bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-8 relative">
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-600">Welcome to Open Source Matchmaker</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {profileWarning && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
            <p className="font-bold">GitHub Profile Incomplete</p>
            <p>{profileWarning}</p>
            <div className="mt-2">
              <a 
                href="https://github.com/settings/profile" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                Complete your profile <FaExternalLinkAlt className="ml-1 text-xs" />
              </a>
            </div>
          </div>
        )}
        
        {!profileWarning && (
          <>
            <div className="mb-6 text-center text-gray-600">
              <p>Choose the option that best describes you:</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <button
                onClick={() => openGitHubSignup()}
                disabled={loading || checkingProfile}
                className="flex items-center justify-center gap-3 bg-green-600 border border-green-700 rounded-lg py-4 px-4 text-lg font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm hover:shadow mb-2"
              >
                <FaUserAlt className="w-5 h-5" />
                <div className="text-left">
                  <span className="block font-bold">I'm new to open source</span>
                  <span className="block text-sm opacity-90">Create a GitHub account first</span>
                </div>
              </button>
              
              <button
                onClick={handleBeginnerGithubSignIn}
                disabled={loading || checkingProfile}
                className="flex items-center justify-center gap-3 bg-blue-600 border border-blue-700 rounded-lg py-4 px-4 text-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm hover:shadow mb-2"
              >
                <FaGithub className="w-5 h-5" />
                <div className="text-left">
                  <span className="block font-bold">I have a GitHub account</span>
                  <span className="block text-sm opacity-90">But I'm new to contributing</span>
                </div>
                {checkingProfile && <span className="ml-2 animate-pulse">•••</span>}
              </button>
              
              <button
                onClick={handleGithubSignIn}
                disabled={loading || checkingProfile}
                className="flex items-center justify-center gap-3 bg-gray-800 border border-gray-900 rounded-lg py-4 px-4 text-lg font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow-sm hover:shadow"
              >
                <FaUserGraduate className="w-5 h-5" />
                <div className="text-left">
                  <span className="block font-bold">I'm an experienced developer</span>
                  <span className="block text-sm opacity-90">Already familiar with GitHub & open source</span>
                </div>
              </button>
            </div>
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Alternative</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm hover:shadow"
              >
                <FcGoogle className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </div>
          </>
        )}
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPopup; 