// googleCalendar.js

/**
 * Google Calendar API integration service
 * Handles authentication and event creation
 */

// Scopes required for Google Calendar access
const SCOPES =
  "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";

/**
 * Creates a calendar event in the user's Google Calendar
 *
 * @param {Object} issue - The GitHub issue data with optional meeting details
 * @param {string} accessToken - OAuth access token for Google Calendar API
 * @returns {Promise<Object>} - The created calendar event object
 */
export const createCalendarEvent = async (issue, accessToken) => {
  try {
    // Validate access token
    if (!accessToken) {
      throw new Error("Access token is missing");
    }

    // Check if we have custom meeting details
    const hasCustomMeetingDetails =
      issue.meetingTitle && issue.meetingDate && issue.meetingStartTime;

    // Get user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Create the event object based on whether we have custom meeting details
    let event;

    if (hasCustomMeetingDetails) {
      // Calculate end time based on start time and duration
      const startDateTime = `${issue.meetingDate}T${issue.meetingStartTime}:00`;
      const startTime = new Date(startDateTime);
      const durationInMs = (issue.meetingDuration || 60) * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationInMs);

      event = {
        summary: issue.meetingTitle,
        description:
          issue.meetingDescription ||
          `GitHub Issue: ${issue.html_url}\n\n${
            issue.body || "No description provided"
          }`,
        start: {
          dateTime: startDateTime,
          timeZone: userTimeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: userTimeZone,
        },
        // Add additional fields for better calendar integration
        colorId: "1", // Blue color
        transparency: "opaque", // Shows as busy in calendar
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 10 }],
        },
      };
    } else {
      // Default event settings when custom details aren't provided
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      event = {
        summary: `Work on GitHub Issue: ${issue.title}`,
        description: `GitHub Issue: ${issue.html_url}\n\n${
          issue.body || "No description provided"
        }`,
        start: {
          dateTime: now.toISOString(),
          timeZone: userTimeZone,
        },
        end: {
          dateTime: oneHourLater.toISOString(),
          timeZone: userTimeZone,
        },
        colorId: "1", // Blue color
        transparency: "opaque", // Shows as busy in calendar
        reminders: {
          useDefault: true,
        },
      };
    }

    // Log shortened token and event details for debugging
    console.log(
      "Creating calendar event with token:",
      accessToken.substring(0, 10) + "..."
    );
    console.log("Event details:", JSON.stringify(event, null, 2));

    // Call Google Calendar API to create the event
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Calendar API error response:", errorData);

      // Create more descriptive error message
      const errorMessage =
        errorData.error?.message || `${response.status} ${response.statusText}`;

      throw new Error(`Failed to create calendar event: ${errorMessage}`);
    }

    // Return successful response
    return await response.json();
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
};

/**
 * Generates the Google OAuth authorization URL
 *
 * @returns {string} - The authorization URL for Google OAuth
 */
export const getAuthUrl = () => {
  // Create URL parameters for OAuth flow
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    response_type: "token",
    scope: SCOPES,
    include_granted_scopes: "true",
    state: JSON.stringify({ issue: true }),
    // Add additional parameters for better user experience
    prompt: "consent", // Always show consent screen
    access_type: "online",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Extracts access token from URL hash after OAuth redirect
 *
 * @returns {Object|null} - Object containing the access token and expiration, or null if not found
 */
export const extractTokenFromHash = () => {
  if (!window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = params.get("access_token");
  const expiresIn = params.get("expires_in");

  if (!accessToken) return null;

  return {
    accessToken,
    expiresIn: parseInt(expiresIn, 10),
    expirationTime: Date.now() + parseInt(expiresIn, 10) * 1000,
  };
};
