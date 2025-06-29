import axios from 'axios';

/**
 * Uploads an image to Cloudinary using unsigned upload
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} cloudName - Cloudinary cloud name
 * @param {string} uploadPreset - Cloudinary upload preset (must be set to unsigned)
 * @returns {Promise<Object>} - The Cloudinary upload response
 */
const uploadToCloudinary = async (dataUrl, cloudName = 'ddgmjuauj', uploadPreset = 'leaderboard_upload') => {
  try {
    // Convert data URL to blob
    const blob = await fetch(dataUrl).then(res => res.blob());
    const formData = new FormData();
    
    // Add required parameters
    formData.append('file', blob);
    formData.append('upload_preset', uploadPreset);
    
    // Make API call to Cloudinary
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    // Return the secure URL and other response data
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image to Cloudinary'
    };
  }
};

export default uploadToCloudinary; 