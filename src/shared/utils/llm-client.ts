import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { logInfo, logError } from './logger';

export interface LLMConfig {
  provider: 'gemini' | 'anthropic';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMClient {
  private geminiClient?: ChatGoogleGenerativeAI;
  private anthropicClient?: ChatAnthropic;
  private config: LLMConfig;

  constructor(config: LLMConfig = { provider: 'gemini' }) {
    this.config = config;
    this.initializeClients();
  }

  private initializeClients() {
    try {
      // Initialize Gemini client
      if (process.env.GEMINI_KEY_AI_HACKATHON) {
        this.geminiClient = new ChatGoogleGenerativeAI({
          model: this.config.model || 'gemini-2.5-flash',
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 8192, // Increased for better JSON completion
          apiKey: process.env.GEMINI_KEY_AI_HACKATHON,
        });
        logInfo('Gemini client initialized successfully');
      }

      // Initialize Anthropic client as fallback
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicClient = new ChatAnthropic({
          model: 'claude-3-haiku-20240307',
          temperature: this.config.temperature || 0.7,
          maxTokens: this.config.maxTokens || 2048,
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        logInfo('Anthropic client initialized successfully');
      }
    } catch (error) {
      logError('Failed to initialize LLM clients', error as Error);
    }
  }

  async generateResponse(messages: BaseMessage[], options?: { retries?: number }): Promise<string> {
    const { retries = 2 } = options || {};
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Try primary provider first
        if (this.config.provider === 'gemini' && this.geminiClient) {
          logInfo('Using Gemini for LLM generation');
          const response = await this.geminiClient.invoke(messages);
          return response.content.toString();
        }
        
        if (this.config.provider === 'anthropic' && this.anthropicClient) {
          logInfo('Using Anthropic for LLM generation');
          const response = await this.anthropicClient.invoke(messages);
          return response.content.toString();
        }

        // Fallback to available provider
        if (this.geminiClient) {
          logInfo('Falling back to Gemini');
          const response = await this.geminiClient.invoke(messages);
          return response.content.toString();
        }

        if (this.anthropicClient) {
          logInfo('Falling back to Anthropic');
          const response = await this.anthropicClient.invoke(messages);
          return response.content.toString();
        }

        throw new Error('No LLM provider available');
      } catch (error) {
        logError(`LLM generation attempt ${attempt + 1} failed`, error as Error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    throw new Error('All LLM generation attempts failed');
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: BaseMessage[] = [];
    
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }
    
    messages.push(new HumanMessage(prompt));
    
    // Log request details for debugging
    logInfo('Generating text with LLM', { 
      promptLength: prompt.length, 
      systemPromptLength: systemPrompt?.length || 0,
      messagesCount: messages.length 
    });
    
    const response = await this.generateResponse(messages);
    
    // Log response details
    logInfo('LLM text generation completed', { 
      responseLength: response.length,
      isEmpty: !response || response.trim().length === 0
    });
    
    return response;
  }

  async generateStructuredResponse<T>(
    prompt: string, 
    schema: string, 
    systemPrompt?: string
  ): Promise<T> {
    // Check input size limits
    const maxPromptLength = 100000; // 100KB limit
    if (prompt.length > maxPromptLength) {
      logError('Prompt too large', new Error(`Prompt length ${prompt.length} exceeds maximum ${maxPromptLength}`));
      throw new Error(`Prompt is too large (${prompt.length} characters). Try with a smaller repository or reduce the analysis scope.`);
    }
    
    const fullSystemPrompt = `${systemPrompt || ''}\n\nPlease respond with valid JSON that matches this schema: ${schema}. Do not wrap the JSON in markdown code blocks.`;
    
    let response: string;
    try {
      response = await this.generateText(prompt, fullSystemPrompt);
    } catch (error) {
      logError('LLM generation failed', error as Error);
      throw new Error(`LLM generation failed: ${(error as Error).message}. This might be due to rate limits, content filtering, or service issues.`);
    }
    
    // Log the response for debugging
    logInfo('LLM Response received', { responseLength: response.length, responsePreview: response.substring(0, 200) });
    
    // Check if response is empty
    if (!response || response.trim().length === 0) {
      logError('Empty response from LLM', new Error('LLM returned empty response'));
      throw new Error('LLM returned empty response. This might be due to content filtering, rate limits, or input being too large.');
    }
    
    try {
      // First, try to extract JSON from markdown code blocks
      const markdownJsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownJsonMatch) {
        logInfo('Found JSON in markdown code block');
        return JSON.parse(markdownJsonMatch[1]);
      }
      
      // Try to extract JSON from generic code blocks
      const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        logInfo('Found JSON in generic code block');
        return JSON.parse(codeBlockMatch[1]);
      }
      
      // Try to extract JSON object from response (non-greedy)
      const jsonMatch = response.match(/\{[\s\S]*?\}(?=\s*$|$)/);
      if (jsonMatch) {
        logInfo('Found JSON object in response');
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try parsing the whole response
      logInfo('Attempting to parse entire response as JSON');
      return JSON.parse(response.trim());
    } catch (error) {
      logError('JSON parsing failed, attempting repair', error as Error, { 
        response: response.substring(0, 1000), // Log first 1000 chars
        responseLength: response.length 
      });
      
      // Try to repair truncated JSON
      const repairedJson = this.repairTruncatedJson(response);
      if (repairedJson) {
        logInfo('Successfully repaired truncated JSON');
        return repairedJson;
      }
      
      throw new Error(`Failed to parse structured response: ${(error as Error).message}`);
    }
  }

  private repairTruncatedJson(response: string): any | null {
    try {
      // Extract JSON-like content from response
      let jsonStr = response.trim();
      
      // Try to find JSON object boundaries
      const startIndex = jsonStr.indexOf('{');
      if (startIndex === -1) return null;
      
      let braceCount = 0;
      let endIndex = -1;
      
      for (let i = startIndex; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++;
        if (jsonStr[i] === '}') braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
      
      // If we found complete JSON, parse it
      if (endIndex !== -1) {
        return JSON.parse(jsonStr.substring(startIndex, endIndex + 1));
      }
      
      // Try to repair truncated JSON
      jsonStr = jsonStr.substring(startIndex);
      
      // Common repair patterns
      const repairs = [
        // Fix unterminated string at the end
        () => {
          if (jsonStr.endsWith('"')) {
            return jsonStr;
          }
          // Find the last quote and try to close it
          const lastQuoteIndex = jsonStr.lastIndexOf('"');
          if (lastQuoteIndex > 0) {
            let repaired = jsonStr.substring(0, lastQuoteIndex + 1);
            // Close any open arrays/objects
            let openBraces = 0;
            let openBrackets = 0;
            for (let i = 0; i < repaired.length; i++) {
              if (repaired[i] === '{') openBraces++;
              if (repaired[i] === '}') openBraces--;
              if (repaired[i] === '[') openBrackets++;
              if (repaired[i] === ']') openBrackets--;
            }
            while (openBrackets > 0) { repaired += ']'; openBrackets--; }
            while (openBraces > 0) { repaired += '}'; openBraces--; }
            return repaired;
          }
          return null;
        },
        
        // Fix incomplete object/array
        () => {
          let repaired = jsonStr;
          // Remove trailing comma if present
          repaired = repaired.replace(/,\s*$/, '');
          
          // Count braces and brackets
          let openBraces = 0;
          let openBrackets = 0;
          for (let i = 0; i < repaired.length; i++) {
            if (repaired[i] === '{') openBraces++;
            if (repaired[i] === '}') openBraces--;
            if (repaired[i] === '[') openBrackets++;
            if (repaired[i] === ']') openBrackets--;
          }
          
          // Close open structures
          while (openBrackets > 0) { repaired += ']'; openBrackets--; }
          while (openBraces > 0) { repaired += '}'; openBraces--; }
          
          return repaired;
        }
      ];
      
      // Try each repair strategy
      for (const repair of repairs) {
        try {
          const repairedStr = repair();
          if (repairedStr) {
            const parsed = JSON.parse(repairedStr);
            logInfo('JSON repair successful with strategy', { repairStrategy: repair.name });
            return parsed;
          }
        } catch (e) {
          // Continue to next repair strategy
        }
      }
      
      return null;
    } catch (error) {
      logError('JSON repair failed', error as Error);
      return null;
    }
  }

  isAvailable(): boolean {
    return !!(this.geminiClient || this.anthropicClient);
  }

  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.geminiClient) providers.push('gemini');
    if (this.anthropicClient) providers.push('anthropic');
    return providers;
  }
}