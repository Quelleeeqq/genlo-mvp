import OpenAI from 'openai';
import { ChatMessage } from '../types/chat';

export interface OpenAIConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenAIImageAnalysisRequest {
  prompt: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIWebSearchRequest {
  query: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIStreamingResponse {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class OpenAIProvider {
  private client: OpenAI;
  private defaultConfig: OpenAIConfig;

  constructor(config: OpenAIConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 30000 // 30 second timeout
    });

    this.defaultConfig = {
      model: 'o4-mini-2025-04-16',
      maxTokens: 1000,
      temperature: 0.7,
      stream: false,
      ...config
    };
  }

  // Basic text generation
  async generateText(
    messages: ChatMessage[],
    config: Partial<OpenAIConfig> = {}
  ): Promise<{
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      const completion = await this.client.chat.completions.create({
        model: finalConfig.model!,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        max_tokens: finalConfig.maxTokens,
        temperature: finalConfig.temperature,
        stream: false
      });

      return {
        content: completion.choices[0]?.message?.content || '',
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      console.error('OpenAI text generation error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Image analysis
  async analyzeImage(request: OpenAIImageAnalysisRequest): Promise<{
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      let imageUrl: string;

      if (request.imageBase64) {
        // Use base64 image
        imageUrl = `data:${request.mimeType || 'image/jpeg'};base64,${request.imageBase64}`;
      } else if (request.imageUrl) {
        // Use URL image
        imageUrl = request.imageUrl;
      } else {
        throw new Error('Either imageUrl or imageBase64 must be provided');
      }

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: request.prompt },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: request.maxTokens || this.defaultConfig.maxTokens,
        temperature: request.temperature || this.defaultConfig.temperature
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      console.error('OpenAI image analysis error:', error);
      throw new Error(`OpenAI image analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Web search
  async webSearch(request: OpenAIWebSearchRequest): Promise<{
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: request.model || 'gpt-4o-search-preview',
        web_search_options: {},
        messages: [
          {
            role: 'user',
            content: request.query
          }
        ],
        max_tokens: request.maxTokens || this.defaultConfig.maxTokens,
        temperature: request.temperature || this.defaultConfig.temperature
      });

      return {
        content: completion.choices[0]?.message?.content || '',
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      console.error('OpenAI web search error:', error);
      throw new Error(`OpenAI web search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Streaming text generation
  async *generateTextStream(
    messages: ChatMessage[],
    config: Partial<OpenAIConfig> = {}
  ): AsyncGenerator<OpenAIStreamingResponse> {
    const finalConfig = { ...this.defaultConfig, ...config, stream: true };

    try {
      const stream = await this.client.chat.completions.create({
        model: finalConfig.model!,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        max_tokens: finalConfig.maxTokens,
        temperature: finalConfig.temperature,
        stream: true
      });

      let content = '';
      let usage: any = undefined;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          content += delta.content;
          yield {
            content: delta.content,
            done: false
          };
        }

        if (chunk.usage) {
          usage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens
          };
        }
      }

      // Final chunk with complete content and usage
      yield {
        content: '',
        done: true,
        usage
      };
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw new Error(`OpenAI streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Function calling
  async generateWithFunctionCalling(
    messages: ChatMessage[],
    functions: any[],
    config: Partial<OpenAIConfig> = {}
  ): Promise<{
    content: string;
    functionCall?: {
      name: string;
      arguments: string;
    };
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      const completion = await this.client.chat.completions.create({
        model: finalConfig.model!,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        tools: functions,
        tool_choice: 'auto',
        max_tokens: finalConfig.maxTokens,
        temperature: finalConfig.temperature
      });

      const choice = completion.choices[0];
      const message = choice?.message;

      return {
        content: message?.content || '',
        functionCall: message?.tool_calls?.[0] ? {
          name: message.tool_calls[0].function.name,
          arguments: message.tool_calls[0].function.arguments
        } : undefined,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      console.error('OpenAI function calling error:', error);
      throw new Error(`OpenAI function calling error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get available models
  async getModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map((model: any) => model.id);
    } catch (error) {
      console.error('OpenAI get models error:', error);
      throw new Error(`OpenAI get models error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

// Factory function to create OpenAI provider
export function createOpenAIProvider(config: OpenAIConfig = {}): OpenAIProvider {
  return new OpenAIProvider(config);
}

// Default provider instance
export const openAIProvider = createOpenAIProvider(); 