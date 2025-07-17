# Structured Outputs Integration Guide

## Overview

This guide documents the integration of OpenAI's Structured Outputs feature into the Quelle AI chat system. The implementation provides reliable, type-safe responses with confidence levels, suggestions, and metadata.

## Key Features

### 1. Structured Output Schemas

#### ChatResponseSchema
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "The main response content from the AI"
    },
    "confidence": {
      "type": "number",
      "description": "Confidence level in the response (0-1)",
      "minimum": 0,
      "maximum": 1
    },
    "suggestions": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional follow-up suggestions for the user"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "reasoning": { "type": "string" },
        "sources": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "additionalProperties": false
    }
  },
  "required": ["content", "confidence"],
  "additionalProperties": false
}
```

#### ImageGenerationSchema
```json
{
  "type": "object",
  "properties": {
    "description": { "type": "string" },
    "style": {
      "type": "string",
      "enum": ["realistic", "artistic", "cartoon", "abstract", "vintage", "modern"]
    },
    "mood": {
      "type": "string",
      "enum": ["bright", "dark", "warm", "cool", "mysterious", "cheerful", "serene", "dramatic"]
    },
    "composition": { "type": "string" },
    "enhanced_prompt": { "type": "string" }
  },
  "required": ["description", "style", "mood", "enhanced_prompt"],
  "additionalProperties": false
}
```

#### CreativeTaskSchema
```json
{
  "type": "object",
  "properties": {
    "content": { "type": "string" },
    "genre": {
      "type": "string",
      "enum": ["story", "poem", "song", "script", "essay", "brainstorm", "concept"]
    },
    "tone": {
      "type": "string",
      "enum": ["humorous", "serious", "romantic", "mysterious", "inspiring", "melancholic", "energetic"]
    },
    "themes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "word_count": {
      "type": "number",
      "minimum": 1
    }
  },
  "required": ["content", "genre", "tone"],
  "additionalProperties": false
}
```

### 2. Enhanced Chat Flow Controller

The `ChatFlowController` class orchestrates the entire AI interaction:

```typescript
class ChatFlowController {
  private claude: ClaudeHandler;
  private openai: OpenAIHandler;
  private conversationHistory: Array<{role: string; content: string}> = [];
  private referenceImages: Array<{url: string; description: string}> = [];

  async processMessage(userMessage: string, referenceImageUrl?: string): Promise<{
    type: 'text' | 'image';
    content: string;
    imageUrl?: string;
    enhancedPrompt?: string;
    usage?: any;
    structuredData?: any;
  }>
}
```

### 3. Intelligent Message Classification

```typescript
class MessageClassifier {
  static isImageRequest(message: string): boolean {
    const imageKeywords = [
      'generate', 'create', 'draw', 'image', 'picture', 'photo',
      'illustration', 'artwork', 'design', 'visual', 'sketch', 'show me'
    ];
    
    const lowerMessage = message.toLowerCase();
    return imageKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  static isCreativeRequest(message: string): boolean {
    const creativeKeywords = [
      'creative', 'imaginative', 'artistic', 'story', 'poem', 'song',
      'write', 'compose', 'brainstorm', 'ideas', 'concept'
    ];
    
    const lowerMessage = message.toLowerCase();
    return creativeKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}
```

## API Integration

### OpenAI Responses API

The system uses OpenAI's latest Responses API with structured outputs:

```typescript
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openai.apiKey}`,
  },
  body: JSON.stringify({
    model: "gpt-4o-2024-08-06",
    input: [
      { role: "developer", content: systemInstructions },
      { role: "user", content: userMessage }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "chat_response",
        schema: ChatResponseSchema,
        strict: true
      }
    }
  }),
});
```

### Claude Enhancement

Claude AI enhances prompts for better results:

```typescript
class ClaudeHandler {
  async enhancePrompt(userMessage: string, context?: string): Promise<string> {
    const systemPrompt = `# Identity
You are a creative prompt enhancement specialist for Quelle AI. Your role is to transform user requests into detailed, imaginative prompts that will generate high-quality AI responses.

# Instructions
- Enhance prompts to be more descriptive, creative, and engaging
- Add relevant context and details that would improve the output
- Maintain the user's original intent while expanding on it
- For image requests, include visual details like style, composition, lighting, mood
- Keep enhanced prompts under 1000 characters for API compatibility
- Be creative but practical`;

    const msg = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: context 
          ? `Enhance this request: "${userMessage}"\n\nContext: ${context}`
          : `Enhance this request: "${userMessage}"`
      }]
    });

    return msg.content[0].text.trim();
  }
}
```

## Frontend Integration

### DashboardChat Component

The React component displays structured data:

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  enhancedPrompt?: string;
  structuredData?: {
    confidence?: number;
    suggestions?: string[];
    metadata?: {
      reasoning?: string;
      sources?: string[];
    };
  };
  usage?: any;
}
```

### Structured Data Display

```tsx
{message.structuredData && (
  <div className="mt-2 space-y-1">
    {/* Confidence level */}
    {message.structuredData.confidence !== undefined && (
      <div className="text-xs opacity-70">
        <strong>Confidence:</strong> {(message.structuredData.confidence * 100).toFixed(1)}%
      </div>
    )}
    
    {/* Suggestions */}
    {message.structuredData.suggestions && message.structuredData.suggestions.length > 0 && (
      <div className="text-xs opacity-70">
        <strong>Suggestions:</strong>
        <ul className="list-disc list-inside mt-1">
          {message.structuredData.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      </div>
    )}
    
    {/* Reasoning */}
    {message.structuredData.metadata?.reasoning && (
      <div className="text-xs opacity-70">
        <strong>Reasoning:</strong> {message.structuredData.metadata.reasoning}
      </div>
    )}
  </div>
)}
```

## Error Handling

### Structured Output Parsing

```typescript
if (data.output && data.output[0]?.content) {
  const outputContent = data.output[0].content[0];
  
  if (outputContent.type === 'output_text') {
    try {
      structuredData = JSON.parse(outputContent.text);
      content = structuredData.content || outputContent.text;
    } catch (parseError) {
      console.warn('Failed to parse structured output, using raw text');
      content = outputContent.text;
    }
  } else if (outputContent.type === 'refusal') {
    content = `I apologize, but I cannot fulfill this request: ${outputContent.refusal}`;
  } else {
    content = outputContent.text || 'No response content available';
  }
} else {
  content = data.output_text || '';
}
```

### Rate Limiting and Retries

```typescript
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
}
```

## Benefits of Structured Outputs

### 1. Reliable Type Safety
- No need to validate or retry incorrectly formatted responses
- Guaranteed schema adherence
- Consistent data structure

### 2. Explicit Refusals
- Safety-based model refusals are programmatically detectable
- Clear error handling for content policy violations
- User-friendly refusal messages

### 3. Enhanced User Experience
- Confidence levels help users understand response reliability
- Suggestions provide follow-up interaction opportunities
- Metadata offers transparency about AI reasoning

### 4. Better Prompt Engineering
- No need for strongly worded prompts to achieve consistent formatting
- Structured schemas guide the model's output
- Reduced hallucination through schema constraints

## Usage Examples

### Text Generation with Confidence
```
User: "What are the latest trends in AI technology?"

