import React, { useState } from "react";
import { useMatching } from "../hooks/useMatching";

const MatchingResults = ({ candidates }) => {
  const [query, setQuery] = useState("");
  const { findMatches, isLoading, error, matches } = useMatching();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await findMatches(query, candidates);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {matches.map((match, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {match.candidate.title || "Untitled"}
                </h3>
                <p className="text-gray-600 mt-1">{match.candidate.text}</p>
              </div>
              <div className="text-sm text-gray-500">
                Score: {(match.score * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && matches.length === 0 && query && (
        <div className="text-center text-gray-500 mt-8">
          No matches found. Try a different search query.
        </div>
      )}
    </div>
  );
};

export default MatchingResults;
