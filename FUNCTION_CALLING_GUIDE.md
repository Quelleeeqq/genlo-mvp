# Function Calling Implementation Guide

## 🚀 **Overview**

This guide documents the implementation of OpenAI Function Calling in the Quelle AI chat system, enabling powerful data fetching and action-taking capabilities.

## 📋 **Table of Contents**

1. [Architecture Overview](#architecture-overview)
2. [Available Functions](#available-functions)
3. [Implementation Details](#implementation-details)
4. [Usage Examples](#usage-examples)
5. [API Integration](#api-integration)
6. [UI Components](#ui-components)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)
10. [Future Enhancements](#future-enhancements)

## 🏗️ **Architecture Overview**

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Message Classifier │───▶│ Function Detection │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Function Calls │◀───│  OpenAI API      │◀───│  Chat Controller │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Function Results│───▶│  Response Processing │───▶│  UI Display     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Flow Process

1. **Message Classification**: Detects if function calling is needed
2. **Function Detection**: Identifies relevant functions based on keywords
3. **API Call**: Sends request to OpenAI with function definitions
4. **Function Execution**: Executes detected functions with parameters
5. **Result Integration**: Incorporates function results into final response
6. **UI Display**: Shows function calls and results to user

## 🔧 **Available Functions**

### 1. Weather Information (`get_weather`)
- **Purpose**: Get current weather for any location
- **Parameters**: 
  - `location` (string): City and country
  - `units` (optional): "celsius" or "fahrenheit"
- **Example**: "What's the weather like in Paris?"

### 2. Email Sending (`send_email`)
- **Purpose**: Send emails to recipients
- **Parameters**:
  - `to` (string): Recipient email address
  - `subject` (string): Email subject
  - `body` (string): Email content
- **Example**: "Send an email to john@example.com saying hello"

### 3. Knowledge Base Search (`search_knowledge_base`)
- **Purpose**: Search internal knowledge base
- **Parameters**:
  - `query` (string): Search query
  - `options` (object): Search options
- **Example**: "Search for information about AI in the knowledge base"

### 4. File Operations (`file_operations`)
- **Purpose**: Perform file system operations
- **Parameters**:
  - `operation` (string): "read", "write", "delete", "list"
  - `path` (string): File path
  - `content` (optional): Content for write operations
- **Example**: "List files in the documents folder"

### 5. Database Queries (`query_database`)
- **Purpose**: Query database tables
- **Parameters**:
  - `table` (string): Table name
  - `query` (string): Query string
  - `limit` (optional): Result limit
- **Example**: "Query the users table for active accounts"

### 6. News Search (`search_news`)
- **Purpose**: Search for recent news articles
- **Parameters**:
  - `query` (string): News search query
  - `category` (optional): News category
  - `limit` (optional): Number of results
- **Example**: "Find recent news about artificial intelligence"

### 7. Calculator (`calculate`)
- **Purpose**: Perform mathematical calculations
- **Parameters**:
  - `expression` (string): Mathematical expression
- **Example**: "Calculate 15 * 23 + 7"

## ⚙️ **Implementation Details**

### Function Definitions Schema

```typescript
export const functionDefinitions = [
  {
    type: "function",
    name: "get_weather",
    description: "Get current weather information for a specific location.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City and country e.g. Paris, France"
        },
        units: {
          type: ["string", "null"],
          enum: ["celsius", "fahrenheit"],
          description: "Temperature units"
        }
      },
      required: ["location"],
      additionalProperties: false
    }
  }
  // ... more functions
];
```

### Function Execution Flow

```typescript
// 1. Detect function calling need
const needsFunctionCalling = MessageClassifier.needsFunctionCalling(userMessage);

// 2. Make initial API call with functions
const response = await openai.responses.create({
  model: "gpt-4o",
  input: messages,
  tools: functionDefinitions,
  tool_choice: "auto"
});

// 3. Execute function calls
const functionCalls = response.output.filter(item => item.type === 'function_call');
for (const functionCall of functionCalls) {
  const args = JSON.parse(functionCall.arguments);
  const result = await executeFunction(functionCall.name, args);
  // Add result to conversation
}

// 4. Make final response with results
const finalResponse = await openai.responses.create({
  model: "gpt-4o",
  input: messagesWithResults,
  text: { format: { type: "json_schema", schema: ChatResponseSchema } }
});
```

### Message Classification

```typescript
static needsFunctionCalling(message: string): boolean {
  const functionKeywords = [
    'weather', 'temperature', 'email', 'send', 'search', 'find', 'query',
    'database', 'file', 'calculate', 'math', 'news', 'knowledge', 'data'
  ];
  
  const lowerMessage = message.toLowerCase();
  return functionKeywords.some(keyword => lowerMessage.includes(keyword));
}
```

## 💡 **Usage Examples**

### Weather Query
```
User: "What's the weather like in Tokyo today?"
AI: [Calls get_weather function]
Result: "Current weather in Tokyo: 22.5°C, Partly cloudy"
```

### Mathematical Calculation
```
User: "Calculate 15 * 23 + 7"
AI: [Calls calculate function]
Result: "Result: 352"
```

### Email Sending
```
User: "Send an email to alice@example.com with subject 'Meeting' and body 'Let's meet tomorrow'"
AI: [Calls send_email function]
Result: "Email sent successfully to alice@example.com with subject: 'Meeting'"
```

### News Search
```
User: "Find recent news about renewable energy"
AI: [Calls search_news function]
Result: "Latest news for 'renewable energy': [news articles...]"
```

## 🔌 **API Integration**

### Chat Flow API Endpoint

```typescript
// POST /api/ai-chat-flow
{
  "message": "What's the weather like in Paris?",
  "referenceImageUrl": "optional-image-url"
}

// Response
{
  "success": true,
  "type": "text",
  "content": "The current weather in Paris is 18°C with partly cloudy skies.",
  "functionCalls": [
    {
      "functionName": "get_weather",
      "result": "Current weather in Paris: 18°C, Partly cloudy"
    }
  ],
  "structuredData": {
    "confidence": 0.95,
    "metadata": {
      "functions_used": ["get_weather"]
    }
  }
}
```

### Function Execution Handler

```typescript
export async function executeFunction(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'get_weather':
        return await getWeather(args.location, args.units);
      case 'send_email':
        return await sendEmail(args.to, args.subject, args.body);
      // ... other functions
      default:
        return `Unknown function: ${name}`;
    }
  } catch (error) {
    console.error(`Function execution error for ${name}:`, error);
    return `Error executing ${name}: ${error.message}`;
  }
}
```

## 🎨 **UI Components**

### Function Call Display

```tsx
{/* Function calls display */}
{message.functionCalls && message.functionCalls.length > 0 && (
  <div className="mt-2 space-y-1">
    <div className="text-xs opacity-70">
      <strong>🔧 Functions Used:</strong>
    </div>
    {message.functionCalls.map((fc, index) => (
      <div key={index} className="text-xs opacity-70 ml-2">
        <div className="font-medium">{fc.functionName}</div>
        <div className="text-xs opacity-60 mt-1">{fc.result}</div>
      </div>
    ))}
  </div>
)}
```

### Function Hints

```tsx
{/* Function calling hint */}
<p className="text-xs text-gray-600 mt-2">
  🔧 <strong>Try:</strong> "What's the weather like?", "Calculate 15 * 23", "Search for AI news", "Send an email to..."
</p>
```

## 🛡️ **Error Handling**

### Function Execution Errors

```typescript
try {
  const result = await executeFunction(functionCall.name, args);
  return result;
} catch (error) {
  console.error(`Error executing function ${functionCall.name}:`, error);
  return `Error executing ${functionCall.name}: ${error.message}`;
}
```

### API Error Handling

```typescript
if (!response.ok) {
  if (response.status === 429) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again in a moment.' },
      { status: 429 }
    );
  }
  throw new Error(`OpenAI API error: ${response.status}`);
}
```

### User-Friendly Error Messages

```typescript
const errorMessage: Message = {
  id: (Date.now() + 1).toString(),
  role: 'assistant',
  content: 'Sorry, I encountered an error processing your request. Please try again.',
  timestamp: new Date()
};
```

## 🔒 **Security Considerations**

### Input Validation

```typescript
// Validate function parameters
if (!args.location || typeof args.location !== 'string') {
  return 'Invalid location parameter';
}

// Sanitize mathematical expressions
const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
```

### Rate Limiting

```typescript
// Implement rate limiting for function calls
const rateLimiter = new Map();
const maxCallsPerMinute = 10;

if (rateLimiter.get(userId) > maxCallsPerMinute) {
  return 'Rate limit exceeded. Please try again later.';
}
```

### API Key Security

```typescript
// Use environment variables for API keys
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});
```

## 🧪 **Testing**

### Function Testing

```typescript
// Test weather function
const weatherResult = await getWeather('Paris, France', 'celsius');
expect(weatherResult).toContain('Current weather in Paris');

// Test calculator function
const calcResult = calculate('2 + 2');
expect(calcResult).toBe('Result: 4');
```

### Integration Testing

```typescript
// Test complete function calling flow
const response = await fetch('/api/ai-chat-flow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'What is 15 * 23?' })
});

const data = await response.json();
expect(data.functionCalls).toHaveLength(1);
expect(data.functionCalls[0].functionName).toBe('calculate');
```

### UI Testing

```typescript
// Test function call display
const functionCallElement = screen.getByText('🔧 Functions Used:');
expect(functionCallElement).toBeInTheDocument();

const functionName = screen.getByText('calculate');
expect(functionName).toBeInTheDocument();
```

## 🚀 **Future Enhancements**

### Planned Features

1. **More Functions**:
   - Calendar integration
   - Social media posting
   - E-commerce operations
   - Payment processing

2. **Advanced Function Calling**:
   - Function chaining
   - Conditional function execution
   - Batch function processing

3. **Enhanced UI**:
   - Function call visualization
   - Real-time function execution status
   - Function result caching

4. **Performance Optimizations**:
   - Function result caching
   - Parallel function execution
   - Intelligent function selection

### Custom Function Development

```typescript
// Example: Custom calendar function
export async function scheduleMeeting(
  title: string, 
  date: string, 
  attendees: string[]
): Promise<string> {
  // Implementation for calendar integration
  return `Meeting "${title}" scheduled for ${date} with ${attendees.join(', ')}`;
}

// Add to function definitions
{
  type: "function",
  name: "schedule_meeting",
  description: "Schedule a meeting with specified attendees",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      date: { type: "string" },
      attendees: { 
        type: "array", 
        items: { type: "string" } 
      }
    },
    required: ["title", "date", "attendees"],
    additionalProperties: false
  }
}
```

## 📚 **Resources**

- [OpenAI Function Calling Documentation](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [JSON Schema Specification](https://json-schema.org/)
- [TypeScript Function Types](https://www.typescriptlang.org/docs/handbook/functions.html)

## 🤝 **Contributing**

To add new functions or improve existing ones:

1. Add function implementation to `function-handlers.ts`
2. Add function definition to `functionDefinitions` array
3. Update `MessageClassifier.needsFunctionCalling()` if needed
4. Add tests for the new function
5. Update this documentation

---

**Note**: This implementation provides a solid foundation for function calling capabilities. The system is designed to be extensible and maintainable, allowing for easy addition of new functions and improvements to existing ones. 