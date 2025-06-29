import React from 'react';

export default function TestDashboard() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-blue-600">Test Dashboard Page</h1>
      <p className="mt-4">This is a test page to check if routing works correctly.</p>
      
      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold">Debug Information</h2>
        <p className="mt-2">Current URL: {window.location.href}</p>
        <p>Path: {window.location.pathname}</p>
      </div>
    </div>
  );
} 