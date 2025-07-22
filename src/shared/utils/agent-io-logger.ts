/**
 * Agent Input/Output Logger
 * Captures exact data flowing between agents for debugging and analysis
 */

import fs from 'fs-extra';
import path from 'path';
import { enhancedLogger } from './simple-enhanced-logger';

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

interface AgentIOLog {
  agentName: string;
  operation: string;
  timestamp: string;
  input?: any;
  output?: any;
  error?: string;
  executionTime?: number;
}

class AgentIOLogger {
  private logsDir: string = 'logs/agent-io';
  
  constructor() {
    // Ensure logs directory exists
    fs.ensureDirSync(this.logsDir);
  }

  /**
   * Log Agent Input - what the agent receives
   */
  async logInput(agentName: string, operation: string, input: any) {
    const timestamp = new Date().toISOString();
    const inputId = this.generateId();
    
    console.log(`\n${colors.cyan}📥 AGENT INPUT${colors.reset}`);
    console.log(`${colors.bright}Agent: ${agentName}${colors.reset}`);
    console.log(`${colors.bright}Operation: ${operation}${colors.reset}`);
    console.log(`${colors.gray}Input ID: ${inputId}${colors.reset}`);
    console.log(`${colors.gray}Timestamp: ${new Date().toLocaleTimeString()}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    // Log input structure overview
    this.logDataStructure('INPUT', input);
    
    // Log key metrics if available
    if (input && typeof input === 'object') {
      this.logKeyMetrics('INPUT', input);
    }
    
    // Save detailed input to file
    const inputLog: AgentIOLog = {
      agentName,
      operation,
      timestamp,
      input
    };
    
    const inputFilename = `${agentName.toLowerCase().replace(/\s+/g, '-')}-${operation.toLowerCase().replace(/\s+/g, '-')}-input-${inputId}.json`;
    await this.saveToFile(inputFilename, inputLog);
    
    console.log(`${colors.gray}💾 Detailed input saved to: ${inputFilename}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    enhancedLogger.info(`Agent Input: ${agentName} - ${operation}`, {
      agentName,
      operation,
      inputId,
      inputType: typeof input,
      inputSize: JSON.stringify(input).length
    });
    
    return inputId;
  }

  /**
   * Log Agent Output - what the agent produces
   */
  async logOutput(agentName: string, operation: string, output: any, inputId?: string, executionTime?: number) {
    const timestamp = new Date().toISOString();
    const outputId = this.generateId();
    
    console.log(`\n${colors.green}📤 AGENT OUTPUT${colors.reset}`);
    console.log(`${colors.bright}Agent: ${agentName}${colors.reset}`);
    console.log(`${colors.bright}Operation: ${operation}${colors.reset}`);
    console.log(`${colors.gray}Output ID: ${outputId}${colors.reset}`);
    if (inputId) {
      console.log(`${colors.gray}Related Input ID: ${inputId}${colors.reset}`);
    }
    if (executionTime) {
      console.log(`${colors.gray}Execution Time: ${executionTime.toFixed(2)}s${colors.reset}`);
    }
    console.log(`${colors.gray}Timestamp: ${new Date().toLocaleTimeString()}${colors.reset}`);
    console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    // Log output structure overview
    this.logDataStructure('OUTPUT', output);
    
    // Log key metrics if available
    if (output && typeof output === 'object') {
      this.logKeyMetrics('OUTPUT', output);
    }
    
    // Save detailed output to file
    const outputLog: AgentIOLog = {
      agentName,
      operation,
      timestamp,
      output,
      executionTime
    };
    
    const outputFilename = `${agentName.toLowerCase().replace(/\s+/g, '-')}-${operation.toLowerCase().replace(/\s+/g, '-')}-output-${outputId}.json`;
    await this.saveToFile(outputFilename, outputLog);
    
    console.log(`${colors.gray}💾 Detailed output saved to: ${outputFilename}${colors.reset}`);
    console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    enhancedLogger.info(`Agent Output: ${agentName} - ${operation}`, {
      agentName,
      operation,
      outputId,
      inputId,
      outputType: typeof output,
      outputSize: JSON.stringify(output).length,
      executionTime
    });
    
    return outputId;
  }

  /**
   * Log Agent Error - when agent fails
   */
  async logError(agentName: string, operation: string, error: Error, inputId?: string, executionTime?: number) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateId();
    
    console.log(`\n${colors.red}💥 AGENT ERROR${colors.reset}`);
    console.log(`${colors.bright}Agent: ${agentName}${colors.reset}`);
    console.log(`${colors.bright}Operation: ${operation}${colors.reset}`);
    console.log(`${colors.gray}Error ID: ${errorId}${colors.reset}`);
    if (inputId) {
      console.log(`${colors.gray}Related Input ID: ${inputId}${colors.reset}`);
    }
    if (executionTime) {
      console.log(`${colors.gray}Failed After: ${executionTime.toFixed(2)}s${colors.reset}`);
    }
    console.log(`${colors.gray}Timestamp: ${new Date().toLocaleTimeString()}${colors.reset}`);
    console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    console.log(`${colors.red}🔥 Error Message: ${error.message}${colors.reset}`);
    if (error.stack) {
      console.log(`${colors.gray}📚 Stack Trace:${colors.reset}`);
      console.log(`${colors.gray}${error.stack.split('\n').slice(0, 3).join('\n')}${colors.reset}`);
    }
    
    // Save detailed error to file
    const errorLog: AgentIOLog = {
      agentName,
      operation,
      timestamp,
      error: error.message,
      executionTime
    };
    
    const errorFilename = `${agentName.toLowerCase().replace(/\s+/g, '-')}-${operation.toLowerCase().replace(/\s+/g, '-')}-error-${errorId}.json`;
    await this.saveToFile(errorFilename, {
      ...errorLog,
      fullError: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
    
    console.log(`${colors.gray}💾 Error details saved to: ${errorFilename}${colors.reset}`);
    console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    
    enhancedLogger.error(`Agent Error: ${agentName} - ${operation}`, {
      agentName,
      operation,
      errorId,
      inputId,
      errorMessage: error.message,
      executionTime
    });
    
    return errorId;
  }

  /**
   * Log data structure overview
   */
  private logDataStructure(type: 'INPUT' | 'OUTPUT', data: any) {
    console.log(`${colors.yellow}📊 ${type} STRUCTURE:${colors.reset}`);
    
    if (data === null || data === undefined) {
      console.log(`${colors.gray}   Type: ${typeof data}${colors.reset}`);
      return;
    }
    
    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        console.log(`${colors.yellow}   Type: Array[${data.length}]${colors.reset}`);
        if (data.length > 0) {
          console.log(`${colors.yellow}   First Item Type: ${typeof data[0]}${colors.reset}`);
        }
      } else {
        console.log(`${colors.yellow}   Type: Object${colors.reset}`);
        const keys = Object.keys(data);
        console.log(`${colors.yellow}   Properties: ${keys.length}${colors.reset}`);
        if (keys.length > 0) {
          console.log(`${colors.yellow}   Keys: ${keys.slice(0, 8).join(', ')}${keys.length > 8 ? '...' : ''}${colors.reset}`);
        }
      }
    } else {
      console.log(`${colors.yellow}   Type: ${typeof data}${colors.reset}`);
      if (typeof data === 'string') {
        console.log(`${colors.yellow}   Length: ${data.length} characters${colors.reset}`);
      }
    }
    
    // Size information
    try {
      const jsonString = JSON.stringify(data);
      console.log(`${colors.yellow}   JSON Size: ${jsonString.length} characters${colors.reset}`);
      console.log(`${colors.yellow}   Memory Size: ~${Math.round(jsonString.length / 1024)} KB${colors.reset}`);
    } catch (error) {
      console.log(`${colors.gray}   Size: Cannot serialize${colors.reset}`);
    }
  }

