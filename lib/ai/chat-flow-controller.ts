import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { executeFunction, functionDefinitions } from "./function-handlers";

// AI Flow Architecture for Chat Application
// OpenAI for image generation and text responses, Claude for creativity enhancement
// Enhanced with Function Calling for data fetching and actions

interface AIConfig {
  claude: {
    apiKey: string;
    model: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229';
  };
  openai: {
    apiKey: string;
    model: 'gpt-4.1' | 'gpt-4o' | 'gpt-4o-mini';
    imageModel: 'gpt-image-1' | 'dall-e-3'; // Support both GPT Image and DALL-E 3
    useImageAPI?: boolean; // Option to use Image API instead of Responses API
    vectorStoreIds?: string[]; // Vector store IDs for file search
  };
}

// Structured Output Schemas
const ChatResponseSchema = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "The main response content from the AI"
    },
    confidence: {
      type: "number",
      description: "Confidence level in the response (0-1)",
      minimum: 0,
      maximum: 1
    },
    suggestions: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Optional follow-up suggestions for the user"
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        },
        web_search_used: {
          type: "boolean",
          description: "Whether web search was used in this response",
          default: false
        },
        search_calls: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false
          },
          description: "Details of web search calls made"
        }
      },
      required: ["reasoning", "sources", "functions_used", "web_search_used"],
      additionalProperties: false
    }
  },
  required: ["content", "confidence", "suggestions", "metadata"],
  additionalProperties: false
};

const ImageGenerationSchema = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description: "Detailed description of the generated image"
    },
    style: {
      type: "string",
      description: "Artistic style of the image",
      enum: ["realistic", "artistic", "cartoon", "abstract", "vintage", "modern"]
    },
    mood: {
      type: "string",
      description: "Mood or atmosphere of the image",
      enum: ["bright", "dark", "warm", "cool", "mysterious", "cheerful", "serene", "dramatic"]
    },
    composition: {
      type: "string",
      description: "Composition details like perspective, framing, etc."
    },
    enhanced_prompt: {
      type: "string",
      description: "The enhanced prompt used for generation"
    }
  },
  required: ["description", "style", "mood", "enhanced_prompt"],
  additionalProperties: false
};

const CreativeTaskSchema = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "The creative content (story, poem, etc.)"
    },
    genre: {
      type: "string",
      description: "Genre or type of creative work",
      enum: ["story", "poem", "song", "script", "essay", "brainstorm", "concept"]
    },
    tone: {
      type: "string",
      description: "Tone of the creative work",
      enum: ["humorous", "serious", "romantic", "mysterious", "inspiring", "melancholic", "energetic"]
    },
    themes: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Main themes explored in the work"
    },
    word_count: {
      type: "number",
      description: "Approximate word count of the content",
      minimum: 1
    }
  },
  required: ["content", "genre", "tone"],
  additionalProperties: false
};

