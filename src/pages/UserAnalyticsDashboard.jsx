import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format, parseISO, subDays } from 'date-fns';
import { fetchSheetsData } from '../services/api';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import StatsCard from '../components/StatsCard';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import DataTable from '../components/DataTable';

// Icons
import {
  Users,
  Code2,
  MessageSquare,
  Award,
  Github,
  Bookmark,
  Search,
  RefreshCw,
  Clock,
  Info,
  X
} from 'lucide-react';

// Demo data for fallback
const DEMO_DATA = {
  user: {
    displayName: 'Jane Developer',
    email: 'jane@example.com',
    photoURL: 'https://i.pravatar.cc/150?img=29',
    createdAt: '2023-01-15T10:30:00Z',
    skills: ['JavaScript', 'React', 'Node.js', 'Firebase', 'TypeScript', 'GraphQL', 'MongoDB'],
    bio: 'Full-stack developer passionate about open source.'
  },
  github: {
    username: 'janedev',
    publicRepos: 24,
    followers: 87,
    following: 42,
    stars: 156,
    contributions: 342,
    lastActive: '2023-04-18T14:22:33Z'
  },
  contributions: [
    { type: 'code', count: 28 },
    { type: 'issues', count: 12 },
    { type: 'pull_requests', count: 8 },
    { type: 'reviews', count: 15 },
    { type: 'documentation', count: 6 },
    { type: 'testing', count: 4 },
    { type: 'design', count: 3 }
  ],
  savedIssues: [
    { id: 'issue1', title: 'Fix navigation bug', createdAt: '2023-04-10T09:15:00Z', repo: 'frontend-app' },
    { id: 'issue2', title: 'Add dark mode support', createdAt: '2023-04-05T11:30:00Z', repo: 'design-system' },
    { id: 'issue3', title: 'Optimize database queries', createdAt: '2023-04-01T14:45:00Z', repo: 'backend-api' },
    { id: 'issue4', title: 'Improve error handling', createdAt: '2023-03-25T10:00:00Z', repo: 'utils-library' },
    { id: 'issue5', title: 'Fix mobile responsive layout', createdAt: '2023-03-20T16:20:00Z', repo: 'marketing-site' }
  ],
  chatInteractions: [
    { date: '2023-03-01', count: 3 },
    { date: '2023-03-15', count: 5 },
    { date: '2023-04-01', count: 8 },
    { date: '2023-04-05', count: 12 },
    { date: '2023-04-10', count: 7 },
    { date: '2023-04-15', count: 10 },
    { date: '2023-04-20', count: 15 }
  ],
  searchHistory: [
    { term: 'React hooks', timestamp: '2023-04-18T09:30:00Z' },
    { term: 'Firebase authentication', timestamp: '2023-04-17T15:45:00Z' },
    { term: 'GraphQL queries', timestamp: '2023-04-15T11:20:00Z' },
    { term: 'Responsive design', timestamp: '2023-04-12T14:10:00Z' },
    { term: 'State management', timestamp: '2023-04-10T16:55:00Z' }
  ],
  activityHistory: [
    { action: 'Viewed project', target: 'AI Chat Application', timestamp: '2023-04-18T16:30:00Z' },
    { action: 'Saved issue', target: 'Add dark mode support', timestamp: '2023-04-18T14:20:00Z' },
    { action: 'Submitted contribution', target: 'Fix navigation bug', timestamp: '2023-04-17T10:15:00Z' },
    { action: 'Started chat', target: 'Project requirements', timestamp: '2023-04-16T13:45:00Z' },
    { action: 'Searched for', target: 'Firebase integration', timestamp: '2023-04-16T11:30:00Z' },
    { action: 'Updated profile', target: 'Skills updated', timestamp: '2023-04-15T09:20:00Z' }
  ],
  // New dummy data for combined charts
  combinedData: {
    skills: [
      { name: 'JavaScript', count: 25 },
      { name: 'React', count: 22 },
      { name: 'TypeScript', count: 18 },
      { name: 'Node.js', count: 15 },
      { name: 'Firebase', count: 12 },
      { name: 'GraphQL', count: 8 },
      { name: 'CSS/SCSS', count: 7 },
      { name: 'HTML', count: 6 }
    ],
    activityByMonth: [
      { month: 'Jan', count: 12 },
      { month: 'Feb', count: 18 },
      { month: 'Mar', count: 24 },
      { month: 'Apr', count: 32 }
    ]
  }
};

