#!/usr/bin/env ts-node

/**
 * Demo script to showcase the enhanced terminal logging
 * Run with: npx ts-node demo-enhanced-logging.ts
 */

import { 
  logAnalysisStart,
  logStep,
  logProgress,
  logSuccess,
  logAnalysisError,
  logRepoInfo,
  logFileAnalysis,
  logAICall,
  logArchitectureDetection,
  logEnhancedInfo
} from './src/shared/utils/enhanced-logger';

// Simulate a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function demoAnalysis() {
  console.log('🎯 Starting Enhanced Logging Demo...\n');

  try {
    // Start analysis
    logAnalysisStart('Demo GitHub Repository Analysis', { 
      repositoryUrl: 'https://github.com/facebook/react',
      timestamp: new Date().toISOString()
    });

    await delay(1000);

    // Step 1: Repository Fetch
    logStep('Repository Fetch', { 
      url: 'https://github.com/facebook/react',
      branch: 'main',
      operation: 'Fetching repository metadata'
    });

    await delay(1500);

    // Log repo info
    logRepoInfo({
      name: 'react',
      owner: 'facebook',
      language: 'JavaScript',
      stars: 215000,
      forks: 44500,
      description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.'
    });

    await delay(1000);

    // Step 2: File Analysis
    logStep('File Analysis', { 
      operation: 'Processing repository files',
      targetFiles: 'Analyzing file structure'
    });

    await delay(500);

    // Progress updates
    logProgress('Downloading files', 25, 100);
    await delay(300);
    logProgress('Processing JavaScript files', 45, 100);
    await delay(300);
    logProgress('Analyzing components', 70, 100);
    await delay(300);
    logProgress('Categorizing files', 100, 100);

    await delay(1000);

    // Log file analysis
    logFileAnalysis({
      totalFiles: 847,
      totalDirectories: 125,
      categories: {
        source: Array(450).fill({}),
        test: Array(180).fill({}),
        config: Array(25).fill({}),
        documentation: Array(15).fill({}),
        build: Array(30).fill({}),
        dependency: Array(5).fill({}),
        asset: Array(42).fill({}),
        other: Array(100).fill({})
      }
    });

    await delay(1000);

    // Step 3: AI Pattern Detection
    logStep('AI Pattern Detection', { 
      model: 'Google Gemini',
      operation: 'Detecting architectural patterns'
    });

    await delay(500);

    // AI Call logging
    logAICall('Architectural Pattern Analysis', 
      'Analyze this repository structure to identify architectural patterns...',
      {
        detectedPatterns: ['Component-Based', 'Modular', 'Library'],
        confidence: 'high',
        reasoning: 'Clear component structure with modular organization'
      }
    );

    await delay(1000);

    // Architecture detection results
    logArchitectureDetection(
      ['Component-Based', 'Modular', 'Library'], 
      {
        type: 'modular',
        complexity: 'high'
      }
    );

    await delay(1000);

    // Step 4: Technology Stack Analysis
    logStep('Technology Stack Analysis', {
      operation: 'Analyzing dependencies and technologies'
    });

    await delay(800);

    logEnhancedInfo('Detected technologies', {
      primaryLanguage: 'JavaScript',
      frameworks: ['React', 'JSX'],
      buildTools: ['Webpack', 'Rollup', 'Babel'],
      testingTools: ['Jest', 'React Testing Library'],
      linting: ['ESLint', 'Prettier']
    });

    await delay(1000);

    // Step 5: AI Summary Generation
    logStep('AI Summary Generation', {
      model: 'Google Gemini',
      operation: 'Generating comprehensive summary'
    });

    await delay(500);

    logAICall('Repository Summary Generation', 
      'Generate a comprehensive summary of this repository...',
      {
        purpose: 'UI library for building user interfaces',
        projectType: 'library',
        complexity: 'high',
        insights: [
          'Well-structured component library',
          'Extensive test coverage',
          'Modern JavaScript standards'
        ]
      }
    );

    await delay(1500);

    // Success!
    logSuccess('GitHub Repository Analysis Completed', {
      repository: 'react',
      totalFiles: 847,
      projectType: 'library',
      complexity: 'high',
      analysisTime: '45.3 seconds',
      aiCalls: 2,
      patternsDetected: 3
    });

  } catch (error) {
    logAnalysisError('Demo analysis failed', error as Error);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  console.log('🚀 Enhanced Logging Demo\n');
  console.log('This demonstrates the rich terminal output during repository analysis.\n');
  
  demoAnalysis().then(() => {
    console.log('\n✨ Demo completed! This is what you\'ll see during real analysis runs.\n');
    process.exit(0);
  }).catch((error) => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { demoAnalysis };