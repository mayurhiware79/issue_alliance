import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import AuthNavbar from './AuthNavbar';
import LoginPopup from './LoginPopup';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { signup, updateUserProfile } = useAuth();
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');

    try {
      setError('');
      setLoading(true);

      const result = await signup(email, password);
      await updateUserProfile({ displayName });

      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        displayName,
        createdAt: new Date(),
        skills: [],
        interests: [],
        githubUsername: ''
      });

      await setDoc(doc(db, 'userStats', result.user.uid), {
        uid: result.user.uid,
        displayName,
        email,
        photoURL: result.user.photoURL || null,
        streak: 0,
        points: 0,
        completedIssues: 0,
        lastUpdated: Timestamp.now()
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900'
        : 'bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100'
      }`}>
      <AuthNavbar />

      <div className="flex-1 flex items-center justify-center pt-24 pb-10 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">Create Account</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-name">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input id="reg-name" type="text" placeholder="John Doe"
                  value={displayName} onChange={e => setDisplayName(e.target.value)} required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-email">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input id="reg-email" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-password">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reg-confirm">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input id="reg-confirm" type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={() => setShowLoginPopup(true)}
              className="font-medium text-blue-600 hover:text-blue-500">
              Sign In
            </button>
          </p>
        </div>
      </div>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

export default Register;
