import { useState, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash";

export const useGeminiChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Update chat history whenever messages change - ensure it's in the correct format for Gemini API
    const history = messages.map(msg => {
      // Format differs based on whether the message is from user or model
      if (msg.sender === 'user') {
        return {
          role: 'user',
          parts: [{ text: msg.text }]
        };
      } else {
        // Handle messages from bot - ensure text is always a string
        const textContent = typeof msg.text === 'string' 
          ? msg.text 
          : JSON.stringify(msg.text); // Convert complex objects to strings
        
        return {
          role: 'model',
          parts: [{ text: textContent }]
        };
      }
    });
    
    setChatHistory(history);
  }, [messages]);

  const sendMessage = useCallback(async (inputText, recommendedResponse = null) => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
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
          sender: 'bot',
          timestamp: new Date(),
          isFormatted: true // Add a flag to indicate this is a formatted message
        };
        
        setMessages((prev) => [...prev, botMessage]);
      } else {
        if (!API_KEY) {
          throw new Error("Gemini API key is not configured. Please check your .env file.");
        }
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        
        // Create a chat session with properly formatted history
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        });
        
        // Prepare the standard prompt to include with user query
        const standardPrompt = `You are an AI assistant named IssueAlliance AI, integrated into a platform called "Open Source Contribution Matchmaker".

Primary purpose: This platform helps developers discover and contribute to open-source GitHub issues matched to their skills and interests.

Your capabilities:
1. Provide information about the platform's features and how to use them
2. Explain how the matching algorithm works using GitHub APIs, Firebase Auth, and ML models
3. Help users understand open source contribution workflows
4. Answer general programming and development questions
5. Respond to general knowledge questions while maintaining a helpful, friendly tone

Important: For questions about the platform, be specific about IssueAlliance features. For general questions about programming, open source, or other topics, give accurate, helpful responses based on your knowledge.

User query: ${inputText}`;
        
        // Send the message and get a response
        const result = await chat.sendMessage(standardPrompt);
        const response = await result.response;
        const botResponse = response.text();
        
        const botMessage = {
          id: Date.now() + 1,
          text: botResponse,
          sender: 'bot',
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
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory]);

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
    setMessages
  };
}; 