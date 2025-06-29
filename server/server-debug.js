import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';



dotenv.config();


// Setup file paths 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());


// Capture unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);

});


// Simple test endpoint
app.get('/api/test', (req, res) => {

  res.status(200).json({ 
    message: 'Server is running', 
    time: new Date().toISOString()

  });
});

//  Google Sheets
app.post('/api/log-to-sheets', (req, res) => {

  try {
    console.log('Received data for logging:', JSON.stringify(req.body, null, 2));
    
    
    const logFile = path.join(__dirname, 'analytics-debug.json');
    
   
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
    

    
    if (logs.length > 100) {

      logs = logs.slice(-100);
    }
    
    
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    
    
    return res.status(200).json({
      success: true,
      message: 'Data logged to debug file (not to Google Sheets)',
      receivedAt: new Date().toISOString(),

    });

  } catch (error) {
    console.error('Error in debug logging:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log data',
      error: error.message
    });
  }
});



console.log('Debug environment info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_SHEET_ID exists:', !!process.env.GOOGLE_SHEET_ID);
console.log('PORT:', PORT);


// Start the server
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Test the server at: http://localhost:${PORT}/api/test`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
}); 