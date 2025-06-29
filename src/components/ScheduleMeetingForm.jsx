import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUrl } from "../services/googleCalendar";
import { generateIssueSummary } from "../services/geminiService";
import {
  FaMagic,
  FaCalendarAlt,
  FaClock,
  FaHourglassHalf,
  FaTimes,
} from "react-icons/fa";

const ScheduleMeetingForm = ({ issue, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: issue.meetingTitle || `Work on GitHub Issue: ${issue.title}`,
    description:
      issue.meetingDescription ||
      `GitHub Issue: ${issue.html_url}\n\n${
        issue.body || "No description provided"
      }`,
    date: issue.meetingDate || new Date().toISOString().split("T")[0],
    startTime: issue.meetingStartTime || "09:00",
    duration: issue.meetingDuration || 60, // minutes
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleGenerateSummary = async () => {
    try {
      setIsGeneratingSummary(true);
      const summary = await generateIssueSummary(issue);

      // Update the description with the generated summary
      setFormData({
        ...formData,
        description: `GitHub Issue: ${
          issue.html_url
        }\n\nSummary:\n${summary}\n\nOriginal Description:\n${
          issue.body || "No description provided"
        }`,
      });
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Create a meeting object with the form data
      const meetingData = {
        ...issue,
        meetingTitle: formData.title,
        meetingDescription: formData.description,
        meetingDate: formData.date,
        meetingStartTime: formData.startTime,
        meetingDuration: parseInt(formData.duration),
      };

      // Store the meeting data in localStorage
      localStorage.setItem("pendingCalendarEvent", JSON.stringify(meetingData));

      // Redirect to Google auth
      const authUrl = getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error preparing meeting:", error);
      alert("Failed to prepare meeting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate duration options dynamically
  const durationOptions = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-lg mx-auto border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-lg mr-4">
              <FaCalendarAlt className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Schedule Meeting</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <FaTimes />
          </button>
        </div>
        <p className="mt-2 ml-14 text-white/80">
          For GitHub issue: #{issue.number}
        </p>

        {/* Progress Steps */}
        <div className="flex justify-between mt-6 px-4">
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center font-medium ${
                activeStep >= 1
                  ? "bg-white text-blue-600"
                  : "bg-white/30 text-white"
              }`}
            >
              1
            </div>
            <span className="text-xs mt-1 text-white/80">Details</span>
          </div>
          <div className="flex-1 flex items-center">
            <div
              className={`h-1 w-full ${
                activeStep >= 2 ? "bg-white" : "bg-white/30"
              }`}
            ></div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center font-medium ${
                activeStep >= 2
                  ? "bg-white text-blue-600"
                  : "bg-white/30 text-white"
              }`}
            >
              2
            </div>
            <span className="text-xs mt-1 text-white/80">When</span>
          </div>
          <div className="flex-1 flex items-center">
            <div
              className={`h-1 w-full ${
                activeStep >= 3 ? "bg-white" : "bg-white/30"
              }`}
            ></div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center font-medium ${
                activeStep >= 3
                  ? "bg-white text-blue-600"
                  : "bg-white/30 text-white"
              }`}
            >
              3
            </div>
            <span className="text-xs mt-1 text-white/80">Confirm</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Meeting Details */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className={`flex items-center text-sm px-3 py-1 rounded-full transition-all ${
                      isGeneratingSummary
                        ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                  >
                    <FaMagic
                      className={`mr-1 ${
                        isGeneratingSummary ? "animate-pulse" : ""
                      }`}
                      size={12}
                    />
                    {isGeneratingSummary ? "Generating..." : "AI Summary"}
                  </button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Include key points to discuss during the meeting.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  Next: Schedule Time
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Scheduling */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2 text-gray-500" size={14} />
                      Date
                    </div>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(formData.date)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <FaClock className="mr-2 text-gray-500" size={14} />
                      Start Time
                    </div>
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <FaHourglassHalf className="mr-2 text-gray-500" size={14} />
                    Duration
                  </div>
                </label>
                <div className="relative">
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none pr-10"
                    required
                  >
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-medium text-lg text-gray-800 mb-4">
                  Meeting Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex">
                    <div className="w-1/3 text-gray-500 text-sm">Title:</div>
                    <div className="w-2/3 font-medium">{formData.title}</div>
                  </div>

                  <div className="flex">
                    <div className="w-1/3 text-gray-500 text-sm">Date:</div>
                    <div className="w-2/3 font-medium">
                      {formatDate(formData.date)}
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-1/3 text-gray-500 text-sm">Time:</div>
                    <div className="w-2/3 font-medium">
                      {formData.startTime} (
                      {
                        durationOptions.find(
                          (o) => o.value == formData.duration
                        )?.label
                      }
                      )
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 text-sm mb-1">
                      Description:
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200 text-sm max-h-32 overflow-y-auto whitespace-pre-line">
                      {formData.description}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex">
                  <div className="mr-3 text-blue-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-800">
                    You'll be redirected to Google Calendar to authorize and
                    create this event.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Schedule Meeting"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ScheduleMeetingForm;
