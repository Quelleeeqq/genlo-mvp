# Enhanced Chat Flow System Guide

This guide covers the new enhanced chat flow system that integrates OpenAI's latest Responses API with Claude AI for prompt enhancement and intelligent routing.

## Overview

The enhanced chat flow system provides a unified interface for text generation, image generation, and creative tasks using the latest AI technologies:

- **OpenAI Responses API**: Uses the new `/v1/responses` endpoint with proper message roles
- **Claude AI**: Handles prompt enhancement and creative tasks
- **Intelligent Routing**: Automatically selects the best AI model for each request type
- **Conversation State Management**: Maintains context across multiple interactions

## Architecture

### 1. Chat Flow Controller (`lib/ai/chat-flow-controller.ts`)

The main orchestrator that handles all AI interactions:

```typescript
interface AIConfig {
  claude: {
    apiKey: string;
    model: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229';
  };
  openai: {
    apiKey: string;
    model: 'gpt-4.1' | 'gpt-4o' | 'gpt-4o-mini';
    imageModel: 'dall-e-3' | 'dall-e-2';
  };
}
```

### 2. Message Classification

Automatically detects request types:

- **Image Requests**: Keywords like "generate", "create", "draw", "image", "picture"
- **Creative Requests**: Keywords like "creative", "story", "poem", "brainstorm"
- **Text Requests**: General conversation and information requests

### 3. AI Service Handlers

#### Claude Handler
- **Prompt Enhancement**: Transforms user requests into detailed, imaginative prompts
- **Creative Responses**: Handles storytelling, poetry, brainstorming, and artistic tasks
- **System Prompts**: Uses structured prompts with examples and instructions

#### OpenAI Handler
- **Text Generation**: Uses the new Responses API with proper message roles
- **Image Generation**: DALL-E 3 integration with enhanced prompts
- **Conversation State**: Maintains context with `previous_response_id`

## API Endpoints

### 1. Enhanced Chat Flow (`/api/ai-chat-flow`)

**POST** - Process messages with intelligent routing

```json
{
  "message": "Generate an image of a futuristic city",
  "referenceImageUrl": "data:image/jpeg;base64,...", // Optional
  "clearHistory": false // Optional
}
```

**Response:**
```json
{
  "type": "image",
  "content": "Here's your futuristic city image with enhanced details...",
  "imageUrl": "https://...",
  "enhancedPrompt": "A stunning futuristic city skyline with neon lights...",
  "usage": { "promptTokens": 150, "completionTokens": 200 },
  "metadata": {
    "requestId": "req_123",
    "processingTime": 2500,
    "model": "dall-e-3",
    "provider": "openai"
  }
}
```

**GET** - Retrieve conversation history
**DELETE** - Clear conversation history

## Key Features

### 1. OpenAI Responses API Integration

Uses the latest `/v1/responses` endpoint with proper message roles:

```typescript
const input = [
  {
    role: 'developer',
    content: systemInstructions
  },
  {
    role: 'user',
    content: enhancedPrompt
  }
];

const requestBody = {
  model: 'gpt-4.1',
  input,
  max_output_tokens: 2000,
  previous_response_id: conversationState.previousResponseId
};
```

### 2. Claude Prompt Enhancement

Enhances user prompts for better AI responses:

```typescript
const systemPrompt = `# Identity
You are a creative prompt enhancement specialist for Quelle AI.

# Instructions
- Enhance prompts to be more descriptive, creative, and engaging
- Add relevant context and details that would improve the output
- Keep enhanced prompts under 1000 characters for API compatibility

# Examples
<user_request>"Draw a cat"</user_request>
<enhanced_prompt>"A majestic orange tabby cat sitting regally on a sunlit windowsill, detailed fur texture, warm golden lighting, photorealistic style, high quality"</enhanced_prompt>`;
```

### 3. Intelligent Model Routing

Automatically routes requests to the best AI model:

- **General Text**: OpenAI GPT-4.1 with Claude-enhanced prompts
- **Creative Tasks**: Claude AI for storytelling, poetry, brainstorming
- **Image Generation**: DALL-E 3 with enhanced prompts
- **Image-to-Image**: DALL-E 3 with reference image support

