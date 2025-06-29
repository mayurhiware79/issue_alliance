import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
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
  FaMagic,
  FaPlus,
  FaCalendarPlus,
  FaHistory,
  FaTimes,
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
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { findMatchingIssuesForUser } from "../services/matchingService";
import { saveIssue, removeSavedIssue } from "../services/savedIssuesService";
import { trackIssueInRepository } from "../services/repositoryService";
import { generateIssueSummary } from "../services/geminiService";
import StreakIcon from "./StreakIcon";

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendedIssues, setRecommendedIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [profileComplete, setProfileComplete] = useState(0); // Percentage of profile completion
  const [activeContributions, setActiveContributions] = useState([]);
  const [bookmarkedIssues, setBookmarkedIssues] = useState([]);
  const [issuesRequested, setIssuesRequested] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState({});
  const [contributingIssueId, setContributingIssueId] = useState(null);
  const [error, setError] = useState(null);

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
    try {
      // Get personalized issue recommendations using the matching service
      const issues = await findMatchingIssuesForUser(currentUser.uid);
      setRecommendedIssues(issues.slice(0, 5)); // Only show top 5 in the dashboard
    } catch (error) {
      console.error("Error fetching recommended issues:", error);
      setRecommendedIssues([]);
    } finally {
      setLoadingIssues(false);
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

  // Generate summary using Gemini
  const handleGenerateSummary = async (issue) => {
    if (summaries[issue.id]) return; // Don't regenerate if we already have a summary

    setLoadingSummaries((prev) => ({ ...prev, [issue.id]: true }));
    try {
      const summary = await generateIssueSummary(issue);
      setSummaries((prev) => ({ ...prev, [issue.id]: summary }));
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummaries((prev) => ({
        ...prev,
        [issue.id]: `Error: ${error.message || "Failed to generate summary"}`,
      }));
    } finally {
      setLoadingSummaries((prev) => ({ ...prev, [issue.id]: false }));
    }
  };

  // Schedule a meeting
  const handleSchedule = (issue) => {
    try {
      // Navigate to the schedule meeting page with the issue data
      navigate("/schedule-meeting", { state: { issue } });
    } catch (error) {
      console.error("Error preparing to schedule:", error);
      setError("Failed to prepare scheduling. Please try again.");
      setTimeout(() => setError(null), 5000);
    }
  };

  // Start contributing to an issue
  const handleStartContributing = async (issue) => {
    if (!currentUser) {
      navigate("/login", { state: { from: "/dashboard" } });
      return;
    }

    try {
      // Set loading state for this specific issue
      setContributingIssueId(issue.id);
      setError(null);

      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        let updatedHistory = [...(userData.contributionHistory || [])];

        // Check if already in history
        const existingIndex = updatedHistory.findIndex(
          (item) => item.issueId === issue.id
        );

        if (existingIndex < 0) {
          // Make sure we have all the required properties from the issue object
          // GitHub API sometimes returns html_url instead of url
          const issueUrl = issue.url || issue.html_url || "";
          
          if (!issue.id || !issue.title || (!issueUrl) || !issue.repository?.full_name) {
            console.error("Missing required issue properties:", issue);
            setError("Issue data is incomplete. Please try again with another issue.");
            setContributingIssueId(null);
            return;
          }

          // Add to history with proper data validation
          const contributionData = {
            issueId: issue.id,
            title: issue.title || "Untitled Issue",
            url: issueUrl,
            repository: issue.repository?.full_name || "",
            repositoryUrl: issue.repository?.full_name 
              ? `https://github.com/${issue.repository.full_name}`
              : "",
            startedAt: new Date().toISOString(),
            status: "in_progress",
          };

          updatedHistory.push(contributionData);
          setActiveContributions([...activeContributions, contributionData]);

          // Create valid update object
          const updateData = {
            contributionHistory: updatedHistory,
            updatedAt: new Date(),
          };

          // Update Firestore
          await updateDoc(userRef, updateData);

          // Track this issue in the repository collection
          try {
            if (issue.repository && issue.repository.full_name) {
              await trackIssueInRepository(issue, currentUser.uid);
            }
          } catch (repoError) {
            console.error("Error tracking repository:", repoError);
            // Continue even if repository tracking fails
          }

          // Navigate to my contributions page
          navigate("/my-contributions", {
            state: {
              newContribution: contributionData,
            },
          });
        } else {
          // Issue already in history
          setError("This issue is already in your contributions");
          setTimeout(() => setError(null), 3000);
          setContributingIssueId(null);
        }
      }
    } catch (err) {
      console.error("Error adding to contribution history:", err);
      setError(`Failed to add issue to contributions: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setContributingIssueId(null);
    }
  };

  // Check if an issue is currently being contributed to
  const isContributing = (issueId) => {
    return activeContributions.some((item) => item.issueId === issueId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-20 right-4 z-50 max-w-md shadow-lg">
          <div className="flex">
            <div className="py-1">
              <FaExclamationCircle className="text-xl mr-2" />
            </div>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg text-white">
        <div className="flex items-center justify-between mb-4">
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
          
          {/* Streak Icon */}
          <div className="scale-125 p-1">
            <StreakIcon inDashboard={true} />
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
        <div className="bg-white p-4 mb-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Complete your profile</h3>
            <span className="text-sm text-blue-600 font-medium">
              {profileComplete}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${profileComplete}%` }}
            ></div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Complete your profile to get better project matches and connect with
            other contributors.
          </div>
          <div className="mt-3">
            <button
              onClick={() => navigate("/profile")}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
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
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Getting Started
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaGithub className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">
                    Connect Your GitHub Account
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Link your GitHub account to help us find better project
                    matches for you.
                  </p>
                  <button
                    onClick={() => navigate("/profile")}
                    className={`${
                      userProfile?.githubConnected
                        ? "bg-green-100 text-green-800 cursor-default"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
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
                      <FaCheckCircle className="ml-1 text-green-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">
                    Add Your Skills
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Tell us what programming languages and frameworks you're
                    comfortable with.
                  </p>
                  <button
                    onClick={() => navigate("/profile")}
                    className={`${
                      userProfile?.skills?.length > 0
                        ? "bg-green-100 text-green-800 cursor-default"
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
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                Recommended Issues
              </h2>
              <Link
                to="/personalized-issues"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {!issuesRequested ? (
              <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
                <FaSearch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold text-gray-700 mb-2">
                  Find Personalized Recommendations
                </h3>
                <p className="text-gray-500 mb-6">
                  We'll analyze your skills and preferences to suggest GitHub issues that match your expertise.
                </p>
                <button
                  onClick={fetchRecommendedIssues}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  <FaSyncAlt className="w-4 h-4" />
                  <span>Fetch Recommended Issues</span>
                </button>
              </div>
            ) : loadingIssues ? (
              <div className="flex flex-col items-center py-10">
                <FaSpinner className="animate-spin text-blue-600 text-2xl mb-4" />
                <p className="text-gray-500">
                  Finding personalized recommendations...
                </p>
              </div>
            ) : recommendedIssues.length > 0 ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={fetchRecommendedIssues}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
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
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 hover:text-blue-600">
                          <a
                            href={match.issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-start"
                          >
                            <FaGithub className="mr-2 text-gray-600 flex-shrink-0 mt-1" />
                            <span className="line-clamp-2">
                              {match.issue.title}
                            </span>
                          </a>
                        </h3>
                        <button
                          onClick={() => handleToggleBookmark(match.issue)}
                          className="text-gray-400 hover:text-blue-500 focus:outline-none transition-colors"
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
                      <div className="flex items-center flex-wrap text-sm text-gray-500 mb-3">
                        <a
                          href={
                            match.issue.repository_html_url ||
                            `https://github.com/${
                              match.issue.repository?.full_name || ""
                            }`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 mr-3 mb-1"
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
                      <div className="bg-blue-50 text-blue-800 rounded-lg px-3 py-2 mb-3 flex items-center text-sm">
                        <span className="font-medium mr-2">Match:</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
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
                                backgroundColor: `#${label.color}25`,
                                color: `#${label.color}`,
                                border: `1px solid #${label.color}`,
                              }}
                            >
                              <FaTag className="mr-1 text-xs" />
                              {label.name}
                            </span>
                          ))}
                          {match.issue.labels.length > 3 && (
                            <span className="text-xs text-gray-500 ml-1">
                              +{match.issue.labels.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Summary Section */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {!summaries[match.issue.id] && !loadingSummaries[match.issue.id] && (
                          <button
                            onClick={() => handleGenerateSummary(match.issue)}
                            className={`inline-flex items-center text-sm ${
                              loadingSummaries[match.issue.id]
                                ? "text-gray-400 cursor-wait"
                                : "text-purple-600 hover:text-purple-800"
                            }`}
                            disabled={loadingSummaries[match.issue.id]}
                          >
                            {loadingSummaries[match.issue.id] ? (
                              <>
                                <FaSpinner className="mr-1 animate-spin" /> Summarizing...
                              </>
                            ) : summaries[match.issue.id] ? (
                              <>
                                <FaMagic className="mr-1" /> View Summary
                              </>
                            ) : (
                              <>
                                <FaMagic className="mr-1" /> Summarize
                              </>
                            )}
                          </button>
                        )}

                        {loadingSummaries[match.issue.id] && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FaSpinner className="animate-spin mr-2" /> Generating
                            summary...
                          </div>
                        )}

                        {summaries[match.issue.id] && (
                          <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">Summary:</p>
                            <p>{summaries[match.issue.id]}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <a
                            href={match.issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <FaGithub className="mr-1" /> View
                          </a>

                          <button
                            onClick={() => handleSchedule(match.issue)}
                            className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                            title="Schedule a meeting for this issue"
                          >
                            <FaCalendarPlus className="mr-1" /> Schedule
                          </button>
                        </div>

                        <button
                          onClick={() => handleStartContributing(match.issue)}
                          disabled={isContributing(match.issue.id) || contributingIssueId === match.issue.id}
                          className={`inline-flex items-center text-sm ${
                            isContributing(match.issue.id)
                              ? "text-green-600 cursor-not-allowed"
                              : contributingIssueId === match.issue.id
                              ? "text-gray-400 cursor-wait"
                              : "text-green-600 hover:text-green-800"
                          }`}
                          title={
                            isContributing(match.issue.id)
                              ? "Already in your contributions"
                              : contributingIssueId === match.issue.id
                              ? "Adding to contributions..."
                              : "Start contributing to this issue"
                          }
                        >
                          {isContributing(match.issue.id) ? (
                            <>
                              <FaHistory className="mr-1" /> Contributing
                            </>
                          ) : contributingIssueId === match.issue.id ? (
                            <>
                              <FaSpinner className="mr-1 animate-spin" /> Adding...
                            </>
                          ) : (
                            <>
                              <FaPlus className="mr-1" /> Contribute
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
                <FaExclamationCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-semibold text-gray-700 mb-2">
                  No recommendations found
                </h3>
                <p className="text-gray-500 mb-4">
                  We couldn't find matching issues. Try adding more skills to your profile
                  or connecting your GitHub account for better recommendations.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate("/profile")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Complete Your Profile
                  </button>
                  <button
                    onClick={fetchRecommendedIssues}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <FaSyncAlt className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:space-y-8">
          {/* Profile Summary */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Profile Summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-800">
                  {currentUser.email}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">GitHub</span>
                <span
                  className={`font-medium ${
                    userProfile?.githubConnected
                      ? "text-green-600"
                      : "text-blue-600"
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

              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600">Skills</span>
                <span className="text-gray-800">
                  {userProfile?.skills?.length > 0
                    ? `${userProfile.skills.length} added`
                    : "None added"}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/profile")}
              className="mt-6 w-full bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Edit Profile
            </button>
          </div>

          {/* Saved Issues */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Saved Issues</h2>
              {bookmarkedIssues.length > 0 && (
                <Link
                  to="/saved-issues"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
                    className="pb-3 border-b border-gray-100"
                  >
                    <h3 className="font-medium text-gray-800 mb-1 truncate">
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-start"
                      >
                        <FaGithub className="mr-2 text-gray-600 flex-shrink-0 mt-1" />
                        <span>{issue.title}</span>
                      </a>
                    </h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {issue.repository_name}
                      </span>
                      <span className="text-blue-600">Saved</span>
                    </div>
                  </div>
                ))}
                {bookmarkedIssues.length > 3 && (
                  <div className="pt-2 text-center">
                    <Link
                      to="/saved-issues"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View {bookmarkedIssues.length - 3} more
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <FaBookmark className="w-10 h-10 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">No saved issues yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Bookmark interesting issues to find them later
                </p>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Recent Activity
            </h2>

            {activeContributions.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {activeContributions.map((contribution) => (
                  <div
                    key={contribution.issueId}
                    className="pb-3 border-b border-gray-100"
                  >
                    <h3 className="font-medium text-gray-800 mb-1 truncate">
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
                      <span className="text-gray-600">
                        {contribution.repository}
                      </span>
                      <span className="text-blue-600">In Progress</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link
                    to="/my-contributions"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All Contributions
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <p className="text-gray-500 mb-4">No activity to show yet.</p>
                <p className="text-sm text-gray-400 mb-4">
                  Your GitHub activity will appear here once you start
                  contributing.
                </p>
                <Link
                  to="/github-issues"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
