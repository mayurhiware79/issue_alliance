import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { findMatchingIssuesForUser } from "../services/matchingService";
import { saveIssue, removeSavedIssue } from "../services/savedIssuesService";
import { Link, useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaSpinner,
  FaExclamationCircle,
  FaTag,
  FaBookmark,
  FaStar,
  FaCodeBranch,
  FaCalendarAlt,
  FaComment,
  FaLink,
  FaArrowRight,
  FaUserCircle,
  FaCode,
  FaSearch,
  FaListUl,
  FaLightbulb,
  FaCheckCircle,
  FaMagic,
  FaPlus,
  FaCalendarPlus,
  FaHistory,
  FaTimes,
  FaSync,
} from "react-icons/fa";
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { fetchReposByLanguage, fetchIssues } from "../services/githubService";
import { trackIssueInRepository } from "../services/repositoryService";
import { generateIssueSummary } from "../services/geminiService";

function PersonalizedIssues() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  const [matchedIssues, setMatchedIssues] = useState([]);
  const [allMatchedIssues, setAllMatchedIssues] = useState([]); // Store all fetched issues
  const [visibleCount, setVisibleCount] = useState(10); // Number of issues to show initially
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // For "Load More" button
  const [error, setError] = useState(null);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState("all");
  const [selectedTimeCommitment, setSelectedTimeCommitment] = useState("all");
  const [bookmarkedIssues, setBookmarkedIssues] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState({});
  const [contributingIssueId, setContributingIssueId] = useState(null);
  const [activeContributions, setActiveContributions] = useState([]);

  // New state for tracking loading stages
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingStages = [
    { icon: FaUserCircle, text: "Analyzing your profile and skills..." },
    { icon: FaCode, text: "Finding repositories that match your expertise..." },
    { icon: FaSearch, text: "Searching for relevant open issues..." },
    { icon: FaListUl, text: "Filtering issues by difficulty and scope..." },
    { icon: FaLightbulb, text: "Calculating best matches for your skills..." },
    { icon: FaCheckCircle, text: "Finalizing personalized recommendations..." },
  ];

  // New useEffect to load bookmarked issues
  useEffect(() => {
    const loadBookmarkedIssues = async () => {
      if (!currentUser) return;

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

    loadBookmarkedIssues();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setError("Please log in to see personalized issue recommendations.");
      return;
    }

    // Start the loading animation sequence
    setLoadingStage(0);
    const loadingInterval = setInterval(() => {
      setLoadingStage((prev) => {
        if (prev < loadingStages.length - 1) return prev + 1;
        return prev;
      });
    }, 1500); // Transition to next stage every 1.5 seconds

    const fetchPersonalizedIssues = async (refetch = false) => {
      try {
        setLoading(true);
        setError(null);

        // Create options object for personalization
        const options = {
          skillLevel:
            selectedSkillLevel !== "all" ? selectedSkillLevel : undefined,
          timeCommitment:
            selectedTimeCommitment !== "all"
              ? selectedTimeCommitment
              : undefined,
        };

        // Try to load user profile from localStorage as a fallback
        if (!localStorage.getItem("user") && currentUser) {
          try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              localStorage.setItem("user", JSON.stringify(userSnap.data()));
            }
          } catch (e) {
            console.warn("Failed to pre-load user profile to localStorage:", e);
          }
        }

        // Fetch matched issues using the matching service
        const issues = await findMatchingIssuesForUser(
          currentUser.uid,
          options
        );

        if (!issues || issues.length === 0) {
          console.log(
            "No matched issues found, falling back to popular repositories"
          );

          // If no matches found, try to get some generic good first issues
          try {
            const language = "javascript"; // Default to JavaScript as a fallback
            const repos = await fetchReposByLanguage(language, 1, 5);

            if (repos && repos.length > 0) {
              // Find issues for these repos
              const fallbackIssues = [];

              for (const repo of repos) {
                try {
                  const repoOwner = repo.owner.login;
                  const repoName = repo.name;
                  const issuesForRepo = await fetchIssues(
                    repoOwner,
                    repoName,
                    "good-first-issue,help-wanted",
                    1,
                    10
                  );

                  if (issuesForRepo && issuesForRepo.length > 0) {
                    // Format these to match the expected structure
                    const formattedIssues = issuesForRepo.map((issue) => ({
                      issue: {
                        ...issue,
                        // Make sure these fields are present
                        repository_html_url:
                          issue.repository_html_url ||
                          `https://github.com/${repoOwner}/${repoName}`,
                        repository: {
                          ...issue.repository,
                          full_name:
                            issue.repository?.full_name ||
                            `${repoOwner}/${repoName}`,
                          url:
                            issue.repository?.url ||
                            `https://github.com/${repoOwner}/${repoName}`,
                        },
                      },
                      score: 0.5, // Medium match score
                      matchReason:
                        "Popular repository with beginner-friendly issues",
                    }));

                    fallbackIssues.push(...formattedIssues);
                  }
                } catch (repoError) {
                  console.warn(
                    `Failed to fetch issues for repo ${repo.full_name}:`,
                    repoError
                  );
                }
              }

              if (fallbackIssues.length > 0) {
                setAllMatchedIssues(fallbackIssues);
                setMatchedIssues(fallbackIssues.slice(0, visibleCount));
                setInitialLoadComplete(true);
                return;
              }
            }
          } catch (fallbackError) {
            console.warn("Failed to fetch fallback issues:", fallbackError);
          }
        }

        // Store all matched issues
        setAllMatchedIssues(issues || []);

        // Only display first batch initially
        setMatchedIssues((issues || []).slice(0, visibleCount));
        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Error fetching personalized issues:", error);
        setError(
          "Failed to load personalized recommendations. We're showing popular issues instead."
        );

        // Try to get some generic good first issues as a fallback
        try {
          const language = "javascript"; // Default to JavaScript as a fallback
          const repos = await fetchReposByLanguage(language, 1, 5);

          if (repos && repos.length > 0) {
            // Find issues for these repos
            const fallbackIssues = [];

            for (const repo of repos) {
              try {
                const repoOwner = repo.owner.login;
                const repoName = repo.name;
                const issuesForRepo = await fetchIssues(
                  repoOwner,
                  repoName,
                  "good-first-issue,help-wanted",
                  1,
                  10
                );

                if (issuesForRepo && issuesForRepo.length > 0) {
                  // Format these to match the expected structure
                  const formattedIssues = issuesForRepo.map((issue) => ({
                    issue: {
                      ...issue,
                      // Make sure these fields are present
                      repository_html_url:
                        issue.repository_html_url ||
                        `https://github.com/${repoOwner}/${repoName}`,
                      repository: {
                        ...issue.repository,
                        full_name:
                          issue.repository?.full_name ||
                          `${repoOwner}/${repoName}`,
                        url:
                          issue.repository?.url ||
                          `https://github.com/${repoOwner}/${repoName}`,
                      },
                    },
                    score: 0.5, // Medium match score
                    matchReason:
                      "Popular repository with beginner-friendly issues",
                  }));

                  fallbackIssues.push(...formattedIssues);
                }
              } catch (repoError) {
                console.warn(
                  `Failed to fetch issues for repo ${repo.full_name}:`,
                  repoError
                );
              }
            }

            if (fallbackIssues.length > 0) {
              setAllMatchedIssues(fallbackIssues);
              setMatchedIssues(fallbackIssues.slice(0, visibleCount));
              setInitialLoadComplete(true);
              return;
            }
          }
        } catch (fallbackError) {
          console.warn("Failed to fetch fallback issues:", fallbackError);
        }
      } finally {
        setLoading(false);
        clearInterval(loadingInterval); // Stop the loading animation
      }
    };

    // Call the function to fetch issues
    fetchPersonalizedIssues();

    return () => {
      clearInterval(loadingInterval); // Clean up interval on component unmount
    };
  }, [currentUser, selectedSkillLevel, selectedTimeCommitment]);

  // Load more issues
  const handleLoadMore = () => {
    setLoadingMore(true);

    // Simulate a slight delay for better UX
    setTimeout(() => {
      const nextBatch = allMatchedIssues.slice(0, visibleCount + 10);
      setMatchedIssues(nextBatch);
      setVisibleCount(visibleCount + 10);
      setLoadingMore(false);
    }, 500);
  };

  // Handle bookmarking an issue
  const handleToggleBookmark = async (issue) => {
    if (!currentUser) return;

    try {
      // Check if already bookmarked
      const isAlreadyBookmarked = bookmarkedIssues.some(
        (bookmarked) => bookmarked.issueId === issue.id
      );

      if (isAlreadyBookmarked) {
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
          repository_name: issue.repository?.full_name,
          userId: currentUser.uid,
          savedAt: new Date(),
        };

        setBookmarkedIssues([...bookmarkedIssues, newBookmark]);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  // Format date to a readable format
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

  // Check if an issue is bookmarked
  const isBookmarked = (issueId) => {
    return bookmarkedIssues.some((issue) => issue.issueId === issueId);
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

  // Fetch user contributions
  useEffect(() => {
    const fetchUserContributions = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const contributionHistory = userData.contributionHistory || [];
          const activeContribs = contributionHistory.filter(item => item.status === "in_progress");
          setActiveContributions(activeContribs);
        }
      } catch (error) {
        console.error("Error fetching contributions:", error);
      }
    };

    fetchUserContributions();
  }, [currentUser]);

  // Start contributing to an issue
  const handleStartContributing = async (issue) => {
    if (!currentUser) {
      navigate("/login", { state: { from: "/personalized-issues" } });
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

  // Fix the refetch functionality
  const handleApplyFilters = () => {
    setInitialLoadComplete(false);
    setMatchedIssues([]);
    setLoading(true);
    // Create a new function to handle refetching
    const fetchWithNewFilters = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create options object for personalization
        const options = {
          skillLevel:
            selectedSkillLevel !== "all" ? selectedSkillLevel : undefined,
          timeCommitment:
            selectedTimeCommitment !== "all"
              ? selectedTimeCommitment
              : undefined,
        };

        // Fetch matched issues using the matching service
        const issues = await findMatchingIssuesForUser(
          currentUser.uid,
          options
        );

        // Store all matched issues
        setAllMatchedIssues(issues || []);

        // Only display first batch initially
        setMatchedIssues((issues || []).slice(0, visibleCount));
        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Error fetching personalized issues:", error);
        setError(
          "Failed to load personalized recommendations. We're showing popular issues instead."
        );
        // ... existing fallback logic ...
      } finally {
        setLoading(false);
      }
    };

    fetchWithNewFilters();
  };

  if (loading && !initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        {/* Loading animation */}
        <div className="flex flex-col items-center justify-center py-10">
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
                  width: `${((loadingStage + 1) / loadingStages.length) * 100}%`,
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
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between mb-8 items-start gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Personalized Issue Recommendations</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            These GitHub issues match your skills and preferences.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Filters */}
          <div className={`p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow flex flex-col sm:flex-row gap-3`}>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Skill Level
              </label>
              <select
                value={selectedSkillLevel}
                onChange={(e) => setSelectedSkillLevel(e.target.value)}
                className={`rounded-md text-sm border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500'
                } p-2 w-full`}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Time Commitment
              </label>
              <select
                value={selectedTimeCommitment}
                onChange={(e) => setSelectedTimeCommitment(e.target.value)}
                className={`rounded-md text-sm border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500'
                } p-2 w-full`}
              >
                <option value="all">Any Time</option>
                <option value="small">Small (1-2 hours)</option>
                <option value="medium">Medium (3-6 hours)</option>
                <option value="large">Large (7+ hours)</option>
              </select>
            </div>
            <button
              onClick={handleApplyFilters}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm self-end ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <FaSpinner className="animate-spin mr-2" /> Searching...
                </div>
              ) : (
                "Apply Filters"
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={`${isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'} p-4 rounded-md mb-6`}>
          <p>{error}</p>
        </div>
      )}

      {!initialLoadComplete && !error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-full max-w-md">
            {/* Loading animation similar to above */}
            {/* ... */}
          </div>
        </div>
      ) : matchedIssues.length === 0 && !loading ? (
        <div className={`text-center py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl`}>
          <FaExclamationCircle className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-300'} mb-4`} />
          <h3 className={`text-xl font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>No matching issues found</h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} max-w-sm mx-auto mb-6`}>
            Try adjusting your skill filters or preferences to find more issues.
          </p>
          <button
            onClick={() => {
              setSelectedSkillLevel("all");
              setSelectedTimeCommitment("all");
              setInitialLoadComplete(false);
              setMatchedIssues([]);
              setLoading(true);
              handleApplyFilters();
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaSync className="mr-2" /> Reset Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {matchedIssues.map((match, index) => (
              <div 
                key={match.issue.id || index}
                className={`border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md`}
              >
                {/* Issue header */}
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} hover:text-blue-500 transition-colors`}>
                      <a
                        href={match.issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-start"
                      >
                        <FaGithub className={`mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0 mt-1`} />
                        <span className="line-clamp-2">{match.issue.title}</span>
                      </a>
                    </h3>
                    <button
                      onClick={() => handleToggleBookmark(match.issue)}
                      className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} hover:text-blue-500 focus:outline-none transition-colors`}
                      aria-label={isBookmarked(match.issue.id) ? "Remove bookmark" : "Bookmark this issue"}
                    >
                      <FaBookmark
                        className={isBookmarked(match.issue.id) ? "text-blue-500" : ""}
                        size={18}
                      />
                    </button>
                  </div>

                  {/* Repository info and metadata */}
                  <div className={`mt-2 flex flex-wrap items-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <a
                      href={
                        match.issue.repository_html_url ||
                        `https://github.com/${match.issue.repository?.full_name || ""}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'} mr-3 mb-1`}
                    >
                      <FaCodeBranch className="inline mr-1" />
                      {match.issue.repository?.full_name ||
                        match.issue.repository_url?.split("/").slice(-2).join("/")}
                    </a>
                    <span className="flex items-center mr-3 mb-1">
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
                </div>

                {/* Issue body & matching info */}
                <div className="p-4">
                  {/* Match score */}
                  <div className={`${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'} rounded-lg px-3 py-2 mb-3 flex items-center text-sm`}>
                    <span className="font-medium mr-2">Match:</span>
                    <div className={`w-20 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.round(match.score * 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">
                      {Math.round(match.score * 100)}%
                    </span>
                  </div>

                  {/* Match reason */}
                  {match.matchReason && (
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                      <p className="line-clamp-2">{match.matchReason}</p>
                    </div>
                  )}

                  {/* Labels */}
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

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={match.issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      View Issue
                    </a>
                    <button
                      onClick={() => handleSchedule(match.issue)}
                      className={`px-3 py-1.5 ${
                        isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      } rounded-lg text-sm font-medium transition-colors`}
                    >
                      <FaCalendarPlus className="inline mr-1" /> Schedule
                    </button>
                    <button
                      onClick={() => handleStartContributing(match.issue)}
                      className={`${
                        isContributing(match.issue.id)
                          ? isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800'
                          : isDarkMode ? 'bg-purple-900/40 text-purple-200' : 'bg-purple-100 text-purple-800'
                      } px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}
                      disabled={isContributing(match.issue.id)}
                    >
                      {isContributing(match.issue.id) ? (
                        <>
                          <FaCheckCircle className="inline mr-1" /> Contributing
                        </>
                      ) : (
                        <>
                          <FaCodeBranch className="inline mr-1" /> Start Contributing
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load more button */}
          {allMatchedIssues.length > visibleCount && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                className={`px-4 py-2 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                } rounded-md font-medium flex items-center mx-auto`}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" /> Loading...
                  </>
                ) : (
                  <>
                    <FaArrowRight className="mr-2" /> Load More
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PersonalizedIssues;
