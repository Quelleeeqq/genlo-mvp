import { NextRequest, NextResponse } from 'next/server';
import { openAIProvider } from '@/lib/ai/providers/openai';
import { createAPIResponse } from '@/lib/utils/api-response-headers';
import { APIResponseHeaderManager } from '@/lib/utils/api-response-headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      messages,
      model = 'o4-mini-2025-04-16',
      maxTokens = 1000,
      temperature = 0.7,
      stream = false
    } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return createAPIResponse({ 
        error: 'Messages array is required' 
      }, 400);
    }

    // Create request metadata
    const metadata = APIResponseHeaderManager.createRequestMetadata(model, 'openai');
    const startTime = Date.now();

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const streamGenerator = openAIProvider.generateTextStream(messages, {
              model,
              maxTokens,
              temperature
            });

            for await (const chunk of streamGenerator) {
              const data = JSON.stringify({
                content: chunk.content,
                done: chunk.done,
                usage: chunk.usage
              });
              
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              
              if (chunk.done) {
                const processingTime = Date.now() - startTime;
                const customHeaders = APIResponseHeaderManager.createCustomHeaders(metadata, processingTime);
                
                // Add final metadata
                const finalData = JSON.stringify({
                  metadata: {
                    requestId: metadata.requestId,
                    processingTime,
                    model,
                    provider: 'openai'
                  }
                });
                
                controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                controller.close();
              }
            }
          } catch (error) {
            console.error('OpenAI streaming error:', error);
            const errorData = JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'x-quelle-request-id': metadata.requestId,
          'x-quelle-model': model,
          'x-quelle-provider': 'openai'
        }
      });
    } else {
      // Handle regular response
      const result = await openAIProvider.generateText(messages, {
        model,
        maxTokens,
        temperature
      });

      const processingTime = Date.now() - startTime;

      // Log request information
      APIResponseHeaderManager.logRequestInfo(metadata, {}, processingTime);

      const responseData = {
        content: result.content,
        usage: result.usage,
        metadata: {
          requestId: metadata.requestId,
          processingTime,
          model,
          provider: 'openai'
        }
      };

      // Add custom headers
      const customHeaders = {
        'x-quelle-request-id': metadata.requestId,
        'x-quelle-processing-ms': processingTime.toString(),
        'x-quelle-model': model,
        'x-quelle-provider': 'openai'
      };

      return createAPIResponse(responseData, 200, customHeaders);
    }

  } catch (error) {
    console.error('OpenAI Text API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while processing your request.' 
    }, 500);
  }
} 