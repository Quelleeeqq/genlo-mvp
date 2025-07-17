export interface APIResponseHeaders {
  // OpenAI/Anthropic specific headers
  'openai-organization'?: string;
  'openai-processing-ms'?: string;
  'openai-version'?: string;
  'x-request-id'?: string;
  
  // Rate limiting headers
  'x-ratelimit-limit-requests'?: string;
  'x-ratelimit-limit-tokens'?: string;
  'x-ratelimit-remaining-requests'?: string;
  'x-ratelimit-remaining-tokens'?: string;
  'x-ratelimit-reset-requests'?: string;
  'x-ratelimit-reset-tokens'?: string;
  
  // Custom headers
  'x-quelle-request-id'?: string;
  'x-quelle-processing-ms'?: string;
  'x-quelle-model'?: string;
  'x-quelle-provider'?: string;
  'x-quelle-cache-status'?: string;
  
  // Evaluation headers
  'x-quelle-eval-id'?: string;
  'x-quelle-eval-tests'?: string;
  'x-quelle-eval-passed'?: string;
  'x-quelle-eval-success-rate'?: string;
}

export interface APIRequestMetadata {
  requestId: string;
  startTime: number;
  model?: string;
  provider?: string;
  cacheStatus?: 'hit' | 'miss' | 'created';
}

export class APIResponseHeaderManager {
  private static generateRequestId(): string {
    return `quelle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createRequestMetadata(model?: string, provider?: string): APIRequestMetadata {
    return {
      requestId: this.generateRequestId(),
      startTime: Date.now(),
      model,
      provider
    };
  }

  static extractHeadersFromResponse(response: Response): APIResponseHeaders {
    const headers: APIResponseHeaders = {};
    
    // Extract OpenAI/Anthropic headers
    const openaiOrg = response.headers.get('openai-organization');
    const openaiProcessingMs = response.headers.get('openai-processing-ms');
    const openaiVersion = response.headers.get('openai-version');
    const requestId = response.headers.get('x-request-id');
    
    if (openaiOrg) headers['openai-organization'] = openaiOrg;
    if (openaiProcessingMs) headers['openai-processing-ms'] = openaiProcessingMs;
    if (openaiVersion) headers['openai-version'] = openaiVersion;
    if (requestId) headers['x-request-id'] = requestId;
    
    // Extract rate limiting headers
    const rateLimitLimitRequests = response.headers.get('x-ratelimit-limit-requests');
    const rateLimitLimitTokens = response.headers.get('x-ratelimit-limit-tokens');
    const rateLimitRemainingRequests = response.headers.get('x-ratelimit-remaining-requests');
    const rateLimitRemainingTokens = response.headers.get('x-ratelimit-remaining-tokens');
    const rateLimitResetRequests = response.headers.get('x-ratelimit-reset-requests');
    const rateLimitResetTokens = response.headers.get('x-ratelimit-reset-tokens');
    
    if (rateLimitLimitRequests) headers['x-ratelimit-limit-requests'] = rateLimitLimitRequests;
    if (rateLimitLimitTokens) headers['x-ratelimit-limit-tokens'] = rateLimitLimitTokens;
    if (rateLimitRemainingRequests) headers['x-ratelimit-remaining-requests'] = rateLimitRemainingRequests;
    if (rateLimitRemainingTokens) headers['x-ratelimit-remaining-tokens'] = rateLimitRemainingTokens;
    if (rateLimitResetRequests) headers['x-ratelimit-reset-requests'] = rateLimitResetRequests;
    if (rateLimitResetTokens) headers['x-ratelimit-reset-tokens'] = rateLimitResetTokens;
    
    return headers;
  }

  static createCustomHeaders(metadata: APIRequestMetadata, processingTime?: number): APIResponseHeaders {
    const headers: APIResponseHeaders = {
      'x-quelle-request-id': metadata.requestId,
      'x-quelle-model': metadata.model,
      'x-quelle-provider': metadata.provider,
      'x-quelle-cache-status': metadata.cacheStatus
    };
    
    if (processingTime !== undefined) {
      headers['x-quelle-processing-ms'] = processingTime.toString();
    }
    
    return headers;
  }

  static logRequestInfo(metadata: APIRequestMetadata, headers: APIResponseHeaders, processingTime?: number) {
    const logData = {
      timestamp: new Date().toISOString(),
      requestId: metadata.requestId,
      model: metadata.model,
      provider: metadata.provider,
      processingTime: processingTime ? `${processingTime}ms` : undefined,
      cacheStatus: metadata.cacheStatus,
      externalRequestId: headers['x-request-id'],
      externalProcessingMs: headers['openai-processing-ms'],
      rateLimitInfo: {
        limitRequests: headers['x-ratelimit-limit-requests'],
        remainingRequests: headers['x-ratelimit-remaining-requests'],
        resetRequests: headers['x-ratelimit-reset-requests'],
        limitTokens: headers['x-ratelimit-limit-tokens'],
        remainingTokens: headers['x-ratelimit-remaining-tokens'],
        resetTokens: headers['x-ratelimit-reset-tokens']
      }
    };
    
    console.log('API Request Info:', JSON.stringify(logData, null, 2));
    
    // Log rate limiting warnings
    if (headers['x-ratelimit-remaining-requests'] && parseInt(headers['x-ratelimit-remaining-requests']) < 5) {
      console.warn(`Rate limit warning: ${headers['x-ratelimit-remaining-requests']} requests remaining`);
    }
    
    if (headers['x-ratelimit-remaining-tokens'] && parseInt(headers['x-ratelimit-remaining-tokens']) < 1000) {
      console.warn(`Token limit warning: ${headers['x-ratelimit-remaining-tokens']} tokens remaining`);
    }
  }

  static addHeadersToResponse(response: Response, customHeaders: APIResponseHeaders): Response {
    const newResponse = new Response(response.body, response);
    
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (value) {
        newResponse.headers.set(key, value);
      }
    });
    
    return newResponse;
  }
}

// Utility function for Next.js API routes
export function createAPIResponse(data: any, status: number = 200, headers: APIResponseHeaders = {}): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
  
  return response;
}

// Utility function for logging API errors with headers
export function logAPIError(error: any, metadata: APIRequestMetadata, headers: APIResponseHeaders = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: metadata.requestId,
    model: metadata.model,
    provider: metadata.provider,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    externalRequestId: headers['x-request-id'],
    rateLimitInfo: {
      limitRequests: headers['x-ratelimit-limit-requests'],
      remainingRequests: headers['x-ratelimit-remaining-requests'],
      resetRequests: headers['x-ratelimit-reset-requests']
    }
  };
  
  console.error('API Error:', JSON.stringify(errorLog, null, 2));
} 