Response:
{
  "content": "The latest trends in AI technology include...",
  "confidence": 0.85,
  "suggestions": [
    "Would you like me to elaborate on any specific trend?",
    "Should I research recent AI breakthroughs in detail?"
  ],
  "metadata": {
    "reasoning": "Based on recent industry reports and research papers",
    "sources": ["MIT Technology Review", "Nature AI", "arXiv papers"]
  }
}
```

### Image Generation with Style Analysis
```
User: "Generate an image of a futuristic city"

Response:
{
  "description": "A cyberpunk-inspired cityscape with neon lights and flying cars",
  "style": "modern",
  "mood": "mysterious",
  "composition": "Low-angle shot with dramatic lighting",
  "enhanced_prompt": "A futuristic cyberpunk cityscape at night with neon lights, flying cars, and towering skyscrapers, dramatic low-angle composition, cinematic lighting, highly detailed, 4K quality"
}
```

### Creative Task with Genre Classification
```
User: "Write a story about time travel"

Response:
{
  "content": "In the year 2157, Dr. Sarah Chen stood before...",
  "genre": "story",
  "tone": "mysterious",
  "themes": ["time travel", "scientific discovery", "human nature"],
  "word_count": 450
}
```

## Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Claude Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Model Configuration
```typescript
const aiConfig: AIConfig = {
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
    imageModel: 'dall-e-3'
  }
};
```

## Testing

### Test Page
Visit `/test-chat-flow` to test the structured outputs system with sample prompts.

### Sample Test Cases
1. **Text Generation**: Ask general questions to see confidence levels and suggestions
2. **Image Generation**: Use image keywords to trigger DALL-E generation with enhanced prompts
3. **Creative Tasks**: Request stories, poems, or creative content for Claude routing
4. **Structured Analysis**: Ask for detailed analysis to see metadata and reasoning

## Future Enhancements

### 1. Advanced Schemas
- Custom schemas for specific domains (finance, healthcare, etc.)
- Dynamic schema selection based on user context
- Multi-step reasoning schemas

### 2. Enhanced Metadata
- Source verification and citation tracking
- Confidence breakdown by response sections
- Bias detection and transparency metrics

### 3. Conversation Memory
- Long-term conversation state management
- Context-aware schema selection
- Personalized response patterns

### 4. Streaming Support
- Real-time structured output streaming
- Progressive confidence updates
- Live suggestion generation

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**
   - Ensure all required fields are present
   - Check enum values are valid
   - Verify `additionalProperties: false` is set

2. **Prompt Length Limits**
   - Enhanced prompts are automatically truncated to 1000 characters
   - Monitor console warnings for truncation events

3. **API Rate Limits**
   - Implement exponential backoff for retries
   - Monitor usage with structured data
   - Consider request queuing for high-volume usage

4. **Parsing Errors**
   - Fallback to raw text when structured parsing fails
   - Log parsing errors for debugging
   - Implement schema versioning for compatibility

## Conclusion

The structured outputs integration provides a robust, type-safe foundation for AI interactions. By leveraging OpenAI's latest API features and combining them with Claude's creative enhancement, the system delivers reliable, transparent, and engaging user experiences.

The implementation balances technical sophistication with practical usability, making it suitable for both development and production environments. 