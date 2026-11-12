import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import {
  FaGithub, FaUserGraduate, FaUserAlt, FaExternalLinkAlt,
  FaFlask, FaEnvelope, FaLock, FaEye, FaEyeSlash
} from 'react-icons/fa';

function LoginPopup({ onClose }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileWarning, setProfileWarning] = useState('');
  const [activeTab, setActiveTab] = useState('email'); // 'oauth' | 'email'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { loginWithGoogle, loginWithGithub, loginAsDemo, login, currentUser } = useAuth();
  const navigate = useNavigate();

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
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGithub();
      if (result.user) {
        console.log('GitHub login successful:', result.user.displayName);
      }
      handleClose();
      navigate('/dashboard');
    } catch (err) {
      console.error('GitHub sign-in error:', err);
      if (err.customMessage) {
        setError(err.customMessage);
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email. Try another login method.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Authentication was cancelled. Please try again.');
      } else {
        setError('Failed to sign in with GitHub. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBeginnerGithubSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await loginWithGithub();
      if (result.user) {
        setCheckingProfile(true);
        const githubProfile = result.user.providerData.find(
          p => p.providerId === 'github.com'
        );
        const username = githubProfile?.displayName;
        if (username) {
          try {
            const response = await fetch(`https://api.github.com/users/${username}`);
            const profileData = await response.json();
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`);
            const reposData = await reposResponse.json();
            const hasIncompleteProfile =
              !profileData.bio ||
              profileData.avatar_url.includes('gravatar') ||
              !reposData || reposData.length === 0;
            if (hasIncompleteProfile) {
              setProfileWarning('Please complete your GitHub profile with a bio, profile picture, and at least one public repository before proceeding.');
              return;
            }
          } catch (profileError) {
            console.error('Error checking GitHub profile:', profileError);
          }
        }
        handleClose();
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('GitHub sign-in error:', err);
      if (err.customMessage) {
        setError(err.customMessage);
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email. Try another login method.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Authentication was cancelled. Please try again.');
      } else {
        setError('Failed to sign in with GitHub. Please try again.');
      }
    } finally {
      setLoading(false);
      setCheckingProfile(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(emailInput, passwordInput);
      handleClose();
      navigate('/dashboard');
    } catch (err) {
      console.error('Email login error:', err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Autofill demo credentials and switch to email tab
  const fillDemoCredentials = () => {
    setActiveTab('email');
    setEmailInput('demo@issuealliance.app');
    setPasswordInput('demo123');
    setError('');
  };

  const openGitHubSignup = () => {
    window.open('https://github.com/signup', '_blank');
  };

  // Guest demo mode — no Firebase auth needed
  const handleDemoLogin = () => {
    loginAsDemo();
    handleClose();
    navigate('/dashboard');
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-blue-900 bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-8 relative">

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Welcome to Open Source Matchmaker
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setActiveTab('oauth'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'oauth'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Sign in with
          </button>
          <button
            onClick={() => { setActiveTab('email'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'email'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Email & Password
          </button>
        </div>

        {/* ── OAuth Tab ── */}
        {activeTab === 'oauth' && (
          <>
            {profileWarning ? (
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
            ) : (
              <>
                <div className="mb-6 text-center text-gray-600">
                  <p>Choose the option that best describes you:</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <button
                    onClick={openGitHubSignup}
                    disabled={loading || checkingProfile}
                    className="flex items-center justify-center gap-3 bg-green-600 border border-green-700 rounded-lg py-4 px-4 text-lg font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm hover:shadow"
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
                    className="flex items-center justify-center gap-3 bg-blue-600 border border-blue-700 rounded-lg py-4 px-4 text-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm hover:shadow"
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

                {/* Google */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Alternative</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm hover:shadow"
                >
                  <FcGoogle className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
              </>
            )}
          </>
        )}

        {/* ── Email & Password Tab ── */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="login-email">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  id="login-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            {/* Demo autofill */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400">want to try first?</span>
              </div>
            </div>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 font-medium py-2.5 rounded-lg transition-colors bg-blue-50 hover:bg-blue-100"
            >
              <FaFlask className="text-sm" />
              Use Demo Account
              <span className="text-xs text-gray-400 font-normal ml-1">
                (demo@issuealliance.app / demo123)
              </span>
            </button>
          </form>
        )}

        {/* Register link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register
          </Link>
        </div>

      </div>
    </div>
  );
}

export default LoginPopup;
