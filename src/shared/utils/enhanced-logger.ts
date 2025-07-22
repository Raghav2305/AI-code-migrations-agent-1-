import winston from 'winston';
import chalk from 'chalk';

// Enhanced console formatter for better terminal output
const enhancedConsoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const time = new Date(timestamp as string).toLocaleTimeString();
  
  // Color coding for different log levels
  let levelColor;
  let icon;
  switch (level) {
    case 'error':
      levelColor = chalk.red.bold;
      icon = '❌';
      break;
    case 'warn':
      levelColor = chalk.yellow.bold;
      icon = '⚠️';
      break;
    case 'info':
      levelColor = chalk.blue.bold;
      icon = '📊';
      break;
    case 'debug':
      levelColor = chalk.gray;
      icon = '🔍';
      break;
    case 'verbose':
      levelColor = chalk.cyan;
      icon = '💬';
      break;
    default:
      levelColor = chalk.white;
      icon = '📝';
  }
  
  // Format the main message
  const formattedMessage = `${chalk.gray(time)} ${icon} ${levelColor(level.toUpperCase())} ${chalk.white(message)}`;
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    const metaString = JSON.stringify(meta, null, 2);
    return `${formattedMessage}\n${chalk.gray('   Meta:')} ${chalk.cyan(metaString)}`;
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
    
    console.log(chalk.green.bold('\n🚀 STARTING ANALYSIS'));
    console.log(chalk.blue(`📁 Operation: ${operation}`));
    if (this.steps.length > 0) {
      console.log(chalk.gray(`📋 Steps: ${this.steps.join(' → ')}`));
    }
    console.log(chalk.gray(`⏰ Started at: ${new Date().toLocaleTimeString()}`));
    console.log(chalk.gray('━'.repeat(80)));
  }
  
  step(stepName: string, details?: any) {
    this.currentStep++;
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log(`\n${chalk.yellow('⚡')} ${chalk.bold(`STEP ${this.currentStep}: ${stepName}`)}`);
    console.log(chalk.gray(`   ⏱️  Elapsed: ${elapsed}s`));
    
    if (details) {
      if (typeof details === 'string') {
        console.log(chalk.cyan(`   📝 ${details}`));
      } else {
        console.log(chalk.cyan('   📝 Details:'));
        Object.entries(details).forEach(([key, value]) => {
          console.log(chalk.cyan(`      ${key}: ${JSON.stringify(value)}`));
        });
      }
    }
  }
  
  progress(message: string, current?: number, total?: number) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    if (current !== undefined && total !== undefined) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = this.createProgressBar(percentage);
      console.log(`   ${progressBar} ${chalk.bold(`${current}/${total}`)} - ${message} ${chalk.gray(`(${elapsed}s)`)}`);
    } else {
      console.log(`   ${chalk.blue('◦')} ${message} ${chalk.gray(`(${elapsed}s)`)}`);
    }
  }
  
  success(message: string, results?: any) {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log(chalk.gray('━'.repeat(80)));
    console.log(chalk.green.bold(`✅ SUCCESS: ${message}`));
    console.log(chalk.gray(`⏱️  Total time: ${totalTime}s`));
    
    if (results) {
      console.log(chalk.green('📊 Results:'));
      Object.entries(results).forEach(([key, value]) => {
        console.log(chalk.green(`   ✓ ${key}: ${JSON.stringify(value)}`));
      });
    }
    
    console.log(chalk.green.bold('🎉 ANALYSIS COMPLETED SUCCESSFULLY\n'));
  }
  
  error(message: string, error?: Error) {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log(chalk.gray('━'.repeat(80)));
    console.log(chalk.red.bold(`❌ ERROR: ${message}`));
    console.log(chalk.gray(`⏱️  Failed after: ${totalTime}s`));
    
    if (error) {
      console.log(chalk.red('🔥 Error details:'));
      console.log(chalk.red(`   Message: ${error.message}`));
      if (error.stack) {
        console.log(chalk.gray(`   Stack: ${error.stack.split('\n')[1]?.trim()}`));
      }
    }
    
    console.log(chalk.red.bold('💥 ANALYSIS FAILED\n'));
  }
  
  private createProgressBar(percentage: number, width: number = 30): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    const filledBar = chalk.green('█'.repeat(filled));
    const emptyBar = chalk.gray('░'.repeat(empty));
    
    return `[${filledBar}${emptyBar}] ${chalk.bold(`${percentage}%`)}`;
  }
}

// Global progress tracker instance
export const progress = new ProgressTracker();

// Enhanced logging functions with better terminal output
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

// Enhanced info logging with better formatting
export const logEnhancedInfo = (message: string, meta?: any) => {
  console.log(`   ${chalk.blue('◦')} ${message}`);
  if (meta) {
    console.log(chalk.cyan(`      ${JSON.stringify(meta, null, 2)}`));
  }
  enhancedLogger.info(message, meta);
};

// AI interaction logging
export const logAICall = (operation: string, prompt?: string, response?: any) => {
  console.log(`   ${chalk.magenta('🤖')} AI Call: ${operation}`);
  if (prompt) {
    const truncatedPrompt = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
    console.log(chalk.gray(`      Prompt: ${truncatedPrompt}`));
  }
  if (response) {
    console.log(chalk.gray(`      Response received: ${typeof response} (${JSON.stringify(response).length} chars)`));
  }
  
  enhancedLogger.info(`AI Call: ${operation}`, { 
    promptLength: prompt?.length, 
    responseType: typeof response,
    responseLength: JSON.stringify(response).length 
  });
};

// Repository analysis specific logging
export const logRepoInfo = (repo: any) => {
  console.log(`   ${chalk.green('📊')} Repository Info:`);
  console.log(chalk.green(`      Name: ${repo.name}`));
  console.log(chalk.green(`      Owner: ${repo.owner}`));
  console.log(chalk.green(`      Language: ${repo.language}`));
  console.log(chalk.green(`      Stars: ${repo.stars || 0}`));
  console.log(chalk.green(`      Description: ${repo.description?.substring(0, 80) || 'None'}...`));
  
  enhancedLogger.info('Repository information extracted', repo);
};

// File analysis logging
export const logFileAnalysis = (fileStructure: any) => {
  console.log(`   ${chalk.cyan('📁')} File Analysis:`);
  console.log(chalk.cyan(`      Total Files: ${fileStructure.totalFiles}`));
  console.log(chalk.cyan(`      Directories: ${fileStructure.totalDirectories}`));
  
  // Show category breakdown
  Object.entries(fileStructure.categories || {}).forEach(([category, files]: [string, any]) => {
    if (files && files.length > 0) {
      console.log(chalk.cyan(`      ${category}: ${files.length} files`));
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
  console.log(`   ${chalk.yellow('🏗️')} Architecture Detection:`);
  
  if (patterns.length > 0) {
    console.log(chalk.yellow(`      Patterns: ${patterns.join(', ')}`));
  } else {
    console.log(chalk.gray('      No patterns detected'));
  }
  
  if (architecture) {
    console.log(chalk.yellow(`      Type: ${architecture.type}`));
    console.log(chalk.yellow(`      Complexity: ${architecture.complexity}`));
  }
  
  enhancedLogger.info('Architecture patterns detected', { patterns, architecture });
};

// Export original logger functions for compatibility
export { logInfo, logError, logDebug, logWarn } from './logger';