  /**
   * Log key metrics from data
   */
  private logKeyMetrics(type: 'INPUT' | 'OUTPUT', data: any) {
    console.log(`${colors.magenta}🔢 KEY ${type} METRICS:${colors.reset}`);
    
    if (type === 'INPUT') {
      // Agent 1 to Agent 2 input metrics
      if (data.repository) {
        console.log(`${colors.magenta}   Repository: ${data.repository.name} (${data.repository.owner})${colors.reset}`);
        console.log(`${colors.magenta}   Language: ${data.repository.language || 'Unknown'}${colors.reset}`);
        console.log(`${colors.magenta}   Stars: ${data.repository.stars || 0}${colors.reset}`);
      }
      
      if (data.fileStructure) {
        console.log(`${colors.magenta}   Total Files: ${data.fileStructure.totalFiles}${colors.reset}`);
        console.log(`${colors.magenta}   Directories: ${data.fileStructure.totalDirectories}${colors.reset}`);
        
        // File categories
        if (data.fileStructure.categories) {
          const categoryCount = Object.keys(data.fileStructure.categories).length;
          console.log(`${colors.magenta}   File Categories: ${categoryCount}${colors.reset}`);
          
          Object.entries(data.fileStructure.categories).forEach(([category, files]: [string, any]) => {
            if (files && files.length > 0) {
              console.log(`${colors.magenta}     ${category}: ${files.length} files${colors.reset}`);
            }
          });
        }
        
        if (data.fileStructure.mainFiles) {
          console.log(`${colors.magenta}   Main Files: ${data.fileStructure.mainFiles.length}${colors.reset}`);
        }
      }
      
      if (data.summary) {
        console.log(`${colors.magenta}   Project Type: ${data.summary.projectType}${colors.reset}`);
        console.log(`${colors.magenta}   Complexity: ${data.summary.complexity}${colors.reset}`);
        console.log(`${colors.magenta}   Technologies: ${data.summary.mainTechnologies?.length || 0} identified${colors.reset}`);
      }
      
      if (data.insights) {
        console.log(`${colors.magenta}   Insights: ${data.insights.length} generated${colors.reset}`);
      }
    } else {
      // Agent 2 output metrics
      if (data.architecture) {
        console.log(`${colors.magenta}   Architecture Type: ${data.architecture.type}${colors.reset}`);
        console.log(`${colors.magenta}   Complexity: ${data.architecture.complexity}${colors.reset}`);
        console.log(`${colors.magenta}   Layers: ${data.architecture.layers?.length || 0}${colors.reset}`);
        console.log(`${colors.magenta}   Components: ${data.architecture.components?.length || 0}${colors.reset}`);
        console.log(`${colors.magenta}   Entry Points: ${data.architecture.entryPoints?.length || 0}${colors.reset}`);
        console.log(`${colors.magenta}   Patterns: ${data.architecture.patterns?.length || 0}${colors.reset}`);
        
        if (data.architecture.techStack) {
          console.log(`${colors.magenta}   Tech Stack:${colors.reset}`);
          console.log(`${colors.magenta}     Language: ${data.architecture.techStack.language}${colors.reset}`);
          console.log(`${colors.magenta}     Frameworks: ${data.architecture.techStack.frameworks?.length || 0}${colors.reset}`);
          console.log(`${colors.magenta}     Libraries: ${data.architecture.techStack.libraries?.length || 0}${colors.reset}`);
          console.log(`${colors.magenta}     Tools: ${data.architecture.techStack.tools?.length || 0}${colors.reset}`);
        }
      }
      
      if (data.recommendations) {
        console.log(`${colors.magenta}   Recommendations: ${data.recommendations.length}${colors.reset}`);
      }
      
      if (data.migrationComplexity) {
        console.log(`${colors.magenta}   Migration Complexity: ${data.migrationComplexity}${colors.reset}`);
      }
      
      if (data.fileAnalysis) {
        console.log(`${colors.magenta}   File Analysis:${colors.reset}`);
        console.log(`${colors.magenta}     Total: ${data.fileAnalysis.totalFiles}${colors.reset}`);
        console.log(`${colors.magenta}     Source: ${data.fileAnalysis.sourceFiles}${colors.reset}`);
        console.log(`${colors.magenta}     Config: ${data.fileAnalysis.configFiles}${colors.reset}`);
        console.log(`${colors.magenta}     Tests: ${data.fileAnalysis.testFiles}${colors.reset}`);
      }
    }
  }

