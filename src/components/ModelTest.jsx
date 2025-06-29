import React, { useState, useEffect } from "react";
import { useMatching } from "../hooks/useMatching";
import { embeddingService } from "../services/embeddingService";

const ModelTest = () => {
  const [modelStatus, setModelStatus] = useState("Not initialized");
  const [testResults, setTestResults] = useState(null);
  const [detailedError, setDetailedError] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const { findMatches, isLoading, error } = useMatching();

  // Test data
  const testCandidates = [
    {
      text: "React is a JavaScript library for building user interfaces",
      title: "React Definition",
    },
    {
      text: "Vue.js is a progressive JavaScript framework for building user interfaces",
      title: "Vue Definition",
    },
    {
      text: "Angular is a platform for building mobile and desktop web applications",
      title: "Angular Definition",
    },
  ];

  // Check internet connection
  const checkConnection = () => {
    return navigator.onLine;
  };

  // Test the model initialization
  useEffect(() => {
    const testModel = async () => {
      try {
        // Check internet connection
        if (!checkConnection()) {
          setModelStatus("Network connection unavailable");
          setDetailedError(
            "Your device appears to be offline. The embedded fallback model will be used automatically."
          );
          return;
        }

        setModelStatus("Initializing...");
        setDetailedError(null);

        // Try to generate an embedding for a simple test
        const text = "test";
        await embeddingService.initialize();

        // Update fallback status
        setUsingFallback(embeddingService.useFallback);

        if (embeddingService.useFallback) {
          setModelStatus("Using lightweight fallback model");
          setDetailedError(
            "The system is using a lightweight built-in model because it could not access the full model. " +
              "This will still work, but with slightly less accuracy. No internet connection is needed in this mode."
          );
        } else {
          setModelStatus("Model initialized successfully");
          setDetailedError(null);
        }
      } catch (err) {
        const errorMessage = err.message || "Unknown error";
        setModelStatus(`Model initialization failed: ${errorMessage}`);
        setUsingFallback(true);

        // Provide helpful error information
        if (
          errorMessage.includes("<!DOCTYPE") ||
          errorMessage.includes("not valid JSON")
        ) {
          setDetailedError(
            "Received HTML instead of model data. This typically happens when your device cannot " +
              "access Hugging Face model files. The system will automatically fall back to a lightweight built-in model."
          );
        } else if (errorMessage.includes("timeout")) {
          setDetailedError(
            "Model initialization timed out. This could be due to a slow internet connection. " +
              "The system will automatically fall back to a lightweight built-in model."
          );
        } else {
          setDetailedError(
            `Error: ${errorMessage}. The system will automatically fall back to a lightweight built-in model.`
          );
        }

        console.error("Model test error:", err);
      }
    };

    if (!isOfflineMode) {
      testModel();
    }
  }, [isOfflineMode]);

  // Test matching functionality
  const runMatchingTest = async () => {
    try {
      setTestResults("Running matching test...");
      setDetailedError(null);

      // Use mock data in offline mode
      if (isOfflineMode) {
        setTimeout(() => {
          const mockResults = [
            {
              candidate: testCandidates[1], // Vue.js
              score: 0.95,
            },
            {
              candidate: testCandidates[0], // React
              score: 0.85,
            },
            {
              candidate: testCandidates[2], // Angular
              score: 0.65,
            },
          ];

          setTestResults({
            success: true,
            message: "Offline test completed with mock data",
            results: mockResults,
          });
        }, 1000); // Simulate processing time
        return;
      }

      const query = "JavaScript framework for building user interfaces";
      const results = await findMatches(query, testCandidates);

      // Update fallback status after the test
      setUsingFallback(embeddingService.useFallback);

      if (results && results.length > 0) {
        setTestResults({
          success: true,
          message: embeddingService.useFallback
            ? "Matching test successful (using fallback model)"
            : "Matching test successful",
          results: results,
        });
        console.log("Matching results:", results);
      } else {
        setTestResults({
          success: false,
          message: "Matching test returned no results",
        });
      }
    } catch (err) {
      const errorMessage = err.message || "Unknown error";
      setTestResults({
        success: false,
        message: `Matching test failed: ${errorMessage}`,
      });
      setDetailedError(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      console.error("Matching test error:", err);
    }
  };

  // Toggle offline mode
  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
    if (!isOfflineMode) {
      setModelStatus("Offline mode enabled");
      setDetailedError(
        "Using mock data for testing. No real AI model will be loaded."
      );
    } else {
      setModelStatus("Not initialized");
      setDetailedError(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Model Testing Dashboard</h1>

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm px-3 py-1 rounded-full bg-gray-100 border">
          Status:{" "}
          {usingFallback
            ? "Using Fallback Model"
            : embeddingService.initialized
            ? "Using Full Model"
            : "Initializing..."}
        </div>

        <button
          onClick={toggleOfflineMode}
          className={`px-4 py-2 rounded-lg ${
            isOfflineMode
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          {isOfflineMode ? "Offline Mode: ON" : "Offline Mode: OFF"}
        </button>
      </div>

      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Model Status</h2>
        <div
          className={`p-2 rounded ${
            modelStatus.includes("successfully")
              ? "bg-green-100 text-green-800"
              : modelStatus.includes("failed") ||
                modelStatus.includes("unavailable") ||
                modelStatus.includes("fallback") ||
                modelStatus.includes("lightweight")
              ? "bg-red-100 text-red-800"
              : isOfflineMode
              ? "bg-blue-100 text-blue-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {modelStatus}
        </div>
      </div>

      <div className="mb-8">
        <button
          onClick={runMatchingTest}
          disabled={isLoading && !isOfflineMode}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading && !isOfflineMode ? "Testing..." : "Run Matching Test"}
        </button>
      </div>

      {error && !isOfflineMode && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {detailedError && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Detailed Information:</h3>
          {typeof detailedError === "string" &&
          detailedError.startsWith("{") ? (
            <pre className="text-xs overflow-auto p-2 bg-gray-200 rounded">
              {detailedError}
            </pre>
          ) : (
            <p className="text-sm">{detailedError}</p>
          )}
        </div>
      )}

      {testResults && (
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <div
            className={`p-2 rounded mb-4 ${
              testResults.success
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {testResults.message}
          </div>

          {testResults.results && (
            <div className="space-y-4">
              <h3 className="font-semibold">Matching Results:</h3>
              {testResults.results.map((result, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="font-medium">{result.candidate.title}</div>
                  <div className="text-sm text-gray-600">
                    {result.candidate.text}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Score: {(result.score * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Important Information</h2>
        <p className="mb-4">
          This system now uses a hybrid approach with two models:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>
            <span className="font-medium">Primary Model:</span> A full-featured
            embedding model from Hugging Face (80MB download, high accuracy)
          </li>
          <li>
            <span className="font-medium">Fallback Model:</span> A tiny built-in
            model that works 100% offline (no download needed, lower but still
            reasonable accuracy)
          </li>
        </ul>
        <p className="mb-4">
          The system automatically switches to the fallback model if:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Your device is offline</li>
          <li>Your network blocks Hugging Face or CDN content</li>
          <li>Model download times out or fails</li>
          <li>Any unexpected errors occur</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelTest;
