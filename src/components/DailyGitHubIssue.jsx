import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getCurrentDailyIssue,
  getPreviousDailyIssues,
  markDailyIssueCompleted,
  trackIssueView,
  getUserDailyIssueStats,
  fetchAndStoreDailyIssue,
  verifyUserDataConsistency
} from "../services/dailyIssueService";
import {
  FaGithub,
  FaStar,
  FaCodeBranch,
  FaTag,
  FaCalendarAlt,
  FaComment,
  FaUserAlt,
  FaCheckCircle,
  FaTrophy,
  FaHistory,
  FaExternalLinkAlt,
  FaFire,
  FaBan,
  FaRegClock,
  FaPlus,
  FaArrowRight,
  FaSync,
  FaTimes
} from "react-icons/fa";
import { format } from "date-fns";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function DailyGitHubIssue() {
  const { currentUser } = useAuth();
  const [dailyIssue, setDailyIssue] = useState(null);
  const [previousIssues, setPreviousIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState({
    currentStreak: 0,
    totalPoints: 0,
    totalCompleted: 0,
    badges: [],
  });
  const [completingIssue, setCompletingIssue] = useState(false);
  const [completionMessage, setCompletionMessage] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [issueTimer, setIssueTimer] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(120); // 2 minutes default
  const [completedView, setCompletedView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [leaderboardStats, setLeaderboardStats] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [dataConsistencyVerified, setDataConsistencyVerified] = useState(false);
  const [consistencyResult, setConsistencyResult] = useState(null);

  useEffect(() => {
    // Fetch data when component mounts
    fetchDailyIssue();
    if (currentUser) {
      fetchUserStats();
      
      // Verify data consistency between collections
      const verifyDataConsistency = async () => {
        try {
          const result = await verifyUserDataConsistency(currentUser.uid);
          setConsistencyResult(result);
          setDataConsistencyVerified(true);
          
          // If data was synced, refresh user stats
          if (result.syncPerformed) {
            fetchUserStats();
            fetchLeaderboardStats();
          }
        } catch (err) {
          console.error("Error verifying data consistency:", err);
        }
      };
      
      verifyDataConsistency();
    }
    
    // Cleanup function to clear the timer when component unmounts
    return () => {
      if (issueTimer) {
        clearInterval(issueTimer);
      }
    };
  }, [currentUser]);

  useEffect(() => {
    const checkFirebaseConnection = async () => {
      if (!currentUser) return;
      
      try {
        // Try a simple read operation to verify permissions
        const userRef = doc(db, 'users', currentUser.uid);
        await getDoc(userRef);
      } catch (err) {
        console.error('Firebase connection check failed:', err);
        if (err.code === 'permission-denied') {
          setError('You do not have permission to access this data. Please log in again.');
        }
      }
    };
    
    checkFirebaseConnection();
  }, [currentUser]);

  const fetchDailyIssue = async () => {
    try {
      setLoading(true);
      setError(null);
      const issue = await getCurrentDailyIssue();
      setDailyIssue(issue);

      // If logged in, track the view for this issue
      if (currentUser && issue) {
        await trackIssueView(currentUser.uid, issue.dailyIssueId);
      }

      // Fetch previous issues
      const previous = await getPreviousDailyIssues();
      setPreviousIssues(previous);
    } catch (err) {
      console.error("Error fetching daily issue:", err);
      if (err.message && err.message.includes('requires an index')) {
        setError("Database index issue. Please click 'Refresh' to try again or contact support.");
      } else if (err.code && err.code === 'permission-denied') {
        setError("You don't have permission to access this content. Please log in again or contact support.");
      } else {
        setError("Failed to load daily issue. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const stats = await getUserDailyIssueStats(currentUser.uid);
      setUserStats(stats);
    } catch (err) {
      console.error("Error fetching user stats:", err);
    }
  };

  const handleViewDetails = (e) => {
    // Prevent default behavior to ensure the click is captured
    e.preventDefault();
    
    // Only proceed if not already in a viewing state
    if (!viewingDetails && !completedView) {
      setViewingDetails(true);
      // Start the timer
      handleStartTimer();
    }
  };

  const handleStartTimer = () => {
    // Don't start a timer if already completed
    if (completedView) return;
    
    // Set timer for 2 minutes (120 seconds)
    setTimeLeftSeconds(120);
    
    // Clear any existing timer
    if (issueTimer) {
      clearInterval(issueTimer);
    }
    
    // Start new timer
    const timer = setInterval(() => {
      setTimeLeftSeconds((prevTime) => {
        if (prevTime <= 1) {
          // Time's up, clear the timer
          clearInterval(timer);
          if (dailyIssue && currentUser && !completedView) {
            handleCompleteIssue();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setIssueTimer(timer);
  };

  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteIssue = async (e) => {
    // If this is an event, prevent default
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!currentUser || !dailyIssue || completingIssue || completedView) return;
    
    try {
      setCompletingIssue(true);
      setError(null);
      
      // Clear timer if it's running
      if (issueTimer) {
        clearInterval(issueTimer);
        setIssueTimer(null);
      }
      
      const result = await markDailyIssueCompleted(
        currentUser.uid,
        dailyIssue.dailyIssueId
      );
      
      if (result.success) {
        // Update local state
        setCompletedView(true);
        setViewingDetails(false); // Ensure we're in completed view
        setCompletionMessage({
          type: "success",
          message: `Issue completed! ${
            result.pointsAwarded > 0
              ? `You earned ${result.pointsAwarded} points.`
              : "No points awarded for previous issues."
          }`,
        });
        
        // Refresh user stats
        fetchUserStats();
      } else {
        setCompletionMessage({
          type: "info",
          message: result.message || "Issue was already completed.",
        });
      }
    } catch (err) {
      console.error("Error completing issue:", err);
      setCompletionMessage({
        type: "error",
        message: "Failed to complete issue. Please try again.",
      });
    } finally {
      setCompletingIssue(false);
    }
  };

  const renderBadges = () => {
    if (!userStats.badges || userStats.badges.length === 0) {
      return <p className="text-gray-500 text-sm">No badges earned yet</p>;
    }

    return (
      <div className="flex flex-wrap gap-3 mt-2">
        {userStats.badges.map((badge) => (
          <div
            key={badge.id}
            className="rounded-lg bg-indigo-50 p-2 flex flex-col items-center cursor-pointer hover:bg-indigo-100 transition-colors"
            title={badge.description}
            onClick={() => handleOpenBadgeModal(badge)}
          >
            {badge.imagePath ? (
              <img 
                src={getBadgeImagePath(badge)}
                alt={badge.name} 
                className="w-10 h-10 mb-1"
              />
            ) : (
              <FaTrophy className="text-yellow-500 text-xl mb-1" />
            )}
            <span className="text-xs font-medium text-indigo-800">{badge.name}</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper to get the correct badge image path
  const getBadgeImagePath = (badge) => {
    if (!badge || !badge.imagePath) return null;
    
    // Check if this is a 3D badge path
    if (badge.id === 'day_1') {
      return '/images/badges/3d/day1-3d-badge.svg';
    } else if (badge.id === 'day_2') {
      return '/images/badges/3d/day2-3d-badge.svg';
    } else if (badge.id === 'day_3') {
      return '/images/badges/3d/day3-3d-badge.svg';
    }
    
    // For regular badges, ensure we return an SVG version if available
    return badge.imagePath.replace('.png', '.svg');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = typeof dateString === "string" 
      ? new Date(dateString) 
      : dateString.toDate();
    return format(date, "MMM d, yyyy");
  };

  const handleRefreshIssue = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Fetch and store a new daily issue
      await fetchAndStoreDailyIssue();
      
      // Refetch the daily issue to display it
      await fetchDailyIssue();
      
    } catch (err) {
      console.error("Error refreshing daily issue:", err);
      setError("Failed to refresh daily issue. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  const handleCloseBadgeModal = () => {
    setShowBadgeModal(false);
    setSelectedBadge(null);
  };

  // Add function to check if this issue is already completed
  const checkIfAlreadyCompleted = async () => {
    if (!currentUser || !dailyIssue) return false;
    
    try {
      // Check user's daily issues document
      const userDailyIssuesRef = doc(db, 'userDailyIssues', currentUser.uid);
      const userDailyIssuesDoc = await getDoc(userDailyIssuesRef);
      
      if (!userDailyIssuesDoc.exists()) {
        return false;
      }
      
      const userData = userDailyIssuesDoc.data();
      const completedIssues = userData.completedIssues || [];
      
      // Check if the current daily issue is already completed
      const alreadyCompleted = completedIssues.some(
        issue => issue.dailyIssueId === dailyIssue.dailyIssueId
      );
      
      if (alreadyCompleted) {
        setCompletedView(true);
        setCompletionMessage({
          type: "success",
          message: "You've already completed today's challenge!",
        });
      }
      
      return alreadyCompleted;
    } catch (err) {
      console.error("Error checking completion status:", err);
      return false;
    }
  };

  // Update useEffect to check completion status
  useEffect(() => {
    if (dailyIssue && currentUser) {
      checkIfAlreadyCompleted();
    }
  }, [dailyIssue, currentUser]);

  // Add a function to fetch user's leaderboard stats
  const fetchLeaderboardStats = async () => {
    if (!currentUser) return;
    
    try {
      const userStatsRef = doc(db, 'userStats', currentUser.uid);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        setLeaderboardStats(userStatsDoc.data());
      } else {
        setLeaderboardStats(null);
      }
    } catch (err) {
      console.error('Error fetching leaderboard stats:', err);
    }
  };

  // Add a debug button with the user stats section
  const toggleDebugInfo = () => {
    setShowDebugInfo(prev => !prev);
    if (!showDebugInfo) {
      fetchLeaderboardStats();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-red-500 flex items-center gap-2 mb-4">
          <FaBan className="text-2xl" />
          <p className="font-medium">{error}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchDailyIssue}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <FaSync />
            <span>Retry</span>
          </button>
          <button
            onClick={handleRefreshIssue}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FaPlus />
            <span>Create New Issue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Section */}
      {currentUser && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            Your Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Streak</h3>
                  <p className="text-2xl font-bold text-indigo-700">
                    {userStats.currentStreak} days
                  </p>
                </div>
                <FaFire className="text-4xl text-orange-500" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Points</h3>
                  <p className="text-2xl font-bold text-purple-700">
                    {userStats.totalPoints}
                  </p>
                </div>
                <FaStar className="text-4xl text-yellow-500" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                  <p className="text-2xl font-bold text-green-700">
                    {userStats.totalCompleted}
                  </p>
                </div>
                <FaCheckCircle className="text-4xl text-green-500" />
              </div>
            </div>
          </div>
          
          {/* Badges section */}
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Badges</h3>
            {renderBadges()}
          </div>
          
          {/* Add debug section */}
          <div className="mt-4 text-right">
            <button 
              onClick={toggleDebugInfo}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showDebugInfo ? 'Hide Debug Info' : 'Debug Info'}
            </button>
          </div>
          
          {showDebugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm">
              <h4 className="font-bold mb-2">Leaderboard Data (userStats collection):</h4>
              {leaderboardStats ? (
                <div>
                  <p>Display Name: {leaderboardStats.displayName}</p>
                  <p>Points: {leaderboardStats.points}</p>
                  <p>Streak: {leaderboardStats.streak}</p>
                  <p>Completed Issues: {leaderboardStats.completedIssues}</p>
                  <p>Last Updated: {leaderboardStats.lastUpdated?.toDate?.().toString() || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-red-500">No data found in userStats collection!</p>
              )}
              
              {dataConsistencyVerified && (
                <div className="mt-2 border-t pt-2">
                  <h4 className="font-bold mb-1">Data Consistency Check:</h4>
                  <p>Status: {consistencyResult?.consistent ? 
                    <span className="text-green-500">Consistent</span> : 
                    <span className="text-orange-500">Inconsistent</span>
                  }</p>
                  <p>Sync Performed: {consistencyResult?.syncPerformed ? 
                    <span className="text-green-500">Yes</span> : 
                    <span className="text-gray-500">No</span>
                  }</p>
                </div>
              )}
              
              <div className="mt-2">
                <button
                  onClick={fetchLeaderboardStats}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  Refresh Debug Info
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today's Issue Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaGithub />
            Today's GitHub Challenge
          </h2>
          <button
            onClick={handleRefreshIssue}
            disabled={refreshing}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition-colors"
            title="Refresh daily issue"
          >
            {refreshing ? (
              <FaSync className="animate-spin" />
            ) : (
              <>
                <FaSync />
                <span className="text-sm">Refresh</span>
              </>
            )}
          </button>
        </div>
        {!dailyIssue ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">
              No challenge available for today. Check back later!
            </p>
          </div>
        ) : completedView ? (
          <div className="p-6">
            <div className={`mb-4 p-4 rounded-lg ${
              completionMessage?.type === "success"
                ? "bg-green-100 text-green-800"
                : completionMessage?.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}>
              <div className="flex items-center gap-2">
                {completionMessage?.type === "success" ? (
                  <FaCheckCircle />
                ) : (
                  <FaRegClock />
                )}
                <p>{completionMessage?.message}</p>
              </div>
            </div>
            
            {/* Completion Celebration Image */}
            <div className="flex justify-center mb-6">
              <img 
                src="/images/completion-celebration.svg" 
                alt="Challenge Completed!" 
                className="w-64 h-48 object-contain"
              />
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{dailyIssue.title}</h3>
              <a
                href={dailyIssue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <FaExternalLinkAlt />
                View on GitHub
              </a>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {dailyIssue.labels &&
                dailyIssue.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: `#${label.color}`,
                      color: parseInt(label.color, 16) > 0xffffff / 2 ? "#000" : "#fff",
                    }}
                  >
                    {label.name}
                  </span>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <FaCodeBranch />
                <span>
                  {dailyIssue.repository?.full_name || "Unknown repository"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaCalendarAlt />
                <span>{formatDate(dailyIssue.date)}</span>
              </div>
            </div>

            {/* Tomorrow's challenge notice */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-700 mb-2 flex items-center gap-2">
                <FaCalendarAlt />
                Next Challenge
              </h4>
              <p className="text-gray-700">
                Come back tomorrow for a new daily GitHub challenge!
              </p>
            </div>
          </div>
        ) : viewingDetails ? (
          <div className="p-6">
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-2 text-indigo-700">
                <FaRegClock />
                <span>
                  Complete automatically in{" "}
                  <span className="font-bold">{formatTimeLeft(timeLeftSeconds)}</span>
                </span>
              </div>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                onClick={handleCompleteIssue}
                disabled={completingIssue}
              >
                {completingIssue ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    <span>Complete Now</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{dailyIssue.title}</h3>
              <a
                href={dailyIssue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <FaExternalLinkAlt />
                View on GitHub
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {dailyIssue.labels &&
                dailyIssue.labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: `#${label.color}`,
                      color: parseInt(label.color, 16) > 0xffffff / 2 ? "#000" : "#fff",
                    }}
                  >
                    {label.name}
                  </span>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <FaCodeBranch />
                <span>
                  {dailyIssue.repository?.full_name || "Unknown repository"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaCalendarAlt />
                <span>{formatDate(dailyIssue.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaUserAlt />
                <span>{dailyIssue.user?.login || "Unknown user"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaComment />
                <span>{dailyIssue.comments || 0} comments</span>
              </div>
            </div>

            {dailyIssue.body && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Description</h4>
                <div className="bg-gray-50 p-4 rounded-lg prose max-w-none">
                  {dailyIssue.body}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{dailyIssue.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  New Challenge
                </span>
                <a
                  href={dailyIssue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <FaExternalLinkAlt />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {dailyIssue.labels &&
                dailyIssue.labels.slice(0, 3).map((label) => (
                  <span
                    key={label.id}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: `#${label.color}`,
                      color: parseInt(label.color, 16) > 0xffffff / 2 ? "#000" : "#fff",
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              {dailyIssue.labels && dailyIssue.labels.length > 3 && (
                <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">
                  +{dailyIssue.labels.length - 3} more
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <FaCodeBranch />
                <span>
                  {dailyIssue.repository?.full_name || "Unknown repository"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaCalendarAlt />
                <span>{formatDate(dailyIssue.date)}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 cursor-pointer active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={handleViewDetails}
                disabled={loading || refreshing}
              >
                <FaPlus />
                <span>View Challenge Details</span>
                <FaArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Previous Issues Section */}
      {previousIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaHistory />
            Previous Challenges
          </h2>
          <div className="space-y-4">
            {previousIssues.map((issue) => (
              <div
                key={issue.dailyIssueId}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{issue.title}</h3>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <FaExternalLinkAlt />
                    <span className="hidden sm:inline">View on GitHub</span>
                  </a>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {issue.labels &&
                    issue.labels.slice(0, 2).map((label) => (
                      <span
                        key={label.id}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: `#${label.color}`,
                          color: parseInt(label.color, 16) > 0xffffff / 2 ? "#000" : "#fff",
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaCodeBranch className="text-xs" />
                    <span>{issue.repository?.full_name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="text-xs" />
                    <span>{formatDate(issue.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showBadgeModal && selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-700">{selectedBadge.name}</h3>
              <button 
                onClick={handleCloseBadgeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              {selectedBadge.imagePath ? (
                <img 
                  src={getBadgeImagePath(selectedBadge)}
                  alt={selectedBadge.name} 
                  className="w-40 h-40"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center">
                  <FaTrophy className="text-yellow-500 text-6xl" />
                </div>
              )}
            </div>
            <p className="text-gray-700 mb-2">{selectedBadge.description}</p>
            <p className="text-sm text-gray-500">
              Earned on {formatDate(selectedBadge.awardedAt)}
            </p>
            <button
              onClick={handleCloseBadgeModal}
              className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyGitHubIssue; 