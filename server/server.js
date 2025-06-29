import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, setDoc, Timestamp } from 'firebase/firestore';
import fetch from 'node-fetch';
import schedule from 'node-schedule';
import userRoutes from './routes/userRoutes.js';
import multer from 'multer';
import cloudinary from './config/cloudinary.js';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




const PORT = process.env.PORT || 5000;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;


console.log('===========================================');
console.log('Google Sheets Integration Server Starting...');
console.log('Environment Information:');
console.log(`Port: ${PORT}`);
console.log(`Google Sheet ID: ${GOOGLE_SHEET_ID || 'NOT FOUND IN ENV!'}`);
console.log(`Credentials File: ${path.join(__dirname, 'credentials.json')}`);
console.log('===========================================');




if (!fs.existsSync(path.join(__dirname, 'credentials.json'))) {

  console.error('ERROR: credentials.json does not exist in the server directory!');
  console.error('Please make sure you create this file with your service account credentials.');
  process.exit(1);

}




// Check if GOOGLE_SHEET_ID exists
if (!GOOGLE_SHEET_ID) {

  console.error('ERROR: GOOGLE_SHEET_ID environment variable is not set!');
  console.error('Please make sure it is defined in your .env file.');
  process.exit(1);
}

const app = express();


app.use(cors());
app.use(express.json());



app.use((req, res, next) => {
  
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
 
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});

// Initialize Google Sheets API
const setupGoogleSheets = () => {
  try {
    console.log('Setting up Google Sheets API connection...');
   
    const credentialsPath = path.join(__dirname, 'credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    console.log(`Using service account: ${credentials.client_email}`);

    // Create JWT client using service account credentials
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );


    // Create sheets client
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Google Sheets API connection established successfully!');
    return { auth, sheets };
  } catch (error) {
    console.error('Error setting up Google Sheets:', error);
    return null;
  }
};


const { sheets } = setupGoogleSheets() || {};



const testGoogleSheetsConnection = async () => {
  try {
    console.log('Testing Google Sheets connection...');
    
    if (!sheets) {
      console.error('Sheets client not initialized. Cannot test connection.');
      return;
    }
    
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID
    });
    
    console.log('Successfully connected to Google Sheet:');
    console.log(`- Title: ${response.data.properties.title}`);
    console.log(`- Sheets: ${response.data.sheets.map(s => s.properties.title).join(', ')}`);
    
    console.log('Google Sheets connection test PASSED!');
    
  } catch (error) {
    console.error('Google Sheets connection test FAILED:', error);
    console.error('Details:', error.response?.data || error.message);
  }
};


app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running', 
    time: new Date().toISOString(),
    googleSheetId: GOOGLE_SHEET_ID,
    sheetsConnected: !!sheets
  });
});




app.get('/api/test-headers', (req, res) => {
  res.status(200).json({ 
    message: 'Headers test endpoint',
    headers: {
      'X-Frame-Options': res.getHeader('X-Frame-Options'),
      'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
      'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
      'Strict-Transport-Security': res.getHeader('Strict-Transport-Security')
    }
  });

});




app.post('/api/log-to-sheets', async (req, res) => {

  try {
    console.log('Received request to log data to sheets:', req.body);
    
    if (!sheets) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google Sheets client not initialized' 
      });

    }

    const {
      name,
      email,
      skills,
      contributions,
      githubInfo,
      chatbotInteractions,
      websiteEvents,
      timestamp
    } = req.body;

    

    if (email === 'server@test.com' || name === 'Server Test') {
      return res.status(400).json({
        success: false,
        message: 'Test data not allowed'
      });
    }


    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    
    const row = [

      name || 'Unknown',
      email,
      Array.isArray(skills) ? skills.join(', ') : skills || 'None',
      JSON.stringify(contributions || {}),
      JSON.stringify(githubInfo || {}),
      JSON.stringify(chatbotInteractions || {}),
      JSON.stringify(websiteEvents || {}),
      timestamp || new Date().toISOString(),

    ];

    console.log('Preparing to write row to Google Sheets:', row);

    // Append row to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [row]
      }
    });

    console.log('Successfully wrote to Google Sheets:', response.data);

    return res.status(200).json({
      success: true,
      message: 'Data successfully logged to Google Sheets',
      data: response.data
    });
  } catch (error) {
    console.error('Error logging data to Google Sheets:', error);
    console.error('Details:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to log data to Google Sheets',
      error: error.message
    });
  }
});




