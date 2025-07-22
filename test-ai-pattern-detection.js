const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import the architecture inference agent
const { ArchitectureInferenceAgent } = require('./dist/agents/architecture-inference');

// Mock repository analysis data for testing
const mockRepositoryAnalysis = {
  repository: {
    name: "express-mvc-app",
    language: "JavaScript",
    description: "A sample Express.js MVC application",
    owner: "test",
    branch: "main"
  },
  fileStructure: {
    totalFiles: 25,
    totalDirectories: 8,
    files: [
      {
        path: "src/controllers/UserController.js",
        name: "UserController.js", 
        type: "file",
        extension: "js",
        category: "source",
        size: 1024,
        content: "class UserController { async getUsers(req, res) { ... } }"
      },
      {
        path: "src/controllers/ProductController.js",
        name: "ProductController.js",
        type: "file", 
        extension: "js",
        category: "source",
        size: 2048
      },
      {
        path: "src/models/User.js",
        name: "User.js",
        type: "file",
        extension: "js", 
        category: "source",
        size: 512,
        content: "class User extends Model { ... }"
      },
      {
        path: "src/models/Product.js", 
        name: "Product.js",
        type: "file",
        extension: "js",
        category: "source",
        size: 768
      },
      {
        path: "src/views/user/index.ejs",
        name: "index.ejs",
        type: "file",
        extension: "ejs",
        category: "source", 
        size: 1536
      },
      {
        path: "src/views/product/list.ejs",
        name: "list.ejs", 
        type: "file",
        extension: "ejs",
        category: "source",
        size: 2048
      },
      {
        path: "src/services/UserService.js",
        name: "UserService.js",
        type: "file",
        extension: "js",
        category: "source",
        size: 1024
      },
      {
        path: "src/routes/api.js",
        name: "api.js",
        type: "file", 
        extension: "js",
        category: "source",
        size: 512
      },
      {
        path: "package.json",
        name: "package.json",
        type: "file",
        extension: "json",
        category: "config",
        size: 1024,
        content: '{"dependencies": {"express": "^4.18.0", "ejs": "^3.1.0"}}'
      },
      {
        path: "app.js",
        name: "app.js", 
        type: "file",
        extension: "js",
        category: "source",
        size: 2048,
        content: "const express = require('express'); const app = express();"
      },
      {
        path: "Dockerfile",
        name: "Dockerfile",
        type: "file",
        category: "build",
        size: 512
      }
    ],
    categories: {
      source: [],
      config: [],
      test: [],
      documentation: [],
      build: [],
      dependency: [],
      asset: [],
      other: []
    },
    mainFiles: [
      { name: "package.json", path: "package.json" },
      { name: "app.js", path: "app.js" }
    ]
  },
  summary: {
    purpose: "Web application with MVC structure",
    mainTechnologies: ["JavaScript", "Express.js", "EJS"],
    projectType: "web application",
    complexity: "medium"
  },
  insights: [
    "Well-organized MVC structure",
    "Express.js web framework", 
    "EJS templating engine"
  ],
  timestamp: new Date().toISOString()
};

async function testAIPatternDetection() {
  try {
    console.log('🧪 Testing AI Pattern Detection...\n');
    
    // Check if API key is available
    if (!process.env.GEMINI_KEY_AI_HACKATHON) {
      console.error('❌ GEMINI_KEY_AI_HACKATHON not set');
      return;
    }
    
    console.log('✅ API key found');
    console.log('📊 Mock repository structure:');
    console.log('- Controllers:', mockRepositoryAnalysis.fileStructure.files.filter(f => f.path.includes('controller')).length);
    console.log('- Models:', mockRepositoryAnalysis.fileStructure.files.filter(f => f.path.includes('model')).length);
    console.log('- Views:', mockRepositoryAnalysis.fileStructure.files.filter(f => f.path.includes('view')).length);
    console.log('- Services:', mockRepositoryAnalysis.fileStructure.files.filter(f => f.path.includes('service')).length);
    console.log('- Has Dockerfile:', mockRepositoryAnalysis.fileStructure.files.some(f => f.name === 'Dockerfile'));
    
    console.log('\n🤖 Starting AI pattern detection...');
    
    const agent = new ArchitectureInferenceAgent();
    const result = await agent.analyze(mockRepositoryAnalysis);
    
    console.log('\n✅ AI Pattern Detection Results:');
    console.log('🏗️  Architecture Type:', result.architecture.type);
    console.log('📐 Architecture Style:', result.architecture.style);
    console.log('🔍 Detected Patterns:', result.architecture.patterns);
    console.log('📊 Complexity:', result.architecture.complexity);
    
    if (result.architecture.patterns.includes('MVC')) {
      console.log('✅ Successfully detected MVC pattern!');
    } else {
      console.log('⚠️  MVC pattern not detected - check AI analysis');
    }
    
    console.log('\n💡 Recommendations:');
    result.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    console.log('\n🎯 Migration Complexity:', result.migrationComplexity);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('🔧 Check your GEMINI_KEY_AI_HACKATHON environment variable');
    } else if (error.message.includes('rate limit')) {
      console.log('⏰ Rate limit reached, try again later');
    } else {
      console.log('🐛 Full error:', error);
    }
  }
}

// Run the test
testAIPatternDetection();