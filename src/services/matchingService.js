import { embeddingService } from "./embeddingService";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  limit,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import {
  getUserProfile,
  fetchReposByLanguage,
  fetchIssuesByKeyword,
} from "./githubService";
import { auth } from "../firebase";

const SIMILARITY_THRESHOLD = 0.55; // Minimum similarity score to consider a match
const MAX_ISSUES_TO_FETCH = 200; // Maximum number of issues to retrieve from GitHub
const MAX_ISSUES_TO_PROCESS = 100; // Maximum number of issues to process with embeddings
const MAX_MATCHES_TO_RETURN = 25; // Maximum number of matches to return

/**
 * Main function to find matching issues for a specific user
 * @param {string} userId - Firebase user ID
 * @param {Object} options - Additional options (preferredLanguages, skillLevel, timeCommitment)
 * @returns {Promise<Array>} - Array of matching issues with similarity scores
 */
export const findMatchingIssuesForUser = async (userId, options = {}) => {
  try {
    console.log("Finding matching issues for user:", userId);

    // Fetch user profile data
    const userProfile = await fetchUserProfileData(userId);
    if (!userProfile) {
      // Create a minimal profile with default skills to avoid failing
      console.log("Creating minimal default profile for recommendations");
      const defaultProfile = {
        skills: ["javascript", "html", "css"], // Default skills
        contributions: [],
        savedIssues: [],
        chatHistory: [],
      };

      // Continue with this minimal profile instead of failing
      const userEmbedding = await generateUserEmbedding(defaultProfile);
      const issues = await fetchPotentialIssues(defaultProfile, options);
      const matchedIssues = await rankIssuesByRelevance(
        issues,
        userEmbedding,
        defaultProfile,
        options
      );
      return matchedIssues;
    }

    // Make sure we have a skills array
    if (!userProfile.skills || !Array.isArray(userProfile.skills)) {
      userProfile.skills = ["javascript", "html", "css"]; // Default if missing
    }

    // Generate user embeddings
    const userEmbedding = await generateUserEmbedding(userProfile);

    // Fetch potential issues based on user profile
    const issues = await fetchPotentialIssues(userProfile, options);

    // Calculate similarities using embeddings
    const matchedIssues = await rankIssuesByRelevance(
      issues,
      userEmbedding,
      userProfile,
      options
    );

    // Store matches for analytics - but don't let it fail the whole process
    try {
      await storeMatchResults(userId, matchedIssues);
    } catch (storageError) {
      console.warn(
        "Failed to store match results, but continuing:",
        storageError
      );
    }

    return matchedIssues;
  } catch (error) {
    console.error("Error finding matching issues:", error);

    // Return empty array instead of failing completely
    return [];
  }
};

/**
 * Fetch the user's profile data from Firestore
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} - User profile data
 */
