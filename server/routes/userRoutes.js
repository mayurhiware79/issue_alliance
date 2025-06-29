import express from 'express';
import multer from 'multer'; //use to upload img on claudnary

import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

const router = express.Router();


// GitHub API to fetching user languages
const GITHUB_API_BASE_URL = "https://api.github.com";


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile');


    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);

  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.originalname + '-' + uniqueSuffix + ext);
  }
});




const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }

};


const upload = multer({ 

  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }

});




const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'user_uploads' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });
    
    readableStream.pipe(uploadStream);
  });

};



router.get('/test', (req, res) => {

  res.status(200).json({

    success: true,
    message: 'User routes are working',
    timestamp: new Date().toISOString(),

  });
});



router.post('/upload-image', upload.single('image'), async (req, res) => {

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Upload image to Cloudinary
    try {
      const filePath = req.file.path;
      const result = await cloudinary.uploader.upload(filePath);

      
      // Clean up the temporary file
      fs.unlinkSync(filePath);
      
      res.status(200).json({
        success: true,
        imageUrl: result.secure_url
      });

    } catch (uploadError) {
      console.error('Error uploading to Cloudinary:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image'
      });

    }
  } catch (error) {
    console.error('Error in image upload route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }

});


// Route to fetch GitHub user information
router.get('/github/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'GitHub username is required'
      });
    }
    

    // Fetch GitHub user data
    const userResponse = await fetch(`${GITHUB_API_BASE_URL}/users/${username}`);
    
    if (!userResponse.ok) {
      return res.status(userResponse.status).json({
        success: false,
        message: 'GitHub API error',
        status: userResponse.status,

      });
    }

    
    const userData = await userResponse.json();

    
    // Fetch user's repositories
    const reposResponse = await fetch(`${GITHUB_API_BASE_URL}/users/${username}/repos?sort=updated&per_page=10`);
    

    if (!reposResponse.ok) {
      return res.status(reposResponse.status).json({
        success: false,
        message: 'GitHub API error when fetching repositories',
        status: reposResponse.status
      });
    }
    

    const reposData = await reposResponse.json();
    

    // Extract language stats from repos
    const languages = {};
    const languagePromises = reposData.map(async (repo) => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });
    

    await Promise.all(languagePromises);
    

    // Format the data
    const githubInfo = {
      username: userData.login,
      displayName: userData.name,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      location: userData.location,
      company: userData.company,
      blog: userData.blog,
      followers: userData.followers,
      following: userData.following,
      publicRepos: userData.public_repos,
      languages: Object.keys(languages).map(lang => ({
        name: lang,
        count: languages[lang]
      })),
      topRepositories: reposData.map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language
      }))
    };
    
    res.status(200).json({
      success: true,
      githubInfo
    });
    
  } catch (error) {
    console.error('Error in GitHub info route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});




export default router; 