import React, { useState, useEffect } from "react";
import { fetchIssuesByKeyword } from "../services/githubService";
import { trackIssueInRepository } from "../services/repositoryService";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FaGithub,
  FaSearch,
  FaSpinner,
  FaStar,
  FaCodeBranch,
  FaExclamationCircle,
  FaTag,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaLink,
  FaCalendarAlt,
  FaComment,
  FaMagic,
  FaUserAlt,
  FaChartLine,
  FaHistory,
  FaBookmark,
  FaPlus,
  FaCalendarPlus,
  FaTimes,
} from "react-icons/fa";
import { useDebounce } from "../hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { generateIssueSummary } from "../services/geminiService";
import {
  saveIssue,
  removeSavedIssue,
  getSavedIssues,
} from "../services/savedIssuesService";

function GitHubIssuesFetcher() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [rateLimit, setRateLimit] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [additionalLabels, setAdditionalLabels] = useState([]);
  const [minStars, setMinStars] = useState(0);
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [showUserSkills, setShowUserSkills] = useState(false);
  const [bookmarkedIssues, setBookmarkedIssues] = useState([]);
  const [contributionHistory, setContributionHistory] = useState([]);
  const [matchingBySkills, setMatchingBySkills] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userRights, setUserRights] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState({});
  const [contributingIssueId, setContributingIssueId] = useState(null);
  const [currentSearchId, setCurrentSearchId] = useState(null);

  // Debounce the keyword to avoid making too many requests
  const debouncedKeyword = useDebounce(keyword, 500);

  // Fetch user data on component mount
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      setLoadingUserData(true);
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Set user skills from Firestore
          setUserSkills(userData.skills || []);
          // Set bookmarked issues
          setBookmarkedIssues(userData.bookmarkedIssues || []);
          // Set contribution history
          setContributionHistory(userData.contributionHistory || []);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Store skill search in Firebase
  const storeSkillSearch = async (skills) => {
    if (!currentUser || !skills || skills.length === 0) return null;

    try {
      // Create a unique ID for this search session
      const searchSessionId = `${currentUser.uid}-${Date.now()}`;

      // Create the search document
      const searchRef = doc(db, "skillSearches", searchSessionId);

      await setDoc(searchRef, {
        userId: currentUser.uid,
        skills: skills,
        timestamp: Timestamp.now(),
        resultsCount: null, // Will be updated when results come back
      });

      return searchSessionId;
    } catch (err) {
      console.error("Error storing skill search:", err);
      // Don't stop execution if this fails
      return null;
    }
  };

  // Update search results count in Firebase
  const updateSearchResultsCount = async (searchId, count) => {
    if (!searchId || !currentUser) return;

    try {
      const searchRef = doc(db, "skillSearches", searchId);
      const searchDoc = await getDoc(searchRef);

      if (searchDoc.exists()) {
        await updateDoc(searchRef, {
          resultsCount: count || 0,
        });
      } else {
        console.warn(
          `Search document ${searchId} does not exist. Creating a new one.`
        );

        // Create the search document if it doesn't exist
        try {
          await setDoc(searchRef, {
            userId: currentUser.uid,
            skills: userSkills || [],
            timestamp: Timestamp.now(),
            resultsCount: count || 0,
          });
        } catch (createErr) {
          console.error("Error creating search document:", createErr);
        }
      }
    } catch (err) {
      console.error("Error updating search results count:", err);
      // Silent failure - don't impact user experience
    }
  };

  // Handle using user skills for search
  const handleUseMySkills = async () => {
    if (userSkills.length === 0) {
      navigate("/profile", { state: { showSkillsSection: true } });
      return;
    }

    // Check if we have multiple skills to combine
    if (userSkills.length > 1) {
      // Create a search query that combines up to 3 skills
      const skillsToUse = userSkills.slice(0, 3);
      const combinedSkills = skillsToUse.join(" OR ");
      setKeyword(combinedSkills);
    } else {
      // Use the only skill available
      setKeyword(userSkills[0]);
    }

    // Reset any filters that might interfere with results
    setAdditionalLabels([]);
    setMinStars(0);

    setMatchingBySkills(true);

    // Store this search in Firebase for tracking
    if (currentUser) {
      const searchId = await storeSkillSearch(userSkills);
      // Store the search ID in component state
      if (searchId) {
        setCurrentSearchId(searchId);
      }
    }
  };

  // Handle saving/unsaving an issue
  const handleSaveIssue = async (issue) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      // Log the issue object to see its structure
      console.log("Issue to save:", issue);

      const isCurrentlySaved = bookmarkedIssues.some(
        (saved) => saved.issueId === issue.id
      );

      if (isCurrentlySaved) {
        // Remove from saved issues
        const savedIssue = bookmarkedIssues.find(
          (saved) => saved.issueId === issue.id
        );
        await removeSavedIssue(savedIssue.id);
        setBookmarkedIssues(
          bookmarkedIssues.filter((saved) => saved.issueId !== issue.id)
        );
      } else {
        // Save the issue
        const savedIssueId = await saveIssue(issue, currentUser.uid);

        // Get the URL (GitHub API sometimes returns html_url instead of url)
        const issueUrl = issue.url || issue.html_url || "";

        // Create a new saved issue object with the correct structure
        const newSavedIssue = {
          id: savedIssueId,
          issueId: issue.id,
          title: issue.title || "",
          url: issueUrl,
          state: issue.state || "open",
          created_at: issue.created_at || new Date().toISOString(),
          repository_url: issue.repository_url || "",
          repository_name: issue.repository?.full_name || "",
          labels: issue.labels || [],
          savedAt: new Date(),
        };

        // Update the bookmarkedIssues state immediately
        setBookmarkedIssues((prev) => [...prev, newSavedIssue]);
      }
    } catch (error) {
      console.error("Error saving/removing issue:", error);
      // Show error message to user
      setError(
        `Failed to ${isCurrentlySaved ? "remove" : "save"} issue: ${error.message
        }`
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch saved issues when component mounts
  useEffect(() => {
    const fetchSavedIssues = async () => {
      if (!currentUser) return;

      try {
        const savedIssues = await getSavedIssues(currentUser.uid);
        setBookmarkedIssues(savedIssues);
      } catch (error) {
        console.error("Error fetching saved issues:", error);
      }
    };

    fetchSavedIssues();
  }, [currentUser]);

  // Add to contribution history
  const handleStartContributing = async (issue) => {
    if (!currentUser) {
      navigate("/login", { state: { from: "/github-issues" } });
      return;
    }

    try {
      // Log the issue object to better understand its structure
      console.log("Missing required issue properties: ", issue);

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
            url: issueUrl, // Use the url we determined above
            repository: issue.repository?.full_name || "",
            repositoryUrl: issue.repository?.full_name
              ? `https://github.com/${issue.repository.full_name}`
              : "",
            startedAt: new Date().toISOString(),
            status: "in_progress",
          };

          updatedHistory.push(contributionData);
          setContributionHistory(updatedHistory);

          // Create valid update object - ensure no undefined values
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

          // Show success message or navigate
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

  // Fetch issues when the debounced keyword or filters change
  useEffect(() => {
    if (!debouncedKeyword) {
      setIssues([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);

    let searchSessionId = currentSearchId;

    if (matchingBySkills && currentUser && !searchSessionId) {
      // Create a search session ID for tracking if we don't have one yet
      storeSkillSearch(userSkills).then(id => {
        if (id) setCurrentSearchId(id);
      });
    }

    fetchIssuesByKeyword(
      debouncedKeyword,
      1,
      30,
      additionalLabels,
      minStars,
      sortBy,
      sortOrder
    )
      .then((data) => {
        setIssues(data.issues);
        setTotalCount(data.total_count);
        setRateLimit(data.rateLimit);
        setHasMore(data.issues.length < data.total_count);
        setPage(1);

        // Store the search results in Firebase if matching by skills
        if (matchingBySkills && currentUser && searchSessionId) {
          updateSearchResultsCount(searchSessionId, data.total_count);
        }

        // If we got fewer than 30 results and more exist, automatically load more
        if (data.issues.length < 30 && data.issues.length < data.total_count) {
          loadMoreResults(debouncedKeyword, 2, data.issues);
        }
      })
      .catch((err) => {
        setError(err.message);
        setIssues([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    debouncedKeyword,
    additionalLabels,
    minStars,
    sortBy,
    sortOrder,
    currentUser,
    matchingBySkills,
  ]);

  // Function to load more results to achieve at least 30
  const loadMoreResults = (keyword, nextPage, currentIssues) => {
    fetchIssuesByKeyword(
      keyword,
      nextPage,
      30,
      additionalLabels,
      minStars,
      sortBy,
      sortOrder
    )
      .then((data) => {
        const combinedIssues = [...currentIssues, ...data.issues];
        setIssues(combinedIssues);
        setHasMore(combinedIssues.length < data.total_count);
        setPage(nextPage);

        // If we still don't have 30 results and more exist, load another page
        if (
          combinedIssues.length < 30 &&
          combinedIssues.length < data.total_count &&
          nextPage < 3
        ) {
          loadMoreResults(keyword, nextPage + 1, combinedIssues);
        }
      })
      .catch((err) => {
        console.error("Error loading more results:", err);
        // Don't update state on error, keep what we already have
      });
  };

  // Load more results button handler
  const handleLoadMore = () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    setLoading(true);

    fetchIssuesByKeyword(
      debouncedKeyword,
      nextPage,
      30,
      additionalLabels,
      minStars,
      sortBy,
      sortOrder
    )
      .then((data) => {
        setIssues((prevIssues) => [...prevIssues, ...data.issues]);
        setHasMore(issues.length + data.issues.length < data.total_count);
        setPage(nextPage);
        setRateLimit(data.rateLimit);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Check if an issue is bookmarked
  const isBookmarked = (issueId) => {
    return bookmarkedIssues.some((item) => item.issueId === issueId);
  };

  // Check if an issue is in contribution history
  const isContributing = (issueId) => {
    return contributionHistory.some((item) => item.issueId === issueId);
  };

  // Toggle a label in the additionalLabels array
  const toggleLabel = (label) => {
    setAdditionalLabels((prevLabels) => {
      if (prevLabels.includes(label)) {
        return prevLabels.filter((l) => l !== label);
      } else {
        return [...prevLabels, label];
      }
    });
  };

  // Set the minimum stars
  const handleMinStarsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setMinStars(isNaN(value) ? 0 : value);
  };

  // Set the sort criteria
  const handleSortByChange = (value) => {
    setSortBy(value);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "desc" ? "asc" : "desc"));
  };

  // Format a date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setAdditionalLabels([]);
    setMinStars(0);
    setSortBy("created");
    setSortOrder("desc");
  };

  const handleGenerateSummary = async (issue) => {
    if (summaries[issue.id]) return; // Don't regenerate if we already have a summary

    setLoadingSummaries((prev) => ({ ...prev, [issue.id]: true }));
    try {
      console.log("Generating summary for issue:", issue.id);

      const summary = await generateIssueSummary(issue);
      console.log("Summary generated:", summary);

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

  const handleSchedule = (issue) => {
    try {
      // Navigate to the schedule meeting page with the issue data
      navigate("/schedule-meeting", { state: { issue } });
    } catch (error) {
      console.error("Error preparing to schedule:", error);
      alert("Failed to prepare scheduling. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
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
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
            <FaGithub className="mr-2" /> GitHub Issues
          </h1>

          {/* Search Input */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search for open source issues..."
                    className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <button
                onClick={handleUseMySkills}
                className={`px-4 py-2 rounded-lg flex items-center whitespace-nowrap ${matchingBySkills
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  } transition-colors`}
                title={
                  userSkills.length === 0
                    ? "Add skills in your profile first"
                    : "Find issues matching your skills"
                }
              >
                <FaMagic className="mr-2" />
                {loadingUserData
                  ? "Loading..."
                  : userSkills.length === 0
                    ? "Add Skills"
                    : "Match My Skills"}
              </button>
            </div>
          </div>

          {/* Skill Tags */}
          {userSkills.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowUserSkills(!showUserSkills)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 flex items-center"
              >
                <FaUserAlt className="mr-1" />
                {showUserSkills ? "Hide My Skills" : "Show My Skills"}
              </button>

              {showUserSkills && (
                <div className="flex flex-wrap gap-2 py-2">
                  {userSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        setKeyword(skill);
                        setMatchingBySkills(true);
                      }}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Filter Toggle Button */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <FaFilter className="mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsGridView(false)}
                className={`p-2 rounded ${!isGridView ? "bg-blue-100 text-blue-700" : "text-gray-500"
                  }`}
                title="List view"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsGridView(true)}
                className={`p-2 rounded ${isGridView ? "bg-blue-100 text-blue-700" : "text-gray-500"
                  }`}
                title="Grid view"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                {/* Labels Filter */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Filter by labels:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setAdditionalLabels([])}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${additionalLabels.length === 0
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      <FaTag className="inline mr-1" />
                      All
                    </button>
                    {[
                      "good-first-issue",
                      "help-wanted",
                      "bug",
                      "documentation",
                      "enhancement",
                      "hacktoberfest",
                    ].map((label) => (
                      <button
                        key={label}
                        onClick={() => toggleLabel(label)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${additionalLabels.includes(label)
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        <FaTag className="inline mr-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stars Filter */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Minimum stars:
                  </p>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={minStars}
                      onChange={handleMinStarsChange}
                      className="w-full md:w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <FaStar className="ml-2 text-yellow-400" />
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Sort by:
                  </p>
                  <div className="flex items-center space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortByChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="created">Created Date</option>
                      <option value="updated">Updated Date</option>
                      <option value="comments">Comments</option>
                    </select>
                    <button
                      onClick={toggleSortOrder}
                      className="p-2 border border-gray-300 rounded-lg"
                      title={
                        sortOrder === "desc"
                          ? "Descending order"
                          : "Ascending order"
                      }
                    >
                      {sortOrder === "desc" ? (
                        <FaSortAmountDown />
                      ) : (
                        <FaSortAmountUp />
                      )}
                    </button>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          {debouncedKeyword && !loading && !error && (
            <div className="mb-4">
              <p className="text-gray-700">
                Found <span className="font-bold">{totalCount}</span> issues
                matching "{debouncedKeyword}"
                {matchingBySkills && userSkills.includes(debouncedKeyword) && (
                  <span className="ml-2 text-blue-600">
                    <FaMagic className="inline mr-1" /> Matching your skills
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center my-8">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
            </div>
          )}

          {/* Issues List or Grid */}
          {issues.length > 0 && (
            <div
              className={
                isGridView
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-blue-600 mb-1">
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {issue.title}
                      </a>
                    </h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      #{issue.number}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <FaCodeBranch className="mr-1" />
                    <a
                      href={`https://github.com/${issue.repository.full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {issue.repository.full_name}
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {issue.labels.map((label) => (
                      <span
                        key={label.name}
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: `#${label.color}20`,
                          color: `#${label.color}`,
                          border: `1px solid #${label.color}`,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center">
                      <img
                        src={issue.user.avatar_url}
                        alt={issue.user.login}
                        className="w-5 h-5 rounded-full mr-1"
                      />
                      <a
                        href={issue.user.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        @{issue.user.login}
                      </a>
                    </div>
                    <span title={new Date(issue.created_at).toLocaleString()}>
                      <FaCalendarAlt className="inline mr-1" />
                      {formatDate(issue.created_at)}
                    </span>
                  </div>

                  {/* Summary Section */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {!summaries[issue.id] && !loadingSummaries[issue.id] && (
                      <button
                        onClick={() => handleGenerateSummary(issue)}
                        className={`inline-flex items-center text-sm ${loadingSummaries[issue.id]
                            ? "text-gray-400 cursor-wait"
                            : "text-purple-600 hover:text-purple-800"
                          }`}
                        disabled={loadingSummaries[issue.id]}
                      >
                        {loadingSummaries[issue.id] ? (
                          <>
                            <FaSpinner className="mr-1 animate-spin" /> Summarizing...
                          </>
                        ) : summaries[issue.id] ? (
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

                    {loadingSummaries[issue.id] && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FaSpinner className="animate-spin mr-2" /> Generating
                        summary...
                      </div>
                    )}

                    {summaries[issue.id] && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Summary:</p>
                        <p>{summaries[issue.id]}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <FaGithub className="mr-1" /> View
                      </a>

                      <button
                        onClick={() => handleSaveIssue(issue)}
                        className={`inline-flex items-center text-sm ${isBookmarked(issue.id)
                            ? "text-yellow-600 hover:text-yellow-700"
                            : "text-gray-600 hover:text-gray-800"
                          }`}
                        title={
                          isBookmarked(issue.id)
                            ? "Remove from bookmarks"
                            : "Save for later"
                        }
                      >
                        <FaBookmark className="mr-1" />{" "}
                        {isBookmarked(issue.id) ? "Saved" : "Save"}
                      </button>

                      <button
                        onClick={() => handleSchedule(issue)}
                        className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                        title="Schedule a meeting for this issue"
                      >
                        <FaCalendarPlus className="mr-1" /> Schedule
                      </button>
                    </div>

                    <button
                      onClick={() => handleStartContributing(issue)}
                      disabled={isContributing(issue.id) || contributingIssueId === issue.id}
                      className={`inline-flex items-center text-sm ${isContributing(issue.id)
                          ? "text-green-600 cursor-not-allowed"
                          : contributingIssueId === issue.id
                            ? "text-gray-400 cursor-wait"
                            : "text-green-600 hover:text-green-800"
                        }`}
                      title={
                        isContributing(issue.id)
                          ? "Already in your contributions"
                          : contributingIssueId === issue.id
                            ? "Adding to contributions..."
                            : "Start contributing to this issue"
                      }
                    >
                      {isContributing(issue.id) ? (
                        <>
                          <FaHistory className="mr-1" /> Contributing
                        </>
                      ) : contributingIssueId === issue.id ? (
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
          )}

          {/* Load More Button */}
          {issues.length > 0 && hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <FaSpinner className="animate-spin inline mr-1" />
                ) : null}
                Load More
              </button>
            </div>
          )}

          {/* No Results */}
          {debouncedKeyword && !loading && !error && issues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                <FaExclamationCircle className="text-gray-400 text-3xl" />
              </div>
              <p className="text-lg font-medium">
                No issues found matching your criteria.
              </p>
              <p className="text-sm mt-2">
                Try adjusting your search terms, reducing the minimum stars, or
                removing some label filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Initial State */}
          {!debouncedKeyword && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                <FaSearch className="text-gray-400 text-3xl" />
              </div>
              <p className="text-lg font-medium">
                Enter a keyword above to search for GitHub issues
              </p>
              <p className="text-sm mt-2">
                Search for programming languages, frameworks, or technologies to
                find relevant open source issues
              </p>
              {userSkills.length > 0 && (
                <button
                  onClick={handleUseMySkills}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaMagic className="inline mr-2" />
                  Match My Skills
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GitHubIssuesFetcher;
