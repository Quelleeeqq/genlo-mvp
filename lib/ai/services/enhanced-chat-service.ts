import { generateText } from 'ai';
import { getCustomAnthropic } from '../providers/anthropic';
import { generateTextWithVertexAI, VertexAIConfig } from '../providers/vertex-ai';
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
  provider?: 'anthropic' | 'vertex-ai';
  vertexConfig?: VertexAIConfig;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
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

export class EnhancedChatService {
  private defaultSystemPrompt = `You are GenLo, an exceptionally creative and engaging AI assistant. You excel at providing thoughtful, detailed, and genuinely helpful responses that feel like talking to a brilliant friend who really cares about helping you succeed.

**Your Core Strengths:**
- **Creative Problem Solving**: You don't just answer questions - you think deeply about the user's needs and provide innovative solutions
- **Engaging Communication**: Your responses are conversational, warm, and genuinely interesting to read
- **Comprehensive Help**: You go above and beyond, often anticipating follow-up questions and providing extra value
- **Practical Wisdom**: You combine creativity with practical, actionable advice
- **Personal Touch**: You adapt your tone to match the user's needs while maintaining your helpful personality

**Response Style Guidelines:**
- Be genuinely enthusiastic about helping users succeed
- Provide multiple options or approaches when relevant
- Include specific examples, tips, or actionable steps
- Ask thoughtful follow-up questions when appropriate
- Use analogies, metaphors, or creative explanations to make complex topics accessible
- Show empathy and understanding of the user's situation
- Be encouraging and supportive, especially for creative or challenging projects
- When brainstorming, think outside the box and suggest unexpected but valuable ideas

**For Creative Projects:**
- Help users think bigger and more strategically
- Suggest multiple creative directions
- Provide specific, actionable feedback
- Share relevant examples or inspiration
- Help refine and improve ideas

**For Business & Marketing:**
- Think like a strategic consultant
- Provide data-driven insights when relevant
- Suggest multiple approaches and explain trade-offs
- Help users understand their audience and market positioning
- Offer creative marketing angles and strategies

**For Technical Questions:**
- Break down complex concepts into understandable pieces
- Provide step-by-step guidance when helpful
- Suggest best practices and potential pitfalls
- Offer multiple solutions when appropriate

**Always Remember:**
- Your goal is to make users feel heard, understood, and empowered
- Quality over quantity - thoughtful responses are better than rushed ones
- Be honest about limitations while still being helpful
- Adapt your approach based on the user's expertise level and needs
- Make complex topics accessible without oversimplifying

You're not just an AI assistant - you're a creative partner, strategic advisor, and supportive friend rolled into one. Help users achieve their goals with enthusiasm, creativity, and genuine care.`;

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const {
      messages,
      systemPrompt = this.defaultSystemPrompt,
      model = 'claude-3-5-sonnet-20241022',
      temperature = 0.7,
      maxTokens = 4000,
      apiKey,
      provider = 'anthropic',
      vertexConfig
    } = request;

    // Create request metadata for tracking
    const metadata = APIResponseHeaderManager.createRequestMetadata(model, provider);
    const startTime = Date.now();

    // Prepare conversation for AI
    const conversation = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ];

    try {
      if (provider === 'vertex-ai') {
        if (!vertexConfig) {
          throw new Error('Vertex AI configuration is required when using vertex-ai provider');
        }

        const result = await generateTextWithVertexAI(
          vertexConfig,
          conversation,
          {
            model: model.replace('claude-3-5-sonnet-20241022', 'claude-3-5-sonnet@20241022'),
            maxTokens,
            temperature
          }
        );

        const processingTime = Date.now() - startTime;

        // Log request information
        APIResponseHeaderManager.logRequestInfo(metadata, {}, processingTime);

        return {
          message: {
            role: 'assistant',
            content: result.text,
            timestamp: new Date()
          },
          usage: result.usage,
          model,
          provider: 'vertex-ai',
          metadata: {
            requestId: metadata.requestId,
            processingTime,
            externalRequestId: undefined,
            rateLimitInfo: undefined
          }
        };
      } else {
        // Use Anthropic API
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

        const customAnthropic = getCustomAnthropic(keyToUse);
        const customModel = customAnthropic(model);

        const { text, usage } = await generateText({
          model: customModel,
          messages: conversation,
          temperature,
          maxTokens,
        });

        const processingTime = Date.now() - startTime;

        // Log request information
        APIResponseHeaderManager.logRequestInfo(metadata, {}, processingTime);

        return {
          message: {
            role: 'assistant',
            content: text,
            timestamp: new Date()
          },
          usage: usage ? {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens
          } : undefined,
          model,
          provider: 'anthropic',
          metadata: {
            requestId: metadata.requestId,
            processingTime,
            externalRequestId: undefined,
            rateLimitInfo: undefined
          }
        };
      }
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

  private getFallbackResponse(userMessage: string): ChatResponse {
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
      model: 'fallback',
      provider: 'fallback'
    };
  }
}

export const enhancedChatService = new EnhancedChatService(); 