export default function UserAnalyticsDashboard() {
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [contributionsData, setContributionsData] = useState([]);
  const [savedIssuesData, setSavedIssuesData] = useState([]);
  const [chatData, setChatData] = useState([]);
  const [searchHistoryData, setSearchHistoryData] = useState([]);
  const [activityHistoryData, setActivityHistoryData] = useState([]);
  const [sheetsData, setSheetsData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [combinedData, setCombinedData] = useState({
    skills: [],
    activityByMonth: []
  });
  
  // Add this error handling function before the useEffect hooks
  const handleFirestoreError = (error) => {
    console.warn('Firestore operation error:', error.message);
    // Check for lease-related errors which are usually temporary
    if (error.message && error.message.includes('lease')) {
      console.info('This is a temporary Firestore lease error. Will retry operation.');
      // Automatically retry after a delay
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 3000);
    }
    return error;
  };
  
  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Get user profile from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef).catch(err => {
          throw handleFirestoreError(err);
        });
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          console.warn('No user data found in Firestore');
          setUserData(DEMO_DATA.user);
          setUsingDemoData(true);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Using demo data instead.');
        setUserData(DEMO_DATA.user);
        setUsingDemoData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser, refreshKey]);
  
  // Fetch contributions data
  useEffect(() => {
    const fetchContributions = async () => {
      if (!currentUser) return;
      
      try {
        // Attempt to get contributions from Firestore
        const contributionsRef = collection(db, 'contributions');
        const q = query(contributionsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const contributions = [];
          querySnapshot.forEach(doc => {
            contributions.push({ id: doc.id, ...doc.data() });
          });
          
          // Process data for chart display
          const contribByType = {};
          contributions.forEach(contrib => {
            const type = contrib.type || 'other';
            contribByType[type] = (contribByType[type] || 0) + 1;
          });
          
          const formattedData = Object.entries(contribByType).map(([type, count]) => ({
            name: type,
            count
          }));
          
          setContributionsData(formattedData);
        } else {
          console.warn('No contributions found for user');
          setContributionsData(DEMO_DATA.contributions);
          setUsingDemoData(true);
        }
      } catch (err) {
        console.error('Error fetching contributions:', err);
        setContributionsData(DEMO_DATA.contributions);
        setUsingDemoData(true);
      }
    };
    
    fetchContributions();
  }, [currentUser, refreshKey]);
  
  // Fetch saved issues
  useEffect(() => {
    const fetchSavedIssues = async () => {
      if (!currentUser) return;
      
      try {
        // Query for saved issues
        const savedIssuesRef = collection(db, 'savedIssues');
        const q = query(
          savedIssuesRef, 
          where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q).catch(err => {
          throw handleFirestoreError(err);
        });
        
        if (!querySnapshot.empty) {
          const issues = [];
          querySnapshot.forEach(doc => {
            issues.push({ id: doc.id, ...doc.data() });
          });
          
          // Ensure we only have current user's data
          const filteredIssues = issues.filter(issue => 
            issue.userId === currentUser.uid
          );
          
          setSavedIssuesData(filteredIssues.length > 0 ? filteredIssues : DEMO_DATA.savedIssues);
        } else {
          console.warn('No saved issues found');
          setSavedIssuesData(DEMO_DATA.savedIssues);
          setUsingDemoData(true);
        }
      } catch (err) {
        console.error('Error fetching saved issues:', err);
        setSavedIssuesData(DEMO_DATA.savedIssues);
        setUsingDemoData(true);
      }
    };
    
    fetchSavedIssues();
  }, [currentUser, refreshKey]);
  
  // Get chat data from localStorage
  useEffect(() => {
    const fetchChatData = () => {
      try {
        // Get chat sessions from localStorage
        const chatSessions = localStorage.getItem('chatSessions');
        
        if (chatSessions) {
          const parsedSessions = JSON.parse(chatSessions);
          
          // Process sessions for chart display
          const sessionsByDate = {};
          parsedSessions.forEach(session => {
            if (session.lastUpdated) {
              const dateKey = format(new Date(session.lastUpdated), 'yyyy-MM-dd');
              sessionsByDate[dateKey] = (sessionsByDate[dateKey] || 0) + 1;
            }
          });
          
          // Format for chart
          const formattedData = Object.entries(sessionsByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
          setChatData(formattedData.length > 0 ? formattedData : DEMO_DATA.chatInteractions);
        } else {
          console.warn('No chat sessions found in localStorage');
          setChatData(DEMO_DATA.chatInteractions);
          setUsingDemoData(true);
        }
      } catch (err) {
        console.error('Error processing chat data:', err);
        setChatData(DEMO_DATA.chatInteractions);
        setUsingDemoData(true);
      }
    };
    
    fetchChatData();
  }, [refreshKey]);
  
  // Get search history from localStorage
  useEffect(() => {
    const fetchSearchHistory = () => {
      try {
        const searchHistory = localStorage.getItem('searchHistory');
        
        if (searchHistory) {
          const parsedHistory = JSON.parse(searchHistory);
          setSearchHistoryData(parsedHistory);
        } else {
          console.warn('No search history found');
          setSearchHistoryData(DEMO_DATA.searchHistory);
          setUsingDemoData(true);
        }
      } catch (err) {
        console.error('Error processing search history:', err);
        setSearchHistoryData(DEMO_DATA.searchHistory);
        setUsingDemoData(true);
      }
    };
    
    fetchSearchHistory();
  }, [refreshKey]);
  
  // Get user activity from localStorage
  useEffect(() => {
    const fetchActivityHistory = () => {
      try {
        const userActions = localStorage.getItem('user_actions');
        
        if (userActions) {
          const parsedActions = JSON.parse(userActions);
          setActivityHistoryData(parsedActions);
        } else {
          console.warn('No user activity found');
          setActivityHistoryData(DEMO_DATA.activityHistory);
          setUsingDemoData(true);
        }
      } catch (err) {
        console.error('Error processing activity history:', err);
        setActivityHistoryData(DEMO_DATA.activityHistory);
        setUsingDemoData(true);
      }
    };
    
    fetchActivityHistory();
  }, [refreshKey]);
  
  // Fetch sheets data for current user
  useEffect(() => {
    const fetchUserSheetsData = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetchSheetsData();
        
        if (response && Array.isArray(response)) {
          // Filter sheets data to only show this user's data
          const userEmail = currentUser.email;
          const userSheetData = response.filter(
            entry => entry.email === userEmail
          );
          
          if (userSheetData.length > 0) {
            console.log('Found user-specific sheet data:', userSheetData.length, 'entries');
            setSheetsData(userSheetData);
          } else {
            console.warn('No user-specific data found in sheets');
            setSheetsData([]);
            // Don't set usingDemoData here as we may have other real data
          }
        } else {
          console.warn('Invalid sheets data format');
          setSheetsData([]);
        }
      } catch (err) {
        console.error('Error fetching sheets data:', err);
        setSheetsData([]);
      }
    };
    
    fetchUserSheetsData();
  }, [currentUser, refreshKey]);
  
  // Add a new useEffect to combine Firebase and Sheets data
  useEffect(() => {
    const combineAllData = () => {
      // Combine skills from both sources
      const allSkills = {};
      
      // Add skills from user profile if available
      if (userData && userData.skills && Array.isArray(userData.skills)) {
        userData.skills.forEach(skill => {
          if (skill && skill.trim()) {
            allSkills[skill.trim()] = (allSkills[skill.trim()] || 0) + 2; // Weight profile skills higher
          }
        });
      }
      
      // Add skills from Firebase contributions
      if (contributionsData && Array.isArray(contributionsData)) {
        contributionsData.forEach(contrib => {
          if (contrib.name) {
            allSkills[contrib.name] = (allSkills[contrib.name] || 0) + contrib.count;
          }
        });
      }
      
      // Add skills from Google Sheets
      if (sheetsData && Array.isArray(sheetsData)) {
        sheetsData.forEach(entry => {
          if (entry.skills) {
            // Parse skills field which might be array or string
            const skillsArray = Array.isArray(entry.skills) 
              ? entry.skills 
              : typeof entry.skills === 'string' 
                ? entry.skills.split(',').map(s => s.trim())
                : [];
              
            skillsArray.forEach(skill => {
              if (skill && skill.trim()) {
                allSkills[skill.trim()] = (allSkills[skill.trim()] || 0) + 1;
              }
            });
          }
        });
      }
      
      // Sort skills by count
      const skillsData = Object.entries(allSkills)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      
      // Generate activity by month data
      const activityByMonth = generateMonthlyActivityData();
      
      // Update combined data state
      setCombinedData({
        skills: skillsData.length > 0 ? skillsData : DEMO_DATA.combinedData.skills,
        activityByMonth: activityByMonth.length > 0 ? activityByMonth : DEMO_DATA.combinedData.activityByMonth
      });
    };
    
    // Helper function to generate monthly activity data
    const generateMonthlyActivityData = () => {
      const monthlyData = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Add activity from chat interactions
      if (chatData && Array.isArray(chatData)) {
        chatData.forEach(item => {
          try {
            const date = new Date(item.date);
            const monthKey = monthNames[date.getMonth()];
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.count;
          } catch (e) {
            // Ignore invalid dates
          }
        });
      }
      
      // Add activity from saved issues
      if (savedIssuesData && Array.isArray(savedIssuesData)) {
        savedIssuesData.forEach(issue => {
          try {
            const date = new Date(issue.createdAt);
            const monthKey = monthNames[date.getMonth()];
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
          } catch (e) {
            // Ignore invalid dates
          }
        });
      }
      
      // Add activity from search history
      if (searchHistoryData && Array.isArray(searchHistoryData)) {
        searchHistoryData.forEach(search => {
          try {
            const date = new Date(search.timestamp);
            const monthKey = monthNames[date.getMonth()];
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
          } catch (e) {
            // Ignore invalid dates
          }
        });
      }
      
      // Convert to array for charts
      return Object.entries(monthlyData)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          // Sort by month (Jan to Dec)
          return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        });
    };
    
    // Only run when data changes
    combineAllData();
  }, [userData, contributionsData, savedIssuesData, chatData, searchHistoryData, sheetsData]);
  
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Update the formatDate function to be more robust
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      // First try parsing as ISO string
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, 'MMM dd, yyyy HH:mm');
      }
      return dateString;
    } catch (e) {
      console.warn('Date formatting error:', e);
      return dateString || 'Unknown date';
    }
  };
  
  // Add a function to ensure charts have data
  const ensureChartData = (data, fallbackData) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return fallbackData;
    }
    return data;
  }
  
  // Add this helper function before the return statement
  const ensureTableData = (data, fallbackData) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return fallbackData;
    }
    return data;
  };
  
  // Add this function to process Google Sheets data for visualization
  const processSheetDataForSkillsChart = () => {
    if (!sheetsData || sheetsData.length === 0) {
      return [];
    }
    
    // Get all unique skills across all entries
    const skillCounts = {};
    
    sheetsData.forEach(entry => {
      if (entry.skills) {
        // Handle different formats of skills field
        const skillsArray = Array.isArray(entry.skills) 
          ? entry.skills 
          : typeof entry.skills === 'string' 
            ? entry.skills.split(',').map(s => s.trim())
            : [];
        
        skillsArray.forEach(skill => {
          if (skill && skill.trim()) {
            skillCounts[skill.trim()] = (skillCounts[skill.trim()] || 0) + 1;
          }
        });
      }
    });
    
    // Convert to array format for PieChart
    return Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 skills
  };
  
  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <LoadingSpinner size="lg" color={isDarkMode ? "gray" : "blue"} />
      </div>
    );
  }
  
  // Table columns for saved issues
  const issuesColumns = [
    { key: 'title', header: 'Issue Title' },
    { key: 'repo', header: 'Repository' },
    { key: 'createdAt', header: 'Saved Date', format: (date) => formatDate(date) }
  ];
  
  // Table columns for search history
  const searchColumns = [
    { key: 'term', header: 'Search Term' },
    { key: 'timestamp', header: 'Date', format: (date) => formatDate(date) }
  ];
  
  // Table columns for activity history
  const activityColumns = [
    { key: 'action', header: 'Action' },
    { key: 'target', header: 'Target' },
    { key: 'timestamp', header: 'Date', format: (date) => formatDate(date) }
  ];
  
  // Table columns for Google Sheets data
  const sheetsColumns = [
    { key: 'timestamp', header: 'Date', format: (date) => formatDate(date) },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'skills', header: 'Skills', format: (skills) => 
      Array.isArray(skills) ? skills.join(', ') : (typeof skills === 'string' ? skills : '') 
    }
  ];
  
  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} min-h-screen p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>User Analytics Dashboard</h1>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} p-2 rounded-full`}
              aria-label="Toggle info"
            >
              <Info size={20} />
            </button>
          </div>
          {userData && (
            <div className="mt-4 flex items-center">
              <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'} flex items-center justify-center mr-4 overflow-hidden`}>
                {userData.photoURL ? (
                  <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
                ) : (
                  <Users size={24} className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                )}
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{userData.displayName || 'Anonymous User'}</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userData.email}</p>
                {userData.createdAt && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Member since {formatDate(userData.createdAt)}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {!usingDemoData && (
                <span className={`${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'} text-xs px-2 py-1 rounded-full font-medium flex items-center`}>
                  <span className={`w-2 h-2 ${isDarkMode ? 'bg-green-400' : 'bg-green-500'} rounded-full mr-1`}></span>
                  Live Data
                </span>
              )}
              {usingDemoData && (
                <span className={`${isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'} text-xs px-2 py-1 rounded-full font-medium flex items-center`}>
                  <span className={`w-2 h-2 ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'} rounded-full mr-1`}></span>
                  Demo Data
                </span>
              )}
            </div>
            
            <button 
              onClick={handleRefresh} 
              className={`flex items-center gap-2 ${isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md`}
            >
              <RefreshCw size={18} />
              Refresh Data
            </button>
          </div>
        </div>
        
        {/* Info Panel */}
        {showInfo && (
          <div className={`mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700 border-l-4 border-l-blue-500' : 'bg-white border-l-4 border-blue-500'} p-4 rounded-lg shadow relative`}>
            <button 
              onClick={() => setShowInfo(false)}
              className={`absolute top-2 right-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              aria-label="Close info"
            >
              <X size={18} />
            </button>
            <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-2`}>About Your Dashboard</h3>
            <ul className={`list-disc pl-5 space-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>This dashboard shows all your activity and data in the platform</li>
              <li>Data is collected from Firestore and your local browser storage</li>
              <li>See your GitHub activity, saved issues, and chat history</li>
              <li>Analyze your contribution patterns and platform engagement</li>
              <li>Click "Refresh Data" to update with the latest information</li>
            </ul>
            <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Privacy Note:</strong> All data shown is private to you and not shared with other users.
            </div>
          </div>
        )}
        
        {/* Error notice */}
        {error && (
          <div className={`mb-6 ${isDarkMode ? 'bg-red-900/30 border-l-4 border-red-500' : 'bg-red-100 border-l-4 border-red-500'} p-4 rounded`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* User Skills */}
        {userData?.skills && userData.skills.length > 0 && (
          <div className={`mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Your Skills</h3>
            <div className="flex flex-wrap gap-2">
              {userData.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className={`${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'} text-sm px-3 py-1 rounded-full`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Combined Data Overview */}
        <div className="mb-6">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Unified Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Combined Skills Chart */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-5`}>
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Your Skills Overview</h3>
              <PieChart 
                data={combinedData.skills.slice(0, 6)} 
                title="" 
              />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-3 text-center`}>
                Combined from all data sources (Profile, Firebase, Sheets)
              </p>
            </div>
            
            {/* Monthly Activity Chart */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-5`}>
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Monthly Activity</h3>
              <BarChart 
                data={combinedData.activityByMonth} 
                title="" 
              />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-3 text-center`}>
                Aggregated from all interactions across the platform
              </p>
            </div>
          </div>
          
          {/* Comprehensive Skills Overview */}
          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Comprehensive Skills Analysis</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Combined skills data from your profile, contributions, and Google Sheets records
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {combinedData.skills.map((skill, index) => (
                  <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-lg`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{skill.name}</span>
                      <span className={`text-blue-600 font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{skill.count}</span>
                    </div>
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`bg-blue-500 h-full ${isDarkMode ? 'bg-blue-400' : ''}`}
                        style={{ 
                          width: `${Math.min(100, (skill.count / (combinedData.skills[0]?.count || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
                {combinedData.skills.length === 0 && (
                  <div className={`${isDarkMode ? 'col-span-3 text-gray-400' : 'col-span-3 text-center py-6 text-gray-500'}`}>
                    No skills data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Usage Tips Section */}
        <div className="mb-6 bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-medium mb-3">How to Use This Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">1</span>
                  <span>View your unified skills data combined from multiple sources</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">2</span>
                  <span>Track your monthly activity across all platform interactions</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">3</span>
                  <span>Explore contributions and chat history with detailed charts</span>
                </li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">4</span>
                  <span>Review your Google Sheets analytics data filtered to show only your information</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">5</span>
                  <span>Click "Refresh Data" to fetch the latest data from all sources</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 mr-2 flex-shrink-0">6</span>
                  <span>All your data is private and only visible to you</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard 
            title="Contributions" 
            value={contributionsData.reduce((sum, item) => sum + item.count, 0)} 
            icon={<Code2 size={24} />} 
            color="blue"
          />
          <StatsCard 
            title="Saved Issues" 
            value={savedIssuesData.length} 
            icon={<Bookmark size={24} />} 
            color="green"
          />
          <StatsCard 
            title="Chat Sessions" 
            value={chatData.reduce((sum, item) => sum + item.count, 0)} 
            icon={<MessageSquare size={24} />} 
            color="purple"
          />
          <StatsCard 
            title="Recent Activities" 
            value={activityHistoryData.length} 
            icon={<Clock size={24} />} 
            color="orange"
          />
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-5`}>
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Contribution Types</h3>
            <BarChart 
              data={ensureChartData(contributionsData, DEMO_DATA.contributions)} 
              title="" 
            />
          </div>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-5`}>
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Chat Interactions Over Time</h3>
            <LineChart 
              data={ensureChartData(chatData, DEMO_DATA.chatInteractions)} 
              title="" 
              color="#8884d8"
            />
          </div>
        </div>
        
        {/* Google Sheets Charts */}
        {sheetsData.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Google Sheets Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-5`}>
                <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Your Skills Distribution</h3>
                <PieChart 
                  data={processSheetDataForSkillsChart()} 
                  title="" 
                />
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-3 text-center`}>
                  Based on your Google Sheets analytics data
                </p>
              </div>
              
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-5`}>
                <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Skills Summary</h3>
                <div className="p-4">
                  <ul className="space-y-2">
                    {processSheetDataForSkillsChart().map((skill, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{skill.name}</span>
                        <div className="flex items-center">
                          <div className={`bg-blue-100 h-4 rounded-full overflow-hidden mr-2 ${isDarkMode ? 'bg-blue-800' : ''}`} style={{ width: '150px' }}>
                            <div 
                              className={`bg-blue-500 h-full ${isDarkMode ? 'bg-blue-800' : ''}`}
                              style={{ 
                                width: `${Math.min(100, (skill.count / processSheetDataForSkillsChart()[0].count) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : ''} text-sm w-8 text-right`}>{skill.count}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {processSheetDataForSkillsChart().length === 0 && (
                    <p className={`text-gray-500 ${isDarkMode ? 'text-gray-400' : ''} text-center py-4`}>No skills data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Google Sheets Data Table */}
        {sheetsData.length > 0 && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
            <div className="p-4 border-b">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Your Google Sheets Analytics Data</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Data synchronized from Google Sheets, filtered to show only your information
              </p>
            </div>
            <div>
              <DataTable 
                data={sheetsData} 
                columns={sheetsColumns}
                title=""
              />
            </div>
          </div>
        )}
        
        {/* Saved Issues */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          <div className="p-4 border-b">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Your Saved Issues</h3>
          </div>
          <div>
            <DataTable 
              data={ensureTableData(savedIssuesData, DEMO_DATA.savedIssues)} 
              columns={issuesColumns}
              title=""
            />
          </div>
        </div>
        
        {/* Activity History */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          <div className="p-4 border-b">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Recent Activity</h3>
          </div>
          <div>
            <DataTable 
              data={ensureTableData(activityHistoryData.slice(0, 10), DEMO_DATA.activityHistory)} 
              columns={activityColumns}
              title=""
            />
          </div>
        </div>
        
        {/* Search History */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          <div className="p-4 border-b">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Search History</h3>
          </div>
          <div>
            <DataTable 
              data={ensureTableData(searchHistoryData, DEMO_DATA.searchHistory)} 
              columns={searchColumns}
              title=""
            />
          </div>
        </div>
        
        {/* Add a user filter notice if using sheet data */}
        {!usingDemoData && (
          <div className={`${isDarkMode ? 'bg-blue-900/30 border-l-4 border-blue-500' : 'bg-blue-100 border-l-4 border-blue-500'} p-4 rounded-lg shadow`}>
            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <strong>Note:</strong> Analytics data is filtered to show only your information, even if multiple users exist in the database.
            </p>
          </div>
        )}
        
        {/* Footer */}
        <div className={`text-center text-gray-500 text-sm py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
          <p>Data refreshed: {new Date().toLocaleString()}</p>
          {usingDemoData && <p className={`text-yellow-600 ${isDarkMode ? 'text-yellow-300' : ''} mt-1`}>Some demo data is being used where real data is unavailable</p>}
        </div>
      </div>
    </div>
  );
} 