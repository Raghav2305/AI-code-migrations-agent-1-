const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

console.log('Testing Gemini API Key...');
console.log('API Key loaded:', process.env.GOOGLE_API_KEY ? 'Yes' : 'No');
console.log('API Key length:', process.env.GOOGLE_API_KEY?.length || 0);
console.log('API Key starts with:', process.env.GOOGLE_API_KEY?.substring(0, 10) || 'N/A');

async function testAPIKey() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent('Hello, world!');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Key is working!');
    console.log('Response:', text);
  } catch (error) {
    console.log('❌ API Key test failed:');
    console.log('Error:', error.message);
    
    // Check if it's a specific error
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n🔧 Solutions:');
      console.log('1. Check if your API key is correct');
      console.log('2. Make sure the API key has Gemini API access enabled');
      console.log('3. Try creating a new API key at https://aistudio.google.com/apikey');
      console.log('4. Ensure you have sufficient quota');
    }
  }
}

testAPIKey();