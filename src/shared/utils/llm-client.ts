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
      if (process.env.GOOGLE_API_KEY) {
        this.geminiClient = new ChatGoogleGenerativeAI({
          model: this.config.model || 'gemini-2.5-flash',
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 2048,
          apiKey: process.env.GOOGLE_API_KEY,
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
    
    return this.generateResponse(messages);
  }

  async generateStructuredResponse<T>(
    prompt: string, 
    schema: string, 
    systemPrompt?: string
  ): Promise<T> {
    const fullSystemPrompt = `${systemPrompt || ''}\n\nPlease respond with valid JSON that matches this schema: ${schema}`;
    
    const response = await this.generateText(prompt, fullSystemPrompt);
    
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try parsing the whole response
      return JSON.parse(response);
    } catch (error) {
      logError('Failed to parse structured response', error as Error, { response });
      throw new Error(`Failed to parse structured response: ${(error as Error).message}`);
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