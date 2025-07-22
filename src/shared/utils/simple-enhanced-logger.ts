/**
 * Enhanced Logger without external dependencies (no chalk)
 * Provides rich terminal output for analysis progress tracking
 */

import winston from 'winston';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Enhanced console formatter
const enhancedConsoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const time = new Date(timestamp as string).toLocaleTimeString();
  
  // Color coding for different log levels
  let levelColor;
  let icon;
  switch (level) {
    case 'error':
      levelColor = colors.red + colors.bright;
      icon = '❌';
      break;
    case 'warn':
      levelColor = colors.yellow + colors.bright;
      icon = '⚠️';
      break;
    case 'info':
      levelColor = colors.blue + colors.bright;
      icon = '📊';
      break;
    case 'debug':
      levelColor = colors.gray;
      icon = '🔍';
      break;
    case 'verbose':
      levelColor = colors.cyan;
      icon = '💬';
      break;
    default:
      levelColor = colors.white;
      icon = '📝';
  }
  
  // Format the main message
  const formattedMessage = `${colors.gray}${time}${colors.reset} ${icon} ${levelColor}${level.toUpperCase()}${colors.reset} ${colors.white}${message}${colors.reset}`;
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    const metaString = JSON.stringify(meta, null, 2);
    return `${formattedMessage}\n${colors.gray}   Meta:${colors.reset} ${colors.cyan}${metaString}${colors.reset}`;
  }
  
  return formattedMessage;
});

// Create enhanced logger
export const enhancedLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-legacy-migration' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add enhanced console transport
if (process.env.NODE_ENV !== 'production') {
  enhancedLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      enhancedConsoleFormat
    )
  }));
}

// Progress tracking utilities
class ProgressTracker {
  private currentOperation: string = '';
  private startTime: number = 0;
  private steps: string[] = [];
  private currentStep: number = 0;
  
  start(operation: string, totalSteps?: string[]) {
    this.currentOperation = operation;
    this.startTime = Date.now();
    this.steps = totalSteps || [];
    this.currentStep = 0;
    
    console.log(`\n${colors.green}${colors.bright}🚀 STARTING ANALYSIS${colors.reset}`);
    console.log(`${colors.blue}📁 Operation: ${operation}${colors.reset}`);
    if (this.steps.length > 0) {
      console.log(`${colors.gray}📋 Steps: ${this.steps.join(' → ')}${colors.reset}`);
    }
    console.log(`${colors.gray}⏰ Started at: ${new Date().toLocaleTimeString()}${colors.reset}`);
    console.log(`${colors.gray}━`.repeat(80) + colors.reset);
  }
  
  step(stepName: string, details?: any) {
    this.currentStep++;
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log(`\n${colors.yellow}⚡${colors.reset} ${colors.bright}STEP ${this.currentStep}: ${stepName}${colors.reset}`);
    console.log(`${colors.gray}   ⏱️  Elapsed: ${elapsed}s${colors.reset}`);
    
    if (details) {
      if (typeof details === 'string') {
        console.log(`${colors.cyan}   📝 ${details}${colors.reset}`);
      } else {
        console.log(`${colors.cyan}   📝 Details:${colors.reset}`);
        Object.entries(details).forEach(([key, value]) => {
          console.log(`${colors.cyan}      ${key}: ${JSON.stringify(value)}${colors.reset}`);
        });
      }
    }
  }
  
  progress(message: string, current?: number, total?: number) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    if (current !== undefined && total !== undefined) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = this.createProgressBar(percentage);
      console.log(`   ${progressBar} ${colors.bright}${current}/${total}${colors.reset} - ${message} ${colors.gray}(${elapsed}s)${colors.reset}`);
    } else {
      console.log(`   ${colors.blue}◦${colors.reset} ${message} ${colors.gray}(${elapsed}s)${colors.reset}`);
    }
  }
  
  success(message: string, results?: any) {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log(`${colors.gray}━`.repeat(80) + colors.reset);
    console.log(`${colors.green}${colors.bright}✅ SUCCESS: ${message}${colors.reset}`);
    console.log(`${colors.gray}⏱️  Total time: ${totalTime}s${colors.reset}`);
    
    if (results) {
      console.log(`${colors.green}📊 Results:${colors.reset}`);
      Object.entries(results).forEach(([key, value]) => {
        console.log(`${colors.green}   ✓ ${key}: ${JSON.stringify(value)}${colors.reset}`);
      });
    }
    
    console.log(`${colors.green}${colors.bright}🎉 ANALYSIS COMPLETED SUCCESSFULLY${colors.reset}\n`);
  }
  
  error(message: string, error?: Error) {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log(`${colors.gray}━`.repeat(80) + colors.reset);
    console.log(`${colors.red}${colors.bright}❌ ERROR: ${message}${colors.reset}`);
    console.log(`${colors.gray}⏱️  Failed after: ${totalTime}s${colors.reset}`);
    
    if (error) {
      console.log(`${colors.red}🔥 Error details:${colors.reset}`);
      console.log(`${colors.red}   Message: ${error.message}${colors.reset}`);
      if (error.stack) {
        console.log(`${colors.gray}   Stack: ${error.stack.split('\n')[1]?.trim()}${colors.reset}`);
      }
    }
    
    console.log(`${colors.red}${colors.bright}💥 ANALYSIS FAILED${colors.reset}\n`);
  }
  
  private createProgressBar(percentage: number, width: number = 30): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    const filledBar = colors.green + '█'.repeat(filled) + colors.reset;
    const emptyBar = colors.gray + '░'.repeat(empty) + colors.reset;
    
    return `[${filledBar}${emptyBar}] ${colors.bright}${percentage}%${colors.reset}`;
  }
}

