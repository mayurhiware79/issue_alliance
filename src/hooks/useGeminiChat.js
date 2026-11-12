import { useState, useEffect, useCallback } from "react";
import { generateGeminiText } from "../services/geminiClient";

const MODEL_NAME = "gemini-3.5-flash";

export const useGeminiChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Update chat history whenever messages change - ensure it's in the correct format for Gemini API
    const history = messages.map((msg) => {
      // Format differs based on whether the message is from user or model
      if (msg.sender === "user") {
        return {
          role: "user",
          parts: [{ text: msg.text }],
        };
      } else {
        // Handle messages from bot - ensure text is always a string
        const textContent =
          typeof msg.text === "string" ? msg.text : JSON.stringify(msg.text); // Convert complex objects to strings

        return {
          role: "model",
          parts: [{ text: textContent }],
        };
      }
    });

    setChatHistory(history);
  }, [messages]);

  const sendMessage = useCallback(
    async (inputText, recommendedResponse = null) => {
      if (!inputText.trim()) return;

      const userMessage = {
        id: Date.now(),
        text: inputText,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        if (recommendedResponse) {
          // For predefined responses, preserve the structure for formatted rendering
          const botMessage = {
            id: Date.now() + 1,
            text: recommendedResponse, // Keep the original structure
            sender: "bot",
            timestamp: new Date(),
            isFormatted: true, // Add a flag to indicate this is a formatted message
          };

          setMessages((prev) => [...prev, botMessage]);
        } else {
          // Prepare the standard prompt to include with user query
          const standardPrompt = `You are IssueAlliance AI, a helpful assistant integrated into the "Open Source Contribution Matchmaker" platform. This platform helps developers find and contribute to GitHub open-source issues matched to their skills.

STRICT FORMATTING RULES — follow these exactly, no exceptions:
- NEVER return JSON, arrays, or object literals under any circumstances.
- Always respond in plain readable text using simple markdown:
  - Use **bold** for emphasis on key terms.
  - Use bullet points (- item) for lists.
  - Use numbered lists (1. item) for steps.
  - Use short paragraphs separated by blank lines.
- Keep responses concise and friendly. 2-4 short paragraphs max unless the topic requires more detail.
- Do NOT wrap your answer in code blocks or backticks.

Your areas of expertise:
1. IssueAlliance platform features (issue matching, badges, leaderboards, contribution tracking)
2. How the matching algorithm works (GitHub APIs, Firebase Auth, ML models)
3. Open-source contribution workflows (PRs, code reviews, git conventions)
4. General programming and software development questions

User query: ${inputText}`;

          // Send the message and get a response
          const botResponse = await generateGeminiText(
            [...chatHistory, { role: "user", parts: [{ text: standardPrompt }] }],
            {
              model: MODEL_NAME,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1000,
              },
            },
          );

          const botMessage = {
            id: Date.now() + 1,
            text: botResponse,
            sender: "bot",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, botMessage]);
        }
      } catch (error) {
        console.error("Error getting response from Gemini:", error);
        setError(error);

        const errorMessage = {
          id: Date.now() + 1,
          text: `Sorry, I encountered an error: ${error.message || "Something went wrong"}`,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [chatHistory],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setChatHistory([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMessages,
  };
};
