# 🔍 HTTP Response Headers Guide - Production Debugging

This guide covers the comprehensive HTTP response header system implemented in your Quelle AI application for production debugging and monitoring.

## 📋 Overview

The HTTP response header system provides detailed metadata about API requests, including:
- **Request IDs** for tracking individual requests
- **Rate limiting information** from external APIs
- **Processing times** for performance monitoring
- **Model and provider information** for debugging
- **Cache status** for optimization insights

## 🏗️ Architecture

### Core Components

1. **`lib/utils/api-response-headers.ts`** - Main utility for header management
2. **Updated AI Services** - Enhanced with header tracking
3. **Updated API Routes** - Return responses with custom headers
4. **Logging System** - Comprehensive request/error logging

### Header Types

#### External API Headers (OpenAI/Anthropic)
- `openai-organization` - Organization associated with the request
- `openai-processing-ms` - Time taken processing the API request
- `openai-version` - REST API version used
- `x-request-id` - Unique identifier for the API request

#### Rate Limiting Headers
- `x-ratelimit-limit-requests` - Maximum requests allowed
- `x-ratelimit-limit-tokens` - Maximum tokens allowed
- `x-ratelimit-remaining-requests` - Remaining requests in window
- `x-ratelimit-remaining-tokens` - Remaining tokens in window
- `x-ratelimit-reset-requests` - When request limit resets
- `x-ratelimit-reset-tokens` - When token limit resets

#### Custom Quelle Headers
- `x-quelle-request-id` - Unique Quelle request identifier
- `x-quelle-processing-ms` - Total processing time
- `x-quelle-model` - AI model used
- `x-quelle-provider` - AI provider (anthropic, vertex-ai, etc.)
- `x-quelle-cache-status` - Cache hit/miss/created status

## 🚀 Implementation

### 1. Request Metadata Creation

```typescript
import { APIResponseHeaderManager } from '@/lib/utils/api-response-headers';

// Create metadata for tracking
const metadata = APIResponseHeaderManager.createRequestMetadata(
  'claude-3-5-sonnet-20241022', 
  'anthropic'
);

// metadata contains:
// {
//   requestId: 'quelle_1703123456789_abc123def',
//   startTime: 1703123456789,
//   model: 'claude-3-5-sonnet-20241022',
//   provider: 'anthropic'
// }
```

### 2. Header Extraction from External APIs

```typescript
// Extract headers from external API response
const externalHeaders = APIResponseHeaderManager.extractHeadersFromResponse(response);

// This extracts all relevant headers:
// - OpenAI/Anthropic specific headers
// - Rate limiting information
// - Request IDs
```

### 3. Custom Header Creation

```typescript
const processingTime = Date.now() - metadata.startTime;
const customHeaders = APIResponseHeaderManager.createCustomHeaders(metadata, processingTime);

// Creates headers like:
// {
//   'x-quelle-request-id': 'quelle_1703123456789_abc123def',
//   'x-quelle-processing-ms': '1250',
//   'x-quelle-model': 'claude-3-5-sonnet-20241022',
//   'x-quelle-provider': 'anthropic'
// }
```

### 4. Request Logging

```typescript
// Log comprehensive request information
APIResponseHeaderManager.logRequestInfo(metadata, externalHeaders, processingTime);

// Outputs structured JSON log:
// {
//   "timestamp": "2023-12-21T10:30:45.123Z",
//   "requestId": "quelle_1703123456789_abc123def",
//   "model": "claude-3-5-sonnet-20241022",
//   "provider": "anthropic",
//   "processingTime": "1250ms",
//   "externalRequestId": "req_abc123def456",
//   "externalProcessingMs": "850",
//   "rateLimitInfo": {
//     "limitRequests": "100",
//     "remainingRequests": "95",
//     "resetRequests": "1703124000"
//   }
// }
```

### 5. Error Logging

```typescript
import { logAPIError } from '@/lib/utils/api-response-headers';

try {
  // API call
} catch (error) {
  logAPIError(error, metadata, externalHeaders);
  
  // Logs detailed error information with context
}
```

## 📊 Response Format

### Success Response with Headers

```json
{
  "text": "Hello! I'm here to help you...",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 200,
    "totalTokens": 350
  },
  "model": "claude-3-5-sonnet-20241022",
  "timestamp": "2023-12-21T10:30:45.123Z",
  "metadata": {
    "requestId": "quelle_1703123456789_abc123def",
    "processingTime": 1250,
    "externalRequestId": "req_abc123def456",
    "rateLimitInfo": {
      "limitRequests": "100",
      "remainingRequests": "95",
      "resetRequests": "1703124000"
    }
  }
}
```

**Response Headers:**
```
x-quelle-request-id: quelle_1703123456789_abc123def
x-quelle-processing-ms: 1250
x-quelle-model: claude-3-5-sonnet-20241022
x-quelle-provider: anthropic
x-request-id: req_abc123def456
```

