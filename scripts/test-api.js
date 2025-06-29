
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testApi() {
  console.log('Testing API Endpoints...');
  
  try {
   
    console.log('\n1. Testing server status...');
    const testResponse = await axios.get(`${API_URL}/test`);
    console.log('✅ Server is running!');
    console.log(testResponse.data);
    
 
    console.log('\n2. Testing Google Sheets data retrieval...');
    const sheetsResponse = await axios.get(`${API_URL}/get-sheets-data`);
    
    if (sheetsResponse.data.success) {
      console.log('✅ Successfully retrieved data from Google Sheets!');
      console.log(`Retrieved ${sheetsResponse.data.data.length} records`);
      
     
      if (sheetsResponse.data.data.length > 0) {
        console.log('\nSample record:');
        console.log(JSON.stringify(sheetsResponse.data.data[0], null, 2));
      }

      }else {
      console.log('❌ Failed to retrieve data from Google Sheets');
      console.log(sheetsResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    console.log('\nMake sure your server is running with: npm run server');
  }
}

testApi(); 