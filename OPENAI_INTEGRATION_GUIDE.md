# OpenAI Integration Guide

This guide covers the complete OpenAI API integration for the Quelle AI application, including text generation, image analysis, web search, streaming, and function calling capabilities.

## Table of Contents

1. [Setup](#setup)
2. [Features](#features)
3. [API Endpoints](#api-endpoints)
4. [Usage Examples](#usage-examples)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Setup

### 1. Install Dependencies

```bash
npm install openai
```

### 2. Environment Variables

Add your OpenAI API key to your `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Provider Configuration

The OpenAI provider is automatically configured when you import it:

```typescript
import { openAIProvider } from '@/lib/ai/providers/openai';
```

## Features

### 1. Text Generation
- Support for all OpenAI chat models (GPT-4o, GPT-4o Mini, GPT-4 Turbo, etc.)
- Configurable parameters (temperature, max tokens, etc.)
- Streaming support for real-time responses

### 2. Image Analysis (Vision)
- Analyze images using GPT-4o models
- Support for both URL and base64 image inputs
- File upload support via FormData

### 3. Web Search
- Real-time web search using GPT-4o-search-preview
- Access to current information from the internet
- Configurable search parameters

### 4. Streaming Responses
- Server-sent events (SSE) for real-time streaming
- Progressive content delivery
- Usage tracking and metadata

### 5. Function Calling
- Support for OpenAI's function calling feature
- Custom function definitions
- Structured output generation

## API Endpoints

### 1. Text Generation
**Endpoint:** `POST /api/openai/text`

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello, how are you?" }
  ],
  "model": "o4-mini-2025-04-16",
  "maxTokens": 1000,
  "temperature": 0.7,
  "stream": false
}
```

**Response:**
```json
{
  "content": "I'm doing well, thank you for asking!",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 15,
    "totalTokens": 25
  },
  "metadata": {
    "requestId": "quelle_1234567890_abc123",
    "processingTime": 1500,
    "model": "o4-mini-2025-04-16",
    "provider": "openai"
  }
}
```

### 2. Image Analysis
**Endpoint:** `POST /api/openai/vision` (JSON) or `PUT /api/openai/vision` (FormData)

**JSON Request:**
```json
{
  "prompt": "What do you see in this image?",
  "imageUrl": "https://example.com/image.jpg",
  "maxTokens": 300,
  "temperature": 0.7
}
```

**FormData Request:**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('prompt', 'Describe this image');
formData.append('maxTokens', '300');
formData.append('temperature', '0.7');
```

### 3. Web Search
**Endpoint:** `POST /api/openai/search`

**Request Body:**
```json
{
  "query": "What was the latest news about AI today?",
  "maxTokens": 1000,
  "temperature": 0.7
}
```

### 4. Streaming Text Generation
**Endpoint:** `POST /api/openai/text`

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Tell me a story" }
  ],
  "stream": true
}
```

**Response (Server-Sent Events):**
```
data: {"content": "Once", "done": false}

data: {"content": " upon", "done": false}

data: {"content": " a", "done": false}

data: {"content": " time", "done": false}

data: {"content": "", "done": true, "usage": {...}}

data: {"metadata": {...}}
```

## Usage Examples

### 1. Basic Text Generation

```typescript
import { openAIProvider } from '@/lib/ai/providers/openai';

const result = await openAIProvider.generateText([
  { role: 'user', content: 'Write a short poem about coding' }
], {
  model: 'o4-mini-2025-04-16',
  maxTokens: 200,
  temperature: 0.8
});

console.log(result.content);
```

### 2. Image Analysis

```typescript
const result = await openAIProvider.analyzeImage({
  prompt: 'Describe what you see in this image',
  imageUrl: 'https://example.com/image.jpg',
  maxTokens: 300
});

console.log(result.content);
```

### 3. Web Search

```typescript
const result = await openAIProvider.webSearch({
  query: 'What are the latest developments in quantum computing?',
  maxTokens: 500
});

console.log(result.content);
```

### 4. Streaming Response

```typescript
const stream = openAIProvider.generateTextStream([
  { role: 'user', content: 'Tell me a story' }
]);

for await (const chunk of stream) {
  if (!chunk.done) {
    process.stdout.write(chunk.content);
  } else {
    console.log('\nUsage:', chunk.usage);
  }
}
```

### 5. Function Calling

```typescript
const functions = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA'
        }
      },
      required: ['location']
    }
  }
];

const result = await openAIProvider.generateWithFunctionCalling([
  { role: 'user', content: 'What\'s the weather like in New York?' }
], functions);

if (result.functionCall) {
  console.log('Function to call:', result.functionCall.name);
  console.log('Arguments:', result.functionCall.arguments);
}
```

## Configuration

### Provider Configuration

```typescript
import { createOpenAIProvider } from '@/lib/ai/providers/openai';

const customProvider = createOpenAIProvider({
  apiKey: 'your_custom_key',
  model: 'o4-mini-2025-04-16',
  maxTokens: 2000,
  temperature: 0.5
});
```

### Available Models

- `o4-mini-2025-04-16` - Latest O4 Mini model (default)
- `gpt-4o` - Latest GPT-4 model with vision capabilities
- `gpt-4o-mini` - Faster, more cost-effective version
- `gpt-4-turbo` - Previous generation GPT-4
- `gpt-3.5-turbo` - GPT-3.5 model for faster responses
- `gpt-4o-search-preview` - For web search capabilities

### Parameter Guidelines

- **Temperature**: 0.0 (deterministic) to 2.0 (very creative)
- **Max Tokens**: 1 to 4000 (model dependent)
- **Stream**: true/false for real-time responses

## Testing

### 1. Test Page

Visit `/test-openai` to access the comprehensive test suite that includes:

- Text generation testing
- Image analysis with file upload
- Web search functionality
- Streaming response testing
- Configuration panel

### 2. API Testing

Test individual endpoints using curl or Postman:

```bash
# Text generation
curl -X POST http://localhost:3000/api/openai/text \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "model": "o4-mini-2025-04-16"
  }'

# Image analysis
curl -X POST http://localhost:3000/api/openai/vision \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is in this image?",
    "imageUrl": "https://example.com/image.jpg"
  }'

# Web search
curl -X POST http://localhost:3000/api/openai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Latest AI news"
  }'
```

### 3. Connection Testing

```typescript
const isConnected = await openAIProvider.testConnection();
console.log('OpenAI connection:', isConnected ? 'OK' : 'Failed');
```

## Error Handling

### Common Errors

1. **API Key Missing**
   ```
   Error: OpenAI API key is required
   ```

2. **Invalid Model**
   ```
   Error: The model `invalid-model` does not exist
   ```

3. **Rate Limiting**
   ```
   Error: Rate limit exceeded
   ```

4. **Image Analysis Errors**
   ```
   Error: Either imageUrl or imageBase64 must be provided
   ```

### Error Response Format

```json
{
  "error": "Error message description",
  "metadata": {
    "requestId": "quelle_1234567890_abc123",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Best Practices

### 1. Model Selection

- Use `gpt-4o-mini` for cost-effective general tasks
- Use `gpt-4o` for complex reasoning and analysis
- Use `gpt-4o-search-preview` for current information needs

### 2. Token Management

- Set appropriate `maxTokens` to control costs
- Monitor usage through response metadata
- Use streaming for long responses to improve UX

### 3. Image Analysis

- Provide clear, specific prompts for better results
- Use appropriate image formats (JPEG, PNG)
- Consider image size and quality for optimal analysis

### 4. Web Search

- Use specific, targeted queries
- Combine with text generation for comprehensive responses
- Be aware of search limitations and rate limits

### 5. Error Handling

- Always handle API errors gracefully
- Implement retry logic for transient failures
- Log errors with request IDs for debugging

### 6. Security

- Never expose API keys in client-side code
- Validate all inputs before sending to OpenAI
- Implement rate limiting to prevent abuse

## Integration with Existing Services

The OpenAI provider integrates seamlessly with the existing AI services architecture:

```typescript
import { openAIProvider } from '@/lib/ai/providers/openai';
import { anthropicProvider } from '@/lib/ai/providers/anthropic';

// Use different providers based on requirements
const provider = useOpenAI ? openAIProvider : anthropicProvider;
```

## Monitoring and Logging

All API calls include comprehensive metadata:

- Request IDs for tracking
- Processing time measurements
- Token usage statistics
- Model and provider information

This data is automatically logged and can be used for:

- Performance monitoring
- Cost tracking
- Usage analytics
- Debugging and troubleshooting

## Next Steps

1. **Production Deployment**
   - Set up proper environment variables
   - Configure rate limiting
   - Implement monitoring and alerting

2. **Advanced Features**
   - Implement function calling workflows
   - Add support for fine-tuned models
   - Integrate with other OpenAI services (DALL-E, Whisper)

3. **Optimization**
   - Implement response caching
   - Add request batching
   - Optimize for cost and performance

4. **Security Enhancements**
   - Add input validation
   - Implement content filtering
   - Set up audit logging

For more information, refer to the [OpenAI API Documentation](https://platform.openai.com/docs). 