import { NextRequest, NextResponse } from 'next/server';
import { ChatFlowController } from '@/lib/ai/chat-flow-controller';
import { supabase } from '@/lib/supabaseClient';
import { chatMessages } from '@/lib/ai/services/chat-messages';

// Initialize the chat flow controller with environment variables
const chatFlowController = new ChatFlowController({
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
    imageModel: 'gpt-image-1', // Updated to use new GPT Image model
    useImageAPI: process.env.USE_IMAGE_API === 'true' // Optional: use Image API instead of Responses API
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, referenceImageUrl, imageOptions, webSearchOptions, fileSearchOptions, userId, chatId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch last 20 messages for this chat for conversation memory
    let conversationHistory: Array<{role: 'user' | 'assistant'; content: string}> = [];
    if (userId && chatId) {
      const { data: messages, error } = await chatMessages.getMessages(userId, chatId, 20);
      if (!error && Array.isArray(messages)) {
        conversationHistory = messages.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));
      }
    }

    // Process the message through the enhanced chat flow, passing conversation history if supported
    const result = await chatFlowController.processMessage(message, referenceImageUrl, webSearchOptions, fileSearchOptions, conversationHistory);

    // Prepare the response based on the result type
    const response: any = {
      success: true,
      type: result.type,
      content: result.content,
      timestamp: new Date().toISOString()
    };

    // Add image-specific data if it's an image response
    if (result.type === 'image' && result.imageUrl) {
      // The imageUrl now contains base64 data
      response.imageBase64 = result.imageUrl;
      response.enhancedPrompt = result.enhancedPrompt;
      
      // Add image metadata if available
      if (result.structuredData) {
        response.imageMetadata = {
          description: result.structuredData.description,
          style: result.structuredData.style,
          mood: result.structuredData.mood,
          composition: result.structuredData.composition,
          revisedPrompt: result.structuredData.revised_prompt,
          imageId: result.structuredData.image_id,
          partialImagesReceived: result.structuredData.partial_images_received
        };
      }
    }

    // Add structured data if available
    if (result.structuredData) {
      response.structuredData = result.structuredData;
    }

    // Add function calls information if available
    if (result.functionCalls && result.functionCalls.length > 0) {
      response.functionCalls = result.functionCalls.map((fc: any) => ({
        functionName: fc.functionName,
        result: fc.result
      }));
    }

    // Add web search calls information if available
    if (result.webSearchCalls && result.webSearchCalls.length > 0) {
      response.webSearchCalls = result.webSearchCalls.map((ws: any) => ({
        id: ws.id,
        status: ws.status,
        action: ws.action,
        query: ws.query,
        domains: ws.domains
      }));
    }

    // Add file search calls information if available
    if (result.fileSearchCalls && result.fileSearchCalls.length > 0) {
      response.fileSearchCalls = result.fileSearchCalls.map((fs: any) => ({
        id: fs.id,
        status: fs.status,
        queries: fs.queries,
        searchResults: fs.search_results
      }));
    }

    // Add usage information if available
    if (result.usage) {
      response.usage = result.usage;
    }

    // Add enhanced prompt for text responses
    if (result.type === 'text' && result.enhancedPrompt) {
      response.enhancedPrompt = result.enhancedPrompt;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat flow API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Authentication error. Please check your API configuration.' },
          { status: 401 }
        );
      }

      if (error.message.includes('content policy') || error.message.includes('moderation')) {
        return NextResponse.json(
          { error: 'The requested content violates our content policy. Please try a different prompt.' },
          { status: 400 }
        );
      }

      if (error.message.includes('model')) {
        return NextResponse.json(
          { error: 'Model not available. Please check your API access and model configuration.' },
          { status: 400 }
        );
      }

      if (error.message.includes('web search') || error.message.includes('search')) {
        return NextResponse.json(
          { error: 'Web search is currently unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      if (error.message.includes('file search') || error.message.includes('vector store')) {
        return NextResponse.json(
          { error: 'File search is currently unavailable. Please check your vector store configuration.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversation history
export async function GET() {
  try {
    const history = chatFlowController.getHistory();
    const referenceImages = chatFlowController.getReferenceImages();
    
    return NextResponse.json({
      success: true,
      history,
      referenceImages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear conversation history
export async function DELETE() {
  try {
    chatFlowController.clearHistory();
    
    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
} 