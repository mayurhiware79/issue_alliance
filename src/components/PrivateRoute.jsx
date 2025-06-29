import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * A wrapper component that redirects to the login page if the user is not authenticated
 */
function PrivateRoute() {
  const { currentUser, loading } = useAuth();

  // Show loading state if authentication is still being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute; 