async function fetchUserProfileData(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn("User document not found in Firestore");

      // Try to use local storage as a fallback
      const localUser = localStorage.getItem("user");
      if (localUser) {
        console.log("Using localStorage user data as fallback");
        const userData = JSON.parse(localUser);

        // Construct a minimal user profile from local storage data
        return {
          ...userData,
          skills: userData.skills || [],
          contributions: [],
          savedIssues: [],
          chatHistory: [],
        };
      }

      // Try to construct a minimal profile from auth data if available
      if (auth.currentUser) {
        console.log("Constructing minimal profile from auth data");
        return {
          displayName: auth.currentUser.displayName || "",
          email: auth.currentUser.email || "",
          githubUsername: "",
          skills: [],
          contributions: [],
          savedIssues: [],
          chatHistory: [],
        };
      }

      return null;
    }

    const userData = userSnap.data();

    // Store this data in localStorage for future fallback
    localStorage.setItem("user", JSON.stringify(userData));

    // Try to fetch user's contribution history, but make it optional
    let contributions = [];
    try {
      const contributionsQuery = query(
        collection(db, "contributions"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const contributionSnap = await getDocs(contributionsQuery);
      contributionSnap.forEach((doc) => {
        contributions.push({
          id: doc.id,
          ...doc.data(),
        });
      });
    } catch (error) {
      console.warn(
        "Error fetching contributions, proceeding with empty list:",
        error
      );
    }

    // Fetch saved issues, but make it optional
    let savedIssues = [];
    try {
      const savedIssuesQuery = query(
        collection(db, "savedIssues"),
        where("userId", "==", userId),
        orderBy("savedAt", "desc"),
        limit(20)
      );
      const savedIssuesSnap = await getDocs(savedIssuesQuery);
      savedIssuesSnap.forEach((doc) => {
        savedIssues.push({
          id: doc.id,
          ...doc.data(),
        });
      });
    } catch (error) {
      console.warn(
        "Error fetching saved issues, proceeding with empty list:",
        error
      );
    }

    // Fetch chat history, but make it optional
    let chatHistory = [];
    try {
      const chatHistoryQuery = query(
        collection(db, "chatHistory"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const chatHistorySnap = await getDocs(chatHistoryQuery);
      chatHistorySnap.forEach((doc) => {
        chatHistory.push(doc.data().message);
      });
    } catch (error) {
      console.warn(
        "Error fetching chat history, proceeding with empty list:",
        error
      );
    }

    // Return enriched user profile
    return {
      ...userData,
      contributions,
      savedIssues,
      chatHistory,
    };
  } catch (error) {
    console.error("Error fetching user profile data:", error);

    // Try to use local storage as a fallback in case of any error
    const localUser = localStorage.getItem("user");
    if (localUser) {
      console.log("Using localStorage user data as fallback after error");
      const userData = JSON.parse(localUser);

      // Construct a minimal user profile from local storage data
      return {
        ...userData,
        skills: userData.skills || [],
        contributions: [],
        savedIssues: [],
        chatHistory: [],
      };
    }

    return null;
  }
}

/**
 * Generate a rich embedding for the user based on their profile, skills, and history
 * @param {Object} userProfile - User profile data
 * @returns {Promise<Array>} - User embedding vector
 */
async function generateUserEmbedding(userProfile) {
  try {
    // Create a rich description of the user from their profile data
    const userDescriptionParts = [];

    // Add skills with high importance (repeated for emphasis)
    if (userProfile.skills && userProfile.skills.length > 0) {
      userDescriptionParts.push(`Expert in: ${userProfile.skills.join(", ")}`);
      userDescriptionParts.push(`Skilled at: ${userProfile.skills.join(", ")}`);
    }

    // Add bio
    if (userProfile.bio) {
      userDescriptionParts.push(`Bio: ${userProfile.bio}`);
    }

    // Add contributions from history
    if (userProfile.contributions && userProfile.contributions.length > 0) {
      const contributionTexts = userProfile.contributions.map(
        (contrib) =>
          `Contributed to: ${contrib.repositoryName} - ${contrib.issueTitle}`
      );
      userDescriptionParts.push(contributionTexts.join(". "));
    }

    // Add saved issues
    if (userProfile.savedIssues && userProfile.savedIssues.length > 0) {
      const savedIssueTexts = userProfile.savedIssues.map(
        (issue) => `Interested in: ${issue.title} (${issue.labels.join(", ")})`
      );
      userDescriptionParts.push(savedIssueTexts.join(". "));
    }

    // Add chat history context
    if (userProfile.chatHistory && userProfile.chatHistory.length > 0) {
      const relevantMessages = userProfile.chatHistory
        .filter((msg) => msg.length > 10) // Filter out very short messages
        .slice(0, 5); // Take only the most recent 5 messages

      if (relevantMessages.length > 0) {
        userDescriptionParts.push(
          `Recent interests: ${relevantMessages.join(". ")}`
        );
      }
    }

    // Combine all parts into a rich user description
    const userDescription = userDescriptionParts.join("\n");

    // Generate the embedding
    return await embeddingService.generateEmbedding(userDescription);
  } catch (error) {
    console.error("Error generating user embedding:", error);
    // Return a zero embedding if there's an error (fallback)
    return await embeddingService.generateEmbedding("developer");
  }
}

/**
 * Fetch potential issues from GitHub based on user profile
 * @param {Object} userProfile - User profile data
 * @param {Object} options - Additional filtering options
 * @returns {Promise<Array>} - Array of potential issues
 */
async function fetchPotentialIssues(userProfile, options) {
  try {
    const issues = [];
    const trackedQueries = new Set(); // Track queries to avoid duplicates

    // Step 1: Get issues based on user's skills
    if (userProfile.skills && userProfile.skills.length > 0) {
      // Take all skills, not just top 3
      const mainSkills = userProfile.skills;

      for (const skill of mainSkills) {
        // Try both with and without good-first-issue label
        const skillQueries = [
          `${skill} label:good-first-issue language:${skill}`,
          `${skill} is:issue is:open language:${skill}`,
          `${skill} label:help-wanted language:${skill}`,
        ];

        for (const skillQuery of skillQueries) {
          if (trackedQueries.has(skillQuery)) continue;
          trackedQueries.add(skillQuery);

          try {
            // Properly call fetchIssuesByKeyword with all required parameters
            const skillIssues = await fetchIssuesByKeyword(
              skillQuery,
              1, // page
              30, // perPage
              [], // additionalLabels
              0, // minStars
              "created", // sortBy
              "desc" // sortOrder
            );

            if (skillIssues && skillIssues.issues) {
              issues.push(...skillIssues.issues);
            }
          } catch (err) {
            console.warn(`Error fetching issues for skill ${skill}:`, err);
          }
        }
      }
    }

    // Step 2: If we don't have enough issues yet, get issues based on contribution history
    if (
      issues.length < MAX_ISSUES_TO_FETCH &&
      userProfile.contributions &&
      userProfile.contributions.length > 0
    ) {
      // Extract repository names from contribution history
      const contributedRepos = [
        ...new Set(
          userProfile.contributions.map((contrib) => contrib.repositoryName)
        ),
      ];

      // Get issues from repos the user has contributed to
      for (const repoName of contributedRepos) {
        try {
          const repoQuery = `repo:${repoName} is:issue is:open`;
          if (trackedQueries.has(repoQuery)) continue;
          trackedQueries.add(repoQuery);

          const repoIssues = await fetchIssuesByKeyword(
            repoQuery,
            1, // page
            30, // perPage
            [], // additionalLabels
            0, // minStars
            "created", // sortBy
            "desc" // sortOrder
          );

          if (repoIssues && repoIssues.issues) {
            issues.push(...repoIssues.issues);
          }
        } catch (err) {
          console.warn(`Error fetching issues for repo ${repoName}:`, err);
          // Continue with other repos
        }
      }
    }

    // Step 3: If we still don't have enough issues, get popular issues with different labels
    if (issues.length < MAX_ISSUES_TO_FETCH) {
      const popularQueries = [
        "is:issue is:open label:good-first-issue sort:reactions",
        "is:issue is:open label:help-wanted sort:comments",
        "is:issue is:open label:beginner-friendly sort:created",
        "is:issue is:open label:easy sort:updated",
      ];

      for (const popularQuery of popularQueries) {
        if (trackedQueries.has(popularQuery)) continue;
        trackedQueries.add(popularQuery);

        try {
          const popularIssues = await fetchIssuesByKeyword(
            popularQuery,
            1, // page
            30, // perPage
            [], // additionalLabels
            0, // minStars
            "reactions", // sortBy
            "desc" // sortOrder
          );

          if (popularIssues && popularIssues.issues) {
            issues.push(...popularIssues.issues);
          }
        } catch (err) {
          console.warn(
            `Error fetching popular issues with query ${popularQuery}:`,
            err
          );
        }
      }
    }

    // Step 4: If user has specified preferred languages, prioritize those issues
    if (options.preferredLanguages && options.preferredLanguages.length > 0) {
      const languageIssues = [];

      for (const language of options.preferredLanguages) {
        const langQuery = `language:${language} is:issue is:open label:help-wanted`;
        if (trackedQueries.has(langQuery)) continue;
        trackedQueries.add(langQuery);

        try {
          const langIssues = await fetchIssuesByKeyword(
            langQuery,
            1, // page
            30, // perPage
            [], // additionalLabels
            0, // minStars
            "created", // sortBy
            "desc" // sortOrder
          );

          if (langIssues && langIssues.issues) {
            languageIssues.push(...langIssues.issues);
          }
        } catch (err) {
          console.warn(`Error fetching issues for language ${language}:`, err);
        }
      }

      // Add these at the beginning since they're higher priority
      issues.unshift(...languageIssues);
    }

    // Step 5: Add skill-level specific issues
    if (options.skillLevel) {
      let skillLevelQuery = "";

      switch (options.skillLevel) {
        case "beginner":
          skillLevelQuery =
            "is:issue is:open label:good-first-issue label:beginner";
          break;
        case "intermediate":
          skillLevelQuery =
            "is:issue is:open label:help-wanted -label:good-first-issue";
          break;
        case "advanced":
          skillLevelQuery =
            "is:issue is:open label:enhancement -label:good-first-issue -label:beginner";
          break;
      }

      if (skillLevelQuery && !trackedQueries.has(skillLevelQuery)) {
        trackedQueries.add(skillLevelQuery);

        try {
          const skillLevelIssues = await fetchIssuesByKeyword(
            skillLevelQuery,
            1, // page
            40, // perPage - more for this category
            [], // additionalLabels
            0, // minStars
            "created", // sortBy
            "desc" // sortOrder
          );

          if (skillLevelIssues && skillLevelIssues.issues) {
            // Add at the beginning since these are highly relevant to the user's skill level
            issues.unshift(...skillLevelIssues.issues);
          }
        } catch (err) {
          console.warn(
            `Error fetching issues for skill level ${options.skillLevel}:`,
            err
          );
        }
      }
    }

    // Remove duplicates by issue URL
    const uniqueIssues = Array.from(
      new Map(issues.map((issue) => [issue.html_url, issue])).values()
    );

    console.log(`Fetched ${uniqueIssues.length} unique issues to process`);

    // Limit to prevent too many embedding operations
    return uniqueIssues.slice(0, MAX_ISSUES_TO_PROCESS);
  } catch (error) {
    console.error("Error fetching potential issues:", error);
    return [];
  }
}

/**
 * Rank issues by relevance to the user using embedding similarities
 * @param {Array} issues - Array of potential issues
 * @param {Array} userEmbedding - User embedding vector
 * @param {Object} userProfile - User profile data
 * @param {Object} options - Additional options for ranking
 * @returns {Promise<Array>} - Array of ranked issues with similarity scores
 */
async function rankIssuesByRelevance(
  issues,
  userEmbedding,
  userProfile,
  options
) {
  try {
    if (!issues || issues.length === 0) {
      return [];
    }

    // Step 1: Format issues into candidates for embedding comparison
    const candidates = issues.map((issue) => {
      // Create a rich description that includes title, body, and labels
      const description = [
        `Title: ${issue.title}`,
        `Description: ${issue.body || ""}`,
        `Labels: ${issue.labels?.map((label) => label.name).join(", ") || ""}`,
        `Repository: ${
          issue.repository_url?.split("/").slice(-2).join("/") || ""
        }`,
      ].join("\n");

      return {
        text: description,
        title: issue.title,
        originalIssue: issue,
      };
    });

    // Step 2: Find matches using the embedding service
    const matches = await embeddingService.findMatches(
      "", // Empty query because we're using the user embedding directly
      candidates,
      MAX_MATCHES_TO_RETURN
    );

    // Step 3: Calculate additional relevance factors (beyond embedding similarity)
    const enhancedMatches = matches.map((match) => {
      const issue = match.candidate.originalIssue;

      // Start with the embedding similarity score
      let finalScore = match.score;

      // Boost score for issues that match user's skills
      if (userProfile.skills && userProfile.skills.length > 0) {
        const issueText = `${issue.title} ${issue.body || ""} ${
          issue.labels?.map((l) => l.name).join(" ") || ""
        }`.toLowerCase();

        for (const skill of userProfile.skills) {
          if (issueText.includes(skill.toLowerCase())) {
            finalScore += 0.1; // Boost by 0.1 for each matched skill
          }
        }
      }

      // Adjust score based on issue complexity and user's skill level
      if (options.skillLevel && issue.labels) {
        const labels = issue.labels.map((l) => l.name.toLowerCase());

        if (
          options.skillLevel === "beginner" &&
          (labels.includes("good-first-issue") ||
            labels.includes("beginner-friendly"))
        ) {
          finalScore += 0.15;
        } else if (
          options.skillLevel === "intermediate" &&
          labels.includes("intermediate")
        ) {
          finalScore += 0.15;
        } else if (
          options.skillLevel === "advanced" &&
          (labels.includes("advanced") || labels.includes("complex"))
        ) {
          finalScore += 0.15;
        }
      }

      // Boost score for repositories the user has previously contributed to
      if (userProfile.contributions && userProfile.contributions.length > 0) {
        const repoName = issue.repository_url?.split("/").slice(-2).join("/");

        if (
          repoName &&
          userProfile.contributions.some((c) => c.repositoryName === repoName)
        ) {
          finalScore += 0.2; // Significant boost for familiar repositories
        }
      }

      // Consider time commitment if specified
      if (options.timeCommitment && issue.labels) {
        const labels = issue.labels.map((l) => l.name.toLowerCase());

        if (
          options.timeCommitment === "quick" &&
          (labels.includes("quick-fix") || labels.includes("easy"))
        ) {
          finalScore += 0.1;
        } else if (
          options.timeCommitment === "medium" &&
          labels.includes("enhancement")
        ) {
          finalScore += 0.1;
        } else if (
          options.timeCommitment === "significant" &&
          labels.includes("feature")
        ) {
          finalScore += 0.1;
        }
      }

      // Cap score at 1.0
      finalScore = Math.min(finalScore, 1.0);

      return {
        issue: issue,
        score: finalScore,
        matchReason: computeMatchReason(issue, userProfile),
      };
    });

    // Step 4: Filter out low-scoring matches and sort by final score
    return enhancedMatches
      .filter((match) => match.score >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_MATCHES_TO_RETURN);
  } catch (error) {
    console.error("Error ranking issues by relevance:", error);
    return [];
  }
}

/**
 * Compute a human-readable reason for why this issue matches the user
 * @param {Object} issue - GitHub issue
 * @param {Object} userProfile - User profile
 * @returns {string} - Human-readable match reason
 */
function computeMatchReason(issue, userProfile) {
  const reasons = [];

  // Check if issue matches any of the user's skills
  if (userProfile.skills && userProfile.skills.length > 0) {
    const issueText = `${issue.title} ${issue.body || ""} ${
      issue.labels?.map((l) => l.name).join(" ") || ""
    }`.toLowerCase();

    const matchedSkills = userProfile.skills.filter((skill) =>
      issueText.includes(skill.toLowerCase())
    );

    if (matchedSkills.length > 0) {
      reasons.push(`Matches your skills: ${matchedSkills.join(", ")}`);
    }
  }

  // Check if it's from a repository the user has contributed to
  if (userProfile.contributions && userProfile.contributions.length > 0) {
    const repoName = issue.repository_url?.split("/").slice(-2).join("/");

    if (
      repoName &&
      userProfile.contributions.some((c) => c.repositoryName === repoName)
    ) {
      reasons.push(`From a repository you've contributed to: ${repoName}`);
    }
  }

  // Check for beginner-friendly tags
  if (
    issue.labels &&
    issue.labels.some((label) =>
      ["good-first-issue", "beginner-friendly", "easy"].includes(
        label.name.toLowerCase()
      )
    )
  ) {
    reasons.push("Marked as beginner-friendly");
  }

  // Default reason if nothing specific matches
  if (reasons.length === 0) {
    reasons.push("Matches your overall profile");
  }

  return reasons.join(". ");
}

/**
 * Store match results for analytics purposes
 * @param {string} userId - User ID
 * @param {Array} matchedIssues - Array of matched issues
 */
async function storeMatchResults(userId, matchedIssues) {
  try {
    if (!userId || !matchedIssues || matchedIssues.length === 0) {
      return;
    }

    // Create a simplified record of the matching session
    const matchRecord = {
      userId,
      timestamp: Timestamp.now(),
      matchCount: matchedIssues.length,
      topMatches: matchedIssues.slice(0, 5).map((match) => ({
        issueUrl: match.issue.html_url,
        repositoryUrl: match.issue.repository_url,
        score: match.score,
        matchReason: match.matchReason,
      })),
    };

    // Store in Firestore
    await addDoc(collection(db, "issueMatches"), matchRecord);
  } catch (error) {
    console.error("Error storing match results:", error);
    // Don't prevent the main function from completing
  }
}

/**
 * Evaluate a single issue against user profile for one-off matching
 * @param {Object} issue - GitHub issue to evaluate
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Matching score and reason
 */
export const evaluateIssueForUser = async (issue, userId) => {
  try {
    // Get user profile
    const userProfile = await fetchUserProfileData(userId);
    if (!userProfile) {
      return {
        score: 0,
        matchReason: "Unable to analyze: No user profile found",
      };
    }

    // Generate user embedding
    const userEmbedding = await generateUserEmbedding(userProfile);

    // Create a candidate for the issue
    const issueCandidate = {
      text: `Title: ${issue.title}\nDescription: ${issue.body || ""}\nLabels: ${
        issue.labels?.map((label) => label.name).join(", ") || ""
      }`,
      title: issue.title,
      originalIssue: issue,
    };

    // Get embedding for the issue
    const issueEmbedding = await embeddingService.generateEmbedding(
      issueCandidate.text
    );

    // Calculate similarity
    const similarity = embeddingService.cosineSimilarity(
      userEmbedding,
      issueEmbedding
    );

    // Compute human-readable reason
    const matchReason = computeMatchReason(issue, userProfile);

    return {
      score: similarity,
      matchReason,
    };
  } catch (error) {
    console.error("Error evaluating issue for user:", error);
    return { score: 0, matchReason: "Unable to analyze due to an error" };
  }
};
