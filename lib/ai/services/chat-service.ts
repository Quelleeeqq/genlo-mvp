import Anthropic from '@anthropic-ai/sdk';
import { chatModel } from '../models';
import { getCustomAnthropic } from '../providers/anthropic';
import { APIResponseHeaderManager, APIRequestMetadata, APIResponseHeaders, logAPIError } from '@/lib/utils/api-response-headers';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
  model: string;
  metadata?: {
    requestId: string;
    processingTime: number;
    externalRequestId?: string;
    rateLimitInfo?: {
      limitRequests?: string;
      remainingRequests?: string;
      resetRequests?: string;
      limitTokens?: string;
      remainingTokens?: string;
      resetTokens?: string;
    };
  };
}

export class ChatService {
  private defaultSystemPrompt = `You are GenLo, a creative and helpful AI assistant. You provide thoughtful, engaging responses that are concise and varied in length.

**Response Guidelines:**
- Keep responses concise and to the point
- Vary your response length - some short, some detailed
- Be conversational and warm, but not overly verbose
- Provide practical, actionable advice
- Ask follow-up questions when helpful
- Show enthusiasm for helping users succeed

**For Creative Projects:**
- Suggest multiple creative directions
- Provide specific, actionable feedback
- Share relevant examples when helpful

**For Business & Marketing:**
- Think strategically and provide practical insights
- Suggest multiple approaches when relevant
- Help users understand their audience and positioning

**Response Length Variation:**
- Short responses (1-2 sentences) for simple questions
- Medium responses (2-4 sentences) for most questions
- Detailed responses (4-6 sentences) only when explaining complex topics
- Always prioritize clarity and usefulness over length

You're a creative partner and strategic advisor who helps users achieve their goals efficiently.`;

  async getChatResponse(
    prompt: string, 
    systemPrompt?: string, 
    apiKey?: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    return this.chat({
      messages: [
        ...conversationHistory,
        { role: 'user', content: prompt }
      ],
      systemPrompt,
      apiKey
    }).then(response => response.message.content);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const {
      messages,
      systemPrompt = this.defaultSystemPrompt,
      model = 'claude-3-5-sonnet-20241022',
      temperature = 0.5, // Reduced from 0.7 for more focused responses
      maxTokens = 1000, // Reduced from 2000 for more concise responses
      apiKey
    } = request;

    // Create request metadata for tracking
    const metadata = APIResponseHeaderManager.createRequestMetadata(model, 'anthropic');
    const startTime = Date.now();

    // Check if API key is configured
    const keyToUse = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!keyToUse || keyToUse === 'your_anthropic_api_key') {
      const fallbackResponse = this.getFallbackResponse(messages[messages.length - 1]?.content || 'Hello');
      fallbackResponse.metadata = {
        requestId: metadata.requestId,
        processingTime: Date.now() - startTime,
        externalRequestId: undefined,
        rateLimitInfo: undefined
      };
      return fallbackResponse;
    }

