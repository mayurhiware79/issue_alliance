import { useState, useEffect } from 'react';
import { parseISO, isAfter, isBefore, format } from 'date-fns';
import { fetchSheetsData, testApiConnection } from '../services/api';
import { 
  getSkillsDistribution, 
  getContributionsByType, 
  getChatbotInteractionsOverTime, 
  getSummaryStats 
} from '../utils/dataProcessing';

// Charts
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';

// Components
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import DateRangeFilter from '../components/DateRangeFilter';
import SkillsFilter from '../components/SkillsFilter';

// Icons
import { 
  Users, 
  Code2, 
  MessageSquare, 
  Award,
  RefreshCw,
  Info,
  X
} from 'lucide-react';

// Fallback static data in case API fails
const FALLBACK_DATA = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    skills: ['JavaScript', 'React', 'Node.js'],
    contributions: { code: 10, issues: 5, reviews: 3 },
    githubInfo: { username: 'johndoe', repos: 15 },
    chatbotInteractions: { query1: 'How to contribute?', query2: 'What is the tech stack?' },
    websiteEvents: { pageView: '/projects', click: 'Apply' },
    timestamp: '2023-04-15T10:30:00Z'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    skills: ['Python', 'Django', 'AI'],
    contributions: { code: 8, documentation: 12 },
    githubInfo: { username: 'janesmith', repos: 8 },
    chatbotInteractions: { query1: 'Project requirements?' },
    websiteEvents: { pageView: '/dashboard' },
    timestamp: '2023-04-16T14:20:00Z'
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    skills: ['Java', 'Spring', 'SQL'],
    contributions: { code: 15, issues: 7, reviews: 9 },
    githubInfo: { username: 'bobjohnson', repos: 12 },
    chatbotInteractions: { query1: 'How to set up dev environment?', query2: 'API documentation?' },
    websiteEvents: { pageView: '/api-docs', click: 'Download' },
    timestamp: '2023-04-17T09:45:00Z'
  }
];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [skillsFilter, setSkillsFilter] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [useStaticData, setUseStaticData] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown'); // 'online', 'offline', 'unknown'

  // Check if server is running
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await testApiConnection();
        setServerStatus('online');
      } catch (err) {
        console.warn('API server appears to be offline:', err.message);
        setServerStatus('offline');
      }
    };
    
    checkServerStatus();
  }, []);

  // Fetch data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check server status before attempting to fetch data
        if (serverStatus === 'offline') {
          console.warn('Server is offline, using fallback data');
          setData(FALLBACK_DATA);
          setFilteredData(FALLBACK_DATA);
          setUseStaticData(true);
          setError('The API server is not running. Please start the server at http://localhost:5000 to see live data. Using demonstration data instead.');
          setLoading(false);
          return;
        }

        // Try to fetch data from API
        console.log('Attempting to fetch data from Google Sheets API...');
        const response = await fetchSheetsData();
        
        if (response && Array.isArray(response)) {
          console.log('Successfully retrieved data from Google Sheets API');
          setData(response);
          setFilteredData(response);
          setUseStaticData(false);
        } else {
          console.warn('API response is not in expected format, using fallback data');
          setData(FALLBACK_DATA);
          setFilteredData(FALLBACK_DATA);
          setUseStaticData(true);
          setError('API response format invalid. Using demonstration data instead.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // Use fallback data if API fails
        console.log('Using fallback static data instead');
        setData(FALLBACK_DATA);
        setFilteredData(FALLBACK_DATA);
        setUseStaticData(true);
        
        // Provide more detailed error information
        const errorMessage = err.response 
          ? `Server returned ${err.response.status}: ${err.response.statusText}`
          : err.message || 'Unknown error occurred';
          
        setError(`Unable to connect to Google Sheets API: ${errorMessage}. Using demonstration data instead.`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshKey]); // refreshKey will trigger a reload when changed

  // Apply filters when date or skills filters change
  useEffect(() => {
    if (!data.length) return;

    let filtered = [...data];

    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(item => {
        if (!item.timestamp) return false;
        
        try {
          const date = parseISO(item.timestamp);
          
          if (dateFilter.startDate && !isAfter(date, parseISO(dateFilter.startDate))) {
            return false;
          }
          
          if (dateFilter.endDate && !isBefore(date, parseISO(dateFilter.endDate))) {
            return false;
          }
          
          return true;
        } catch (err) {
          console.error('Error filtering by date:', err);
          return false;
        }
      });
    }

    // Apply skills filter
    if (skillsFilter.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.skills || !item.skills.length) return false;
        return skillsFilter.some(skill => item.skills.includes(skill));
      });
    }

    setFilteredData(filtered);
  }, [data, dateFilter, skillsFilter]);

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
  };

  const handleSkillsFilterChange = (skills) => {
    setSkillsFilter(skills);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Table columns
  const tableColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'skills', header: 'Skills', format: (skills) => skills?.join(', ') || '-' },
    { key: 'timestamp', header: 'Date', format: (timestamp) => {
      try {
        return timestamp ? format(parseISO(timestamp), 'MMM dd, yyyy') : '-';
      } catch (e) {
        return timestamp || '-';
      }
    }}
  ];

  // Prepare chart data
  const skillsData = getSkillsDistribution(filteredData);
  const contributionsData = getContributionsByType(filteredData);
  const chatbotInteractionsData = getChatbotInteractionsOverTime(filteredData);
  const stats = getSummaryStats(filteredData);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Google Sheets Analytics Dashboard</h1>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full text-gray-700"
              aria-label="Toggle info"
            >
              <Info size={20} />
            </button>
          </div>
          <p className="mt-2 text-gray-600">
            Visualize user interaction data from Google Sheets including skills, contributions, and chatbot interactions.
          </p>
          
          {/* Info Panel */}
          {showInfo && (
            <div className="mt-4 bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 relative">
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Close info"
              >
                <X size={18} />
              </button>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">How to Use This Dashboard</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>This dashboard visualizes user data from Google Sheets</li>
                <li>Use the date filter to narrow down data by time period</li>
                <li>Filter by skills to focus on specific technology areas</li>
                <li>The summary cards show key metrics at a glance</li>
                <li>Charts present distribution of skills, contributions, and interactions over time</li>
                <li>The data table shows raw records with pagination</li>
                <li>Click "Refresh Data" to fetch the latest data from Google Sheets</li>
              </ul>
              <div className="mt-3 text-sm text-gray-700">
                <strong>Data Source:</strong> Data is pulled from a Google Sheet via the Sheets API endpoint.
              </div>
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {!useStaticData && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Live Data
                </span>
              )}
              {useStaticData && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                  Demo Data
                </span>
              )}
            </div>
            
            <button 
              onClick={handleRefresh} 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Refresh Data
            </button>
          </div>
        </div>
        
        {/* Static data notice */}
        {useStaticData && (
          <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Using demonstration data. API connection failed.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Server status notice */}
        {serverStatus === 'offline' && (
          <div className="mb-6 bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>API Server is offline:</strong> To see live Google Sheets data, please start the server:
                </p>
                <div className="mt-2 bg-gray-800 text-white p-3 rounded text-xs font-mono overflow-x-auto">
                  <p>cd server</p>
                  <p>npm install</p>
                  <p>npm start</p>
                </div>
                <p className="text-xs mt-2 text-blue-600">The server should be running at http://localhost:5000</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error notice */}
        {error && !useStaticData && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateRangeFilter onFilterChange={handleDateFilterChange} />
          <SkillsFilter data={data} onFilterChange={handleSkillsFilterChange} />
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={<Users size={24} />} 
            color="blue"
          />
          <StatsCard 
            title="Unique Skills" 
            value={stats.uniqueSkills} 
            icon={<Code2 size={24} />} 
            color="green"
          />
          <StatsCard 
            title="Total Contributions" 
            value={stats.totalContributions} 
            icon={<Award size={24} />} 
            color="orange"
          />
          <StatsCard 
            title="Chatbot Interactions" 
            value={stats.totalChatbotInteractions} 
            icon={<MessageSquare size={24} />} 
            color="purple"
          />
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PieChart 
            data={skillsData} 
            title="Top Skills Distribution" 
          />
          <BarChart 
            data={contributionsData} 
            title="Contributions by Type" 
          />
        </div>
        
        {/* Charts Row 2 */}
        <div className="mb-6">
          <LineChart 
            data={chatbotInteractionsData} 
            title="Chatbot Interactions Over Time" 
            color="#8884d8"
          />
        </div>
        
        {/* Data Table */}
        <div className="mb-6">
          <DataTable 
            data={filteredData} 
            columns={tableColumns}
            title="Raw Data"
          />
        </div>
        
        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-4">
          <p>Data refreshed: {new Date().toLocaleString()}</p>
          <p>Displaying {filteredData.length} of {data.length} records</p>
          {useStaticData && <p className="text-yellow-600 mt-1">Using demonstration data</p>}
          <p className="mt-1">
            API Server Status: 
            {serverStatus === 'online' && 
              <span className="text-green-600 ml-1">Online</span>
            }
            {serverStatus === 'offline' && 
              <span className="text-red-600 ml-1">Offline</span>
            }
            {serverStatus === 'unknown' && 
              <span className="text-gray-600 ml-1">Checking...</span>
            }
          </p>
        </div>
      </div>
    </div>
  );
} 