// 1. Message Classification System
class MessageClassifier {
  static isImageRequest(message: string): boolean {
    const imageKeywords = [
      'generate', 'create', 'draw', 'image', 'picture', 'photo',
      'illustration', 'artwork', 'design', 'visual', 'sketch', 'show me',
      'woman holding', 'person holding', 'lifestyle', 'product shot', 'product image',
      'with a woman', 'with someone', 'holding it', 'holding the', 'person using',
      'need one with', 'make one with', 'create one with', 'generate one with'
    ];
    
    const lowerMessage = message.toLowerCase();
    return imageKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  static extractImagePrompt(message: string): string {
    // Extract the actual image description from the message
    const patterns = [
      /generate (?:an? )?image (?:of )?(.+)/i,
      /create (?:an? )?(?:image|picture) (?:of )?(.+)/i,
      /draw (?:an? )?(.+)/i,
      /show me (?:an? )?(?:image|picture) (?:of )?(.+)/i,
      /make (?:an? )?(?:image|picture) (?:of )?(.+)/i,
      /need one with (.+)/i,
      /make one with (.+)/i,
      /create one with (.+)/i,
      /generate one with (.+)/i,
      /with a (.+)/i,
      /with (.+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1].trim();
    }
    
    return message; // fallback to full message
  }

  static isCreativeRequest(message: string): boolean {
    const creativeKeywords = [
      'creative', 'imaginative', 'artistic', 'story', 'poem', 'song',
      'write', 'compose', 'brainstorm', 'ideas', 'concept'
    ];
    
    const lowerMessage = message.toLowerCase();
    return creativeKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  static needsFunctionCalling(message: string): boolean {
    const functionKeywords = [
      'weather', 'temperature', 'email', 'send', 'search', 'find', 'query',
      'database', 'file', 'calculate', 'math', 'news', 'knowledge', 'data'
    ];
    
    const lowerMessage = message.toLowerCase();
    return functionKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  static needsWebSearch(message: string): boolean {
    const webSearchKeywords = [
      'latest', 'recent', 'today', 'yesterday', 'this week', 'this month',
      'current', 'breaking', 'news', 'update', 'trending', 'now',
      'what happened', 'what\'s new', 'latest news', 'current events',
      'recent developments', 'latest updates', 'breaking news',
      'search', 'find', 'look up', 'research', 'investigate',
      'weather', 'stock', 'price', 'market', 'crypto', 'bitcoin',
      'election', 'politics', 'sports', 'scores', 'results',
      'movie', 'film', 'box office', 'reviews', 'ratings',
      'restaurant', 'hotel', 'travel', 'vacation', 'tourism'
    ];
    
    const lowerMessage = message.toLowerCase();
    return webSearchKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  static needsFileSearch(message: string): boolean {
    const fileSearchKeywords = [
      'file', 'document', 'pdf', 'search', 'find', 'look up',
      'knowledge base', 'database', 'repository', 'archive',
      'documentation', 'manual', 'guide', 'tutorial', 'reference',
      'report', 'analysis', 'data', 'information', 'content',
      'read', 'analyze', 'examine', 'review', 'study',
      'what does the document say', 'what is in the file',
      'search the files', 'find in documents', 'look through',
      'check the documentation', 'refer to the manual',
      'what does it say about', 'find information about'
    ];
    
    const lowerMessage = message.toLowerCase();
    return fileSearchKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

// 2. AI Service Handlers
class ClaudeHandler {
  private anthropic: Anthropic;
  private config: AIConfig['claude'];

  constructor(config: AIConfig['claude']) {
    this.config = config;
    this.anthropic = new Anthropic({ apiKey: config.apiKey });
  }

  async enhancePrompt(userMessage: string, context?: string): Promise<string> {
    try {
      const systemPrompt = `# Identity
You are a creative prompt enhancement specialist for GenLo. Your role is to transform user requests into detailed, imaginative prompts that will generate high-quality AI responses.

# Instructions
- Enhance prompts to be more descriptive, creative, and engaging
- Add relevant context and details that would improve the output
- Maintain the user's original intent while expanding on it
- For image requests, include visual details like style, composition, lighting, mood
- Keep enhanced prompts under 1000 characters for API compatibility
- Be creative but practical

# Examples

<user_request>
"Draw a cat"
</user_request>

<enhanced_prompt>
"A majestic orange tabby cat sitting regally on a sunlit windowsill, detailed fur texture, warm golden lighting, photorealistic style, high quality"
</enhanced_prompt>

<user_request>
"Write about space"
</user_request>

<enhanced_prompt>
"Compose an engaging narrative about space exploration, focusing on the wonder and mystery of distant galaxies, with vivid descriptions and emotional depth"
</enhanced_prompt>`;

      const msg = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: context 
            ? `Enhance this request: "${userMessage}"\n\nContext: ${context}`
            : `Enhance this request: "${userMessage}"`
        }]
      });

      const content = msg.content[0];
      if (content && 'text' in content) {
        return content.text.trim();
      }
      
      return userMessage; // fallback to original message
    } catch (error) {
      console.error('Claude prompt enhancement error:', error);
      return userMessage; // fallback to original message
    }
  }

  async generateCreativeResponse(
    messages: Array<{role: string; content: string}>,
    systemPrompt?: string
  ): Promise<string> {
    try {
      const msg = await this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 4000,
        system: systemPrompt || "You are a creative and helpful AI assistant for GenLo.",
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      });

      const content = msg.content[0];
      if (content && 'text' in content) {
        return content.text;
      }
      
      return "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }
}

class OpenAIHandler {
  private openai: OpenAI;
  private config: AIConfig['openai'];
  private conversationState: {
    previousResponseId?: string;
    messages: Array<{role: 'developer' | 'user' | 'assistant'; content: string}>;
  } = { messages: [] };

  constructor(config: AIConfig['openai']) {
    this.config = config;
    this.openai = new OpenAI({ apiKey: config.apiKey });
  }

  async generateTextResponse(
    userMessage: string,
    enableFunctionCalling?: boolean,
    enhancedPrompt?: string,
    systemInstructions?: string,
    enableWebSearch?: boolean,
    webSearchOptions?: {
      searchContextSize?: 'low' | 'medium' | 'high';
      userLocation?: {
        type: 'approximate';
        country?: string;
        city?: string;
        region?: string;
        timezone?: string;
      };
    },
    enableFileSearch?: boolean,
    fileSearchOptions?: {
      maxNumResults?: number;
      includeResults?: boolean;
      filters?: {
        type: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
        key: string;
        value: string | number | boolean;
      };
    }
  ): Promise<{
    content: string;
    responseId?: string;
    usage?: any;
    structuredData?: any;
    functionCalls?: any[];
    webSearchCalls?: any[];
    fileSearchCalls?: any[];
  }> {
    try {
      // Determine if web search is needed
      const needsWebSearch = enableWebSearch ?? MessageClassifier.needsWebSearch(userMessage);
      
      // Determine if file search is needed
      const needsFileSearch = enableFileSearch ?? MessageClassifier.needsFileSearch(userMessage);
      
      // Build input with conversation history
      const input = [];
      
      if (systemInstructions) {
        input.push({
          role: 'developer' as const,
          content: systemInstructions
        });
      }
      
      input.push({
        role: 'user' as const,
        content: enhancedPrompt || userMessage
      });

      // Add conversation history
      if (this.conversationState.messages.length > 0) {
        input.push(...this.conversationState.messages.slice(-6));
      }

      // Prepare tools array
      const tools: any[] = [];
      // Always add web search tool
      tools.push({ type: 'web_search_preview' });
      
      // Add web search tool if needed
      if (needsWebSearch) {
        const webSearchTool: any = {
          type: "web_search_preview" as const
        };
        
        if (webSearchOptions?.searchContextSize) {
          webSearchTool.search_context_size = webSearchOptions.searchContextSize;
        }
        
        if (webSearchOptions?.userLocation) {
          webSearchTool.user_location = webSearchOptions.userLocation;
        }
        
        tools.push(webSearchTool);
      }
      
      // Add file search tool if needed
      if (needsFileSearch && this.config.vectorStoreIds && this.config.vectorStoreIds.length > 0) {
        const fileSearchTool: any = {
          type: "file_search" as const,
          vector_store_ids: this.config.vectorStoreIds
        };
        
        if (fileSearchOptions?.maxNumResults) {
          fileSearchTool.max_num_results = fileSearchOptions.maxNumResults;
        }
        
        if (fileSearchOptions?.filters) {
          fileSearchTool.filters = fileSearchOptions.filters;
        }
        
        tools.push(fileSearchTool);
      }
      
      // Add function calling tools if needed
      if (enableFunctionCalling) {
        tools.push(...functionDefinitions);
      }

      const requestBody: any = {
        model: this.config.model,
        input,
        max_output_tokens: 2000,
        text: {
          format: {
            type: "json_schema",
            name: "chat_response",
            schema: ChatResponseSchema,
            strict: true
          }
        }
      };

      if (tools.length > 0) {
        requestBody.tools = tools;
      }

      // Add include parameter for file search results if requested
      if (needsFileSearch && fileSearchOptions?.includeResults) {
        requestBody.include = ["file_search_call.results"];
      }

      if (this.conversationState.previousResponseId) {
        requestBody.previous_response_id = this.conversationState.previousResponseId;
      }

      // Add debug logging for the request body
      console.log('OpenAI request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openai.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {}
        console.error('OpenAI API error details:', errorData);
        const errorMsg = (errorData && typeof errorData === 'object' && 'error' in errorData && errorData.error?.message)
          ? errorData.error.message
          : 'Unknown error';
        throw new Error(`OpenAI API error: ${response.status} - ${errorMsg}`);
      }

      const data = await response.json();
      
      // Handle function calls if present
      if (data.output) {
        const functionCalls = data.output.filter((output: any) => output.type === "function_call");
        const webSearchCalls = data.output.filter((output: any) => output.type === "web_search_call");
        const fileSearchCalls = data.output.filter((output: any) => output.type === "file_search_call");
        
        if (functionCalls.length > 0) {
          // Execute function calls and get results
          const functionResults = await this.executeFunctionCalls(functionCalls, input);
          
          // Make a second call with function results
          return await this.generateTextResponseWithFunctionResults(
            userMessage, 
            functionResults,
            enhancedPrompt, 
            systemInstructions
          );
        }
        
        // Handle web search calls
        if (webSearchCalls.length > 0) {
          return await this.processWebSearchResponse(data, userMessage, enhancedPrompt, systemInstructions);
        }
        
        // Handle file search calls
        if (fileSearchCalls.length > 0) {
          return await this.processFileSearchResponse(data, userMessage, enhancedPrompt, systemInstructions);
        }
      }
      
      // Handle structured output parsing
      let structuredData = null;
      let content = '';
      
      if (data.output && data.output[0]?.content) {
        const outputContent = data.output[0].content[0];
        
        if (outputContent.type === 'output_text') {
          try {
            structuredData = JSON.parse(outputContent.text);
            content = structuredData.content || outputContent.text;
          } catch (parseError) {
            console.warn('Failed to parse structured output, using raw text');
            content = outputContent.text;
          }
        } else if (outputContent.type === 'refusal') {
          content = `I apologize, but I cannot fulfill this request: ${outputContent.refusal}`;
        } else {
          content = outputContent.text || 'No response content available';
        }
      } else {
        content = data.output_text || '';
      }
      
      // Update conversation state
      this.conversationState.previousResponseId = data.id;
      this.conversationState.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: content }
      );

      return {
        content,
        responseId: data.id,
        usage: data.usage,
        structuredData
      };
    } catch (error) {
      console.error('OpenAI text generation error:', error);
      throw error;
    }
  }

