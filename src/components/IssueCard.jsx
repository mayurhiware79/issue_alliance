import React, { useState } from "react";
import {
  FaGithub,
  FaStar,
  FaCodeBranch,
  FaCalendarAlt,
  FaTrash,
  FaCalendarPlus,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const IssueCard = ({ issue, onRemove, isSaved }) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSchedule = () => {
    try {
      setIsScheduling(true);
      // Navigate to the schedule meeting page with the issue data
      navigate("/schedule-meeting", { state: { issue } });
    } catch (error) {
      console.error("Error preparing to schedule:", error);
      alert("Failed to prepare scheduling. Please try again.");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          <a
            href={issue?.url || issue?.html_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600"
          >
            {issue?.title || "Untitled Issue"}
          </a>
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSchedule}
            disabled={isScheduling}
            className="text-green-500 hover:text-green-700 disabled:opacity-50"
            title="Schedule in Google Calendar"
          >
            <FaCalendarPlus />
          </button>
          {isSaved && onRemove && (
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700"
              title="Remove from saved issues"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <FaGithub className="mr-2" />
          <a
            href={issue?.repository_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600"
          >
            {issue?.repository_name || "Repository"}
          </a>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <FaCodeBranch className="mr-2" />
          <span>{issue?.state}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <FaCalendarAlt className="mr-2" />
          <span>Created {formatDate(issue?.created_at)}</span>
        </div>

        {issue?.labels && issue?.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {issue?.labels.map((label) => (
              <span
                key={label?.id || label?.name}
                className="px-2 py-1 text-xs rounded-full"
                style={{
                  backgroundColor: `#${label?.color || '858585'}20`,
                  color: `#${label?.color || '858585'}`,
                }}
              >
                {label?.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCard;
