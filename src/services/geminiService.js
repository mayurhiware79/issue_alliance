import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI client
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("Gemini API Key available:", !!API_KEY);

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generate a brief summary of an issue using Gemini AI
 * @param {Object} issue - The GitHub issue object
 * @returns {Promise<string>} - The generated summary
 */
export async function generateIssueSummary(issue) {
  try {
    if (!API_KEY) {
      throw new Error(
        "Gemini API key is not configured. Please check your .env file."
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Safely extract repository information
    let repositoryInfo = "Unknown Repository";
    if (issue.repository) {
      if (typeof issue.repository === "object" && issue.repository.full_name) {
        repositoryInfo = issue.repository.full_name;
      } else if (typeof issue.repository === "string") {
        repositoryInfo = issue.repository;
      }
    } else if (issue.repository_name) {
      repositoryInfo = issue.repository_name;
    } else if (issue.repository_url) {
      // Extract repository name from URL if available
      const urlParts = issue.repository_url.split("/");
      if (urlParts.length >= 2) {
        repositoryInfo = `${urlParts[urlParts.length - 2]}/${
          urlParts[urlParts.length - 1]
        }`;
      }
    }

    // Safely extract labels
    let labelsText = "No labels";
    if (issue.labels && Array.isArray(issue.labels)) {
      if (issue.labels.length > 0) {
        labelsText = issue.labels
          .map((label) => (typeof label === "object" ? label.name : label))
          .join(", ");
      }
    }

    const prompt = `Please provide a brief, concise summary of this GitHub issue in 2-3 sentences:
    Title: ${issue.title || "Untitled Issue"}
    Description: ${issue.body || "No description provided"}
    Labels: ${labelsText}
    Repository: ${repositoryInfo}`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    console.log("Received summary from Gemini:", summary);

    return summary;
  } catch (error) {
    console.error("Error generating issue summary:", error);
    return `Error: ${
      error.message || "Unable to generate summary at this time."
    }`;
  }
}

/**
 * Service for generating and processing quiz questions using Google Gemini API
 */

// Mock questions for now - to be replaced with actual API calls
const mockQuestions = {
  javascript: [
    {
      question: "What does 'use strict' do in JavaScript?",
      options: [
        "Enforces stricter parsing and error handling",
        "Makes the code run faster",
        "Declares variables without the need for var/let/const",
        "Enables deprecated features"
      ],
      correctAnswer: 0
    },
    // More questions in VerifySkillModal.jsx
  ],
  // More languages in VerifySkillModal.jsx
  c: [
    {
      question: "Which of these is NOT a valid data type in C?",
      options: ["int", "float", "string", "char"],
      correctAnswer: 2
    }
  ],
  "c++": [
    {
      question: "What feature differentiates C++ from C?",
      options: [
        "Pointers",
        "Object-oriented programming",
        "Procedural programming",
        "Memory allocation"
      ],
      correctAnswer: 1
    }
  ],
  java: [
    {
      question: "Which of these is the correct way to create a single-dimensional array in Java?",
      options: [
        "int[5] array;",
        "array int[5];",
        "int array[5];",
        "int[] array = new int[5];"
      ],
      correctAnswer: 3
    }
  ],
  mongodb: [
    {
      question: "What type of database is MongoDB?",
      options: [
        "Relational database",
        "Document-oriented NoSQL database",
        "Graph database",
        "Columnar database"
      ],
      correctAnswer: 1
    }
  ],
  flask: [
    {
      question: "What is Flask in Python?",
      options: [
        "A database ORM",
        "A web framework",
        "A testing framework",
        "A data analysis library"
      ],
      correctAnswer: 1
    }
  ],
  flutter: [
    {
      question: "What programming language is used to develop Flutter applications?",
      options: ["JavaScript", "Java", "Kotlin", "Dart"],
      correctAnswer: 3
    }
  ],
  r: [
    {
      question: "What is R primarily used for?",
      options: [
        "Web development",
        "Mobile app development",
        "Statistical computing and graphics",
        "Game development"
      ],
      correctAnswer: 2
    }
  ]
};

/**
 * Generate skill verification questions using Google Gemini
 * @param {string} skill - The programming skill to generate questions for
 * @param {number} count - Number of questions to generate (default: 5)
 * @returns {Promise<Array>} - Array of question objects
 */
export async function generateSkillQuestions(skill, count = 5) {
  try {
    // Check if we should use the API or mock data
    const useAPI = import.meta.env.VITE_GEMINI_API_KEY && false; // Set to true when ready to use the API
    
    if (useAPI) {
      // Commented out for now - Implement with actual Gemini API when ready
      /*
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Generate ${count} multiple-choice questions to test someone's knowledge of ${skill} programming.
        
        Each question should:
        1. Test a fundamental concept in ${skill}
        2. Have 4 possible answers with only 1 correct answer
        3. Range from beginner to intermediate difficulty
        
        Return the result as a JSON array with this structure:
        [
          {
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0  // Index of the correct answer (0-3)
          }
        ]
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from the response
      try {
        // Extract JSON from the text (in case it's wrapped in code blocks)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          
          // Validate the structure
          const validQuestions = questions.filter(q => 
            q.question && 
            Array.isArray(q.options) && 
            q.options.length === 4 && 
            typeof q.correctAnswer === 'number' &&
            q.correctAnswer >= 0 && 
            q.correctAnswer <= 3
          );
          
          return validQuestions.slice(0, count);
        }
      } catch (jsonError) {
        console.error("Error parsing JSON from Gemini response:", jsonError);
        throw new Error("Failed to generate valid questions");
      }
      */
      
      // Fallback to mock data if API fails
      return getMockQuestions(skill, count);
    } else {
      // Use mock data
      return getMockQuestions(skill, count);
    }
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    // Fallback to basic questions if everything fails
    return getBasicQuestions(skill, count);
  }
}

/**
 * Get mock questions for a skill
 * @param {string} skill - Skill name
 * @param {number} count - Number of questions
 * @returns {Array} - Array of question objects
 */
function getMockQuestions(skill, count) {
  const normalizedSkill = skill.toLowerCase();
  const questionSet = mockQuestions[normalizedSkill];
  
  if (questionSet && questionSet.length >= count) {
    // If we have enough questions for this skill, return a random selection
    return getRandomSelection(questionSet, count);
  } else {
    // Otherwise, return generic programming questions
    return getBasicQuestions(skill, count);
  }
}

/**
 * Get basic programming questions that can be used for any skill
 * @param {string} skill - Skill name to insert into questions
 * @param {number} count - Number of questions
 * @returns {Array} - Array of question objects
 */
function getBasicQuestions(skill, count) {
  // Basic questions that can be adapted to any programming skill
  const basicQuestions = [
    {
      question: `Which best describes the purpose of ${skill}?`,
      options: [
        "Creating instructions for computers to follow",
        "Designing user interfaces",
        "Managing database systems",
        "Network configuration"
      ],
      correctAnswer: 0
    },
    {
      question: `What is a function in ${skill}?`,
      options: [
        "A type of variable",
        "A reusable block of code that performs a specific task",
        "A database connection",
        "An error message"
      ],
      correctAnswer: 1
    },
    {
      question: `What is debugging in ${skill}?`,
      options: [
        "Writing documentation",
        "The process of finding and fixing errors in code",
        "Creating new features",
        "Optimizing code performance"
      ],
      correctAnswer: 1
    },
    {
      question: `How would you describe ${skill} to a beginner?`,
      options: [
        "A markup language for creating web pages",
        "A programming language for solving problems",
        "A database management system",
        "An operating system"
      ],
      correctAnswer: 1
    },
    {
      question: `What is the typical development environment for ${skill}?`,
      options: [
        "A text editor or IDE (Integrated Development Environment)",
        "A spreadsheet program",
        "A graphic design tool",
        "A web browser"
      ],
      correctAnswer: 0
    }
  ];
  
  return getRandomSelection(basicQuestions, count);
}

/**
 * Get a random selection of items from an array
 * @param {Array} array - The array to select from
 * @param {number} count - Number of items to select
 * @returns {Array} - Selected items
 */
function getRandomSelection(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generate a creative leaderboard rank description for LinkedIn sharing
 * @param {string} username - The username to include in the description
 * @param {number} rank - The user's rank on the leaderboard
 * @param {number} points - The user's points
 * @returns {Promise<Object>} - The generated description and hashtags
 */
export async function generateLeaderboardDescription(username, rank = 1, points = 100) {
  try {
    if (!API_KEY) {
      throw new Error(
        "Gemini API key is not configured. Please check your .env file."
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Generate a creative and enthusiastic description for a LinkedIn post about a user's achievement on the IssueAlliance open source platform.
    
    Details about IssueAlliance:
    - It's a platform that matches developers with open source projects
    - It helps developers find GitHub issues that match their skills
    - It gamifies open source contributions with points, badges, and leaderboards
    - It's built to promote open source collaboration
    
    User details:
    - Username: ${username || "OpenSourceDev"}
    - Rank on leaderboard: ${rank}
    - Points earned: ${points}
    
    Please generate:
    1. A short, impressive description (2-3 sentences) celebrating their achievement
    2. 3-5 relevant emojis that fit the theme of tech, coding, open source, and achievements
    3. 5-7 relevant hashtags (including #IssueAlliance, #OpenSource, and #GitHub)
    
    Format the response as a JSON object with these keys: description, emojis, hashtags
    
    Ensure all hashtags have the # symbol prefixed and no spaces between words.
    Also, make sure "IssueAlliance" has this exact capitalization in the hashtag.
    `;

    console.log("Sending leaderboard description prompt to Gemini");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Try to parse the response as JSON
      let parsedResponse = JSON.parse(text);
      console.log("Successfully parsed Gemini response as JSON");
      
      // Ensure IssueAlliance hashtag is included and properly formatted
      const hasIssueAlliance = parsedResponse.hashtags.toLowerCase().includes('#issuealliance');
      if (!hasIssueAlliance) {
        parsedResponse.hashtags = "#IssueAlliance " + parsedResponse.hashtags;
      } else {
        // Replace any variation with the correct capitalization
        parsedResponse.hashtags = parsedResponse.hashtags.replace(
          /#issuealliance/i, 
          "#IssueAlliance"
        );
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.warn("Failed to parse Gemini response as JSON, using fallback extraction:", parseError);
      
      // If parsing fails, try to extract the parts from the text
      const fallbackResponse = {
        description: text.match(/description["\s:]+([^"]+)/i)?.[1] || 
                    `Congratulations to ${username || "our contributor"} for achieving rank #${rank} on the IssueAlliance leaderboard with ${points} points! Making a significant impact in the open source community!`,
        
        emojis: text.includes("emoji") ? 
                text.match(/emoji["\s:]+([^"]+)/i)?.[1] || "🏆 🚀 💻 ✨ 🌟" :
                "🏆 🚀 💻 ✨ 🌟",
        
        hashtags: text.includes("hashtag") ? 
                  text.match(/hashtag["\s:]+([^"]+)/i)?.[1] || "#IssueAlliance #OpenSource #GitHub #WebDev #Coding" :
                  "#IssueAlliance #OpenSource #GitHub #WebDev #Coding"
      };
      
      return fallbackResponse;
    }
  } catch (error) {
    console.error("Error generating leaderboard description:", error);
    
    // Return fallback content
    return {
      description: `Congratulations to ${username || "our contributor"} for achieving rank #${rank} on the IssueAlliance leaderboard with ${points} points! Making waves in the open source community!`,
      emojis: "🏆 🚀 💻 ✨ 🌟",
      hashtags: "#IssueAlliance #OpenSource #GitHub #WebDev #Coding"
    };
  }
}

export default {
  generateIssueSummary,
  generateSkillQuestions,
  generateLeaderboardDescription
};