    try {
      // Use Anthropic SDK directly for prompt caching support
      const client = new Anthropic({ 
        apiKey: keyToUse,
        timeout: 30000 // 30 second timeout
      });
      
      // Prepare system prompt with cache control
      const systemPromptArray = [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const }
        }
      ];

      // Convert messages to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const response = await client.messages.create({
        model: model as any,
        max_tokens: maxTokens,
        temperature,
        system: systemPromptArray,
        messages: anthropicMessages
      });

      const processingTime = Date.now() - startTime;

      // Extract headers from Anthropic response (if available)
      let externalHeaders: APIResponseHeaders = {};
      let externalRequestId: string | undefined;
      let rateLimitInfo: any = {};

      // Note: Anthropic SDK doesn't expose raw response headers directly
      // We'll use our custom headers for tracking
      const customHeaders = APIResponseHeaderManager.createCustomHeaders(metadata, processingTime);
      
      // Log request information
      APIResponseHeaderManager.logRequestInfo(metadata, externalHeaders, processingTime);

      const chatResponse: ChatResponse = {
        message: {
          role: 'assistant',
          content: response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated',
          timestamp: new Date()
        },
        usage: response.usage ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          cacheCreationInputTokens: response.usage.cache_creation_input_tokens || undefined,
          cacheReadInputTokens: response.usage.cache_read_input_tokens || undefined
        } : undefined,
        model,
        metadata: {
          requestId: metadata.requestId,
          processingTime,
          externalRequestId,
          rateLimitInfo
        }
      };

      return chatResponse;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Log error with metadata
      logAPIError(error, metadata, {});
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          throw new Error('AI service authentication failed. Please check your API key configuration.');
        }
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          throw new Error('AI service rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('model') || error.message.includes('not found')) {
          throw new Error('The requested AI model is not available. Please try a different model.');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Request timed out. Please try again.');
        }
      }
      
      // Return fallback response for other errors
      const fallbackResponse = this.getFallbackResponse(messages[messages.length - 1]?.content || 'Hello');
      fallbackResponse.metadata = {
        requestId: metadata.requestId,
        processingTime,
        externalRequestId: undefined,
        rateLimitInfo: undefined
      };
      return fallbackResponse;
    }
  }

  async getStreamingChatResponse(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const {
      messages,
      systemPrompt = this.defaultSystemPrompt,
      model = 'claude-3-5-sonnet-20241022',
      temperature = 0.5, // Reduced from 0.7 for more focused responses
      maxTokens = 1000, // Reduced from 2000 for more concise responses
      apiKey
    } = request;

    const keyToUse = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!keyToUse || keyToUse === 'your_anthropic_api_key') {
      const fallback = this.getFallbackResponse(messages[messages.length - 1]?.content || 'Hello');
      onChunk(fallback.message.content);
      return;
    }

    try {
      // Use Anthropic SDK directly for streaming with prompt caching
      const client = new Anthropic({ 
        apiKey: keyToUse,
        timeout: 30000 // 30 second timeout
      });
      
      // Prepare system prompt with cache control
      const systemPromptArray = [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const }
        }
      ];

      // Convert messages to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const stream = await client.messages.create({
        model: model as any,
        max_tokens: maxTokens,
        temperature,
        system: systemPromptArray,
        messages: anthropicMessages,
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          onChunk(chunk.delta.text);
        }
      }
    } catch (error) {
      console.error('Streaming Chat Error:', error);
      const fallback = this.getFallbackResponse(messages[messages.length - 1]?.content || 'Hello');
      onChunk(fallback.message.content);
    }
  }

  private getFallbackResponse(userMessage: string): ChatResponse {
    // Provide helpful fallback responses based on user input
    const lowerMessage = userMessage.toLowerCase();
    
    let fallbackContent = `I'm here to help you with becoming an AI actor! 

Since the AI service isn't fully configured yet, here's what I can tell you about becoming an AI actor with GenLo:

**Benefits of Becoming an AI Actor:**
• Earn passive income from your digital likeness
• Work from anywhere, anytime
• No need for traditional acting experience
• Your AI avatar can work 24/7
• Scale your earnings without time constraints

**Application Tips:**
• Submit high-quality photos or videos
• Ensure good lighting and clear audio
• Show different expressions and angles
• Include a variety of poses and styles
• Make sure you have proper consent documentation

**Success Factors:**
• Unique and versatile appearance
• Professional presentation
• Consistent quality submissions
• Responsive communication
• Understanding of brand requirements

Would you like me to help you with your application or answer any specific questions about the process?`;

    // Customize response based on user input
    if (lowerMessage.includes('image') || lowerMessage.includes('photo')) {
      fallbackContent = `I can help you with image generation! Our AI image generator supports multiple models:

**Available Models:**
• **Replicate (Stable Diffusion)**: High quality, fast generation
• **Google AI Studio**: Powered by Google Gemini
• **GPT Image 1**: Best quality, superior instruction following
• **DALL-E 3**: High quality, larger resolutions

**Features:**
• Multiple image sizes (1024x1024, 1024x1536, 1536x1024)
• Quality settings (low, medium, high)
• Format options (PNG, JPEG, WebP)
• Image editing capabilities

Try our image generation features to create stunning AI-generated images!`;
    }

    if (lowerMessage.includes('video') || lowerMessage.includes('veo')) {
      fallbackContent = `I can help you with video generation! Our Veo 3 video generator creates high-quality AI videos:

**Veo 3 Features:**
• **Multiple Providers**: Google AI Studio, Replicate, AI/ML API
• **Aspect Ratios**: 16:9, 9:16, 1:1, 4:3
• **Resolutions**: 720p, 1080p, 1440p
• **Durations**: 4-16 seconds
• **Styles**: Realistic, cinematic, artistic, animated
• **Audio Generation**: Optional background music and sound effects

**How It Works:**
1. Describe your video concept
2. Choose your settings
3. AI researches and optimizes your prompt
4. Generate high-quality videos

Try our video generation features to create amazing AI videos!`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      fallbackContent = `I'm here to help! Here's what I can assist you with:

**AI Services:**
• **Image Generation**: Create stunning AI images
• **Video Generation**: Generate AI videos with Veo 3
• **Chat Assistance**: Get help with any questions

**AI Actor Platform:**
• Application guidance
• Best practices
• Requirements and tips
• Success strategies

**Technical Support:**
• Platform usage
• Feature explanations
• Troubleshooting

**General Help:**
• Creative projects
• Content creation
• Research assistance
• Knowledge questions

What would you like help with today?`;
    }

    return {
      message: {
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date()
      },
      model: 'fallback'
    };
  }

  // Helper method for backward compatibility
  async getSimpleResponse(prompt: string, systemPrompt?: string, apiKey?: string): Promise<string> {
    return this.getChatResponse(prompt, systemPrompt, apiKey);
  }
}

// Export singleton instance and legacy function for backward compatibility
export const chatService = new ChatService();

// Legacy function for backward compatibility
export async function getChatResponse(prompt: string, systemPrompt?: string, apiKey?: string): Promise<string> {
  return chatService.getSimpleResponse(prompt, systemPrompt, apiKey);
} 