### Error Response with Headers

```json
{
  "error": "AI service rate limit exceeded. Please try again later."
}
```

**Response Headers:**
```
x-quelle-request-id: quelle_1703123456789_abc123def
x-quelle-processing-ms: 150
x-quelle-model: claude-3-5-sonnet-20241022
x-quelle-provider: anthropic
```

## 🔧 Usage in API Routes

### Updated Chat API Route

```typescript
import { createAPIResponse } from '@/lib/utils/api-response-headers';

export async function POST(req: NextRequest) {
  try {
    // Process request...
    const response = await chatService.chat(request);
    
    // Create response with headers
    const responseData = { 
      text: response.message.content,
      usage: response.usage,
      model: response.model,
      metadata: response.metadata
    };

    // Add custom headers
    const customHeaders: any = {};
    if (response.metadata) {
      customHeaders['x-quelle-request-id'] = response.metadata.requestId;
      customHeaders['x-quelle-processing-ms'] = response.metadata.processingTime.toString();
      customHeaders['x-quelle-model'] = response.model;
      customHeaders['x-quelle-provider'] = 'anthropic';
    }

    return createAPIResponse(responseData, 200, customHeaders);
  } catch (error) {
    return createAPIResponse({ 
      error: error.message 
    }, 500);
  }
}
```

## 📈 Monitoring & Debugging

### 1. Request Tracking

Use the `x-quelle-request-id` header to track individual requests through your system:

```bash
# Example request
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}' \
  -v

# Response headers will include:
# x-quelle-request-id: quelle_1703123456789_abc123def
```

### 2. Performance Monitoring

Monitor processing times using the `x-quelle-processing-ms` header:

```typescript
// Log slow requests
if (processingTime > 5000) {
  console.warn(`Slow request detected: ${processingTime}ms for request ${metadata.requestId}`);
}
```

### 3. Rate Limit Monitoring

Track rate limit usage:

```typescript
// Check rate limit status
if (headers['x-ratelimit-remaining-requests'] && 
    parseInt(headers['x-ratelimit-remaining-requests']) < 5) {
  console.warn(`Rate limit warning: ${headers['x-ratelimit-remaining-requests']} requests remaining`);
}
```

### 4. Error Correlation

Correlate errors with request metadata:

```typescript
// Error logs include request context
{
  "timestamp": "2023-12-21T10:30:45.123Z",
  "requestId": "quelle_1703123456789_abc123def",
  "model": "claude-3-5-sonnet-20241022",
  "provider": "anthropic",
  "error": {
    "message": "Rate limit exceeded",
    "name": "RateLimitError"
  },
  "externalRequestId": "req_abc123def456"
}
```

## 🛠️ Production Deployment

### 1. Environment Variables

```bash
# Enable detailed logging in production
NODE_ENV=production
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

### 2. Monitoring Setup

```typescript
// Add to your monitoring system
const logToMonitoring = (logData: any) => {
  // Send to your monitoring service (DataDog, New Relic, etc.)
  monitoringService.log('api_request', logData);
};

// Hook into the logging system
APIResponseHeaderManager.logRequestInfo = (metadata, headers, processingTime) => {
  const logData = { metadata, headers, processingTime };
  logToMonitoring(logData);
};
```

### 3. Alerting

```typescript
// Set up alerts for critical issues
if (processingTime > 10000) {
  alertService.send('SLOW_REQUEST', {
    requestId: metadata.requestId,
    processingTime,
    model: metadata.model
  });
}

if (headers['x-ratelimit-remaining-requests'] === '0') {
  alertService.send('RATE_LIMIT_EXCEEDED', {
    requestId: metadata.requestId,
    resetTime: headers['x-ratelimit-reset-requests']
  });
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Missing Headers**: Ensure external APIs are returning expected headers
2. **Rate Limit Errors**: Check remaining limits and reset times
3. **Slow Performance**: Monitor processing times and identify bottlenecks
4. **Request ID Collisions**: Extremely rare due to timestamp + random string

### Debug Commands

```bash
# Test API with header inspection
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' \
  -D headers.txt \
  -o response.json

# View headers
cat headers.txt

# Check logs for specific request
grep "quelle_1703123456789_abc123def" logs/app.log
```

## 📚 Best Practices

1. **Always log request metadata** for production debugging
2. **Monitor rate limits** to prevent service disruptions
3. **Track processing times** to identify performance issues
4. **Use request IDs** for correlating logs across services
5. **Set up alerts** for critical thresholds
6. **Archive logs** for historical analysis

## 🔄 Future Enhancements

- **Distributed tracing** with OpenTelemetry
- **Real-time monitoring dashboard**
- **Automated performance optimization**
- **Advanced rate limit management**
- **Request correlation across microservices**

This header system provides comprehensive visibility into your API operations, making debugging and monitoring much more effective in production environments. 