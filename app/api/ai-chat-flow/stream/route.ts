import { NextRequest } from 'next/server';
import { ChatFlowController } from '@/lib/ai/chat-flow-controller';
import { supabase, chatMessages } from '@/lib/supabaseClient';

// Initialize the chat flow controller with environment variables
const chatFlowController = new ChatFlowController({
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
    imageModel: 'dall-e-3',
    useImageAPI: true
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, referenceImageUrl, userId, chatId } = body;

    if (!message || typeof message !== 'string') {
      return new Response('Message is required and must be a string', { status: 400 });
    }

    // Fetch last 20 messages for this chat for conversation memory
    let conversationHistory: Array<{role: 'user' | 'assistant'; content: string}> = [];
    let mostRecentImage: string | null = null;
    
    if (userId && chatId) {
      const { data: messages, error } = await chatMessages.getMessages(userId, chatId, 20);
      if (!error && Array.isArray(messages)) {
        conversationHistory = messages.map((msg: any) => {
          // Include image data in the content if available
          let content = msg.content;
          if (msg.image_base64) {
            content += ` [Image: ${msg.image_base64}]`;
            // Track the most recent image for lifestyle requests
            if (!mostRecentImage) {
              mostRecentImage = msg.image_base64;
            }
          } else if (msg.image_url) {
            content += ` [Image: ${msg.image_url}]`;
            // Track the most recent image for lifestyle requests
            if (!mostRecentImage) {
              mostRecentImage = msg.image_url;
            }
          }
          return {
            role: msg.role as 'user' | 'assistant',
            content: content
          };
        });
      }
    }

    // Check if this is an image generation request
    const isImageRequest = message.toLowerCase().includes('woman holding') || 
                          message.toLowerCase().includes('person holding') ||
                          message.toLowerCase().includes('lifestyle') ||
                          message.toLowerCase().includes('product shot') ||
                          message.toLowerCase().includes('with a woman') ||
                          message.toLowerCase().includes('need one with') ||
                          message.toLowerCase().includes('generate') ||
                          message.toLowerCase().includes('create') ||
                          message.toLowerCase().includes('image') ||
                          message.toLowerCase().includes('picture');

    if (isImageRequest) {
      // For image requests, use the regular chat flow (non-streaming)
      // Use the most recent image from conversation history if no reference image is provided
      const effectiveReferenceImage = referenceImageUrl || mostRecentImage;
      const result = await chatFlowController.processMessage(message, effectiveReferenceImage, undefined, undefined, conversationHistory);
      
      // Return the result as a single chunk
      const encoder = new TextEncoder();
      const responseData = {
        type: 'image',
        content: result.content,
        imageUrl: result.imageUrl,
        enhancedPrompt: result.enhancedPrompt,
        structuredData: result.structuredData
      };
      
      return new Response(encoder.encode(JSON.stringify(responseData) + '\n'), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For text requests, use OpenAI streaming
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      stream: true,
    });

    // Create a ReadableStream to pipe the OpenAI stream to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
        }
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Streaming chat error:', error);
    return new Response('Streaming error', { status: 500 });
  }
} 