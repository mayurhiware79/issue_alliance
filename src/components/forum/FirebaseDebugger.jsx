import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';

export default function FirebaseDebugger() {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState(null);
  const [collections, setCollections] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        // Try to access the threads collection
        const threadsQuery = query(collection(db, 'threads'), limit(1));
        const threadsSnapshot = await getDocs(threadsQuery);
        
        // Get list of all collections to check
        const allCollections = [
          { name: 'threads', required: true },
          { name: 'answers', required: true },
          { name: 'dailyIssues', required: false },
          { name: 'issueMatches', required: false },
          { name: 'messages', required: false },
          { name: 'notifications', required: false },
          { name: 'otpVerification', required: false },
          { name: 'projects', required: false },
          { name: 'queries', required: false },
          { name: 'repositories', required: false },
          { name: 'savedIssues', required: false },
          { name: 'skillSearches', required: false },
          { name: 'userDailyIssues', required: false },
          { name: 'userIssueViews', required: false },
          { name: 'userStats', required: false },
          { name: 'user_settings', required: false },
          { name: 'users', required: false }
        ];
        
        // Check all collections status
        const collectionStatuses = await Promise.all(
          allCollections.map(async (collInfo) => {
            try {
              const colQuery = query(collection(db, collInfo.name), limit(5));
              const snapshot = await getDocs(colQuery);
              return {
                name: collInfo.name,
                count: snapshot.size,
                exists: true,
                hasData: snapshot.size > 0,
                required: collInfo.required
              };
            } catch (error) {
              return {
                name: collInfo.name,
                count: 0,
                exists: false,
                hasData: false,
                required: collInfo.required,
                error: error.message
              };
            }
          })
        );
        
        setCollections(collectionStatuses);
        
        // Check if threads collection has data
        if (threadsSnapshot.empty) {
          setStatus('Connected to Firebase, but the threads collection is empty.');
          setError({ 
            type: 'empty_collection',
            message: 'You need to initialize the forum data by running: npm run init-forum'
          });
        } else {
          setStatus('Connected to Firebase successfully.');
          
          // Check if we have any answers 
          const answersQuery = query(collection(db, 'answers'), limit(1));
          const answersSnapshot = await getDocs(answersQuery);
          
          if (answersSnapshot.empty) {
            setStatus('Connected to Firebase, but the answers collection is empty.');
            setError({ 
              type: 'empty_collection',
              message: 'The threads collection has data, but the answers collection is empty. Run: npm run init-forum'
            });
          }
        }
      } catch (err) {
        console.error('Firebase connection error:', err);
        
        setStatus('Failed to connect to Firebase');
        setError({
          type: 'connection_error',
          message: err.message,
          code: err.code,
          details: 'Check your Firebase configuration in .env file and make sure you have the correct permissions.'
        });
      }
    };

    checkFirebaseConnection();
  }, []);

  return (
    <div className="p-4 mb-6 bg-yellow-50 border border-yellow-300 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-yellow-800">Firebase Connection Status</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      <div className={`mt-2 ${isExpanded ? 'block' : 'hidden'}`}>
        <p className={`text-${error ? 'red' : 'green'}-600 font-medium`}>
          {status}
        </p>
        
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 font-medium">{error.message}</p>
            {error.code && <p className="text-red-600">Error code: {error.code}</p>}
            {error.details && <p className="text-red-600 mt-1">{error.details}</p>}
            
            {error.type === 'empty_collection' && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono">
                <p>To initialize sample forum data:</p>
                <ol className="list-decimal list-inside mt-1">
                  <li>Check that your .env file has correct Firebase config</li>
                  <li>Run <code className="bg-gray-200 px-1">npm run init-forum</code> in your terminal</li>
                  <li>Refresh this page after initialization completes</li>
                </ol>
              </div>
            )}
          </div>
        )}
        
        {collections.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium">Collections Status:</h4>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {collections.map(col => (
                <div key={col.name} className="flex items-center p-2 border border-gray-200 rounded bg-white">
                  <span 
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      col.required 
                        ? (col.hasData ? 'bg-green-500' : 'bg-red-500') 
                        : (col.exists ? (col.hasData ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-300')
                    }`}
                    title={col.hasData ? 'Has data' : 'Empty'}
                  ></span>
                  <span className="font-medium">{col.name}</span>: 
                  <span className="ml-1">{col.count} document{col.count !== 1 ? 's' : ''}</span>
                  {col.required && !col.hasData && 
                    <span className="ml-1 text-xs text-red-500">(Required for forum)</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <h4 className="font-medium text-blue-700">Required Composite Indexes:</h4>
          <ul className="mt-1 list-disc list-inside">
            <li><code>threads</code> collection: <span className="font-mono">category + createdAt</span></li>
            <li><code>threads</code> collection: <span className="font-mono">votes + createdAt</span></li>
            <li><code>answers</code> collection: <span className="font-mono">threadId + isAccepted + votes + createdAt</span></li>
          </ul>
          <p className="mt-2 text-xs text-gray-600">
            If you see any query errors in the console, look for a link to automatically create the required index.
          </p>
        </div>
        
        <p className="mt-3 text-xs text-gray-500">
          Your Firebase project contains {collections.filter(c => c.exists).length} collections. 
          For the forum functionality, the <code>threads</code> and <code>answers</code> collections must have data.
        </p>
      </div>
    </div>
  );
} 