  private async executeFunctionCalls(functionCalls: any[], input: any[]): Promise<any[]> {
    const results = [];
    
    for (const functionCall of functionCalls) {
      try {
        const args = JSON.parse(functionCall.arguments);
        const result = await executeFunction(functionCall.name, args);
        
        // Add function call and result to input
        input.push(functionCall);
        input.push({
          type: "function_call_output",
          call_id: functionCall.call_id,
          output: result
        });
        
        results.push({
          functionName: functionCall.name,
          result: result
        });
      } catch (error) {
        console.error(`Error executing function ${functionCall.name}:`, error);
        results.push({
          functionName: functionCall.name,
          result: `Error executing function: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    return results;
  }

  private async generateTextResponseWithFunctionResults(
    userMessage: string,
    functionResults: any[],
    enhancedPrompt?: string,
    systemInstructions?: string
  ): Promise<{
    content: string;
    responseId?: string;
    usage?: any;
    structuredData?: any;
    functionCalls?: any[];
  }> {
    try {
      // Build input with function results
      const input = [];
      
      if (systemInstructions) {
        input.push({
          role: 'developer' as const,
          content: systemInstructions
        });
      }
      
      input.push({
        role: 'user' as const,
        content: enhancedPrompt || userMessage
      });

      // Add conversation history
      if (this.conversationState.messages.length > 0) {
        input.push(...this.conversationState.messages.slice(-6));
      }

      const requestBody: any = {
        model: this.config.model,
        input,
        max_output_tokens: 2000,
        text: {
          format: {
            type: "json_schema",
            name: "chat_response",
            schema: ChatResponseSchema,
            strict: true
          }
        }
      };

      if (this.conversationState.previousResponseId) {
        requestBody.previous_response_id = this.conversationState.previousResponseId;
      }

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openai.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse structured output
      let structuredData = null;
      let content = '';
      
      if (data.output && data.output[0]?.content) {
        const outputContent = data.output[0].content[0];
        
        if (outputContent.type === 'output_text') {
          try {
            structuredData = JSON.parse(outputContent.text);
            content = structuredData.content || outputContent.text;
            
            // Add function information to metadata
            if (structuredData.metadata) {
              structuredData.metadata.functions_used = functionResults.map(f => f.functionName);
            } else {
              structuredData.metadata = {
                functions_used: functionResults.map(f => f.functionName)
              };
            }
          } catch (parseError) {
            console.warn('Failed to parse structured output, using raw text');
            content = outputContent.text;
          }
        } else {
          content = outputContent.text || 'No response content available';
        }
      } else {
        content = data.output_text || '';
      }
      
      // Update conversation state
      this.conversationState.previousResponseId = data.id;
      this.conversationState.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: content }
      );

      return {
        content,
        responseId: data.id,
        usage: data.usage,
        structuredData,
        functionCalls: functionResults
      };
    } catch (error) {
      console.error('OpenAI function result processing error:', error);
      throw error;
    }
  }

  private async processWebSearchResponse(
    data: any,
    userMessage: string,
    enhancedPrompt?: string,
    systemInstructions?: string
  ): Promise<{
    content: string;
    responseId?: string;
    usage?: any;
    structuredData?: any;
    functionCalls?: any[];
    webSearchCalls?: any[];
  }> {
    try {
      // Extract web search calls and messages
      const webSearchCalls = data.output.filter((output: any) => output.type === "web_search_call");
      const messages = data.output.filter((output: any) => output.type === "message");
      
      let content = '';
      let annotations: any[] = [];
      
      // Process message content
      if (messages.length > 0) {
        const message = messages[0];
        if (message.content && message.content[0]) {
          const messageContent = message.content[0];
          content = messageContent.text || '';
          annotations = messageContent.annotations || [];
        }
      }
      
      // Create structured data with web search information
      const structuredData = {
        content: content,
        confidence: 0.9, // High confidence for web-sourced information
        suggestions: [
          "Would you like me to search for more specific information?",
          "I can help you find the latest updates on this topic.",
          "Let me know if you need more details about any of the sources."
        ],
        metadata: {
          reasoning: "Information retrieved from web search to provide current and accurate data.",
          sources: annotations
            .filter((ann: any) => ann.type === 'url_citation')
            .map((ann: any) => ({
              url: ann.url,
              title: ann.title,
              startIndex: ann.start_index,
              endIndex: ann.end_index
            })),
          web_search_used: true,
          search_calls: webSearchCalls.map((call: any) => ({
            id: call.id,
            status: call.status,
            action: call.action,
            query: call.query,
            domains: call.domains
          }))
        }
      };
      
      // Update conversation state
      this.conversationState.previousResponseId = data.id;
      this.conversationState.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: content }
      );

      return {
        content,
        responseId: data.id,
        usage: data.usage,
        structuredData,
        webSearchCalls: webSearchCalls
      };
    } catch (error) {
      console.error('Web search response processing error:', error);
      throw error;
    }
  }

  private async processFileSearchResponse(
    data: any,
    userMessage: string,
    enhancedPrompt?: string,
    systemInstructions?: string
  ): Promise<{
    content: string;
    responseId?: string;
    usage?: any;
    structuredData?: any;
    functionCalls?: any[];
    webSearchCalls?: any[];
    fileSearchCalls?: any[];
  }> {
    try {
      // Extract file search calls and messages
      const fileSearchCalls = data.output.filter((output: any) => output.type === "file_search_call");
      const messages = data.output.filter((output: any) => output.type === "message");
      
      let content = '';
      let annotations: any[] = [];
      
      // Process message content
      if (messages.length > 0) {
        const message = messages[0];
        if (message.content && message.content[0]) {
          const messageContent = message.content[0];
          content = messageContent.text || '';
          annotations = messageContent.annotations || [];
        }
      }
      
      // Create structured data with file search information
      const structuredData = {
        content: content,
        confidence: 0.9, // High confidence for file-sourced information
        suggestions: [
          "Would you like me to search for more specific information in the files?",
          "I can help you find related documents or sections.",
          "Let me know if you need more details about any of the sources."
        ],
        metadata: {
          reasoning: "Information retrieved from uploaded files and knowledge base.",
          sources: annotations
            .filter((ann: any) => ann.type === 'file_citation')
            .map((ann: any) => ({
              fileId: ann.file_id,
              filename: ann.filename,
              index: ann.index
            })),
          file_search_used: true,
          search_calls: fileSearchCalls.map((call: any) => ({
            id: call.id,
            status: call.status,
            queries: call.queries,
            searchResults: call.search_results
          }))
        }
      };
      
      // Update conversation state
      this.conversationState.previousResponseId = data.id;
      this.conversationState.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: content }
      );

      return {
        content,
        responseId: data.id,
        usage: data.usage,
        structuredData,
        fileSearchCalls: fileSearchCalls
      };
    } catch (error) {
      console.error('File search response processing error:', error);
      throw error;
    }
  }

  async generateImage(prompt: string, options?: {
    size?: '1024x1024' | '1024x1536' | '1536x1024';
    quality?: 'low' | 'medium' | 'high';
    format?: 'png' | 'jpeg' | 'webp';
    compression?: number;
    background?: 'transparent' | 'opaque';
    partialImages?: number;
    moderation?: 'auto' | 'low';
    useImageAPI?: boolean; // Override config setting
  }): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    try {
      // Ensure prompt is within reasonable limits
      let finalPrompt = prompt.trim();
      if (finalPrompt.length > 4000) {
        console.warn(`Prompt too long (${finalPrompt.length} chars), truncating to 4000 characters`);
        finalPrompt = finalPrompt.substring(0, 3997) + "...";
      }
      
      console.log('Image generation prompt length:', finalPrompt.length);
      console.log('Image generation prompt:', finalPrompt);
      
      // Choose API based on configuration and options
      const useImageAPI = options?.useImageAPI ?? this.config.useImageAPI ?? false;
      
      if (useImageAPI) {
        return await this.generateImageWithImageAPI(finalPrompt, options);
      } else {
        return await this.generateImageWithResponsesAPI(finalPrompt, options);
      }
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw error;
    }
  }

  private async generateImageWithImageAPI(prompt: string, options?: {
    size?: '1024x1024' | '1024x1536' | '1536x1024';
    quality?: 'low' | 'medium' | 'high';
    format?: 'png' | 'jpeg' | 'webp';
    compression?: number;
    background?: 'transparent' | 'opaque';
    moderation?: 'auto' | 'low';
  }): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    try {
      const requestBody: any = {
        model: this.config.imageModel,
        prompt: prompt,
        n: 1,
        ...(options?.size && { size: options.size }),
        ...(options?.quality && { quality: options.quality }),
        ...(options?.format && { format: options.format }),
        ...(options?.compression && { output_compression: options.compression }),
        ...(options?.background && { background: options.background }),
        ...(options?.moderation && { moderation: options.moderation })
      };

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openai.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Image generation failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No image data returned from OpenAI');
      }

      const imageData = data.data[0];
      
      return {
        imageBase64: imageData.b64_json,
        revisedPrompt: prompt, // Image API doesn't provide revised prompts
        structuredData: {
          description: prompt,
          style: 'realistic',
          mood: 'neutral',
          composition: 'standard',
          enhanced_prompt: prompt,
          image_id: imageData.id || 'img_' + Date.now()
        }
      };
    } catch (error) {
      console.error('OpenAI Image API error:', error);
      throw error;
    }
  }

  private async generateImageWithResponsesAPI(prompt: string, options?: {
    size?: '1024x1024' | '1024x1536' | '1536x1024';
    quality?: 'low' | 'medium' | 'high';
    format?: 'png' | 'jpeg' | 'webp';
    compression?: number;
    background?: 'transparent' | 'opaque';
    partialImages?: number;
    moderation?: 'auto' | 'low';
  }): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    // Prepare the image generation tool configuration
    const imageGenerationTool = {
      type: "image_generation" as const,
      ...(options?.size && { size: options.size }),
      ...(options?.quality && { quality: options.quality }),
      ...(options?.format && { format: options.format }),
      ...(options?.compression && { compression: options.compression }),
      ...(options?.background && { background: options.background }),
      ...(options?.partialImages && { partial_images: options.partialImages }),
      ...(options?.moderation && { moderation: options.moderation })
    };

    const requestBody = {
      model: this.config.model,
      input: prompt,
      tools: [imageGenerationTool],
      stream: false
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openai.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Image generation failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract image generation call results
    const imageGenerationCalls = data.output?.filter((output: any) => output.type === "image_generation_call") || [];
    
    if (imageGenerationCalls.length === 0) {
      throw new Error('No image generation call found in response');
    }

    const imageCall = imageGenerationCalls[0];
    
    if (imageCall.status !== 'completed') {
      throw new Error(`Image generation failed with status: ${imageCall.status}`);
    }

    return {
      imageBase64: imageCall.result,
      revisedPrompt: imageCall.revised_prompt,
      structuredData: {
        description: prompt,
        style: 'realistic',
        mood: 'neutral',
        composition: 'standard',
        enhanced_prompt: prompt,
        revised_prompt: imageCall.revised_prompt,
        image_id: imageCall.id
      }
    };
  }

  // Enhanced image-to-image generation using the new API
  async generateImageFromImage(
    referenceImageBase64: string,
    prompt: string,
    options?: {
      size?: '1024x1024' | '1024x1536' | '1536x1024';
      quality?: 'low' | 'medium' | 'high';
      format?: 'png' | 'jpeg' | 'webp';
      compression?: number;
      background?: 'transparent' | 'opaque';
      moderation?: 'auto' | 'low';
      useImageAPI?: boolean;
    }
  ): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    try {
      // Create a more concise enhanced prompt
      const basePrompt = prompt.trim();
      const referenceNote = "Maintain exact product design, colors, and features from reference image.";
      
      // Calculate available space (leave some buffer)
      const maxLength = 3950; // Leave 50 chars buffer
      const referenceNoteLength = referenceNote.length + 2; // +2 for spacing
      const availableLength = maxLength - referenceNoteLength;
      
      // Truncate the base prompt if needed
      let finalPrompt = basePrompt;
      if (basePrompt.length > availableLength) {
        finalPrompt = basePrompt.substring(0, availableLength - 3) + "...";
      }
      
      // Combine the prompt with the reference note
      const enhancedPrompt = `${finalPrompt}. ${referenceNote}`;
      
      console.log('Enhanced prompt length:', enhancedPrompt.length);
      console.log('Enhanced prompt:', enhancedPrompt);
      
      // Choose API based on configuration and options
      const useImageAPI = options?.useImageAPI ?? this.config.useImageAPI ?? false;
      
      if (useImageAPI) {
        return await this.generateImageFromImageWithImageAPI(referenceImageBase64, enhancedPrompt, options);
      } else {
        return await this.generateImageFromImageWithResponsesAPI(referenceImageBase64, enhancedPrompt, options);
      }
    } catch (error) {
      console.error('OpenAI image-to-image error:', error);
      throw error;
    }
  }

  private async generateImageFromImageWithImageAPI(
    referenceImageBase64: string,
    prompt: string,
    options?: {
      size?: '1024x1024' | '1024x1536' | '1536x1024';
      quality?: 'low' | 'medium' | 'high';
      format?: 'png' | 'jpeg' | 'webp';
      compression?: number;
      background?: 'transparent' | 'opaque';
      moderation?: 'auto' | 'low';
    }
  ): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    try {
      // Convert base64 to buffer for the Image API
      const imageBuffer = Buffer.from(referenceImageBase64, 'base64');
      
      const formData = new FormData();
      formData.append('model', this.config.imageModel);
      formData.append('prompt', prompt);
      formData.append('image', new Blob([imageBuffer]), 'reference.png');
      formData.append('n', '1');
      
      if (options?.size) formData.append('size', options.size);
      if (options?.quality) formData.append('quality', options.quality);
      if (options?.format) formData.append('format', options.format);
      if (options?.compression) formData.append('output_compression', options.compression.toString());
      if (options?.background) formData.append('background', options.background);
      if (options?.moderation) formData.append('moderation', options.moderation);

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openai.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Image-to-image generation failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No image data returned from OpenAI');
      }

      const imageData = data.data[0];
      
      return {
        imageBase64: imageData.b64_json,
        revisedPrompt: prompt,
        structuredData: {
          description: prompt,
          style: 'realistic',
          mood: 'neutral',
          composition: 'with reference image',
          enhanced_prompt: prompt,
          image_id: imageData.id || 'img_' + Date.now()
        }
      };
    } catch (error) {
      console.error('OpenAI Image API edit error:', error);
      throw error;
    }
  }

  private async generateImageFromImageWithResponsesAPI(
    referenceImageBase64: string,
    prompt: string,
    options?: {
      size?: '1024x1024' | '1024x1536' | '1536x1024';
      quality?: 'low' | 'medium' | 'high';
      format?: 'png' | 'jpeg' | 'webp';
      compression?: number;
      background?: 'transparent' | 'opaque';
      moderation?: 'auto' | 'low';
    }
  ): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    // Prepare the image generation tool configuration
    const imageGenerationTool = {
      type: "image_generation" as const,
      ...(options?.size && { size: options.size }),
      ...(options?.quality && { quality: options.quality }),
      ...(options?.format && { format: options.format }),
      ...(options?.compression && { compression: options.compression }),
      ...(options?.background && { background: options.background }),
      ...(options?.moderation && { moderation: options.moderation })
    };

    const requestBody = {
      model: this.config.model,
      input: [
        {
          role: "user" as const,
          content: [
            { type: "input_text" as const, text: prompt },
            { type: "input_image" as const, image: referenceImageBase64 }
          ]
        }
      ],
      tools: [imageGenerationTool],
      stream: false
    };

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openai.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Image-to-image generation failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract image generation call results
    const imageGenerationCalls = data.output?.filter((output: any) => output.type === "image_generation_call") || [];
    
    if (imageGenerationCalls.length === 0) {
      throw new Error('No image generation call found in response');
    }

    const imageCall = imageGenerationCalls[0];
    
    if (imageCall.status !== 'completed') {
      throw new Error(`Image generation failed with status: ${imageCall.status}`);
    }

    return {
      imageBase64: imageCall.result,
      revisedPrompt: imageCall.revised_prompt,
      structuredData: {
        description: prompt,
        style: 'realistic',
        mood: 'neutral',
        composition: 'with reference image',
        enhanced_prompt: prompt,
        revised_prompt: imageCall.revised_prompt,
        image_id: imageCall.id
      }
    };
  }

  // Multi-turn image editing using previous response ID
  async editImageWithPreviousResponse(
    previousResponseId: string,
    editPrompt: string,
    options?: {
      size?: '1024x1024' | '1024x1536' | '1536x1024';
      quality?: 'low' | 'medium' | 'high';
      format?: 'png' | 'jpeg' | 'webp';
      compression?: number;
      background?: 'transparent' | 'opaque';
    }
  ): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    try {
      // Prepare the image generation tool configuration
      const imageGenerationTool = {
        type: "image_generation" as const,
        ...(options?.size && { size: options.size }),
        ...(options?.quality && { quality: options.quality }),
        ...(options?.format && { format: options.format }),
        ...(options?.compression && { compression: options.compression }),
        ...(options?.background && { background: options.background })
      };

      const requestBody = {
        model: this.config.model,
        previous_response_id: previousResponseId,
        input: editPrompt,
        tools: [imageGenerationTool],
        stream: false
      };

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openai.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Image editing failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Extract image generation call results
      const imageGenerationCalls = data.output?.filter((output: any) => output.type === "image_generation_call") || [];
      
      if (imageGenerationCalls.length === 0) {
        throw new Error('No image generation call found in response');
      }

      const imageCall = imageGenerationCalls[0];
      
      if (imageCall.status !== 'completed') {
        throw new Error(`Image generation failed with status: ${imageCall.status}`);
      }

      return {
        imageBase64: imageCall.result,
        revisedPrompt: imageCall.revised_prompt,
        structuredData: {
          description: editPrompt,
          style: 'realistic',
          mood: 'neutral',
          composition: 'edited from previous',
          enhanced_prompt: editPrompt,
          revised_prompt: imageCall.revised_prompt,
          image_id: imageCall.id,
          previous_response_id: previousResponseId
        }
      };
    } catch (error) {
      console.error('OpenAI image editing error:', error);
      throw error;
    }
  }

  // Streaming image generation
  async generateImageStream(
    prompt: string,
    options?: {
      size?: '1024x1024' | '1024x1536' | '1536x1024';
      quality?: 'low' | 'medium' | 'high';
      format?: 'png' | 'jpeg' | 'webp';
      compression?: number;
      background?: 'transparent' | 'opaque';
      partialImages?: number;
    },
    onPartialImage?: (index: number, imageBase64: string) => void
  ): Promise<{imageBase64: string; revisedPrompt?: string; structuredData?: any}> {
    try {
      let finalPrompt = prompt.trim();
      if (finalPrompt.length > 4000) {
        finalPrompt = finalPrompt.substring(0, 3997) + "...";
      }
      
      // Prepare the image generation tool configuration
      const imageGenerationTool = {
        type: "image_generation" as const,
        ...(options?.size && { size: options.size }),
        ...(options?.quality && { quality: options.quality }),
        ...(options?.format && { format: options.format }),
        ...(options?.compression && { compression: options.compression }),
        ...(options?.background && { background: options.background }),
        ...(options?.partialImages && { partial_images: options.partialImages })
      };

      const requestBody = {
        model: this.config.model,
        input: finalPrompt,
        tools: [imageGenerationTool],
        stream: true
      };

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openai.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Streaming image generation failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let finalImageBase64 = '';
      let revisedPrompt = '';
      let partialImagesReceived = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              
              if (event.type === 'response.image_generation_call.partial_image') {
                const index = event.partial_image_index;
                const imageBase64 = event.partial_image_b64;
                
                if (onPartialImage) {
                  onPartialImage(index, imageBase64);
                }
                partialImagesReceived++;
              } else if (event.type === 'response.image_generation_call') {
                if (event.status === 'completed') {
                  finalImageBase64 = event.result;
                  revisedPrompt = event.revised_prompt || '';
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming event:', parseError);
            }
          }
        }
      }

      if (!finalImageBase64) {
        throw new Error('No final image received from streaming response');
      }

      return {
        imageBase64: finalImageBase64,
        revisedPrompt,
        structuredData: {
          description: prompt,
          style: 'realistic',
          mood: 'neutral',
          composition: 'standard',
          enhanced_prompt: prompt,
          revised_prompt: revisedPrompt,
          partial_images_received: partialImagesReceived
        }
      };
    } catch (error) {
      console.error('OpenAI streaming image generation error:', error);
      throw error;
    }
  }

  // Clear conversation state
  clearConversationState(): void {
    this.conversationState = { messages: [] };
  }
}

// 3. Main Chat Flow Controller
class ChatFlowController {
  private claude: ClaudeHandler;
  private openai: OpenAIHandler;
  private conversationHistory: Array<{role: string; content: string}> = [];
  private referenceImages: Array<{url: string; description: string}> = [];

  constructor(config: AIConfig) {
    this.claude = new ClaudeHandler(config.claude);
    this.openai = new OpenAIHandler(config.openai);
  }

  async processMessage(
    userMessage: string, 
    referenceImageUrl?: string,
    webSearchOptions?: {
      searchContextSize?: 'low' | 'medium' | 'high';
      userLocation?: {
        type: 'approximate';
        country?: string;
        city?: string;
        region?: string;
        timezone?: string;
      };
    },
    fileSearchOptions?: {
      maxNumResults?: number;
      includeResults?: boolean;
      filters?: {
        type: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
        key: string;
        value: string | number | boolean;
      };
    },
    conversationHistory?: Array<{role: 'user' | 'assistant'; content: string}>
  ): Promise<{
    type: 'text' | 'image';
    content: string;
    imageUrl?: string;
    enhancedPrompt?: string;
    usage?: any;
    structuredData?: any;
    functionCalls?: any[];
    webSearchCalls?: any[];
    fileSearchCalls?: any[];
  }> {
    // Use provided conversation history if available, otherwise use internal
    if (conversationHistory && conversationHistory.length > 0) {
      this.conversationHistory = [...conversationHistory];
    }
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Store reference image if provided
    if (referenceImageUrl) {
      this.referenceImages.push({
        url: referenceImageUrl,
        description: userMessage
      });
    }

    try {
      // Check if this is an image generation request
      if (MessageClassifier.isImageRequest(userMessage)) {
        return await this.handleImageRequest(userMessage, referenceImageUrl);
      } else {
        return await this.handleTextRequest(userMessage, webSearchOptions, fileSearchOptions);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        type: 'text',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      };
    }
  }

  private async handleImageRequest(userMessage: string, referenceImageUrl?: string): Promise<{
    type: 'image';
    content: string;
    imageUrl: string;
    enhancedPrompt?: string;
    structuredData?: any;
  }> {
    // Extract image prompt
    const imagePrompt = MessageClassifier.extractImagePrompt(userMessage);
    
    // Check if this is a lifestyle product image request
    const isLifestyleRequest = this.isLifestyleProductRequest(userMessage);
    
    let imageBase64: string;
    let structuredData: any;
    
    if (isLifestyleRequest) {
      console.log('Processing lifestyle request:', userMessage);
      console.log('Original reference image provided:', referenceImageUrl ? 'Yes' : 'No');
      
      // For lifestyle requests, try to find a reference image from conversation history
      let effectiveReferenceImage = referenceImageUrl;
      
      // If no reference image provided, look for the most recent image in conversation history
      if (!effectiveReferenceImage) {
        const recentImage = this.findMostRecentImageInHistory();
        if (recentImage) {
          effectiveReferenceImage = recentImage;
          console.log('Using reference image from conversation history');
        } else {
          console.log('No reference image found, will use text-only generation');
        }
      } else {
        console.log('Using provided reference image');
      }
      
      if (effectiveReferenceImage) {
        // Convert reference image URL to base64 if needed
        let referenceImageBase64 = effectiveReferenceImage;
        if (effectiveReferenceImage.startsWith('data:image')) {
          // Extract base64 from data URL
          referenceImageBase64 = effectiveReferenceImage.split(',')[1];
        } else if (effectiveReferenceImage.startsWith('http')) {
          // Convert URL to base64 (this would need to be implemented)
          // For now, we'll use regular image generation with enhanced prompt
          const enhancedLifestylePrompt = await this.createLifestyleProductPrompt(imagePrompt, userMessage, false);
          const result = await this.openai.generateImage(enhancedLifestylePrompt, {
            size: '1024x1024',
            quality: 'high',
            format: 'png',
            moderation: 'low'
          });
          imageBase64 = result.imageBase64;
          structuredData = result.structuredData;
        }
        
        // Use image-to-image with the reference product image
        const enhancedLifestylePrompt = await this.createLifestyleProductPrompt(imagePrompt, userMessage, true);
        const result = await this.openai.generateImageFromImage(referenceImageBase64, enhancedLifestylePrompt);
        imageBase64 = result.imageBase64;
        structuredData = result.structuredData;
      } else {
        // Fall back to regular image generation with enhanced prompt
        // Use a very specific prompt to ensure the correct product is generated
        const enhancedLifestylePrompt = await this.createLifestyleProductPrompt(imagePrompt, userMessage, false);
        console.log('Using enhanced prompt for lifestyle generation:', enhancedLifestylePrompt);
        
        // Try to use DALL-E 3 for better quality
        try {
          const imageServiceResponse = await fetch('/api/image-gen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: enhancedLifestylePrompt,
              model: 'dall-e-3',
              size: '1024x1024',
              quality: 'hd',
              format: 'png'
            }),
          });
          
          if (imageServiceResponse.ok) {
            const imageData = await imageServiceResponse.json();
            imageBase64 = imageData.imageData || imageData.imageUrl;
            structuredData = {
              description: enhancedLifestylePrompt,
              style: 'realistic',
              mood: 'neutral',
              composition: 'standard',
              enhanced_prompt: enhancedLifestylePrompt,
              image_id: 'dall-e-3-generated'
            };
          } else {
            // Fallback to OpenAI
            const result = await this.openai.generateImage(enhancedLifestylePrompt, {
              size: '1024x1024',
              quality: 'high',
              format: 'png',
              moderation: 'low'
            });
            imageBase64 = result.imageBase64;
            structuredData = result.structuredData;
          }
        } catch (error) {
          console.log('DALL-E 3 failed, falling back to OpenAI:', error);
          // Fallback to OpenAI
          const result = await this.openai.generateImage(enhancedLifestylePrompt, {
            size: '1024x1024',
            quality: 'high',
            format: 'png',
            moderation: 'low'
          });
          imageBase64 = result.imageBase64;
          structuredData = result.structuredData;
        }
      }
    } else {
      // Use image-to-image if reference image is available
      if (referenceImageUrl) {
        // Convert reference image URL to base64 if needed
        let referenceImageBase64 = referenceImageUrl;
        if (referenceImageUrl.startsWith('http') || referenceImageUrl.startsWith('data:image')) {
          // If it's already base64, use it directly
          if (referenceImageUrl.startsWith('data:image')) {
            referenceImageBase64 = referenceImageUrl.split(',')[1];
            const result = await this.openai.generateImageFromImage(referenceImageBase64, imagePrompt);
            imageBase64 = result.imageBase64;
            structuredData = result.structuredData;
          } else {
            // Convert URL to base64 (this would need to be implemented)
            // For now, we'll use regular image generation
            const result = await this.openai.generateImage(imagePrompt);
            imageBase64 = result.imageBase64;
            structuredData = result.structuredData;
          }
        } else {
          // Assume it's already base64
          const result = await this.openai.generateImageFromImage(referenceImageBase64, imagePrompt);
          imageBase64 = result.imageBase64;
          structuredData = result.structuredData;
        }
      } else {
        // Fall back to regular image generation
        const result = await this.openai.generateImage(imagePrompt);
        imageBase64 = result.imageBase64;
        structuredData = result.structuredData;
      }
    }
    
    // Generate descriptive response with Claude
    const claudeResponse = await this.claude.generateCreativeResponse([
      ...this.conversationHistory.slice(-5), // Keep last 5 messages for context
    ], `You are helping with image generation for GenLo. The user requested: "${userMessage}". 
    An image has been generated using the enhanced prompt: "${structuredData?.enhanced_prompt || imagePrompt}".
    Provide a brief, helpful response acknowledging the image creation and mentioning any key features.`);

    // Add response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: `${claudeResponse} [Image generated]`
    });

    return {
      type: 'image',
      content: claudeResponse,
      imageUrl: imageBase64,
      enhancedPrompt: structuredData?.enhanced_prompt,
      structuredData
    };
  }

  private isLifestyleProductRequest(message: string): boolean {
    const lifestyleKeywords = [
      'woman holding', 'person holding', 'lifestyle', 'product shot', 'product image',
      'with a woman', 'with someone', 'holding it', 'holding the', 'person using',
      'need one with', 'make one with', 'create one with', 'generate one with'
    ];
    
    const lowerMessage = message.toLowerCase();
    return lifestyleKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private async createLifestyleProductPrompt(userPrompt: string, originalMessage: string, hasReferenceImage: boolean = false): Promise<string> {
    // Create enhanced lifestyle product prompt based on user request
    // Use very specific product description to ensure accuracy
    const baseProduct = hasReferenceImage 
      ? "black curved back stretcher massage device with numerous small pointed acupressure nodes on surface, prominent ribbed light blue strip running down center, rigid ergonomic design for back pain relief"
      : "black curved back stretcher massage device with numerous small pointed acupressure nodes covering the entire surface, prominent ribbed light blue strip running down the center, rigid ergonomic curved design for back pain relief, NOT a U-shaped neck massager, NOT a circular device, specifically a curved back stretcher with acupressure nodes";
    
    // Extract lifestyle context from user message
    let lifestyleContext = "";
    const lowerMessage = originalMessage.toLowerCase();
    
    if (lowerMessage.includes('woman holding') || lowerMessage.includes('with a woman')) {
      lifestyleContext = "friendly young woman holding the exact same back stretcher device, looking directly at camera with warm smile, hands positioned to show the product clearly";
    } else if (lowerMessage.includes('person holding') || lowerMessage.includes('with someone')) {
      lifestyleContext = "person holding the exact same back stretcher device, looking directly at camera with friendly expression, hands positioned to show the product clearly";
    } else if (lowerMessage.includes('lifestyle')) {
      lifestyleContext = "lifestyle photography of person using the exact same back stretcher device in natural setting";
    } else if (lowerMessage.includes('product shot') || lowerMessage.includes('product image')) {
      lifestyleContext = "professional product photography with person demonstrating the exact same back stretcher device";
    } else {
      // Default to friendly woman holding the product
      lifestyleContext = "friendly young woman holding the exact same back stretcher device, looking directly at camera with warm smile, hands positioned to show the product clearly";
    }

    // Build the enhanced prompt with emphasis on product accuracy and specific details
    const enhancedPrompt = `Professional lifestyle photography of a ${lifestyleContext}, ${baseProduct}, ensure the product is exactly the same as the reference image, clean background, high-quality commercial photography, natural lighting, professional presentation, sharp focus, authentic expression, product must match reference image exactly, the device must be a curved back stretcher with acupressure nodes, not a U-shaped neck massager, 8K resolution, studio lighting, professional camera, commercial product photography style, high-end retouching, magazine quality, cinematic composition, perfect exposure, vibrant colors, professional retouching, commercial advertising quality`;

    return enhancedPrompt;
  }

  private async handleTextRequest(
    userMessage: string,
    webSearchOptions?: {
      searchContextSize?: 'low' | 'medium' | 'high';
      userLocation?: {
        type: 'approximate';
        country?: string;
        city?: string;
        region?: string;
        timezone?: string;
      };
    },
    fileSearchOptions?: {
      maxNumResults?: number;
      includeResults?: boolean;
      filters?: {
        type: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
        key: string;
        value: string | number | boolean;
      };
    }
  ): Promise<{
    type: 'text';
    content: string;
    enhancedPrompt?: string;
    usage?: any;
    structuredData?: any;
    functionCalls?: any[];
    webSearchCalls?: any[];
    fileSearchCalls?: any[];
  }> {
    // Determine if this is a creative request that should use Claude
    if (MessageClassifier.isCreativeRequest(userMessage)) {
      const response = await this.claude.generateCreativeResponse(
        this.conversationHistory.slice(-10) // Keep last 10 messages for context
      );

      // Add response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      return {
        type: 'text',
        content: response
      };
    } else {
      // Check if function calling is needed
      const needsFunctionCalling = MessageClassifier.needsFunctionCalling(userMessage);
      
      // Check if web search is needed
      const needsWebSearch = MessageClassifier.needsWebSearch(userMessage);
      
      // Check if file search is needed
      const needsFileSearch = MessageClassifier.needsFileSearch(userMessage);
      
      // Use OpenAI for general text responses with enhanced prompts
      const enhancedPrompt = await this.claude.enhancePrompt(userMessage);
      
      const systemInstructions = `# Identity
You are GenLo, a helpful and intelligent assistant. You provide clear, accurate, and engaging responses to user queries.

# Instructions
- Be helpful, accurate, and engaging
- Provide clear and concise explanations
- Use a friendly and professional tone
- If you're unsure about something, say so
- Keep responses focused and relevant to the user's question
- Provide confidence levels and suggestions when helpful
${needsFunctionCalling ? `
# Function Calling
You have access to various functions to fetch data and perform actions:
- get_weather: Get current weather information
- send_email: Send emails to recipients
- search_knowledge_base: Search for information in the knowledge base
- file_operations: Perform file operations
- query_database: Query database tables
- search_news: Search for recent news articles
- calculate: Perform mathematical calculations

Use these functions when they would help provide better, more accurate information to the user.` : ''}
${needsWebSearch ? `
# Web Search
You have access to web search capabilities to find the latest information. When using web search:
- Always cite your sources with inline citations
- Provide accurate, up-to-date information
- Include relevant URLs and titles in your response
- Be transparent about what information comes from web search
- Focus on the most recent and relevant information` : ''}
${needsFileSearch ? `
# File Search
You have access to uploaded files and knowledge base documents. When using file search:
- Always cite your sources with file citations
- Provide accurate information from the documents
- Include relevant file names and sections in your response
- Be transparent about what information comes from file search
- Focus on the most relevant information from the files
- Use semantic search to find related content across documents` : ''}

# Response Rules
- Always be helpful and informative
- Use clear, simple language
- Provide examples when helpful
- Ask for clarification if needed
${needsWebSearch ? `
- Include clickable citations for web sources
- Mention when information is from web search
- Provide context for the information you find` : ''}
${needsFileSearch ? `
- Include file citations for document sources
- Mention when information is from uploaded files
- Provide context for the information you find in documents` : ''}`;

      const result = await this.openai.generateTextResponse(
        userMessage,
        needsFunctionCalling,
        enhancedPrompt, 
        systemInstructions,
        needsWebSearch,
        webSearchOptions,
        needsFileSearch,
        fileSearchOptions
      );

      // Add response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: result.content
      });

      return {
        type: 'text',
        content: result.content,
        enhancedPrompt: enhancedPrompt,
        usage: result.usage,
        structuredData: result.structuredData,
        functionCalls: result.functionCalls,
        webSearchCalls: result.webSearchCalls,
        fileSearchCalls: result.fileSearchCalls
      };
    }
  }

  // Utility methods
  clearHistory(): void {
    this.conversationHistory = [];
    this.referenceImages = [];
    this.openai.clearConversationState();
  }

  getHistory(): Array<{role: string; content: string}> {
    return [...this.conversationHistory];
  }

  getReferenceImages(): Array<{url: string; description: string}> {
    return [...this.referenceImages];
  }

  private findMostRecentImageInHistory(): string | null {
    // Look through conversation history for the most recent image
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const message = this.conversationHistory[i];
      
      // Look for image data in the new format: [Image: data:image/...]
      if (message.content && message.content.includes('[Image:')) {
        const imageMatch = message.content.match(/\[Image: (data:image\/[^;]+;base64,[^\]]+)\]/);
        if (imageMatch) {
          console.log('Found image in conversation history:', imageMatch[1].substring(0, 50) + '...');
          return imageMatch[1];
        }
      }
      
      // Also check for direct base64 image data in content
      if (message.content && message.content.includes('data:image')) {
        const imageMatch = message.content.match(/data:image\/[^;]+;base64,[^"]+/);
        if (imageMatch) {
          console.log('Found direct image in conversation history:', imageMatch[0].substring(0, 50) + '...');
          return imageMatch[0];
        }
      }
    }
    
    // Also check reference images
    if (this.referenceImages.length > 0) {
      console.log('Found image in reference images:', this.referenceImages[this.referenceImages.length - 1].url.substring(0, 50) + '...');
      return this.referenceImages[this.referenceImages.length - 1].url;
    }
    
    console.log('No reference image found in conversation history');
    return null;
  }
}

// 4. Error Handling and Fallbacks
class ErrorHandler {
  static handleAPIError(error: any, service: 'claude' | 'openai'): string {
    if (service === 'claude') {
      return "I'm having trouble with creative enhancement right now. Please try again.";
    } else {
      return "I'm having trouble generating responses right now. Please try again later.";
    }
  }

  static isRateLimited(error: any): boolean {
    return error.status === 429 || error.message?.includes('rate limit');
  }
}

export {
  ChatFlowController,
  MessageClassifier,
  ClaudeHandler,
  OpenAIHandler,
  ErrorHandler,
  type AIConfig
}; 