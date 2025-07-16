import dotenv from 'dotenv';
import { logInfo, logError } from './shared/utils';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logError('Missing required environment variables', new Error(`Missing: ${missingEnvVars.join(', ')}`));
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Please create a .env file with the required variables.');
  console.error('📖 See .env.example for reference.');
  process.exit(1);
}

// Start the application
async function startApplication() {
  try {
    logInfo('Starting AI Legacy Migration Agent Suite');
    
    // Import and start the API server
    await import('./api');
    
    logInfo('Application started successfully');
    
  } catch (error) {
    logError('Failed to start application', error as Error);
    console.error('❌ Failed to start application:', (error as Error).message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logInfo('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logInfo('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled promise rejection', reason as Error);
  console.error('❌ Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Start the application
startApplication();