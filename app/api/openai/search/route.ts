import { NextRequest, NextResponse } from 'next/server';
import { openAIProvider } from '@/lib/ai/providers/openai';
import { createAPIResponse } from '@/lib/utils/api-response-headers';
import { APIResponseHeaderManager } from '@/lib/utils/api-response-headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      query,
      model = 'gpt-4o-search-preview',
      maxTokens = 1000,
      temperature = 0.7
    } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return createAPIResponse({ 
        error: 'Query string is required' 
      }, 400);
    }

    // Create request metadata
    const metadata = APIResponseHeaderManager.createRequestMetadata(model, 'openai');
    const startTime = Date.now();

    const result = await openAIProvider.webSearch({
      query,
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

  } catch (error) {
    console.error('OpenAI Search API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while performing web search.' 
    }, 500);
  }
} 