  /**
   * Save data to JSON file
   */
  private async saveToFile(filename: string, data: any) {
    try {
      const filepath = path.join(this.logsDir, filename);
      await fs.writeJSON(filepath, data, { spaces: 2 });
    } catch (error) {
      console.error(`Failed to save log file ${filename}:`, error);
    }
  }

  /**
   * Generate unique ID for logs
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Create comparison between input and output
   */
  async logComparison(agentName: string, operation: string, input: any, output: any) {
    console.log(`\n${colors.cyan}🔄 AGENT INPUT/OUTPUT COMPARISON${colors.reset}`);
    console.log(`${colors.bright}Agent: ${agentName}${colors.reset}`);
    console.log(`${colors.bright}Operation: ${operation}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    console.log(`${colors.yellow}📥 INPUT SUMMARY:${colors.reset}`);
    try {
      const inputSize = JSON.stringify(input).length;
      console.log(`${colors.yellow}   Size: ${inputSize} characters (${Math.round(inputSize / 1024)} KB)${colors.reset}`);
    } catch (e) {
      console.log(`${colors.yellow}   Size: Cannot serialize${colors.reset}`);
    }
    
    console.log(`${colors.green}📤 OUTPUT SUMMARY:${colors.reset}`);
    try {
      const outputSize = JSON.stringify(output).length;
      console.log(`${colors.green}   Size: ${outputSize} characters (${Math.round(outputSize / 1024)} KB)${colors.reset}`);
    } catch (e) {
      console.log(`${colors.green}   Size: Cannot serialize${colors.reset}`);
    }
    
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }
}

// Global instance
export const agentIOLogger = new AgentIOLogger();

// Convenience functions for specific agents
export const logAgent2Input = (input: any) => agentIOLogger.logInput('Architecture Inference Agent', 'analyze', input);
export const logAgent2Output = (output: any, inputId?: string, executionTime?: number) => 
  agentIOLogger.logOutput('Architecture Inference Agent', 'analyze', output, inputId, executionTime);
export const logAgent2Error = (error: Error, inputId?: string, executionTime?: number) => 
  agentIOLogger.logError('Architecture Inference Agent', 'analyze', error, inputId, executionTime);

export const logAgent3Input = (input: any) => agentIOLogger.logInput('Code Flow Agent', 'analyze', input);
export const logAgent3Output = (output: any, inputId?: string, executionTime?: number) => 
  agentIOLogger.logOutput('Code Flow Agent', 'analyze', output, inputId, executionTime);
export const logAgent3Error = (error: Error, inputId?: string, executionTime?: number) => 
  agentIOLogger.logError('Code Flow Agent', 'analyze', error, inputId, executionTime);

export const logAgent4Input = (inputId: string, input: any) => agentIOLogger.logInput('Risk Assessment Agent', 'analyze', input);
export const logAgent4Output = (inputId: string, output: any, executionTime: number) => 
  agentIOLogger.logOutput('Risk Assessment Agent', 'analyze', output, inputId, executionTime);
export const logAgent4Error = (inputId: string, error: Error, executionTime: number) => 
  agentIOLogger.logError('Risk Assessment Agent', 'analyze', error, inputId, executionTime);

export default agentIOLogger;