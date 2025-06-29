import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  FaUser,
  FaCode,
  FaGithub,
  FaCheckCircle,
  FaSearch,
  FaStar,
  FaExclamationCircle,
  FaSpinner,
  FaTag,
  FaCalendarAlt,
  FaComment,
  FaBookmark,
  FaSyncAlt,
  FaUserCircle,
  FaListUl,
  FaLightbulb,
  FaFire,
} from "react-icons/fa";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { findMatchingIssuesForUser } from "../services/matchingService";
import { saveIssue, removeSavedIssue } from "../services/savedIssuesService";
import { getUserDailyIssueStats } from "../services/dailyIssueService";

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendedIssues, setRecommendedIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [profileComplete, setProfileComplete] = useState(0); // Percentage of profile completion
  const [activeContributions, setActiveContributions] = useState([]);
  const [bookmarkedIssues, setBookmarkedIssues] = useState([]);
  const [issuesRequested, setIssuesRequested] = useState(false);
  const [dailyChallengeStreak, setDailyChallengeStreak] = useState(0);
  
  // Add loading stages state like in PersonalizedIssues
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingStages = [
    { icon: FaUserCircle, text: "Analyzing your profile and skills..." },
    { icon: FaCode, text: "Finding repositories that match your expertise..." },
    { icon: FaSearch, text: "Searching for relevant open issues..." },
    { icon: FaListUl, text: "Filtering issues by difficulty and scope..." },
    { icon: FaLightbulb, text: "Calculating best matches for your skills..." },
    { icon: FaCheckCircle, text: "Finalizing personalized recommendations..." },
  ];

  // Fetch user profile data
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserProfile(userData);

          // Calculate profile completion percentage
          let completed = 0;
          let total = 5; // Total number of profile sections to complete

          if (userData.displayName) completed++;
          if (userData.skills && userData.skills.length > 0) completed++;
          if (userData.githubConnected) completed++;
          if (userData.bio) completed++;
          if (userData.photoURL) completed++;

          setProfileComplete(Math.round((completed / total) * 100));

          // Get active contributions
          if (userData.contributionHistory) {
            const activeContribs = userData.contributionHistory
              .filter((c) => c.status === "in_progress")
              .slice(0, 3);
            setActiveContributions(activeContribs);
          }
        }

        // Fetch daily challenge streak from userDailyIssues collection
        const dailyIssueStats = await getUserDailyIssueStats(currentUser.uid);
        setDailyChallengeStreak(dailyIssueStats.currentStreak || 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch personalized issue recommendations when requested
  const fetchRecommendedIssues = async () => {
    setLoadingIssues(true);
    setIssuesRequested(true);
    
    // Start the loading animation sequence
    setLoadingStage(0);
    const loadingInterval = setInterval(() => {
      setLoadingStage((prev) => {
        if (prev < loadingStages.length - 1) return prev + 1;
        return prev;
      });
    }, 1500); // Transition to next stage every 1.5 seconds
    
    try {
      // Get personalized issue recommendations using the matching service
      const issues = await findMatchingIssuesForUser(currentUser.uid);
      setRecommendedIssues(issues.slice(0, 5)); // Only show top 5 in the dashboard
    } catch (error) {
      console.error("Error fetching recommended issues:", error);
      setRecommendedIssues([]);
    } finally {
      setLoadingIssues(false);
      clearInterval(loadingInterval);
    }
  };

  // Fetch bookmarked issues
  useEffect(() => {
    if (!currentUser) return;

    const fetchBookmarkedIssues = async () => {
      try {
        // Query for saved issues from Firestore
        const savedIssuesQuery = query(
          collection(db, "savedIssues"),
          where("userId", "==", currentUser.uid)
        );

        const savedIssuesSnap = await getDocs(savedIssuesQuery);
        const savedIssuesList = [];

        savedIssuesSnap.forEach((doc) => {
          savedIssuesList.push({
            ...doc.data(),
            savedId: doc.id,
          });
        });

        setBookmarkedIssues(savedIssuesList);
      } catch (error) {
        console.error("Error loading saved issues:", error);
      }
    };

    fetchBookmarkedIssues();
  }, [currentUser]);

  // Handle bookmarking an issue
  const handleToggleBookmark = async (issue) => {
    if (!currentUser) return;

    try {
      // Check if the issue is already bookmarked
      const isBookmarked = bookmarkedIssues.some(
        (bookmarked) => bookmarked.issueId === issue.id
      );

      if (isBookmarked) {
        // Find the saved issue document ID
        const savedIssue = bookmarkedIssues.find(
          (bookmarked) => bookmarked.issueId === issue.id
        );

        // Remove from saved issues
        if (savedIssue?.savedId) {
          await removeSavedIssue(savedIssue.savedId);

          // Update local state
          setBookmarkedIssues(
            bookmarkedIssues.filter((item) => item.issueId !== issue.id)
          );
        }
      } else {
        // Save the issue
        await saveIssue(issue, currentUser.uid);

        // Update local state with the new bookmarked issue
        const newBookmark = {
          issueId: issue.id,
          title: issue.title,
          url: issue.html_url,
          userId: currentUser.uid,
          savedAt: new Date(),
        };

        setBookmarkedIssues([...bookmarkedIssues, newBookmark]);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  // Check if an issue is bookmarked
  const isBookmarked = (issueId) => {
    return bookmarkedIssues.some((issue) => issue.issueId === issueId);
  };

  // Format date for better readability
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return "Today";
    } else if (diffDays <= 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className={`animate-spin ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} text-3xl`} />
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'text-gray-100' : 'text-gray-800'}>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg text-white">
        <div className="flex items-center mb-4 justify-between">
          <div className="flex items-center">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mr-4">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "User"}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <FaUser className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome,{" "}
                {currentUser.displayName || currentUser.email.split("@")[0]}!
              </h1>
              <p className="text-blue-100 mt-1">
                Ready to find your next open source contribution?
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center bg-blue-700/30 p-3 rounded-xl">
            <div className="bg-yellow-300 text-yellow-800 rounded-full p-2.5 mb-2 shadow-lg">
              <FaStar className="text-2xl" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-white">Activity Streak: {userProfile?.streak || 0} days</span>
              {dailyChallengeStreak > 0 && (
                <span className="text-xs text-blue-100 mt-1 flex items-center">
                  <FaFire className="mr-1 text-orange-300" />
                  Challenge Streak: {dailyChallengeStreak} days
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-700 bg-opacity-40 rounded-xl p-4 mt-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <p className="text-blue-100 text-sm">Your contribution status</p>
            <p className="font-semibold text-lg">
              {activeContributions.length > 0
                ? `${activeContributions.length} active contribution${
                    activeContributions.length !== 1 ? "s" : ""
                  }`
                : "No active contributions yet"}
            </p>
          </div>
          <button
            onClick={() => navigate("/github-issues")}
            className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg inline-flex items-center gap-2"
          >
            <FaSearch className="w-4 h-4" />
            <span>Find Projects</span>
          </button>
        </div>
      </div>

      {/* Profile Completion Bar */}
      {profileComplete < 100 && (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 mb-6 rounded-xl shadow-md`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Complete your profile</h3>
            <span className="text-sm text-blue-600 font-medium">
              {profileComplete}% complete
            </span>
          </div>
          <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5`}>
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${profileComplete}%` }}
            ></div>
          </div>
          <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Complete your profile to get better project matches and connect with
            other contributors.
          </div>
          <div className="mt-3">
            <button
              onClick={() => navigate("/profile")}
              className="text-blue-600 hover:text-blue-400 font-medium text-sm"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Getting Started */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 md:p-8 rounded-xl shadow-md`}>
            <h2 className={`text-xl md:text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} flex items-center gap-2`}>
              <FaCheckCircle className="text-green-500" />
              Getting Started
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className={`w-12 h-12 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <FaGithub className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-1`}>
                    Connect Your GitHub Account
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                    Link your GitHub account to help us find better project
                    matches for you.
                  </p>
                  <button
                    onClick={() => navigate("/profile")}
                    className={`${
                      userProfile?.githubConnected
                        ? isDarkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
                        : isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    } 
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2`}
                  >
                    <FaGithub className="w-4 h-4" />
                    <span>
                      {userProfile?.githubConnected
                        ? "GitHub Connected"
                        : "Connect GitHub"}
                    </span>
                    {userProfile?.githubConnected && (
                      <FaCheckCircle className={`ml-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className={`w-12 h-12 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <FaCode className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} mb-1`}>
                    Add Your Skills
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                    Tell us what programming languages and frameworks you're
                    comfortable with.
                  </p>
                  <button
                    onClick={() => navigate("/profile")}
                    className={`${
                      userProfile?.skills?.length > 0
                        ? isDarkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    } 
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2`}
                  >
                    {userProfile?.skills?.length > 0 ? (
                      <>
                        <span>Skills Added ({userProfile.skills.length})</span>
                        <FaCheckCircle className="ml-1" />
                      </>
                    ) : (
                      "Add Skills"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Projects */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 md:p-8 rounded-xl shadow-md`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Recommended Issues
              </h2>
              <Link
                to="/personalized-issues"
                className="text-blue-500 hover:text-blue-400 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {!issuesRequested ? (
              <div className={`text-center py-10 px-4 border border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg`}>
                <FaSearch className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                  Personalized Recommendations
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                  We'll analyze your skills and preferences to suggest GitHub issues that match your expertise.
                </p>
                <button
                  onClick={fetchRecommendedIssues}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <FaSearch className="w-4 h-4" />
                  <span>Find Recommended Issues</span>
                </button>
              </div>
            ) : loadingIssues ? (
              <div className="flex flex-col items-center justify-center py-10">
                {/* Enhanced loading animation with stages */}
                <div className="w-full max-w-md">
                  {/* Current stage animation */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="relative">
                      {React.createElement(loadingStages[loadingStage].icon, {
                        className: `${isDarkMode ? 'text-blue-400' : 'text-blue-500'} text-5xl animate-pulse`,
                      })}
                    </div>
                  </div>

                  {/* Current stage text */}
                  <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium text-lg mb-8`}>
                    {loadingStages[loadingStage].text}
                  </p>

                  {/* Progress bar */}
                  <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 mb-6`}>
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                      style={{
                        width: `${
                          ((loadingStage + 1) / loadingStages.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>

                  {/* All stages */}
                  <div className="space-y-4 px-4">
                    {loadingStages.map((stage, index) => (
                      <div
                        key={index}
                        className={`flex items-center transition-opacity duration-300 ${
                          index <= loadingStage ? "opacity-100" : "opacity-30"
                        }`}
                      >
                        <div
                          className={`mr-3 ${
                            index <= loadingStage 
                              ? isDarkMode ? "text-blue-400" : "text-blue-500" 
                              : isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {React.createElement(stage.icon, { size: 16 })}
                        </div>
                        <span
                          className={`text-sm ${
                            index <= loadingStage 
                              ? isDarkMode ? "text-gray-200" : "text-gray-700" 
                              : isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {stage.text}
                        </span>
                        {index === loadingStage && (
                          <FaSpinner className={`ml-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'} animate-spin text-sm`} />
                        )}
                        {index < loadingStage && (
                          <FaCheckCircle className={`ml-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'} text-sm`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : recommendedIssues.length > 0 ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={fetchRecommendedIssues}
                    className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium inline-flex items-center gap-1`}
                    title="Refresh recommendations"
                  >
                    <FaSyncAlt className={loadingIssues ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
                <div className="space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {recommendedIssues.map((match) => (
                    <div
                      key={match.issue.id}
                      className={`border ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} rounded-lg p-4 hover:shadow-md transition-all`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} hover:text-blue-500`}>
                          <a
                            href={match.issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-start"
                          >
                            <FaGithub className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0 mt-1`} />
                            <span className="line-clamp-2">
                              {match.issue.title}
                            </span>
                          </a>
                        </h3>
                        <button
                          onClick={() => handleToggleBookmark(match.issue)}
                          className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} hover:text-blue-500 focus:outline-none transition-colors`}
                          title={
                            isBookmarked(match.issue.id)
                              ? "Remove bookmark"
                              : "Bookmark this issue"
                          }
                        >
                          <FaBookmark
                            className={
                              isBookmarked(match.issue.id) ? "text-blue-500" : ""
                            }
                            size={18}
                          />
                        </button>
                      </div>

                      {/* Repository and metadata */}
                      <div className={`flex items-center flex-wrap text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                        <a
                          href={
                            match.issue.repository_html_url ||
                            `https://github.com/${
                              match.issue.repository?.full_name || ""
                            }`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'} mr-3 mb-1`}
                        >
                          {match.issue.repository?.full_name ||
                            match.issue.repository_url
                              ?.split("/")
                              .slice(-2)
                              .join("/")}
                        </a>
                        <span className="flex items-center mb-1 mr-3">
                          <FaCalendarAlt className="mr-1" />
                          {formatDate(match.issue.created_at)}
                        </span>
                        {match.issue.comments > 0 && (
                          <span className="flex items-center mb-1">
                            <FaComment className="mr-1" />
                            {match.issue.comments}
                          </span>
                        )}
                      </div>

                      {/* Match score */}
                      <div className={`${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'} rounded-lg px-3 py-2 mb-3 flex items-center text-sm`}>
                        <span className="font-medium mr-2">Match:</span>
                        <div className={`w-20 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.round(match.score * 100)}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm">
                          {Math.round(match.score * 100)}%
                        </span>
                      </div>

                      {/* Labels - show max 3 */}
                      {match.issue.labels && match.issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {match.issue.labels.slice(0, 3).map((label) => (
                            <span
                              key={label.id || `label-${label.name}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: isDarkMode ? `#${label.color}15` : `#${label.color}25`,
                                color: isDarkMode ? `#${label.color}dd` : `#${label.color}`,
                                border: `1px solid #${label.color}${isDarkMode ? '55' : ''}`,
                              }}
                            >
                              <FaTag className="mr-1 text-xs" />
                              {label.name}
                            </span>
                          ))}
                          {match.issue.labels.length > 3 && (
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-1`}>
                              +{match.issue.labels.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex justify-end">
                        <a
                          href={match.issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          View Issue
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <FaExclamationCircle className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>No matches found</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                  We couldn't find issues that match your profile. Try updating your skills or check back later.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:space-y-8">
          {/* Profile Summary */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Profile Summary
            </h2>

            <div className="space-y-4">
              <div className={`flex justify-between items-center pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Email</span>
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {currentUser.email}
                </span>
              </div>

              <div className={`flex justify-between items-center pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>GitHub</span>
                <span
                  className={`font-medium ${
                    userProfile?.githubConnected
                      ? isDarkMode ? "text-green-400" : "text-green-600"
                      : isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {userProfile?.githubConnected ? (
                    <>
                      <FaCheckCircle className="inline mr-1" />
                      Connected
                    </>
                  ) : (
                    "Not connected"
                  )}
                </span>
              </div>

              <div className={`flex justify-between items-center pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Skills</span>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
                  {userProfile?.skills?.length > 0
                    ? `${userProfile.skills.length} added`
                    : "None added"}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/profile")}
              className={`mt-6 w-full ${
                isDarkMode 
                  ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
              } px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
            >
              Edit Profile
            </button>
          </div>

          {/* Saved Issues */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Saved Issues</h2>
              {bookmarkedIssues.length > 0 && (
                <Link
                  to="/saved-issues"
                  className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium`}
                >
                  View All
                </Link>
              )}
            </div>

            {bookmarkedIssues.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {bookmarkedIssues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.savedId}
                    className={`pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  >
                    <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-1 truncate`}>
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-start"
                      >
                        <FaGithub className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0 mt-1`} />
                        <span>{issue.title}</span>
                      </a>
                    </h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {issue.repository_name}
                      </span>
                      <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>Saved</span>
                    </div>
                  </div>
                ))}
                {bookmarkedIssues.length > 3 && (
                  <div className="pt-2 text-center">
                    <Link
                      to="/saved-issues"
                      className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium`}
                    >
                      View {bookmarkedIssues.length - 3} more
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <FaBookmark className={`w-10 h-10 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mb-2`}>No saved issues yet</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
                  Bookmark interesting issues to find them later
                </p>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Recent Activity
            </h2>

            {activeContributions.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {activeContributions.map((contribution) => (
                  <div
                    key={contribution.issueId}
                    className={`pb-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  >
                    <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-1 truncate`}>
                      <a
                        href={contribution.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {contribution.title}
                      </a>
                    </h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {contribution.repository}
                      </span>
                      <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>In Progress</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link
                    to="/my-contributions"
                    className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium`}
                  >
                    View All Contributions
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} mb-4`}>No activity to show yet.</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
                  Your GitHub activity will appear here once you start
                  contributing.
                </p>
                <Link
                  to="/github-issues"
                  className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium`}
                >
                  Find Issues to Contribute
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
