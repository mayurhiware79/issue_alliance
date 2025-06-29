import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createCalendarEvent } from "../services/googleCalendar";

const GoogleAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing your request...");
  const [error, setError] = useState(null);
  const [returnPath, setReturnPath] = useState("/saved-issues");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus("Extracting authentication information...");
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const state = JSON.parse(params.get("state") || "{}");

        if (!accessToken) {
          throw new Error("No access token received from Google");
        }

        console.log(
          "Received access token:",
          accessToken.substring(0, 10) + "..."
        );

        if (accessToken && state.issue) {
          setStatus("Retrieving issue data...");
          // Store the issue data in localStorage
          const issueData = localStorage.getItem("pendingCalendarEvent");
          if (!issueData) {
            throw new Error("No issue data found in localStorage");
          }

          const issue = JSON.parse(issueData);

          // Determine where to return based on the issue source
          if (
            issue.repository_url &&
            issue.repository_url.includes("github.com")
          ) {
            setReturnPath("/github-issues");
          } else {
            setReturnPath("/saved-issues");
          }

          setStatus("Creating calendar event...");
          await createCalendarEvent(issue, accessToken);
          localStorage.removeItem("pendingCalendarEvent");
          setStatus("Event successfully added to your Google Calendar!");
          setTimeout(() => {
            navigate(returnPath);
          }, 2000);
        } else {
          throw new Error("Invalid state or missing access token");
        }
      } catch (error) {
        console.error("Error handling callback:", error);
        setError(
          error.message || "Failed to add event to calendar. Please try again."
        );
        setStatus("Error occurred");
        setTimeout(() => {
          navigate(returnPath);
        }, 3000);
      }
    };

    handleCallback();
  }, [location, navigate, returnPath]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">{status}</h2>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-gray-600">
            Please wait while we set up your calendar event.
          </p>
        )}
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
