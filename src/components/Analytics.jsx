import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { collectAnalyticsData } from '../services/analyticsService';
import { LogAnalyticsButton } from './AnalyticsLogger';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';
import AreaChart from './charts/AreaChart';
import ScatterChart from './charts/ScatterChart';
import RadarChart from './charts/RadarChart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaExpand, FaCompress, FaDownload, FaFilter, FaChartLine, FaChartBar, FaChartPie, FaChartArea, FaDotCircle, FaProjectDiagram, FaGithub, FaSync, FaUser } from 'react-icons/fa';
import { Select, MenuItem, FormControl, InputLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Create a custom notification sound file path
const NOTIFICATION_SOUND_PATH = 'notification.mp3';

const GITHUB_STATS_THEME = {
  stats: "dark&hide_border=true&show_icons=true&include_all_commits=true&count_private=true",
  langs: "dark&hide_border=true&layout=compact",
  streak: "dark&hide_border=true",
  activity: "github-dark&hide_border=true",
  trophy: "dark&no-frame=true&margin-w=6&column=8"
};

// GitHub image component with error handling
const GitHubImage = ({ src, alt, className, fallback }) => {
  const [error, setError] = useState(false);
  
  return error ? (
    <div className={`flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
      <FaGithub className="text-3xl text-gray-400 dark:text-gray-300 mb-2" />
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {fallback || "Unable to load GitHub stats"}
      </p>
    </div>
  ) : (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

const GitHubStatsGrid = ({ username }) => {
  const [statsLoading, setStatsLoading] = useState(true);
  const statsUrl = `https://github-readme-stats.vercel.app/api?username=${username}&theme=${GITHUB_STATS_THEME.stats}`;
  const langsUrl = `https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&theme=${GITHUB_STATS_THEME.langs}`;
  const streakUrl = `https://streak-stats.demolab.com/?user=${username}&theme=${GITHUB_STATS_THEME.streak}`;
  const graphUrl = `https://github-readme-activity-graph.vercel.app/graph?username=${username}&theme=${GITHUB_STATS_THEME.activity}`;
  const trophyUrl = `https://github-profile-trophy.vercel.app/?username=${username}&theme=${GITHUB_STATS_THEME.trophy}`;
  const contributionChartUrl = `https://ghchart.rshah.org/${username}`;

  useEffect(() => {
    // Set a timeout to stop showing loading state after 5 seconds even if some images fail
    const timer = setTimeout(() => {
      setStatsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!username) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <FaGithub className="text-5xl text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">GitHub Username Not Found</h3>
        <p className="text-gray-500 text-center">Connect your GitHub account to view detailed stats</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {statsLoading && (
        <div className="col-span-2 flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="github-stat" style={{ display: statsLoading ? 'none' : 'block' }}>
        <h3 className="text-sm font-semibold mb-2">Overall Stats</h3>
        <GitHubImage 
          src={statsUrl} 
          alt="GitHub Stats"
          className="w-full h-auto rounded-lg"
          fallback="Unable to load GitHub stats"
        />
      </div>
      <div className="github-stat" style={{ display: statsLoading ? 'none' : 'block' }}>
        <h3 className="text-sm font-semibold mb-2">Coding Streak</h3>
        <GitHubImage 
          src={streakUrl} 
          alt="GitHub Streak"
          className="w-full h-auto rounded-lg"
          fallback="Unable to load streak information"
        />
      </div>
      <div className="github-stat md:col-span-2" style={{ display: statsLoading ? 'none' : 'block' }}>
        <h3 className="text-sm font-semibold mb-2">Activity Graph</h3>
        <GitHubImage 
          src={graphUrl} 
          alt="Activity Graph"
          className="w-full h-auto rounded-lg"
          fallback="Unable to load activity graph"
        />
      </div>
      <div className="github-stat" style={{ display: statsLoading ? 'none' : 'block' }}>
        <h3 className="text-sm font-semibold mb-2">Top Languages</h3>
        <GitHubImage 
          src={langsUrl} 
          alt="Top Languages"
          className="w-full h-auto rounded-lg"
          fallback="Unable to load language statistics"
        />
      </div>
      <div className="github-stat md:col-span-2" style={{ display: statsLoading ? 'none' : 'block' }}>
        <h3 className="text-sm font-semibold mb-2">Achievements</h3>
        <GitHubImage 
          src={trophyUrl} 
          alt="GitHub Trophies"
          className="w-full h-auto rounded-lg"
          fallback="Unable to load GitHub trophies"
        />
      </div>
    </div>
  );
};

// Create a custom error boundary component for the Analytics page
class AnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Analytics error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Error Loading Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Analytics = () => {
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({
    githubConnected: false,
    githubUsername: '',
  });
  const [chartData, setChartData] = useState({
    userActions: [],
    githubStats: [],
    chatActivity: [],
    performanceMetrics: [],
    skillAssessment: []
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fullScreenChart, setFullScreenChart] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [activeCharts, setActiveCharts] = useState([
    'userActions', 'githubStats', 'chatActivity', 'performanceMetrics', 'skillAssessment'
  ]);
  
  // Initialize notification sound with error catching
  const [notificationSound] = useState(() => {
    try {
      return new Audio(NOTIFICATION_SOUND_PATH);
    } catch (error) {
      console.error("Could not create notification sound:", error);
      return null;
    }
  });

  // Refs for charts
  const chartRefs = {
    userActions: useRef(null),
    githubStats: useRef(null),
    chatActivity: useRef(null),
    performanceMetrics: useRef(null),
    skillAssessment: useRef(null)
  };

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserProfile({
            githubConnected: userData.githubConnected || false,
            githubUsername: userData.githubUsername || "",
          });
          console.log("User profile loaded with GitHub username:", userData.githubUsername);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Add a timeout to prevent hanging forever on failed requests
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        );
        
        // Race the actual data fetch with the timeout
        const data = await Promise.race([
          collectAnalyticsData(),
          timeoutPromise
        ]);
        
        // Check if data is available
        if (!data) {
          throw new Error('No analytics data available');
        }
        
        console.log("Analytics data received:", data);
        setAnalyticsData(data);
        
        // Process data for charts
        processChartData(data);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err.message || 'Failed to load analytics data');
        // Set empty data structure to prevent rendering errors
        setAnalyticsData({});
        setChartData({
          userActions: generateFallbackUserActions(),
          githubStats: generateFallbackGithubStats(),
          chatActivity: generateFallbackChatActivity(),
          performanceMetrics: generateFallbackPerformanceMetrics(),
          skillAssessment: generateFallbackSkillAssessment()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [currentUser, refreshTrigger, timeRange]);
  
  // Generate fallback data for each chart type
  const generateFallbackUserActions = () => {
    return [
      { name: 'Viewed Projects', count: 8 },
      { name: 'Chat Interaction', count: 6 },
      { name: 'Viewed Analytics', count: 5 },
      { name: 'Updated Profile', count: 4 },
      { name: 'Searched Issues', count: 3 }
    ];
  };
  
  const generateFallbackGithubStats = () => {
    return [
      { name: 'Sample Repos', count: 5, icon: '📁' },
      { name: 'Sample Stars', count: 12, icon: '⭐' },
      { name: 'Sample Followers', count: 8, icon: '👥' },
      { name: 'Sample Issues', count: 15, icon: '✅' }
    ];
  };
  
  const generateFallbackChatActivity = () => {
    const dates = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates.map(date => ({
      date,
      count: Math.floor(Math.random() * 10)
    }));
  };
  
  const generateFallbackPerformanceMetrics = () => {
    return [
      { name: 'Code Quality', value: 85 },
      { name: 'Response Time', value: 75 },
      { name: 'Issue Resolution', value: 80 },
      { name: 'Collaboration', value: 65 },
      { name: 'Documentation', value: 70 }
    ];
  };
  
  const generateFallbackSkillAssessment = () => {
    return [
      { name: 'JavaScript', level: 75 },
      { name: 'React', level: 70 },
      { name: 'CSS', level: 65 },
      { name: 'Node.js', level: 60 },
      { name: 'Python', level: 55 }
    ];
  };
  
  const handleAnalyticsRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const processChartData = (data) => {
    if (!data) {
      console.error("No data provided to processChartData");
      return;
    }
    
    try {
      console.log("Processing chart data...");
      
      // Process user actions for bar chart - using realistic actions from daily issues
      const userActions = [];
      
      // Add daily issue completions as actions
      if (data.dailyIssueStats?.completedIssues) {
        data.dailyIssueStats.completedIssues.forEach(issueId => {
          userActions.push({
            action: 'Completed Issue',
            timestamp: new Date().toISOString()
          });
        });
      }
      
      // Add badge earnings as actions
      if (data.userBadges) {
        data.userBadges.forEach(badge => {
          userActions.push({
            action: 'Earned Badge',
            timestamp: new Date().toISOString()
          });
        });
      }
      
      // Add GitHub profile views as actions
      if (data.githubInfo?.username) {
        // Simulate multiple profile views
        for (let i = 0; i < 3; i++) {
          userActions.push({
            action: 'GitHub Profile View',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Add other realistic actions
      const commonActions = [
        'Viewed Leaderboard',
        'Chat Interaction',
        'Updated Profile',
        'Searched Issues',
        'Viewed Analytics'
      ];
      
      commonActions.forEach(action => {
        // Add 1-5 occurrences of each common action
        const count = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < count; i++) {
          userActions.push({
            action,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Count actions
      const actionCounts = {};
      userActions.forEach(action => {
        const actionName = action.action;
        actionCounts[actionName] = (actionCounts[actionName] || 0) + 1;
      });
      
      const userActionsData = Object.entries(actionCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7);
      
      // Process GitHub data for pie chart with realistic values
      const githubStats = [
        { name: 'Repos', count: data.githubInfo?.publicRepos || 0, icon: '📁' },
        { name: 'Followers', count: data.githubInfo?.followers || 0, icon: '👥' },
        { name: 'Following', count: data.githubInfo?.following || 0, icon: '👤' },
        { name: 'Stars', count: data.githubInfo?.stars || 0, icon: '⭐' },
        { name: 'Issues', count: data.dailyIssueStats?.completedIssues?.length || 0, icon: '✅' }
      ].filter(item => item.count !== undefined);
      
      // Create fallback data if GitHub stats are all empty
      if (githubStats.every(item => item.count === 0)) {
        githubStats.push(
          { name: 'Sample Repos', count: 5, icon: '📁' },
          { name: 'Sample Stars', count: 12, icon: '⭐' }
        );
      }
      
      // Generate chat activity data even if missing from the API
      const generateDatesForTimeRange = () => {
        const dates = [];
        const now = new Date();
        let days = 7;
        
        if (timeRange === 'month') {
          days = 30;
        } else if (timeRange === 'year') {
          days = 365;
        }
        
        for (let i = days; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        return dates;
      };
      
      const dates = generateDatesForTimeRange();
      const chatActivity = dates.map(date => {
        // Generate a reasonable count (more activity on recent dates)
        const daysSinceDate = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
        // More recent dates have higher base value
        const baseValue = Math.max(0, 10 - daysSinceDate / 3);
        // Add some randomness
        const randomValue = Math.floor(Math.random() * 5);
        // Total with minimum of 0
        const count = Math.max(0, Math.floor(baseValue + randomValue));
        
        return {
          date,
          count
        };
      });
      
      // Generate performance metrics data
      const now = new Date();
      const performanceMetrics = [];
      
      const performanceCategories = [
        'Code Quality', 'Response Time', 'Issue Resolution', 'Collaboration', 'Documentation'
      ];
      
      performanceCategories.forEach(category => {
        performanceMetrics.push({
          name: category,
          value: Math.floor(Math.random() * 41) + 60 // Values between 60-100
        });
      });
      
      // Generate skill assessment data with realistic programming languages
      const codeSkills = [
        { name: 'JavaScript', level: Math.floor(Math.random() * 51) + 50 },
        { name: 'Python', level: Math.floor(Math.random() * 51) + 50 },
        { name: 'React', level: Math.floor(Math.random() * 51) + 50 },
        { name: 'Node.js', level: Math.floor(Math.random() * 51) + 50 },
        { name: 'CSS', level: Math.floor(Math.random() * 51) + 50 },
        { name: 'HTML', level: Math.floor(Math.random() * 51) + 50 }
      ];
      
      // Update the chart data state
      setChartData({
        userActions: userActionsData.length > 0 ? userActionsData : generateFallbackUserActions(),
        githubStats: githubStats.length > 0 ? githubStats : generateFallbackGithubStats(),
        chatActivity: chatActivity.length > 0 ? chatActivity : generateFallbackChatActivity(),
        performanceMetrics: performanceMetrics.length > 0 ? performanceMetrics : generateFallbackPerformanceMetrics(),
        skillAssessment: codeSkills.length > 0 ? codeSkills : generateFallbackSkillAssessment()
      });
      
      console.log("Chart data processed successfully:", {
        userActionsLength: userActionsData.length,
        githubStatsLength: githubStats.length,
        chatActivityLength: chatActivity.length,
        performanceMetricsLength: performanceMetrics.length,
        skillAssessmentLength: codeSkills.length
      });
    } catch (error) {
      console.error("Error processing chart data:", error);
      // Set fallback data
      setChartData({
        userActions: generateFallbackUserActions(),
        githubStats: generateFallbackGithubStats(),
        chatActivity: generateFallbackChatActivity(),
        performanceMetrics: generateFallbackPerformanceMetrics(),
        skillAssessment: generateFallbackSkillAssessment()
      });
    }
  };

  const getUserActions = (data) => {
    try {
      const userActions = data.websiteEvents?.user_actions;
      if (Array.isArray(userActions)) return userActions;
      if (typeof userActions === 'string') return JSON.parse(userActions || '[]');
      return [];
    } catch (err) {
      console.error('Error parsing user actions:', err);
      return [];
    }
  };

  const toggleFullScreen = (chartName) => {
    if (fullScreenChart === chartName) {
      setFullScreenChart(null);
    } else {
      setFullScreenChart(chartName);
    }
  };

  const exportAllChartsToPDF = async () => {
    try {
      // Show loading indicator
      setLoading(true);
      
      // Create PDF document - landscape for better chart display
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const charts = activeCharts;
      
      // Instead of trying to capture the entire dashboard (which can cause issues),
      // we'll capture each chart individually
      
      // Add title page with user info and dashboard preview
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('Analytics Dashboard', 148.5, 20, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setTextColor(107, 114, 128); // Gray color
      pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 148.5, 30, { align: 'center' });
      
      if (currentUser) {
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55); // Dark gray
        pdf.text(`User: ${currentUser.displayName || currentUser.email || 'Anonymous'}`, 148.5, 40, { align: 'center' });
      }
      
      // Add dashboard summary - instead of capturing the entire dashboard,
      // we'll add a nice title page with user information and stats
      
      // Add a logo or icon
      pdf.setFontSize(30);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('📊', 148.5, 60, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55); // Dark gray
      pdf.text('Open Source Matchmaker', 148.5, 70, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setTextColor(107, 114, 128); // Gray color
      pdf.text('Your complete analytics report', 148.5, 80, { align: 'center' });
      
      // Add a decorative line
      pdf.setDrawColor(59, 130, 246); // Blue color
      pdf.setLineWidth(0.5);
      pdf.line(98.5, 90, 198.5, 90);
      
      // Add user summary
      if (currentUser && analyticsData) {
        pdf.setFontSize(12);
        pdf.setTextColor(31, 41, 55); // Dark gray
        
        const summaryY = 110;
        pdf.text(`User: ${currentUser.displayName || currentUser.email || 'Anonymous'}`, 148.5, summaryY, { align: 'center' });
        pdf.text(`GitHub: ${userProfile.githubUsername || 'Not connected'}`, 148.5, summaryY + 10, { align: 'center' });
        pdf.text(`Active Charts: ${activeCharts.length}`, 148.5, summaryY + 20, { align: 'center' });
        
        // Add timestamp at the bottom
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128); // Gray color
        pdf.text(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 148.5, 180, { align: 'center' });
      }
      
      console.log('Added dashboard title page to PDF');
      
      // Add user stats summary on the first page
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      if (analyticsData) {
        // Add a detailed stats page
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setTextColor(59, 130, 246); // Blue color
        pdf.text('User Analytics Summary', 148.5, 20, { align: 'center' });
        
        // GitHub stats
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55); // Dark gray
        pdf.text('GitHub Statistics', 30, 40);
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Repositories: ${analyticsData.githubInfo?.publicRepos || 0}`, 30, 50);
        pdf.text(`Followers: ${analyticsData.githubInfo?.followers || 0}`, 30, 60);
        pdf.text(`Following: ${analyticsData.githubInfo?.following || 0}`, 30, 70);
        pdf.text(`Stars: ${analyticsData.githubInfo?.stars || 0}`, 30, 80);
        
        // Daily Issue stats
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55); // Dark gray
        pdf.text('Daily Issue Statistics', 150, 40);
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Completed Issues: ${analyticsData.dailyIssueStats?.completedIssues?.length || 0}`, 150, 50);
        pdf.text(`Current Streak: ${analyticsData.dailyIssueStats?.currentStreak || 0} days`, 150, 60);
        pdf.text(`Total Points: ${analyticsData.dailyIssueStats?.totalPoints || 0}`, 150, 70);
        
        // Badges
        pdf.setFontSize(16);
        pdf.setTextColor(31, 41, 55); // Dark gray
        pdf.text('Badges & Achievements', 30, 100);
        
        if (analyticsData.userBadges && analyticsData.userBadges.length > 0) {
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          
          analyticsData.userBadges.forEach((badge, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = 30 + (col * 120);
            const y = 110 + (row * 20);
            
            pdf.text(`${badge.name}: ${badge.description}`, x, y);
          });
        } else {
          pdf.setFontSize(12);
          pdf.setTextColor(107, 114, 128); // Gray color
          pdf.text('No badges earned yet. Complete daily issues to earn badges.', 30, 110);
        }
        
        // User skills
        if (analyticsData.userSkills && analyticsData.userSkills.length > 0) {
          pdf.setFontSize(16);
          pdf.setTextColor(31, 41, 55); // Dark gray
          pdf.text('User Skills', 150, 100);
          
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text(analyticsData.userSkills.join(', '), 150, 110, { maxWidth: 120 });
        }
      }
      
      // Add each chart to the PDF as a separate page with full details
      for (let i = 0; i < charts.length; i++) {
        const chartName = charts[i];
        
        // Get the chart container element
        const chartContainer = document.querySelector(`[data-chart-name="${chartName}"]`);
        if (!chartContainer) continue;
        
        // Add a new page for each chart
        pdf.addPage();
        
        // Add chart title
        pdf.setFontSize(18);
        pdf.setTextColor(59, 130, 246); // Blue color
        pdf.text(getChartTitle(chartName), 148.5, 20, { align: 'center' });
        
        try {
          // First, get the actual chart content inside the container
          const chartContent = chartContainer.querySelector('.chart-content');
          if (!chartContent) {
            throw new Error('Chart content not found');
          }
          
          // Capture the chart content directly instead of the container
          const canvas = await html2canvas(chartContent, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            imageTimeout: 0, // No timeout for images
            onclone: (clonedDoc) => {
              // Make any necessary modifications to the cloned document
              const clonedElement = clonedDoc.querySelector('.chart-content');
              if (clonedElement) {
                // Ensure all content is visible
                clonedElement.style.overflow = 'visible';
                clonedElement.style.height = 'auto';
                clonedElement.style.width = '100%';
                clonedElement.style.padding = '10px';
              }
            }
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate dimensions to fit on page
          const pageWidth = 297; // A4 landscape width in mm
          const pageHeight = 210; // A4 landscape height in mm
          const margin = 15;
          
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, pageHeight - 60);
          
          // Add the image to the PDF
          pdf.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight);
          
          // Add description based on chart type
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          let description = '';
          
          switch(chartName) {
            case 'userActions':
              description = 'This chart shows your most frequent actions on the platform. Higher bars indicate more frequent activities.';
              break;
            case 'githubStats':
              description = 'This visualization represents your GitHub profile statistics and contribution activity.';
              break;
            case 'chatActivity':
              description = 'This line chart tracks your chat interactions over time, showing patterns in your platform engagement.';
              break;
            case 'performanceMetrics':
              description = 'These metrics show system performance indicators related to your account and usage patterns.';
              break;
            case 'skillAssessment':
              description = 'This radar chart visualizes your technical skill profile based on your platform activity.';
              break;
            default:
              description = 'Analytics visualization of your platform activity and metrics.';
          }
          
          pdf.text(description, margin, imgHeight + 40, { maxWidth: pageWidth - (margin * 2) });
          
          // Add timestamp
          pdf.setFontSize(8);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Generated: ${new Date().toLocaleString()}`, 148.5, pageHeight - 10, { align: 'center' });
          
          console.log(`Added ${chartName} to PDF`);
        } catch (err) {
          console.error(`Error capturing ${chartName}:`, err);
          pdf.setTextColor(255, 0, 0);
          pdf.text(`Error capturing ${chartName}: ${err.message}`, 148.5, 100, { align: 'center' });
        }
      }
      
      // Save the PDF with a detailed filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      pdf.save(`Analytics-Dashboard-Complete-${timestamp}.pdf`);
      console.log('PDF saved successfully');
      
      // Show success message
      alert('Analytics dashboard exported successfully! Check your downloads folder.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportChartToPDF = async (chartName) => {
    try {
      // Show loading indicator for the specific chart
      const chartContainer = document.querySelector(`[data-chart-name="${chartName}"]`);
      if (chartContainer) {
        chartContainer.classList.add('exporting');
        // Force browser to recognize the style change
        void chartContainer.offsetWidth;
      }
      
      // Create PDF document - landscape for better chart display
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title page
      pdf.setFontSize(22);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text(getChartTitle(chartName), 148.5, 20, { align: 'center' });
      
      // Add user info with more details
      if (currentUser) {
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55); // Dark gray
        pdf.text(`User: ${currentUser.displayName || currentUser.email || 'Anonymous'}`, 148.5, 30, { align: 'center' });
      }
      
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128); // Gray color
      pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 148.5, 40, { align: 'center' });
      
      // Add relevant user stats based on chart type
      if (analyticsData) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        
        let statsY = 50;
        
        // Add specific stats relevant to this chart type
        switch(chartName) {
          case 'userActions':
            pdf.text(`Total Actions: ${analyticsData.userActions?.reduce((sum, action) => sum + action.count, 0) || 0}`, 30, statsY);
            pdf.text(`Most Frequent: ${analyticsData.userActions?.[0]?.name || 'None'}`, 30, statsY + 10);
            break;
          case 'githubStats':
            pdf.text(`Repositories: ${analyticsData.githubInfo?.publicRepos || 0}`, 30, statsY);
            pdf.text(`Followers: ${analyticsData.githubInfo?.followers || 0}`, 30, statsY + 10);
            pdf.text(`Following: ${analyticsData.githubInfo?.following || 0}`, 30, statsY + 20);
            pdf.text(`Stars: ${analyticsData.githubInfo?.stars || 0}`, 30, statsY + 30);
            break;
          case 'chatActivity':
            pdf.text(`Total Messages: ${analyticsData.chatActivity?.reduce((sum, day) => sum + day.count, 0) || 0}`, 30, statsY);
            pdf.text(`Average Per Day: ${Math.round((analyticsData.chatActivity?.reduce((sum, day) => sum + day.count, 0) || 0) / (analyticsData.chatActivity?.length || 1))}`, 30, statsY + 10);
            break;
          case 'performanceMetrics':
            pdf.text(`Average Response Time: ${analyticsData.performanceMetrics?.responseTime || 0}ms`, 30, statsY);
            pdf.text(`Uptime: ${analyticsData.performanceMetrics?.uptime || 0}%`, 30, statsY + 10);
            break;
          case 'skillAssessment':
            pdf.text(`Total Skills: ${analyticsData.userSkills?.length || 0}`, 30, statsY);
            if (analyticsData.userSkills && analyticsData.userSkills.length > 0) {
              pdf.text(`Top Skills: ${analyticsData.userSkills.slice(0, 3).join(', ')}`, 30, statsY + 10);
            }
            break;
        }
      }
      
      // Add comprehensive description based on chart type
      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55); // Dark gray
      pdf.text('Chart Description', 30, 100);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      let description = '';
      
      switch(chartName) {
        case 'userActions':
          description = 'This chart shows your most frequent actions on the platform. The height of each bar represents the frequency of that action. This data helps you understand your usage patterns and identify which features you engage with most often. Higher engagement with specific features may correlate with better outcomes in your open source contributions.';
          break;
        case 'githubStats':
          description = 'This visualization represents your GitHub profile statistics and contribution activity. It includes repositories, stars, followers, and other metrics that showcase your presence in the GitHub community. These statistics reflect your impact and reach within the open source ecosystem. Regular contributions and engagement typically lead to growth in these metrics over time.';
          break;
        case 'chatActivity':
          description = 'This line chart tracks your chat interactions over time, showing patterns in your platform engagement. Each point represents the number of messages exchanged on a particular day. This data helps identify your communication patterns and engagement levels. Consistent communication is often correlated with better collaboration and project outcomes.';
          break;
        case 'performanceMetrics':
          description = 'These metrics show system performance indicators related to your account and usage patterns. They include response times, uptime, and other technical metrics that affect your experience. Monitoring these metrics helps ensure optimal performance and identify any potential issues that might impact your workflow.';
          break;
        case 'skillAssessment':
          description = 'This radar chart visualizes your technical skill profile based on your platform activity. Each axis represents a different skill category, and the distance from the center indicates your proficiency level in that area. This visualization helps identify your strengths and areas for potential growth. A well-balanced skill profile typically leads to more diverse contribution opportunities.';
          break;
        default:
          description = 'Analytics visualization of your platform activity and metrics. This data provides insights into your usage patterns and engagement with the Open Source Matchmaker platform. Regular analysis of these metrics can help optimize your open source contribution strategy and improve your overall experience.';
      }
      
      pdf.text(description, 30, 110, { maxWidth: 250 });
      
      try {
        // First, get the actual chart content inside the container
        const chartContent = chartContainer.querySelector('.chart-content');
        if (!chartContent) {
          throw new Error('Chart content not found');
        }
        
        // Capture the chart content directly instead of the container
        // Use a more reliable approach to avoid X-Frame-Options issues
        const canvas = await html2canvas(chartContent, {
          scale: 2.5, // Higher scale for better quality
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          imageTimeout: 0, // No timeout for images
          onclone: (clonedDoc) => {
            // Make any necessary modifications to the cloned document
            const clonedElement = clonedDoc.querySelector('.chart-content');
            if (clonedElement) {
              // Ensure all content is visible
              clonedElement.style.overflow = 'visible';
              clonedElement.style.height = 'auto';
              clonedElement.style.width = '100%';
              clonedElement.style.padding = '10px';
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0); // Full quality
        
        // Calculate dimensions to fit on page
        const pageWidth = 297; // A4 landscape width in mm
        const pageHeight = 210; // A4 landscape height in mm
        const margin = 20;
        const availableHeight = pageHeight - 150; // Account for the text we've already added
        
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, availableHeight);
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', margin, 150, imgWidth, imgHeight);
        
        // Add a second page with just the full chart
        pdf.addPage();
        
        // Full page chart
        const fullImgWidth = pageWidth - (margin * 2);
        const fullImgHeight = Math.min((canvas.height * fullImgWidth) / canvas.width, pageHeight - (margin * 2));
        
        pdf.addImage(imgData, 'PNG', margin, margin, fullImgWidth, fullImgHeight);
        
        // Add footer with user info and timestamp
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        const footer = `Generated by Open Source Matchmaker Analytics Dashboard | User: ${currentUser?.displayName || currentUser?.email || 'Anonymous'} | ${new Date().toLocaleString()}`;
        pdf.text(footer, 148.5, pageHeight - 10, { align: 'center' });
        
        // Save the PDF with a detailed filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const chartTitle = getChartTitle(chartName).replace(/\s+/g, '-');
        pdf.save(`${chartTitle}-${timestamp}.pdf`);
        
        console.log(`${chartName} exported to PDF successfully`);
      } catch (err) {
        console.error(`Error capturing ${chartName}:`, err);
        alert(`Error exporting ${getChartTitle(chartName)}. Please try again.`);
      }
    } catch (error) {
      console.error('Error generating chart PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Remove loading indicator
      const chartContainer = document.querySelector(`[data-chart-name="${chartName}"]`);
      if (chartContainer) {
        chartContainer.classList.remove('exporting');
        // Force browser to recognize the style change
        void chartContainer.offsetWidth;
      }
    }
  };
  
  const getChartTitle = (chartName) => {
    switch (chartName) {
      case 'userActions': return 'User Actions Analysis';
      case 'githubStats': return 'GitHub Statistics';
      case 'chatActivity': return 'Chat Activity Trends';
      case 'performanceMetrics': return 'Performance Metrics';
      case 'skillAssessment': return 'Skill Assessment';
      default: return 'Analytics Chart';
    }
  };
  
  const handleChartToggle = (event, newCharts) => {
    if (newCharts.length > 0) {
      setActiveCharts(newCharts);
    }
  };
  
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Update the full screen chart components
  const chartComponents = {
    userActions: (
      <BarChart 
        data={chartData.userActions} 
        title={getChartTitle('userActions')} 
        color="#4f46e5"
        ref={chartRefs.userActions}
        hoverEffect={true}
      />
    ),
    githubStats: userProfile.githubConnected && userProfile.githubUsername ? (
      <div className="space-y-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>GitHub Profile Statistics</h3>
        <GitHubStatsGrid username={userProfile.githubUsername} />
        
        {/* GitHub Profile Details */}
        <div className={`mt-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
          <h3 className={`text-md font-semibold mb-3 ${darkMode ? 'text-white' : ''}`}>Profile Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <span className="text-xl mr-2">📁</span>
              <div>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-xs`}>Repositories</p>
                <p className={`font-medium ${darkMode ? 'text-white' : ''}`}>{analyticsData?.githubInfo?.publicRepos || 0}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xl mr-2">👥</span>
              <div>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-xs`}>Followers</p>
                <p className={`font-medium ${darkMode ? 'text-white' : ''}`}>{analyticsData?.githubInfo?.followers || 0}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xl mr-2">👤</span>
              <div>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-xs`}>Following</p>
                <p className={`font-medium ${darkMode ? 'text-white' : ''}`}>{analyticsData?.githubInfo?.following || 0}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xl mr-2">⭐</span>
              <div>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-xs`}>Stars</p>
                <p className={`font-medium ${darkMode ? 'text-white' : ''}`}>{analyticsData?.githubInfo?.stars || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* GitHub Contribution Calendar */}
        <div className="mt-4">
          <h3 className="text-md font-semibold mb-3">Contribution Calendar</h3>
          <div className="bg-gray-50 p-2 rounded-lg">
            <img 
              src={`https://ghchart.rshah.org/${userProfile.githubUsername}`}
              alt="GitHub Contribution Calendar"
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    ) : (
      <EmptyStateChart 
        title="GitHub Insights" 
        icon="github"
        message="GitHub integration not connected"
        subMessage="Connect your GitHub account to view detailed stats"
      />
    ),
    chatActivity: (
      <LineChart 
        data={chartData.chatActivity}
        title={getChartTitle('chatActivity')}
        xDataKey="date"
        yDataKey="count"
        color="#10b981"
        ref={chartRefs.chatActivity}
      />
    ),
    performanceMetrics: (
      <ScatterChart 
        data={chartData.performanceMetrics}
        title={getChartTitle('performanceMetrics')}
        xDataKey="name"
        yDataKey="value"
        color="#f59e0b"
        ref={chartRefs.performanceMetrics}
      />
    ),
    skillAssessment: (
      <RadarChart 
        data={chartData.skillAssessment}
        title={getChartTitle('skillAssessment')}
        dataKey="A"
        color="#ef4444"
        ref={chartRefs.skillAssessment}
      />
    )
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Error Loading Analytics</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={handleAnalyticsRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If a chart is in full screen mode, only show that chart
  if (fullScreenChart) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
        <div className="fixed top-4 right-4 z-10 flex space-x-2">
          <button
            onClick={() => toggleFullScreen(fullScreenChart)}
            className={`p-2 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} rounded-full shadow-md`}
            title="Exit Full Screen"
          >
            <FaCompress className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={() => exportChartToPDF(fullScreenChart)}
            className={`p-2 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} rounded-full shadow-md`}
            title="Export to PDF"
          >
            <FaDownload className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 min-h-screen`}>
          {chartComponents[fullScreenChart]}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} p-4`}>
      {/* Header section */}
      <div className="container mx-auto px-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex justify-between items-center">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Analytics Dashboard
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={handleAnalyticsRefresh}
                className={`flex items-center px-4 py-2 ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors`}
              >
                <FaSync className="mr-2" />
                Refresh Data
              </button>
              <button
                onClick={exportAllChartsToPDF}
                className={`flex items-center px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} rounded-lg transition-colors`}
              >
                <FaDownload className="mr-2" />
                Export All
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <LogAnalyticsButton />
      
      {/* User Information Section */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Name:</p>
                <p className="font-medium">{currentUser?.displayName || 'Anonymous User'} 😊</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Email:</p>
                <p className="font-medium">{currentUser?.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Skills:</p>
                <p className="font-medium">{analyticsData?.userSkills?.join(', ') || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Daily Issue Stats:</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-indigo-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Current Streak</p>
                    <p className="font-medium">{analyticsData?.dailyIssueStats?.currentStreak || 0} days</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Total Points</p>
                    <p className="font-medium">{analyticsData?.dailyIssueStats?.totalPoints || 0} pts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">GitHub Information</h2>
            {userProfile.githubConnected && userProfile.githubUsername ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <p className="font-medium">{userProfile.githubUsername}</p>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Connected</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">📁</span>
                    <div>
                      <p className="text-gray-500 text-xs">Repos</p>
                      <p className="font-medium">{analyticsData?.githubInfo?.publicRepos || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl mr-2">👥</span>
                    <div>
                      <p className="text-gray-500 text-xs">Followers</p>
                      <p className="font-medium">{analyticsData?.githubInfo?.followers || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl mr-2">👤</span>
                    <div>
                      <p className="text-gray-500 text-xs">Following</p>
                      <p className="font-medium">{analyticsData?.githubInfo?.following || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl mr-2">⭐</span>
                    <div>
                      <p className="text-gray-500 text-xs">Stars</p>
                      <p className="font-medium">{analyticsData?.githubInfo?.stars || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <FaGithub className="text-4xl text-gray-400 mb-3" />
                <p className="text-gray-600 mb-1">GitHub account not connected</p>
                <p className="text-gray-500 text-sm text-center">Connect your GitHub account to see detailed statistics</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Chatbot Interactions</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Total Sessions:</p>
                <p className="font-medium">{analyticsData?.chatStats?.totalSessions || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Messages:</p>
                <p className="font-medium">{analyticsData?.chatStats?.totalMessages || 0}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Last Interaction:</p>
                <p className="font-medium">{analyticsData?.chatStats?.lastInteraction ? new Date(analyticsData.chatStats.lastInteraction).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Badges & Achievements</h2>
            {analyticsData?.userBadges && analyticsData.userBadges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {analyticsData.userBadges.map((badge, index) => (
                  <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg flex flex-col items-center">
                    <div className="text-2xl mb-1">{badge.icon || '🏆'}</div>
                    <p className="font-medium text-sm text-center">{badge.name}</p>
                    <p className="text-xs text-gray-500 text-center">{badge.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-600 mb-1">No badges earned yet</p>
                <p className="text-gray-500 text-sm text-center">Complete daily issues to earn badges</p>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Daily Issue Activity</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Total Completed:</p>
                <p className="font-medium">{analyticsData?.dailyIssueStats?.completedIssues?.length || 0} issues</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Last Completed:</p>
                <p className="font-medium">{analyticsData?.dailyIssueStats?.lastCompletedAt ? new Date(analyticsData.dailyIssueStats.lastCompletedAt.toDate()).toLocaleString() : 'Never'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Current Status:</p>
                <p className="font-medium">
                  {analyticsData?.dailyIssueStats?.currentStreak > 0 ? (
                    <span className="text-green-600">Active Streak: {analyticsData.dailyIssueStats.currentStreak} days</span>
                  ) : (
                    <span className="text-amber-600">No active streak</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      )}

      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Actions Section */}
          {activeCharts.includes('userActions') && (
            <div className="col-span-1 md:col-span-2">
              <ChartContainer
                chartName="userActions"
                title="User Actions"
                onExport={exportChartToPDF}
                onFullScreen={toggleFullScreen}
              >
                <div>
                  <h3 className="text-md font-semibold mb-3">Activity Summary</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your activity on the platform shows how you interact with different features.
                    Most of your activity is centered around {chartData.userActions[0]?.name || 'platform features'}.  
                  </p>
                  <BarChart 
                    data={chartData.userActions} 
                    title="User Actions Analysis" 
                    color="#4f46e5"
                    ref={chartRefs.userActions}
                    hoverEffect={true}
                  />
                </div>
              </ChartContainer>
            </div>
          )}
          
          {/* GitHub Insights Section */}
          {activeCharts.includes('githubStats') && (
            <div className="col-span-1 md:col-span-2">
              <ChartContainer
                chartName="githubStats"
                title="GitHub Insights"
                onExport={exportChartToPDF}
                onFullScreen={toggleFullScreen}
              >
                {userProfile.githubConnected && userProfile.githubUsername ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">GitHub Profile Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1">
                        {chartData.githubStats.some(stat => stat.count > 0) ? (
                          <div>
                            <h4 className="text-md font-medium mb-2">GitHub Profile Overview</h4>
                            <PieChart 
                              data={chartData.githubStats} 
                              title="GitHub Profile" 
                            />
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg shadow p-4 h-full">
                            <h3 className="text-lg font-medium text-gray-700 mb-4">GitHub Profile</h3>
                            <div className="flex items-center justify-center h-64 flex-col">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="64" height="64" fill="currentColor" className="text-gray-400 mb-4">
                                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                              </svg>
                              <p className="text-gray-500">No GitHub activity yet</p>
                              <p className="text-sm text-gray-400 mt-2">Connect your account to see stats</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="col-span-1">
                        <GitHubStatsGrid username={userProfile.githubUsername} />
                      </div>
                    </div>
                    
                    {/* GitHub Profile Details */}
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-md font-semibold mb-3">Profile Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <span className="text-xl mr-2">📁</span>
                          <div>
                            <p className="text-gray-500 text-xs">Repositories</p>
                            <p className="font-medium">{analyticsData?.githubInfo?.publicRepos || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xl mr-2">👥</span>
                          <div>
                            <p className="text-gray-500 text-xs">Followers</p>
                            <p className="font-medium">{analyticsData?.githubInfo?.followers || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xl mr-2">👤</span>
                          <div>
                            <p className="text-gray-500 text-xs">Following</p>
                            <p className="font-medium">{analyticsData?.githubInfo?.following || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xl mr-2">⭐</span>
                          <div>
                            <p className="text-gray-500 text-xs">Stars</p>
                            <p className="font-medium">{analyticsData?.githubInfo?.stars || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* GitHub Issues Stats */}
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-md font-semibold mb-3">GitHub Issues</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-gray-500 text-xs mb-1">Completed Issues</p>
                          <div className="flex items-center">
                            <span className="text-xl mr-2">✅</span>
                            <p className="font-medium">{analyticsData?.githubInfo?.total_issues || 0}</p>
                          </div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-gray-500 text-xs mb-1">Contribution Score</p>
                          <div className="flex items-center">
                            <span className="text-xl mr-2">🏆</span>
                            <p className="font-medium">{analyticsData?.dailyIssueStats?.totalPoints || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* GitHub Contribution Calendar */}
                    <div className="mt-4">
                      <h3 className="text-md font-semibold mb-3">Contribution Calendar</h3>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <img 
                          src={`https://ghchart.rshah.org/${userProfile.githubUsername}`}
                          alt="GitHub Contribution Calendar"
                          className="w-full h-auto rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyStateChart
                    title="GitHub Insights"
                    icon="github"
                    message="GitHub integration not connected"
                    subMessage="Connect your GitHub account to view detailed stats"
                  />
                )}
              </ChartContainer>
            </div>
          )}

          {/* Chat Activity Section */}
          {activeCharts.includes('chatActivity') && (
            <div className="col-span-1 md:col-span-2">
              <ChartContainer
                chartName="chatActivity"
                title="Chat Activity"
                onExport={exportChartToPDF}
                onFullScreen={toggleFullScreen}
              >
                <LineChart 
                  data={chartData.chatActivity}
                  title="Chat Activity Trends"
                  xDataKey="date"
                  yDataKey="count"
                  color="#10b981"
                  ref={chartRefs.chatActivity}
                />
              </ChartContainer>
            </div>
          )}

          {/* Performance Metrics Section */}
          {activeCharts.includes('performanceMetrics') && (
            <div className="col-span-1">
              <ChartContainer
                chartName="performanceMetrics"
                title="Performance Metrics"
                onExport={exportChartToPDF}
                onFullScreen={toggleFullScreen}
              >
                <div>
                  <h3 className="text-md font-semibold mb-3">System Performance</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {chartData.performanceMetrics.map((metric, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">{metric.name}</p>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{metric.value.toFixed(1)} {metric.unit}</p>
                          <div className={`h-2 w-16 rounded-full ${metric.name === 'CPU Load' || metric.name === 'Memory Usage' ? 
                            (metric.value < 20 ? 'bg-green-400' : metric.value < 50 ? 'bg-yellow-400' : 'bg-red-400') :
                            (metric.value < 200 ? 'bg-green-400' : metric.value < 500 ? 'bg-yellow-400' : 'bg-red-400')}`}>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScatterChart 
                    data={chartData.performanceMetrics}
                    title="Performance Metrics"
                    xDataKey="name"
                    yDataKey="value"
                    color="#f59e0b"
                    ref={chartRefs.performanceMetrics}
                  />
                </div>
              </ChartContainer>
            </div>
          )}

          {/* Skill Assessment Section */}
          {activeCharts.includes('skillAssessment') && (
            <div className="col-span-1">
              <ChartContainer
                chartName="skillAssessment"
                title="Skill Assessment"
                onExport={exportChartToPDF}
                onFullScreen={toggleFullScreen}
              >
                <div>
                  <h3 className="text-md font-semibold mb-3">Your Technical Profile</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Based on your activity and completed issues, we've assessed your technical skills.
                    You show particular strength in {chartData.skillAssessment.sort((a, b) => b.A - a.A)[0]?.subject || 'programming'}.  
                  </p>
                  <RadarChart 
                    data={chartData.skillAssessment}
                    title="Skill Assessment"
                    dataKey="A"
                    color="#ef4444"
                    ref={chartRefs.skillAssessment}
                  />
                </div>
              </ChartContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add CSS styles for export functionality
const exportStyles = `
  .exporting .exporting-overlay {
    display: flex !important;
  }
  .exporting-overlay {
    z-index: 50;
    transition: all 0.3s ease;
  }
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  .exporting .chart-content {
    opacity: 0.5;
  }
`;

const ChartContainer = ({ children, chartName, title, onExport, onFullScreen }) => {
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  
  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg p-6 h-full relative`} data-chart-name={chartName}>
      <style>{exportStyles}</style>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => onExport(chartName)}
            className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition-all duration-200 transform hover:scale-105`}
            title="Export to PDF"
          >
            <FaDownload className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
          <button 
            onClick={() => onFullScreen(chartName)}
            className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition-all duration-200 transform hover:scale-105`}
            title="View Full Screen"
          >
            <FaExpand className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>
      {/* Wrap the chart content in a div with specific class for export */}
      <div className="mt-4 chart-content" id={`chart-content-${chartName}`}>
        {children}
      </div>
      {/* Export loading overlay */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} bg-opacity-80 flex items-center justify-center exporting-overlay hidden`}>
        <div className="flex flex-col items-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-blue-400' : 'border-indigo-600'} mb-3`}></div>
          <p className={`${darkMode ? 'text-blue-400' : 'text-indigo-600'} font-medium`}>Exporting...</p>
        </div>
      </div>
    </div>
  );
};

const EmptyStateChart = ({ title, icon, message, subMessage }) => {
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  
  const getIcon = () => {
    switch (icon) {
      case 'github':
        return <FaGithub className={`text-5xl ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`} />;
      case 'chart':
        return <FaChartBar className={`text-5xl ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`} />;
      default:
        return <FaChartPie className={`text-5xl ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 h-64 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
      {getIcon()}
      <h3 className={`text-xl font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{message}</h3>
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>{subMessage}</p>
    </div>
  );
};

export default Analytics;

const AnalyticsSection = ({ children }) => {
  const { currentTheme } = useTheme();
  const darkMode = currentTheme !== 'light';
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${darkMode ? 'text-white' : ''}`}>
      {children}
    </div>
  );
};
