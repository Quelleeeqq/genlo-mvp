import { NextRequest } from 'next/server';
import { ChatFlowController } from '@/lib/ai/chat-flow-controller';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Initialize the chat flow controller with environment variables
const chatFlowController = new ChatFlowController({
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
    imageModel: 'gpt-image-1',
    useImageAPI: process.env.USE_IMAGE_API === 'true'
  }
});

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  try {
    const body = await request.json();
    const { message, referenceImageUrl, webSearchOptions, fileSearchOptions, userId, chatId } = body;

    if (!message || typeof message !== 'string') {
      return new Response('Message is required and must be a string', { status: 400 });
    }

    // Fetch last 20 messages for this chat for conversation memory
    let conversationHistory: Array<{role: 'user' | 'assistant'; content: string}> = [];
    if (userId && chatId) {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(20);
      if (!error && Array.isArray(messages)) {
        conversationHistory = messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));
      }
    }

    // Process the message through the enhanced chat flow, passing conversation history if supported
    const result = await chatFlowController.processMessage(message, referenceImageUrl, webSearchOptions, fileSearchOptions, conversationHistory);

    // Streaming logic for text responses
    if (result.type === 'text') {
      // Use OpenAI streaming for text responses
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
    }

    // Streaming logic for image responses (return as a single chunk for now)
    if (result.type === 'image') {
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

    // Fallback: return the result as JSON
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Streaming chat error:', error);
    return new Response('Streaming error', { status: 500 });
  }
} 