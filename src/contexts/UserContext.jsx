import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '../services/userService';

const UserContext = createContext();

export function UserProvider({ children }) {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const user = await getUserProfile(currentUser.uid);
        setUserData(user);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
        // If user not found, create default user data
        if (err.response && err.response.status === 404) {
          try {
            const defaultUserData = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'User',
              email: currentUser.email,
              photoURL: currentUser.photoURL || null,
            };
            const newUser = await updateUserProfile(defaultUserData);
            setUserData(newUser);
            setError(null);
          } catch (createErr) {
            console.error('Error creating default user:', createErr);
            setError('Failed to create user data');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const updateUser = async (newUserData, imageFile = null) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const updatedUser = await updateUserProfile({
        uid: currentUser.uid,
        ...newUserData
      }, imageFile);

      setUserData(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Error updating user data:', err);
      setError('Failed to update user data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ userData, loading, error, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 