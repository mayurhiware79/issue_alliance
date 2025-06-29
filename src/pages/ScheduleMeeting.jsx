import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ScheduleMeetingForm from "../components/ScheduleMeetingForm";

const ScheduleMeeting = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the issue data from the state or localStorage
    const getIssueData = () => {
      // First try to get from location state
      if (location.state && location.state.issue) {
        // Normalize the issue data to ensure it has all required fields
        const normalizedIssue = normalizeIssueData(location.state.issue);
        setIssue(normalizedIssue);
        setLoading(false);
        return;
      }

      // If not in location state, try to get from localStorage
      const storedIssue = localStorage.getItem("pendingCalendarEvent");
      if (storedIssue) {
        try {
          const parsedIssue = JSON.parse(storedIssue);
          const normalizedIssue = normalizeIssueData(parsedIssue);
          setIssue(normalizedIssue);
        } catch (error) {
          console.error("Error parsing stored issue:", error);
        }
      }
      setLoading(false);
    };

    getIssueData();
  }, [location]);

  // Normalize issue data to ensure it has all required fields
  const normalizeIssueData = (issueData) => {
    // Create a normalized issue object with all required fields
    return {
      id: issueData.id || `issue-${Date.now()}`,
      title: issueData.title || "Untitled Issue",
      html_url: issueData.html_url || issueData.url || "#",
      body: issueData.body || "",
      repository_name:
        issueData.repository?.full_name ||
        issueData.repository_name ||
        "Unknown Repository",
      repository_url:
        issueData.repository?.html_url || issueData.repository_url || "#",
      state: issueData.state || "open",
      created_at: issueData.created_at || new Date().toISOString(),
      labels: issueData.labels || [],
      // Preserve any custom meeting details if they exist
      meetingTitle: issueData.meetingTitle,
      meetingDescription: issueData.meetingDescription,
      meetingDate: issueData.meetingDate,
      meetingStartTime: issueData.meetingStartTime,
      meetingDuration: issueData.meetingDuration,
    };
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-600">
            Please wait while we prepare the scheduling form.
          </p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No Issue Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select an issue to schedule a meeting for.
          </p>
          <button
            onClick={() => navigate("/github-issues")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to GitHub Issues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schedule Meeting</h1>
        <p className="text-gray-600 mt-2">
          Schedule a meeting to work on the issue:{" "}
          <span className="font-medium">{issue.title}</span>
        </p>
      </div>

      <ScheduleMeetingForm issue={issue} onCancel={handleCancel} />
    </div>
  );
};

export default ScheduleMeeting;