app.get('/api/get-sheets-data', async (req, res) => {
  try {
    console.log('Received request to get data from sheets');
    
    if (!sheets) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google Sheets client not initialized' 
      });
    }

   
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1'
    });

    const rows = response.data.values || [];
    
   

    if (rows.length <= 1) {
      return res.status(200).json({
        success: true,
        message: 'No data found in Google Sheets',
        data: []
      });
    }

    


    const headers = rows[0];
    
    
    const data = rows.slice(1).map(row => {
      const rowData = {};
      headers.forEach((header, index) => {
       
        if (['contributions', 'githubInfo', 'chatbotInteractions', 'websiteEvents'].includes(header)) {
          try {
            rowData[header] = JSON.parse(row[index] || '{}');
          } catch (e) {
            rowData[header] = {};
          }
        } else if (header === 'skills') {
         
          rowData[header] = row[index] ? row[index].split(', ') : [];
        } else {
          rowData[header] = row[index] || '';
        }
      });
      return rowData;
    });

    return res.status(200).json({
      success: true,
      message: 'Data successfully retrieved from Google Sheets',
      data
    });
  } catch (error) {
    console.error('Error getting data from Google Sheets:', error);
    console.error('Details:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get data from Google Sheets',
      error: error.message
    });
  }
});


app.post('/api/backup-log', async (req, res) => {
  try {
    console.log('Backing up log data to local file');
    
    // Log to a debug file for inspection
    const logFile = path.join(__dirname, 'analytics-backup.json');
    
    // Read existing logs or create new array
    let logs = [];
    try {
      if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, 'utf8');
        logs = JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Error reading log file:', e);
    }
    
    // Add new log with timestamp
    logs.push({
      data: req.body,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    // Write back to file
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    
    return res.status(200).json({
      success: true,
      message: 'Data backed up to local file',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error backing up log data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to back up log data',
      error: error.message
    });
  }
});

// Firebase configuration for server
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// GitHub API configuration
const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;

// Function to fetch a random issue from GitHub
async function fetchRandomIssue() {
  try {
    // Define popular repositories with good first issues
    const popularRepos = [
      { owner: "tensorflow", repo: "tensorflow" },
      { owner: "facebook", repo: "react" },
      { owner: "microsoft", repo: "vscode" },
      { owner: "vercel", repo: "next.js" },
      { owner: "flutter", repo: "flutter" },
      { owner: "kubernetes", repo: "kubernetes" },
      { owner: "angular", repo: "angular" },
      { owner: "axios", repo: "axios" },
      { owner: "electron", repo: "electron" },
      { owner: "expressjs", repo: "express" },
      { owner: "tailwindlabs", repo: "tailwindcss" },
      { owner: "nodejs", repo: "node" },
      { owner: "vuejs", repo: "vue" },
      { owner: "TypeStrong", repo: "typescript" },
      { owner: "gatsbyjs", repo: "gatsby" }
    ];
    
    // Choose a random repository
    const randomRepoIndex = Math.floor(Math.random() * popularRepos.length);
    const { owner, repo } = popularRepos[randomRepoIndex];
    
    // Define labels that are suitable for beginners
    const labels = [
      "good first issue",
      "help wanted",
      "beginner friendly",
      "easy",
      "documentation"
    ];
    
    // Choose a random label
    const randomLabelIndex = Math.floor(Math.random() * labels.length);
    const label = labels[randomLabelIndex];
    
    // Query for issues with the selected label
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`;
    
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(GITHUB_API_TOKEN && { Authorization: `token ${GITHUB_API_TOKEN}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const issues = await response.json();
    
    // Filter out pull requests
    const filteredIssues = issues.filter(issue => !issue.pull_request);
    
    if (filteredIssues.length === 0) {
      // If no issues found, try another repository
      return fetchRandomIssue();
    }
    
    // Select a random issue
    const randomIssueIndex = Math.floor(Math.random() * filteredIssues.length);
    const randomIssue = filteredIssues[randomIssueIndex];
    
    // Create proper repository URL and HTML URL
    const repoHtmlUrl = `https://github.com/${owner}/${repo}`;
    const repositoryUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`;
    
    // Format the issue with consistent structure
    return {
      id: randomIssue.id,
      title: randomIssue.title,
      number: randomIssue.number,
      html_url: randomIssue.html_url,
      repository_url: repositoryUrl,
      repository_html_url: repoHtmlUrl,
      created_at: randomIssue.created_at,
      updated_at: randomIssue.updated_at,
      state: randomIssue.state,
      labels: randomIssue.labels
        ? randomIssue.labels.map((label) => ({
            id: label.id || `label-${label.name}`,
            name: label.name,
            color: label.color || "ededed",
          }))
        : [],
      repository: {
        name: repo,
        owner: owner,
        full_name: `${owner}/${repo}`,
        url: repoHtmlUrl,
      },
      user: {
        login: randomIssue.user ? randomIssue.user.login : "",
        avatar_url: randomIssue.user ? randomIssue.user.avatar_url : "",
        url: randomIssue.user ? randomIssue.user.html_url : "",
      },
      comments: randomIssue.comments || 0,
      body: randomIssue.body || "",
    };
  } catch (error) {
    console.error("Error fetching random issue:", error);
    throw error;
  }
}

// Function to store the daily issue in Firebase
async function storeDailyIssue() {
  try {
    console.log('Fetching new daily issue from GitHub...');
    const randomIssue = await fetchRandomIssue();
    
    if (!randomIssue) {
      throw new Error('Failed to fetch random issue from GitHub');
    }
    
    // Create a document in dailyIssues collection
    const dailyIssueRef = doc(collection(db, 'dailyIssues'));
    
    // Add the issue to Firestore
    await setDoc(dailyIssueRef, {
      id: randomIssue.id,
      title: randomIssue.title,
      number: randomIssue.number,
      html_url: randomIssue.html_url,
      repository_url: randomIssue.repository_url,
      repository_html_url: randomIssue.repository_html_url || '',
      created_at: randomIssue.created_at,
      updated_at: randomIssue.updated_at,
      state: randomIssue.state,
      labels: randomIssue.labels || [],
      repository: randomIssue.repository || {},
      body: randomIssue.body || '',
      date: Timestamp.now(),
      active: true
    });
    
    console.log(`New daily issue stored: ${randomIssue.title} (ID: ${dailyIssueRef.id})`);
    return dailyIssueRef.id;
  } catch (error) {
    console.error('Error storing daily issue:', error);
    throw error;
  }
}

// Schedule the job to run every day at midnight
// Format: second minute hour day-of-month month day-of-week
// '0 0 0 * * *' = every day at midnight (00:00:00)
const dailyIssueJob = schedule.scheduleJob('0 0 0 * * *', async function() {
  console.log('Running scheduled job to fetch new daily issue...');
  try {
    const issueId = await storeDailyIssue();
    console.log(`Successfully scheduled and stored daily issue with ID: ${issueId}`);
  } catch (error) {
    console.error('Error in scheduled job:', error);
  }
});

// Add an endpoint to manually trigger fetching a new daily issue (for testing)
app.post('/api/trigger-daily-issue', async (req, res) => {
  try {
    const issueId = await storeDailyIssue();
    return res.status(200).json({
      success: true,
      message: 'New daily issue fetched and stored successfully',
      issueId
    });
  } catch (error) {
    console.error('Error triggering daily issue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch and store daily issue',
      error: error.message
    });
  }
});

// Add user routes
app.use('/api/users', userRoutes);

// Add a more specific image upload endpoint
app.post('/api/upload', multer().single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const result = await cloudinary.uploader.upload(req.file.path);
    
    res.status(200).json({
      success: true,
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Capture unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server at: http://localhost:${PORT}/api/test`);
  
  // Test Google Sheets connection
  testGoogleSheetsConnection();
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
});

export default app; 