### 4. Conversation State Management

Maintains context across interactions:

```typescript
private conversationState: {
  previousResponseId?: string;
  messages: Array<{role: 'developer' | 'user' | 'assistant'; content: string}>;
} = { messages: [] };
```

## Usage Examples

### 1. Text Generation

```typescript
// User: "What's the weather like today?"
// System: Routes to OpenAI with Claude-enhanced prompt
// Enhanced: "Provide a detailed weather forecast for today with current conditions, temperature, and any weather alerts or recommendations"
// Response: Comprehensive weather information
```

### 2. Image Generation

```typescript
// User: "Generate an image of a robot"
// System: Routes to Claude for prompt enhancement
// Enhanced: "A sleek, modern robot with metallic silver finish, standing in a futuristic laboratory, soft blue lighting, high detail, photorealistic style"
// Response: DALL-E 3 generated image
```

### 3. Creative Tasks

```typescript
// User: "Write a story about time travel"
// System: Routes to Claude for creative response
// Response: Original creative story with engaging narrative
```

### 4. Image-to-Image Generation

```typescript
// User uploads reference image + "Make it more colorful"
// System: Uses reference image with enhanced prompt
// Enhanced: "Transform this image with vibrant, saturated colors while maintaining the original composition and subject matter"
// Response: Color-enhanced version of the reference image
```

## Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Claude Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Model Configuration

```typescript
const aiConfig: AIConfig = {
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4.1',
    imageModel: 'dall-e-3'
  }
};
```

## Error Handling

The system includes comprehensive error handling:

1. **API Failures**: Graceful fallbacks to alternative models
2. **Rate Limiting**: Automatic retry with exponential backoff
3. **Invalid Inputs**: Validation and user-friendly error messages
4. **Network Issues**: Timeout handling and connection retry

## Performance Optimizations

1. **Prompt Caching**: Reuses system prompts for better performance
2. **Conversation Trimming**: Keeps only recent messages in context
3. **Parallel Processing**: Handles image and text generation efficiently
4. **Response Streaming**: Real-time content delivery for better UX

## Testing

Use the test page at `/test-chat-flow` to try different types of requests:

- Text generation with various topics
- Image generation with different styles
- Creative tasks like storytelling and brainstorming
- Image-to-image generation with reference images

## Best Practices

### 1. Prompt Engineering

- Use clear, specific instructions in system prompts
- Include examples for better model understanding
- Keep prompts under token limits
- Use structured formatting with headers and sections

### 2. Error Handling

- Always provide fallback responses
- Log errors for debugging
- Give users helpful error messages
- Implement retry logic for transient failures

### 3. Performance

- Cache frequently used prompts
- Limit conversation history length
- Use appropriate model sizes for tasks
- Monitor API usage and costs

### 4. User Experience

- Provide loading indicators
- Show enhanced prompts when helpful
- Maintain conversation context
- Offer clear feedback on errors

## Migration from Old System

The enhanced chat flow is backward compatible. To migrate:

1. Update environment variables
2. Replace old API calls with `/api/ai-chat-flow`
3. Update response handling to use new format
4. Test with various request types

## Troubleshooting

### Common Issues

1. **API Key Errors**: Check environment variables
2. **Rate Limiting**: Implement exponential backoff
3. **Prompt Too Long**: Use Claude enhancement to shorten
4. **Image Generation Fails**: Check DALL-E API status

### Debug Mode

Enable debug logging by setting:

```typescript
console.log('Enhanced chat flow API response:', chatFlowData);
```

## Future Enhancements

1. **Streaming Responses**: Real-time content delivery
2. **Multi-Modal Support**: Video and audio generation
3. **Custom Models**: Fine-tuned models for specific domains
4. **Advanced Routing**: ML-based request classification
5. **Analytics**: Usage tracking and performance metrics

## Support

For issues or questions:

1. Check the error logs in the browser console
2. Verify API keys are correctly configured
3. Test with the `/test-chat-flow` page
4. Review the API response format documentation

---

This enhanced chat flow system provides a modern, efficient, and user-friendly interface for AI interactions, leveraging the latest technologies from OpenAI and Anthropic. 