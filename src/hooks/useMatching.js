import { useState, useCallback } from "react";
import { embeddingService } from "../services/embeddingService";

export const useMatching = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);

  const findMatches = useCallback(async (query, candidates, topK = 5) => {
    if (!query || !candidates || candidates.length === 0) {
      setError("Invalid query or candidates");
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await embeddingService.findMatches(
        query,
        candidates,
        topK
      );
      setMatches(results);
      return results;
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      console.error("Error in findMatches:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateEmbedding = useCallback(async (text) => {
    if (!text) {
      setError("Empty text cannot be embedded");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const embedding = await embeddingService.generateEmbedding(text);
      return embedding;
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      console.error("Error in generateEmbedding:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to format error messages for better user experience
  const formatErrorMessage = (err) => {
    const message = err.message || "Unknown error occurred";

    // Handle common errors more gracefully
    if (message.includes("<!DOCTYPE") || message.includes("not valid JSON")) {
      return "Network issue: Unable to download model from Hugging Face servers. Check your internet connection.";
    }

    if (
      message.includes("NetworkError") ||
      message.includes("Failed to fetch")
    ) {
      return "Network error: Unable to connect to required services.";
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      return "Request timed out. The server took too long to respond.";
    }

    return message;
  };

  return {
    findMatches,
    generateEmbedding,
    isLoading,
    error,
    matches,
  };
};