// Global progress tracker instance
export const progress = new ProgressTracker();

// Enhanced logging functions
export const logAnalysisStart = (operation: string, details?: any) => {
  const steps = [
    'Repository Fetch',
    'File Analysis', 
    'Pattern Detection',
    'Architecture Inference',
    'Code Flow Analysis',
    'Recommendations'
  ];
  progress.start(operation, steps);
  enhancedLogger.info(`Analysis started: ${operation}`, details);
};

export const logStep = (stepName: string, details?: any) => {
  progress.step(stepName, details);
  enhancedLogger.info(`Step: ${stepName}`, details);
};

export const logProgress = (message: string, current?: number, total?: number, meta?: any) => {
  progress.progress(message, current, total);
  enhancedLogger.info(message, { current, total, ...meta });
};

export const logSuccess = (message: string, results?: any) => {
  progress.success(message, results);
  enhancedLogger.info(`Success: ${message}`, results);
};

export const logAnalysisError = (message: string, error?: Error, meta?: any) => {
  progress.error(message, error);
  enhancedLogger.error(`Analysis error: ${message}`, { 
    error: error?.message, 
    stack: error?.stack, 
    ...meta 
  });
};

// Enhanced info logging
export const logEnhancedInfo = (message: string, meta?: any) => {
  console.log(`   ${colors.blue}◦${colors.reset} ${message}`);
  if (meta) {
    console.log(`${colors.cyan}      ${JSON.stringify(meta, null, 2)}${colors.reset}`);
  }
  enhancedLogger.info(message, meta);
};

// AI interaction logging
export const logAICall = (operation: string, prompt?: string, response?: any) => {
  console.log(`   ${colors.magenta}🤖${colors.reset} AI Call: ${operation}`);
  if (prompt) {
    const truncatedPrompt = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
    console.log(`${colors.gray}      Prompt: ${truncatedPrompt}${colors.reset}`);
  }
  if (response) {
    try {
      const responseStr = JSON.stringify(response);
      console.log(`${colors.gray}      Response received: ${typeof response} (${responseStr.length} chars)${colors.reset}`);
    } catch (error) {
      console.log(`${colors.gray}      Response received: ${typeof response} (serialization error)${colors.reset}`);
    }
  }
  
  try {
    const responseLength = response ? JSON.stringify(response).length : 0;
    enhancedLogger.info(`AI Call: ${operation}`, { 
      promptLength: prompt?.length || 0, 
      responseType: typeof response,
      responseLength 
    });
  } catch (error) {
    enhancedLogger.info(`AI Call: ${operation}`, { 
      promptLength: prompt?.length || 0, 
      responseType: typeof response,
      responseLength: 0,
      error: 'Failed to serialize response for logging'
    });
  }
};

// Repository analysis specific logging
export const logRepoInfo = (repo: any) => {
  console.log(`   ${colors.green}📊${colors.reset} Repository Info:`);
  console.log(`${colors.green}      Name: ${repo.name}${colors.reset}`);
  console.log(`${colors.green}      Owner: ${repo.owner}${colors.reset}`);
  console.log(`${colors.green}      Language: ${repo.language}${colors.reset}`);
  console.log(`${colors.green}      Stars: ${repo.stars || 0}${colors.reset}`);
  console.log(`${colors.green}      Description: ${repo.description?.substring(0, 80) || 'None'}...${colors.reset}`);
  
  enhancedLogger.info('Repository information extracted', repo);
};

// File analysis logging
export const logFileAnalysis = (fileStructure: any) => {
  console.log(`   ${colors.cyan}📁${colors.reset} File Analysis:`);
  console.log(`${colors.cyan}      Total Files: ${fileStructure.totalFiles}${colors.reset}`);
  console.log(`${colors.cyan}      Directories: ${fileStructure.totalDirectories}${colors.reset}`);
  
  // Show category breakdown
  Object.entries(fileStructure.categories || {}).forEach(([category, files]: [string, any]) => {
    if (files && files.length > 0) {
      console.log(`${colors.cyan}      ${category}: ${files.length} files${colors.reset}`);
    }
  });
  
  enhancedLogger.info('File structure analyzed', {
    totalFiles: fileStructure.totalFiles,
    totalDirectories: fileStructure.totalDirectories,
    categories: Object.keys(fileStructure.categories || {})
  });
};

// Architecture analysis logging
export const logArchitectureDetection = (patterns: string[], architecture?: any) => {
  console.log(`   ${colors.yellow}🏗️${colors.reset} Architecture Detection:`);
  
  if (patterns.length > 0) {
    console.log(`${colors.yellow}      Patterns: ${patterns.join(', ')}${colors.reset}`);
  } else {
    console.log(`${colors.gray}      No patterns detected${colors.reset}`);
  }
  
  if (architecture) {
    console.log(`${colors.yellow}      Type: ${architecture.type}${colors.reset}`);
    console.log(`${colors.yellow}      Complexity: ${architecture.complexity}${colors.reset}`);
  }
  
  enhancedLogger.info('Architecture patterns detected', { patterns, architecture });
};

// Export original logger functions for compatibility
export { logInfo, logError, logDebug, logWarn } from './logger';