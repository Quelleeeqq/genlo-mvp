import { NextRequest, NextResponse } from 'next/server';
import { enhancedChatService, ChatMessage } from '@/lib/ai/services/enhanced-chat-service';
import { apiSchemas, validationHelpers } from '@/lib/utils/validation';
import { createAPIResponse } from '@/lib/utils/api-response-headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validationResult = apiSchemas.aiChatRequest.safeParse(body);
    if (!validationResult.success) {
      return createAPIResponse({ 
        error: 'Invalid request data',
        details: validationHelpers.formatValidationError(validationResult.error)
      }, 400);
    }
    
    const { 
      prompt, 
      systemPrompt,
      messages = [],
      model,
      temperature,
      maxTokens,
      provider = 'anthropic',
      vertexConfig
    } = validationResult.data;
    
    // Sanitize inputs
    const sanitizedPrompt = prompt ? validationHelpers.sanitizeText(prompt) : undefined;
    const sanitizedSystemPrompt = systemPrompt ? validationHelpers.sanitizeText(systemPrompt) : undefined;
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      content: validationHelpers.sanitizeText(msg.content)
    }));

    // If only prompt is provided, create a simple request
    if (sanitizedPrompt && (!sanitizedMessages || sanitizedMessages.length === 0)) {
      const response = await enhancedChatService.chat({
        messages: [{ role: 'user', content: sanitizedPrompt }],
        systemPrompt: sanitizedSystemPrompt,
        provider,
        vertexConfig
      });
      
      const responseData = { 
        text: response.message.content,
        provider: response.provider,
        model: response.model,
        metadata: response.metadata
      };

      // Add custom headers if metadata is available
      const customHeaders: any = {};
      if (response.metadata) {
        customHeaders['x-quelle-request-id'] = response.metadata.requestId;
        customHeaders['x-quelle-processing-ms'] = response.metadata.processingTime.toString();
        customHeaders['x-quelle-model'] = response.model;
        customHeaders['x-quelle-provider'] = response.provider;
      }

      return createAPIResponse(responseData, 200, customHeaders);
    }

    // If messages are provided, use the full chat interface
    const chatMessages: ChatMessage[] = sanitizedMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
    }));

    const response = await enhancedChatService.chat({
      messages: chatMessages,
      systemPrompt: sanitizedSystemPrompt,
      model,
      temperature,
      maxTokens,
      provider,
      vertexConfig
    });

    const responseData = { 
      text: response.message.content,
      usage: response.usage,
      model: response.model,
      provider: response.provider,
      timestamp: response.message.timestamp,
      metadata: response.metadata
    };

    // Add custom headers if metadata is available
    const customHeaders: any = {};
    if (response.metadata) {
      customHeaders['x-quelle-request-id'] = response.metadata.requestId;
      customHeaders['x-quelle-processing-ms'] = response.metadata.processingTime.toString();
      customHeaders['x-quelle-model'] = response.model;
      customHeaders['x-quelle-provider'] = response.provider;
    }

    return createAPIResponse(responseData, 200, customHeaders);
  } catch (error) {
    console.error('Enhanced AI Chat API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while processing your request.' 
    }, 500);
  }
} 