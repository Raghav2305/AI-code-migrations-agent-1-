const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

// Load environment variables with explicit path
const envPath = path.join(__dirname, '.env');
console.log('Looking for .env file at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('.env file content preview:');
  console.log(envContent.substring(0, 200) + '...');
}

dotenv.config({ path: envPath });

console.log('\n=== Environment Variables Debug ===');
console.log('GEMINI_KEY_AI_HACKATHON from env:', process.env.GEMINI_KEY_AI_HACKATHON ? 'Found' : 'Not found');
console.log('GEMINI_KEY_AI_HACKATHON length:', process.env.GEMINI_KEY_AI_HACKATHON?.length || 0);
console.log('GEMINI_KEY_AI_HACKATHON preview:', process.env.GEMINI_KEY_AI_HACKATHON?.substring(0, 15) + '...' || 'N/A');

// Use the unique environment variable name
const apiKey = process.env.GEMINI_KEY_AI_HACKATHON;
console.log('Final API key to use:', apiKey ? 'Found (' + apiKey.length + ' chars)' : 'None');
console.log('=== End Debug ===\n');

async function testAPIKey() {
  try {
    if (!apiKey) {
      console.log('❌ No API key found in environment variables');
      return;
    }
    
    console.log('Testing with API key:', apiKey.substring(0, 15) + '...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Hello, respond with just "API key working!"');
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