import fetch from 'node-fetch';


const testServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    console.log(`Testing server connection on http://localhost:${PORT}/api/test...`);
    
    const response = await fetch(`http://localhost:${PORT}/api/test`);
    const data = await response.json();
    
    console.log('Server test response:', data);
    console.log('Server is working!');

  } catch (error) {
    console.error('Error testing server:', error);
    console.error('Server may not be running or there may be an issue with the connection.');
    process.exit(1);
    
  }
};

testServer(); 