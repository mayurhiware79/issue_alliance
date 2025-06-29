import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GithubAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  const loginWithGoogle = async () => {
    try {
      // Set custom parameters for Google auth
      googleProvider.setCustomParameters({
        prompt: "select_account"
      });
      
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const loginWithGithub = async () => {
    try {
      // Check network connection first
      if (!navigator.onLine) {
        const error = new Error('No internet connection. Please check your network and try again.');
        error.customMessage = 'No internet connection. Please check your network and try again.';
        throw error;
      }
      
      // Set custom parameters for GitHub auth
      githubProvider.setCustomParameters({
        // Force re-authentication every time
        prompt: "consent",
        // Add scopes for better GitHub access
        scope: 'user:email read:user repo'
      });
      
      // Sign in with popup and wait for result
      let result;
      try {
        result = await signInWithPopup(auth, githubProvider);
      } catch (popupError) {
        console.error('GitHub popup error:', popupError);
        
        // Check for specific error types
        if (popupError.code === 'auth/popup-blocked') {
          const error = new Error('Popup was blocked by your browser. Please allow popups for this site.');
          error.customMessage = 'Popup was blocked by your browser. Please allow popups for this site.';
          throw error;
        } else if (popupError.code === 'auth/cancelled-popup-request' || 
                  popupError.code === 'auth/popup-closed-by-user') {
          const error = new Error('Authentication was cancelled.');
          error.customMessage = 'Authentication was cancelled by user.';
          throw error;
        }
        throw popupError;
      }
      
      // Get GitHub user data and token
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      
      // Store user data in Firestore if needed
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          
          // Retry mechanism for Firestore operations
          let retries = 3;
          let userDoc = null;
          
          while (retries > 0) {
            try {
              userDoc = await getDoc(userRef);
              break; // Success, exit loop
            } catch (dbErr) {
              retries--;
              if (retries === 0) throw dbErr;
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // Get GitHub profile from provider data
          const githubProfile = user.providerData.find(
            provider => provider.providerId === 'github.com'
          );
          
          // Try to get additional GitHub data via API
          let githubData = null;
          try {
            if (githubProfile?.displayName) {
              githubData = await fetch(`https://api.github.com/users/${githubProfile.displayName}`, {
                headers: { Authorization: `token ${token}` }
              }).then(res => res.json());
            }
          } catch (apiErr) {
            console.warn('Could not fetch additional GitHub data:', apiErr);
            // Continue without additional data
          }
          
          if (!userDoc.exists()) {
            // Create new user document
            await setDoc(userRef, {
              displayName: user.displayName || '',
              email: user.email,
              photoURL: user.photoURL,
              createdAt: new Date(),
              updatedAt: new Date(),
              githubConnected: true,
              githubUsername: githubProfile?.displayName || '',
              githubId: githubProfile?.uid || '',
              githubToken: token,
              githubData: githubData
            });
          } else {
            // Update existing user
            await updateDoc(userRef, {
              githubConnected: true,
              githubUsername: githubProfile?.displayName || '',
              githubId: githubProfile?.uid || '',
              githubToken: token,
              githubData: githubData,
              updatedAt: new Date()
            });
          }
        } catch (dbError) {
          console.error('Error updating user data:', dbError);
          // Don't fail the auth process, just log the error
        }
      }
      
      return result;
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to sign in with GitHub';
      if (error.customMessage) {
        errorMessage = error.customMessage;
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email from a different provider.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Authentication was cancelled.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Authentication was cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Authentication popup was blocked by the browser.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      // Add better error context
      error.customMessage = errorMessage;
      throw error;
    }
  };

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function updateUserProfile(profile) {
    return updateProfile(auth.currentUser, profile);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 