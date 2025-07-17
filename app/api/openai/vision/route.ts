import { NextRequest, NextResponse } from 'next/server';
import { openAIProvider } from '@/lib/ai/providers/openai';
import { createAPIResponse } from '@/lib/utils/api-response-headers';
import { APIResponseHeaderManager } from '@/lib/utils/api-response-headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      prompt = 'What is in this image?',
      imageUrl,
      imageBase64,
      mimeType = 'image/jpeg',
      maxTokens = 300,
      temperature = 0.7
    } = body;

    // Validate required fields
    if (!imageUrl && !imageBase64) {
      return createAPIResponse({ 
        error: 'Either imageUrl or imageBase64 is required' 
      }, 400);
    }

    // Create request metadata
    const metadata = APIResponseHeaderManager.createRequestMetadata('o4-mini-2025-04-16', 'openai');
    const startTime = Date.now();

    const result = await openAIProvider.analyzeImage({
      prompt,
      imageUrl,
      imageBase64,
      mimeType,
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
        model: 'o4-mini-2025-04-16',
        provider: 'openai'
      }
    };

    // Add custom headers
    const customHeaders = {
      'x-quelle-request-id': metadata.requestId,
      'x-quelle-processing-ms': processingTime.toString(),
      'x-quelle-model': 'o4-mini-2025-04-16',
      'x-quelle-provider': 'openai'
    };

    return createAPIResponse(responseData, 200, customHeaders);

  } catch (error) {
    console.error('OpenAI Vision API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while analyzing the image.' 
    }, 500);
  }
}

// Handle file uploads for image analysis
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string || 'What is in this image?';
    const image = formData.get('image') as File;
    const maxTokens = parseInt(formData.get('maxTokens') as string) || 300;
    const temperature = parseFloat(formData.get('temperature') as string) || 0.7;

    if (!image) {
      return createAPIResponse({ 
        error: 'Image file is required' 
      }, 400);
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = image.type;

    // Create request metadata
    const metadata = APIResponseHeaderManager.createRequestMetadata('o4-mini-2025-04-16', 'openai');
    const startTime = Date.now();

    const result = await openAIProvider.analyzeImage({
      prompt,
      imageBase64,
      mimeType,
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
        model: 'o4-mini-2025-04-16',
        provider: 'openai'
      }
    };

    // Add custom headers
    const customHeaders = {
      'x-quelle-request-id': metadata.requestId,
      'x-quelle-processing-ms': processingTime.toString(),
      'x-quelle-model': 'o4-mini-2025-04-16',
      'x-quelle-provider': 'openai'
    };

    return createAPIResponse(responseData, 200, customHeaders);

  } catch (error) {
    console.error('OpenAI Vision API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while analyzing the uploaded image.' 
    }, 500);
  }
} 