import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import {
  FaGithub, FaUserGraduate, FaUserAlt, FaExternalLinkAlt,
  FaFlask, FaEnvelope, FaLock, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AuthNavbar from '../components/AuthNavbar';

/* ─── login card (self-contained, no fixed overlay) ─── */
function LoginCard() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setChecking] = useState(false);
  const [profileWarning, setWarning] = useState('');
  const [activeTab, setActiveTab] = useState('email');
  const [emailInput, setEmail] = useState('');
  const [passwordInput, setPassword] = useState('');
  const [showPassword, setShowPwd] = useState(false);

  const { loginWithGoogle, loginWithGithub, login, loginAsDemo, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/dashboard');
  }, [currentUser, navigate]);

  /* Google */
  const handleGoogle = async () => {
    try { setError(''); setLoading(true); await loginWithGoogle(); navigate('/dashboard'); }
    catch { setError('Failed to sign in with Google. Please try again.'); }
    finally { setLoading(false); }
  };

  /* GitHub (experienced) */
  const handleGithub = async () => {
    try {
      setError(''); setLoading(true);
      await loginWithGithub();
      navigate('/dashboard');
    } catch (err) {
      setError(err.customMessage || (err.code === 'auth/popup-closed-by-user' ? 'Authentication was cancelled.' : 'Failed to sign in with GitHub.'));
    } finally { setLoading(false); }
  };

  /* GitHub (beginner — checks profile completeness) */
  const handleBeginnerGithub = async () => {
    try {
      setError(''); setLoading(true);
      const result = await loginWithGithub();
      if (result.user) {
        setChecking(true);
        const ghProfile = result.user.providerData.find(p => p.providerId === 'github.com');
        const username = ghProfile?.displayName;
        if (username) {
          try {
            const pd = await fetch(`https://api.github.com/users/${username}`).then(r => r.json());
            const rd = await fetch(`https://api.github.com/users/${username}/repos`).then(r => r.json());
            if (!pd.bio || pd.avatar_url?.includes('gravatar') || !rd?.length) {
              setWarning('Please complete your GitHub profile with a bio, profile picture, and at least one public repository.');
              return;
            }
          } catch { /* allow through if API fails */ }
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.customMessage || 'Failed to sign in with GitHub.');
    } finally { setLoading(false); setChecking(false); }
  };

  /* Email + password */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setError(''); setLoading(true);
      await login(emailInput, passwordInput);
      navigate('/dashboard');
    } catch (err) {
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(err.code))
        setError('Invalid email or password. Please try again.');
      else if (err.code === 'auth/too-many-requests')
        setError('Too many failed attempts. Please try again later.');
      else setError('Failed to sign in. Please try again.');
    } finally { setLoading(false); }
  };

  /* Autofill demo creds */
  const fillDemo = () => {
    setActiveTab('email');
    setEmail('demo@issuealliance.app');
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full p-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">Welcome Back</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['email', 'oauth'].map(tab => (
          <button key={tab}
            onClick={() => { setActiveTab(tab); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab === 'email' ? 'Email & Password' : 'Sign in with'}
          </button>
        ))}
      </div>

      {/* ── Email tab ── */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lp-email">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input id="lp-email" type="email" value={emailInput} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lp-password">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input id="lp-password" type={showPassword ? 'text' : 'password'} value={passwordInput}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPwd(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {/* Demo autofill */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">want to try first?</span>
            </div>
          </div>
          <button type="button" onClick={fillDemo}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 font-medium py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
            <FaFlask className="text-sm" />
            Use Demo Account
            <span className="text-xs text-gray-400 font-normal ml-1">(demo@issuealliance.app / demo123)</span>
          </button>
        </form>
      )}

      {/* ── OAuth tab ── */}
      {activeTab === 'oauth' && (
        <>
          {profileWarning ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 text-sm">
              <p className="font-bold">GitHub Profile Incomplete</p>
              <p>{profileWarning}</p>
              <a href="https://github.com/settings/profile" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center mt-1">
                Complete your profile <FaExternalLinkAlt className="ml-1 text-xs" />
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={() => window.open('https://github.com/signup', '_blank')} disabled={loading || checkingProfile}
                className="flex items-center gap-3 w-full bg-green-600 rounded-lg py-3 px-4 text-white hover:bg-green-700 transition-colors">
                <FaUserAlt className="shrink-0" />
                <div className="text-left"><p className="font-bold text-sm">New to open source</p><p className="text-xs opacity-90">Create a GitHub account first</p></div>
              </button>
              <button onClick={handleBeginnerGithub} disabled={loading || checkingProfile}
                className="flex items-center gap-3 w-full bg-blue-600 rounded-lg py-3 px-4 text-white hover:bg-blue-700 transition-colors">
                <FaGithub className="shrink-0" />
                <div className="text-left"><p className="font-bold text-sm">I have a GitHub account</p><p className="text-xs opacity-90">New to contributing</p></div>
                {checkingProfile && <span className="ml-auto animate-pulse text-xs">checking…</span>}
              </button>
              <button onClick={handleGithub} disabled={loading || checkingProfile}
                className="flex items-center gap-3 w-full bg-gray-800 rounded-lg py-3 px-4 text-white hover:bg-gray-900 transition-colors">
                <FaUserGraduate className="shrink-0" />
                <div className="text-left"><p className="font-bold text-sm">Experienced developer</p><p className="text-xs opacity-90">Familiar with GitHub & open source</p></div>
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Alternative</span></div>
              </div>

              <button onClick={handleGoogle} disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <FcGoogle className="w-5 h-5" /> Continue with Google
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Register</Link>
      </p>
    </div>
  );
}

/* ─── page wrapper ─── */
export default function LoginPage() {
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';

  return (
    <div className={`min-h-screen flex flex-col ${darkMode
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900'
        : 'bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100'
      }`}>
      <AuthNavbar />
      <div className="flex-1 flex items-center justify-center pt-24 pb-10 px-4">
        <div className="w-full max-w-xl">
          <LoginCard />
        </div>
      </div>
    </div>
  );
}
