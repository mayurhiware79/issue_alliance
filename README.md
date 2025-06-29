# Open Source Contribution Matchmaker

An AI-driven platform using Vertex AI to match developers with ideal GitHub issues based on skills/history, with GitHub API integration and Sheets API for analytics.

## Features

- Match developers with open source issues based on their skills and experience
- GitHub API integration for real-time issue tracking
- AI-powered recommendation system
- Analytics dashboard to track contributions
- AI-generated summaries of GitHub issues using Gemini AI

## Tech Stack

- React with Vite
- Tailwind CSS for styling
- Firebase (Authentication, Firestore, Storage)
- GitHub API
- Google Sheets API
- Vertex AI for ML capabilities
- Gemini AI for issue summarization

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- GitHub API key
- Google Cloud Platform account (for Vertex AI)
- Gemini AI API key (for issue summarization)

### Installation

1. Clone the repository:

```
git clone https://github.com/mayurdongare269/Open-Source-Contribution-Matchmaker-Hackathon
cd open-source-matchmaker
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the root directory based on the `.env.example` template.

4. Start the development server:

```
npm run dev
```

## Configuration

1. Create a Firebase project and enable Authentication, Firestore, and Storage
2. Add your Firebase configuration details to the `.env` file
3. Set up GitHub API credentials
4. Configure Google Cloud Platform for Vertex AI access
5. Get a Gemini AI API key from [Google AI Studio](https://ai.google.dev/) and add it to your `.env` file as `VITE_GEMINI_API_KEY`

## Project Structure

```
/src
  /components      # UI components
  /contexts        # React contexts for state management
  /utils           # Utility functions
  /services        # API and service integrations
  App.jsx          # Main application component
  main.jsx         # Entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

# Google Sheets Analytics Dashboard

A beautiful, responsive React dashboard that visualizes user interaction data stored in Google Sheets.

## Features

- Fetches data from Google Sheets via a Node.js backend
- Displays interactive charts and graphs using Recharts:
  - Pie chart for skills distribution
  - Bar chart for contribution types
  - Line chart for chatbot interactions over time
- Shows summary statistics with attractive cards
- Includes data filtering by date range and skills
- Displays raw data in a paginated table
- Responsive design using Tailwind CSS
- Error handling and loading states
- Dark mode support (via Tailwind)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Set up your Google Sheets credentials:
   - Create a service account in Google Cloud Console
   - Share your Google Sheet with the service account email
   - Download the credentials.json file and place it in the `server` folder

4. Create a `.env` file in the root directory with:

```
VITE_API_URL=http://localhost:5000/api
GOOGLE_SHEET_ID=your-google-sheet-id
```

## Running the Application

1. Start the backend server:

```bash
npm run server
```

2. In a separate terminal, start the frontend:

```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

4. Navigate to the Analytics Dashboard at `/analytics-dashboard`

## Dashboard Structure

The dashboard displays:

1. **Summary Statistics**:
   - Total users
   - Unique skills
   - Total contributions
   - Chatbot interactions

2. **Charts**:
   - Skills Distribution (Pie Chart)
   - Contributions by Type (Bar Chart)
   - Chatbot Interactions Over Time (Line Chart)

3. **Data Table**:
   - Paginated view of raw data

4. **Filters**:
   - Date range filter
   - Skills filter

## Google Sheets Structure

Your Google Sheet should have the following columns:

1. Name
2. Email
3. Skills (comma-separated)
4. Contributions (JSON)
5. GitHub Info (JSON)
6. Chatbot Interactions (JSON)
7. Website Events (JSON)
8. Timestamp

## Backend API Endpoints

- `GET /api/get-sheets-data` - Get all data from Google Sheets
- `POST /api/log-to-sheets` - Log new data to Google Sheets
- `GET /api/test` - Test the API connection

## Technologies Used

- React
- Recharts
- Tailwind CSS
- Node.js
- Express
- Google Sheets API
- date-fns
