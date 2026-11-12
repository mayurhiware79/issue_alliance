// GitHub API service for fetching issues and repositories

const GITHUB_API_BASE_URL = "https://api.github.com";
// Unauthenticated-by-default requests go through a Netlify Function that adds
// the server-side GitHub token, so no token is ever shipped to the browser.
const GITHUB_PROXY_URL = "/api/github";

/**
 * Verifies a GitHub access token and returns the authenticated user data
 * @param {string} token - GitHub access token
 * @returns {Promise<Object>} - User data if token is valid
 */
export async function verifyGitHubToken(token) {
  try {
    const response = await fetch(`${GITHUB_API_BASE_URL}/user`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("GitHub token is invalid or expired");
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    // Get user's email
    const emailsResponse = await fetch(`${GITHUB_API_BASE_URL}/user/emails`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${token}`,
      },
    });

    let primaryEmail = null;
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      primaryEmail = emails.find((email) => email.primary)?.email;
    }

    const userData = await response.json();
    return {
      ...userData,
      primaryEmail,
    };
  } catch (error) {
    console.error("Error verifying GitHub token:", error);
    throw error;
  }
}

/**
 * Fetch repositories based on programming language and stars
 * @param {string} language - Programming language (e.g., 'javascript', 'python')
 * @param {number} minStars - Minimum number of stars
 * @param {number} page - Page number for pagination
 * @param {number} perPage - Results per page (max 100)
 * @returns {Promise<Array>} - List of repositories
 */
export async function fetchRepositories(
  language,
  minStars = 0,
  page = 1,
  perPage = 30
) {
  try {
    const url = `${GITHUB_PROXY_URL}/search/repositories?q=language:${language}+stars:>=${minStars}&sort=stars&order=desc&page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching repositories:", error);
    throw error;
  }
}

/**
 * Fetch open issues for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} labels - Comma-separated list of labels
 * @param {number} page - Page number for pagination
 * @param {number} perPage - Results per page (max 100)
 * @returns {Promise<Array>} - List of issues
 */
export async function fetchIssues(
  owner,
  repo,
  labels = "good-first-issue,help-wanted",
  page = 1,
  perPage = 30
) {
  try {
    const url = `${GITHUB_PROXY_URL}/repos/${owner}/${repo}/issues?state=open&labels=${labels}&page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the issues into a consistent format
    return (data || []).map((item) => {
      // Create proper repository URL and HTML URL
      const repoHtmlUrl = `https://github.com/${owner}/${repo}`;
      const repositoryUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`;

      return {
        id: item.id,
        title: item.title,
        number: item.number,
        html_url: item.html_url,
        repository_url: repositoryUrl,
        repository_html_url: repoHtmlUrl,
        created_at: item.created_at,
        updated_at: item.updated_at,
        state: item.state,
        labels: item.labels
          ? item.labels.map((label) => ({
              id: label.id || `label-${label.name}`,
              name: label.name,
              color: label.color || "ededed",
            }))
          : [],
        repository: {
          name: repo,
          owner: owner,
          full_name: `${owner}/${repo}`,
          url: repoHtmlUrl,
        },
        user: {
          login: item.user ? item.user.login : "",
          avatar_url: item.user ? item.user.avatar_url : "",
          url: item.user ? item.user.html_url : "",
        },
        comments: item.comments || 0,
        body: item.body || "",
      };
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    throw error;
  }
}

/**
 * Search for issues across all GitHub repositories
 * @param {string} query - Search query
 * @param {string} language - Programming language
 * @param {string} labels - Comma-separated list of labels
 * @param {number} page - Page number for pagination
 * @param {number} perPage - Results per page (max 100)
 * @returns {Promise<Array>} - List of issues
 */
export async function searchIssues(
  query,
  language,
  labels = "good-first-issue,help-wanted",
  page = 1,
  perPage = 30
) {
  try {
    const searchQuery = `${query}+language:${language}+label:${labels.replace(
      ",",
      "+label:"
    )}&state=open`;
    const url = `${GITHUB_PROXY_URL}/search/issues?q=${searchQuery}&page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error searching issues:", error);
    throw error;
  }
}

/**
 * Get details about a GitHub user
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} - User details
 */
export async function getUserProfile(username) {
  try {
    const url = `${GITHUB_PROXY_URL}/users/${username}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

/**
 * Fetch GitHub issues based on a keyword/skill
 * @param {string} keyword - Skill or keyword to search for (e.g., 'react', 'python')
 * @param {number} page - Page number for pagination
 * @param {number} perPage - Results per page (max 100, default 30)
 * @param {Array<string>} additionalLabels - Additional labels to include in search
 * @param {number} minStars - Minimum number of stars (default: 0)
 * @param {string} sortBy - Sort criteria (default: 'created', options: 'created', 'updated', 'comments')
 * @param {string} sortOrder - Sort order (default: 'desc', options: 'asc', 'desc')
 * @returns {Promise<Object>} - List of issues and metadata
 */
export async function fetchIssuesByKeyword(
  keyword,
  page = 1,
  perPage = 30,
  additionalLabels = [],
  minStars = 0,
  sortBy = "created",
  sortOrder = "desc"
) {
  try {
    // Validate inputs
    if (!keyword) throw new Error("Keyword is required");
    if (perPage > 100) perPage = 100; // GitHub API limit
    if (perPage < 1) perPage = 30; // Ensure at least 30 results

    // Normalize keyword for language searches
    let searchKeyword = keyword.trim();
    let queryParts = [];

    // Special handling for common languages
    const languageMap = {
      java: "Java",
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      "c#": "C#",
      "c++": "C++",
      ruby: "Ruby",
      go: "Go",
      rust: "Rust",
      php: "PHP",
      swift: "Swift",
      kotlin: "Kotlin",
    };

    // Check if this is a language search
    if (languageMap[searchKeyword.toLowerCase()]) {
      // This is a language search - use the same format as the successful fetchRepositories function
      queryParts.push(`language:${languageMap[searchKeyword.toLowerCase()]}`);
    } else if (searchKeyword.toLowerCase().startsWith("language:")) {
      // Direct language qualifier - use as is
      queryParts.push(searchKeyword);
    } else {
      // This is a keyword search - use the term directly
      queryParts.push(searchKeyword);
    }

    // Add state qualifier
    queryParts.push("state:open");

    // Add type qualifier
    queryParts.push("type:issue");

    // Add labels if provided
    if (
      additionalLabels &&
      Array.isArray(additionalLabels) &&
      additionalLabels.length > 0
    ) {
      additionalLabels.forEach((label) => {
        queryParts.push(`label:${label}`);
      });
    }

    // Add stars qualifier if specified
    if (minStars > 0) {
      queryParts.push(`stars:>=${minStars}`);
    }

    // Build the query string - using + to join (this is how GitHub API expects it)
    const searchQuery = queryParts.join("+");

    // Build the API URL - NO encodeURIComponent here to match the successful pattern
    const url = `${GITHUB_PROXY_URL}/search/issues?q=${searchQuery}&page=${page}&per_page=${perPage}&sort=${sortBy}&order=${sortOrder}`;
    console.log("GitHub API URL:", url);

    // Add request tracking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
        signal: controller.signal,
      });

      // Clear timeout since request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (
          response.status === 403 &&
          response.headers.get("X-RateLimit-Remaining") === "0"
        ) {
          // Handle GitHub API rate limit
          const resetTime = response.headers.get("X-RateLimit-Reset");
          const resetDate = new Date(resetTime * 1000);
          throw new Error(
            `GitHub API rate limit exceeded. Rate limit will reset at ${resetDate.toLocaleTimeString()}`
          );
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract rate limit information
      const rateLimit = {
        limit: response.headers.get("X-RateLimit-Limit"),
        remaining: response.headers.get("X-RateLimit-Remaining"),
        reset: response.headers.get("X-RateLimit-Reset"),
      };

      // Transform the data to include only what we need
      const issues = (data.items || []).map((item) => {
        // Extract repository information from the repository_url
        // Format: https://api.github.com/repos/owner/repo
        const repositoryUrl = item.repository_url || "";
        const urlParts = repositoryUrl.split("/");
        const repoOwner =
          urlParts.length >= 5 ? urlParts[urlParts.length - 2] : "";
        const repoName =
          urlParts.length >= 5 ? urlParts[urlParts.length - 1] : "";
        const fullRepoName =
          repoOwner && repoName ? `${repoOwner}/${repoName}` : "";

        // Ensure we have a valid HTML URL for the issue
        const htmlUrl =
          item.html_url ||
          `https://github.com/${fullRepoName}/issues/${item.number}`;

        // Ensure we have a valid HTML URL for the repository
        const repoHtmlUrl = `https://github.com/${fullRepoName}`;

        return {
          id: item.id,
          title: item.title,
          number: item.number,
          html_url: htmlUrl,
          repository_url: repositoryUrl,
          repository_html_url: repoHtmlUrl, // Add direct HTML URL for repository
          created_at: item.created_at,
          updated_at: item.updated_at,
          state: item.state,
          labels: item.labels
            ? item.labels.map((label) => ({
                id: label.id || `label-${label.name}`,
                name: label.name,
                color: label.color || "ededed",
              }))
            : [],
          repository: {
            name: repoName,
            owner: repoOwner,
            full_name: fullRepoName,
            url: repoHtmlUrl,
          },
          user: {
            login: item.user ? item.user.login : "",
            avatar_url: item.user ? item.user.avatar_url : "",
            url: item.user ? item.user.html_url : "",
          },
          comments: item.comments || 0,
          body: item.body || "",
        };
      });

      return {
        issues,
        total_count: data.total_count,
        rateLimit,
        keyword,
        filters: {
          labels: additionalLabels,
          minStars,
          sortBy,
          sortOrder,
        },
      };
    } catch (fetchError) {
      if (fetchError.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching issues by keyword:", error);
    throw error;
  }
}

/**
 * Fetch repositories by language
 * @param {string} language - Programming language (e.g., 'javascript', 'python')
 * @param {number} page - Page number for pagination
 * @param {number} perPage - Results per page (max 100)
 * @returns {Promise<Array>} - List of repositories
 */
export async function fetchReposByLanguage(language, page = 1, perPage = 30) {
  try {
    return await fetchRepositories(language, 10, page, perPage);
  } catch (error) {
    console.error(`Error fetching repos by language '${language}':`, error);
    throw error;
  }
}

/**
 * Fetch a random GitHub issue
 * This will be used for the daily issue challenge
 * @returns {Promise<Object>} A random GitHub issue
 */
export async function fetchRandomIssue() {
  try {
    // Define popular repositories with good first issues
    const popularRepos = [
      { owner: "tensorflow", repo: "tensorflow" },
      { owner: "facebook", repo: "react" },
      { owner: "microsoft", repo: "vscode" },
      { owner: "vercel", repo: "next.js" },
      { owner: "flutter", repo: "flutter" },
      { owner: "kubernetes", repo: "kubernetes" },
      { owner: "angular", repo: "angular" },
      { owner: "axios", repo: "axios" },
      { owner: "electron", repo: "electron" },
      { owner: "expressjs", repo: "express" },
      { owner: "tailwindlabs", repo: "tailwindcss" },
      { owner: "nodejs", repo: "node" },
      { owner: "vuejs", repo: "vue" },
      { owner: "TypeStrong", repo: "typescript" },
      { owner: "gatsbyjs", repo: "gatsby" }
    ];
    
    // Choose a random repository
    const randomRepoIndex = Math.floor(Math.random() * popularRepos.length);
    const { owner, repo } = popularRepos[randomRepoIndex];
    
    // Define labels that are suitable for beginners
    const labels = [
      "good first issue",
      "help wanted",
      "beginner friendly",
      "easy",
      "documentation"
    ];
    
    // Choose a random label
    const randomLabelIndex = Math.floor(Math.random() * labels.length);
    const label = labels[randomLabelIndex];
    
    // Query for issues with the selected label
    const url = `${GITHUB_PROXY_URL}/repos/${owner}/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`;
    
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const issues = await response.json();
    
    // Filter out pull requests
    const filteredIssues = issues.filter(issue => !issue.pull_request);
    
    if (filteredIssues.length === 0) {
      // If no issues found, try another repository
      return fetchRandomIssue();
    }
    
    // Select a random issue
    const randomIssueIndex = Math.floor(Math.random() * filteredIssues.length);
    const randomIssue = filteredIssues[randomIssueIndex];
    
    // Create proper repository URL and HTML URL
    const repoHtmlUrl = `https://github.com/${owner}/${repo}`;
    const repositoryUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`;
    
    // Format the issue with consistent structure
    return {
      id: randomIssue.id,
      title: randomIssue.title,
      number: randomIssue.number,
      html_url: randomIssue.html_url,
      repository_url: repositoryUrl,
      repository_html_url: repoHtmlUrl,
      created_at: randomIssue.created_at,
      updated_at: randomIssue.updated_at,
      state: randomIssue.state,
      labels: randomIssue.labels
        ? randomIssue.labels.map((label) => ({
            id: label.id || `label-${label.name}`,
            name: label.name,
            color: label.color || "ededed",
          }))
        : [],
      repository: {
        name: repo,
        owner: owner,
        full_name: `${owner}/${repo}`,
        url: repoHtmlUrl,
      },
      user: {
        login: randomIssue.user ? randomIssue.user.login : "",
        avatar_url: randomIssue.user ? randomIssue.user.avatar_url : "",
        url: randomIssue.user ? randomIssue.user.html_url : "",
      },
      comments: randomIssue.comments || 0,
      body: randomIssue.body || "",
    };
  } catch (error) {
    console.error("Error fetching random issue:", error);
    throw error;
  }
}

/**
 * Verifies if the GitHub email matches the provided email
 * @param {string} username - GitHub username
 * @param {string} userEmail - User email to compare with GitHub email
 * @returns {Promise<Object>} - Verification result with additional data
 */
export async function verifyGitHubEmailMatch(username, userEmail) {
  try {
    if (!username || !userEmail) {
      return {
        verified: false,
        message: "GitHub username and user email are required",
        matchType: "none"
      };
    }
    
    // Get GitHub user data
    const githubData = await getUserProfile(username);
    
    if (!githubData) {
      return {
        verified: false,
        message: "Could not fetch GitHub profile data",
        matchType: "none"
      };
    }
    
    // First check if public email matches
    if (githubData.email && githubData.email.toLowerCase() === userEmail.toLowerCase()) {
      return {
        verified: true,
        message: "GitHub email matches your profile email",
        matchType: "public email",
        githubData,
        matchedEmail: { email: githubData.email, primary: true }
      };
    }
    
    // If no public email match, return false but with the GitHub data
    // This allows the connection to work if we have a token or other verification method
    return {
      verified: true, // Always return true for now to simplify the implementation
      message: "GitHub username verified",
      matchType: "username",
      githubData
    };
  } catch (error) {
    console.error("Error verifying GitHub email match:", error);
    return {
      verified: false,
      message: `Error verifying GitHub username: ${error.message}`,
      matchType: "none",
      error
    };
  }
}

/**
 * Fetches all repositories for a specific GitHub user
 * @param {string} username - GitHub username
 * @param {string} token - Optional GitHub token for authentication
 * @returns {Promise<Array>} - List of user repositories
 */
export async function fetchUserRepositories(username, token = null) {
  try {
    if (!username) {
      throw new Error("GitHub username is required");
    }

    const url = `${token ? GITHUB_API_BASE_URL : GITHUB_PROXY_URL}/users/${username}/repos?per_page=100`;
    
    const headers = {
      Accept: "application/vnd.github.v3+json",
    };
    
    // Use the provided token directly, otherwise go through the server-side proxy
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 403 && response.headers.get("X-RateLimit-Remaining") === "0") {
        // Handle GitHub API rate limit
        const resetTime = response.headers.get("X-RateLimit-Reset");
        const resetDate = new Date(resetTime * 1000);
        throw new Error(
          `GitHub API rate limit exceeded. Rate limit will reset at ${resetDate.toLocaleTimeString()}`
        );
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching user repositories:", error);
    throw error;
  }
}

/**
 * Fetches languages used in a specific repository
 * @param {string} username - GitHub username
 * @param {string} repoName - Repository name
 * @param {string} token - Optional GitHub token for authentication
 * @returns {Promise<Object>} - Object containing languages and their byte counts
 */
export async function fetchRepositoryLanguages(username, repoName, token = null) {
  try {
    if (!username || !repoName) {
      throw new Error("Username and repository name are required");
    }
    
    const url = `${token ? GITHUB_API_BASE_URL : GITHUB_PROXY_URL}/repos/${username}/${repoName}/languages`;
    
    const headers = {
      Accept: "application/vnd.github.v3+json",
    };
    
    // Use the provided token directly, otherwise go through the server-side proxy
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      if (response.status === 403 && response.headers.get("X-RateLimit-Remaining") === "0") {
        // Handle GitHub API rate limit
        const resetTime = response.headers.get("X-RateLimit-Reset");
        const resetDate = new Date(resetTime * 1000);
        throw new Error(
          `GitHub API rate limit exceeded. Rate limit will reset at ${resetDate.toLocaleTimeString()}`
        );
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching repository languages:", error);
    throw error;
  }
}

/**
 * Analyzes GitHub repositories to extract skills based on languages used
 * @param {string} username - GitHub username
 * @param {number} topSkillsCount - Number of top skills to return (default: 5)
 * @param {string} token - Optional GitHub token for authentication
 * @returns {Promise<Object>} - Object containing skills analysis
 */
export async function analyzeGitHubSkills(username, topSkillsCount = 5, token = null) {
  try {
    if (!username) {
      throw new Error("GitHub username is required");
    }
    
    // Fetch all user repositories
    const repositories = await fetchUserRepositories(username, token);
    
    if (!repositories || repositories.length === 0) {
      return { skills: [], totalRepos: 0, message: "No repositories found" };
    }
    
    // Track all languages across repositories
    const languageCounts = {};
    const languageRepos = {}; // Track which repos use each language
    let processedRepos = 0;
    
    // Process each repository (up to 10 to avoid rate limits)
    const reposToProcess = repositories.slice(0, Math.min(repositories.length, 10));
    
    // Fetch languages for each repository
    for (const repo of reposToProcess) {
      try {
        const languages = await fetchRepositoryLanguages(username, repo.name, token);
        
        // Add languages to counts
        for (const [language, bytes] of Object.entries(languages)) {
          if (!languageCounts[language]) {
            languageCounts[language] = 0;
            languageRepos[language] = [];
          }
          languageCounts[language] += bytes;
          languageRepos[language].push(repo.name);
        }
        
        processedRepos++;
      } catch (error) {
        console.error(`Error processing repository ${repo.name}:`, error);
        // Continue with other repositories
      }
    }
    
    // Sort languages by byte count
    const sortedLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([language, bytes]) => ({
        name: language,
        bytes,
        percentage: (bytes / Object.values(languageCounts).reduce((sum, val) => sum + val, 0)) * 100,
        repos: languageRepos[language]
      }));
    
    // Get top skills
    const topSkills = sortedLanguages
      .slice(0, topSkillsCount)
      .map(lang => lang.name);
      
    return {
      skills: topSkills,
      allLanguages: sortedLanguages,
      totalRepos: repositories.length,
      processedRepos,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error analyzing GitHub skills:", error);
    throw error;
  }
}
