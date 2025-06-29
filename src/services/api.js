import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetch all user interaction data from Google Sheets
 * @returns {Promise<Array>} The data from Google Sheets
 */
export const fetchSheetsData = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/get-sheets-data`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      console.error('Error fetching sheets data:', response.data.message);
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Failed to fetch sheets data:', error);
    throw error;
  }
};

/**
 * Test API connection
 * @returns {Promise<Object>} Test response
 */
export const testApiConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/test`);
    return response.data;
  } catch (error) {
    console.error('Failed to test API connection:', error);
    throw error;
  }
}; 