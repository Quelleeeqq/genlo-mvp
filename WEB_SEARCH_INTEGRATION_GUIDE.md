# Web Search Integration Guide

## Overview

This guide documents the integration of OpenAI's web search tool into the GenLo system. The implementation allows the AI to search the web for the latest information before generating responses, making it much more capable for current events, real-time information, and up-to-date data.

### Key Features

- **Automatic Detection**: Automatically detects when web search is needed based on keywords
- **Configurable Options**: Search context size, user location, and other parameters
- **Citation Support**: Displays clickable citations for web sources
- **Real-time Information**: Access to current news, weather, stock prices, and more
- **Geographic Awareness**: Location-based search results
- **Comprehensive Metadata**: Detailed information about search calls and sources

## Architecture

### Web Search Tool

The system uses OpenAI's `web_search_preview` tool, which provides:

- **Real-time Web Access**: Search the internet for current information
- **Citation Support**: Automatic citation generation with URLs and titles
- **Geographic Context**: Location-based search results
- **Configurable Context**: Adjustable search context size for performance vs. quality

### Integration Points

1. **MessageClassifier**: Detects when web search is needed
2. **OpenAIHandler**: Manages web search API calls and response processing
3. **ChatFlowController**: Orchestrates web search requests
4. **DashboardChat**: Displays search results and citations
5. **API Route**: Handles web search options and returns search metadata

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional - Web search is enabled by default
ENABLE_WEB_SEARCH=true
```

### Web Search Options

```typescript
interface WebSearchOptions {
  searchContextSize?: 'low' | 'medium' | 'high';
  userLocation?: {
    type: 'approximate';
    country?: string;      // ISO country code (e.g., 'US')
    city?: string;         // City name (e.g., 'New York')
    region?: string;       // Region/state (e.g., 'New York')
    timezone?: string;     // IANA timezone (e.g., 'America/New_York')
  };
}
```

### Search Context Size

| Option | Description | Use Case |
|--------|-------------|----------|
| `low` | Fastest response, least context | Quick facts, simple queries |
| `medium` | Balanced speed and context (default) | General information, news |
| `high` | Most comprehensive, slower | Detailed research, complex topics |

## Features

### 1. Automatic Web Search Detection

The system automatically detects when web search is needed based on keywords:

```typescript
// Keywords that trigger web search
const webSearchKeywords = [
  'latest', 'recent', 'today', 'yesterday', 'this week', 'this month',
  'current', 'breaking', 'news', 'update', 'trending', 'now',
  'what happened', 'what\'s new', 'latest news', 'current events',
  'recent developments', 'latest updates', 'breaking news',
  'search', 'find', 'look up', 'research', 'investigate',
  'weather', 'stock', 'price', 'market', 'crypto', 'bitcoin',
  'election', 'politics', 'sports', 'scores', 'results',
  'movie', 'film', 'box office', 'reviews', 'ratings',
  'restaurant', 'hotel', 'travel', 'vacation', 'tourism'
];
```

### 2. Location-Based Search

Provide user location for geographically relevant results:

```typescript
const webSearchOptions = {
  userLocation: {
    type: 'approximate',
    country: 'US',
    city: 'San Francisco',
    region: 'California',
    timezone: 'America/Los_Angeles'
  }
};
```

### 3. Citation and Source Display

Web search results include clickable citations:

```typescript
// Citation format
{
  type: 'url_citation',
  start_index: 2606,
  end_index: 2758,
  url: 'https://example.com/article',
  title: 'Article Title'
}
```

## API Integration

### Request Format

```typescript
POST /api/ai-chat-flow
{
  "message": "What's the latest news about AI?",
  "webSearchOptions": {
    "searchContextSize": "medium",
    "userLocation": {
      "type": "approximate",
      "country": "US",
      "city": "San Francisco"
    }
  }
}
```

### Response Format

```typescript
{
  "success": true,
  "type": "text",
  "content": "According to recent reports, AI development has seen significant breakthroughs...",
  "webSearchCalls": [
    {
      "id": "ws_67c9fa0502748190b7dd390736892e100be649c1a5ff9609",
      "status": "completed",
      "action": "search",
      "query": "latest AI news 2025",
      "domains": ["techcrunch.com", "wired.com", "arstechnica.com"]
    }
  ],
  "structuredData": {
    "content": "According to recent reports...",
    "confidence": 0.9,
    "suggestions": [
      "Would you like me to search for more specific information?",
      "I can help you find the latest updates on this topic."
    ],
    "metadata": {
      "reasoning": "Information retrieved from web search to provide current and accurate data.",
      "sources": [
        {
          "url": "https://techcrunch.com/ai-breakthrough",
          "title": "Major AI Breakthrough Announced",
          "startIndex": 15,
          "endIndex": 45
        }
      ],
      "web_search_used": true,
      "search_calls": [...]
    }
  }
}
```

## UI Components

### DashboardChat Updates

The DashboardChat component now displays:

1. **Web Search Calls**: Shows search queries and domains
2. **Source Citations**: Clickable links to web sources
3. **Search Metadata**: Information about search actions and results
4. **Web Search Hints**: Suggestions for web search queries

### Web Search Display

```typescript
// Web search calls display
{message.webSearchCalls && message.webSearchCalls.length > 0 && (
  <div className="mt-2 space-y-1">
    <div className="text-xs opacity-70">
      <strong>🔍 Web Search:</strong>
    </div>
    {message.webSearchCalls.map((ws, index) => (
      <div key={index} className="text-xs opacity-70 ml-2">
        <div className="font-medium">
          {ws.action === 'search' ? 'Search' : ws.action}: {ws.query || 'N/A'}
        </div>
        {ws.domains && ws.domains.length > 0 && (
          <div className="text-xs opacity-60 mt-1">
            <strong>Domains:</strong> {ws.domains.join(', ')}
          </div>
        )}
        <div className="text-xs opacity-50">
          Status: {ws.status}
        </div>
      </div>
    ))}
  </div>
)}

// Source citations display
{message.structuredData?.metadata?.sources && message.structuredData.metadata.sources.length > 0 && (
  <div className="mt-2 space-y-1">
    <div className="text-xs opacity-70">
      <strong>📚 Sources:</strong>
    </div>
    {message.structuredData.metadata.sources.map((source: any, index: number) => (
      <div key={index} className="text-xs opacity-70 ml-2">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {source.title || source.url}
        </a>
      </div>
    ))}
  </div>
)}
```

## Usage Examples

### Basic Web Search

```typescript
// Automatic detection
const result = await chatFlowController.processMessage(
  "What's the latest news about AI?"
);
```

### Location-Based Search

```typescript
const result = await chatFlowController.processMessage(
  "What are the best restaurants in San Francisco?",
  undefined, // no reference image
  {
    userLocation: {
      type: 'approximate',
      country: 'US',
      city: 'San Francisco',
      region: 'California'
    }
  }
);
```

### High-Context Search

```typescript
const result = await chatFlowController.processMessage(
  "Research the latest developments in quantum computing",
  undefined,
  {
    searchContextSize: 'high'
  }
);
```

### Weather and Current Events

```typescript
// Weather
const result = await chatFlowController.processMessage(
  "What's the weather like in London today?"
);

// Current events
const result = await chatFlowController.processMessage(
  "What happened in the news today?"
);

// Stock prices
const result = await chatFlowController.processMessage(
  "What's the current price of Apple stock?"
);
```

## Error Handling

### Common Error Scenarios

1. **Rate Limiting**
   ```typescript
   if (error.message.includes('rate limit')) {
     return { error: 'Web search rate limit exceeded. Please try again.' };
   }
   ```

2. **Search Unavailable**
   ```typescript
   if (error.message.includes('web search') || error.message.includes('search')) {
     return { error: 'Web search is currently unavailable. Please try again later.' };
   }
   ```

3. **Model Limitations**
   ```typescript
   if (error.message.includes('model')) {
     return { error: 'Web search not supported by this model.' };
   }
   ```

### Fallback Mechanisms

- **Graceful Degradation**: Falls back to regular responses if web search fails
- **Partial Results**: Shows available information even if some searches fail
- **Error Recovery**: Automatic retry for transient failures

## Best Practices

### Search Optimization

1. **Use Specific Keywords**: "latest AI news" vs "AI"
2. **Include Time Context**: "today", "this week", "recent"
3. **Specify Location**: "restaurants in San Francisco"
4. **Be Specific**: "Apple stock price" vs "stock prices"

### Performance Tips

1. **Choose Appropriate Context Size**: Use 'low' for quick facts, 'high' for research
2. **Cache Results**: Avoid repeated searches for the same information
3. **Location Optimization**: Provide user location for better results
4. **Query Optimization**: Use clear, specific search terms

### Content Guidelines

1. **Citation Requirements**: Always display clickable citations
2. **Source Transparency**: Clearly indicate when information comes from web search
3. **Accuracy Verification**: Cross-reference information from multiple sources
4. **Timeliness**: Prioritize recent information for current events

## Limitations

### Model Support

- **Supported Models**: `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`, `o3`, `o4-mini`
- **Not Supported**: `gpt-4.1-nano`
- **Context Window**: Limited to 128,000 tokens even with larger models

### Search Limitations

- **Content Policy**: All searches follow OpenAI's content policy
- **Rate Limits**: Subject to tiered rate limits based on model
- **Geographic Restrictions**: Some content may be region-restricted
- **Real-time Limitations**: Search results may have slight delays

### Data Handling

- **Privacy**: Search queries and results are processed according to OpenAI's data policy
- **Retention**: Search data retention follows OpenAI's guidelines
- **Residency**: Data residency depends on your OpenAI organization settings

## Testing

### Unit Tests

```typescript
describe('Web Search', () => {
  test('should detect web search keywords', () => {
    expect(MessageClassifier.needsWebSearch('latest news')).toBe(true);
    expect(MessageClassifier.needsWebSearch('hello world')).toBe(false);
  });

  test('should process web search response', async () => {
    const result = await openaiHandler.generateTextResponse(
      'What is the latest news?',
      false, // no function calling
      undefined, // no enhanced prompt
      undefined, // no system instructions
      true // enable web search
    );
    
    expect(result.webSearchCalls).toBeDefined();
    expect(result.structuredData.metadata.web_search_used).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Web Search API', () => {
  test('should return web search results', async () => {
    const response = await fetch('/api/ai-chat-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'What is the latest news about AI?',
        webSearchOptions: { searchContextSize: 'medium' }
      })
    });
    
    const data = await response.json();
    expect(data.webSearchCalls).toBeDefined();
    expect(data.structuredData.metadata.web_search_used).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **No Search Results**
   - Check if the query contains web search keywords
   - Verify model supports web search
   - Check rate limits and API access

2. **Slow Search Response**
   - Use 'low' context size for faster results
   - Check network connectivity
   - Consider caching frequently requested information

3. **Missing Citations**
   - Verify the response includes annotations
   - Check if sources are properly formatted
   - Ensure UI is displaying citation data

4. **Location-Based Issues**
   - Verify location format (ISO country codes, IANA timezones)
   - Check if location is supported for the query type
   - Test with different location formats

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
console.log('Web search detection:', MessageClassifier.needsWebSearch(userMessage));
console.log('Web search options:', webSearchOptions);
console.log('Web search response:', data);
console.log('Search calls:', data.webSearchCalls);
console.log('Sources:', data.structuredData?.metadata?.sources);
```

## Future Enhancements

### Planned Features

1. **Advanced Search Filters**: Domain restrictions, date ranges, content types
2. **Search History**: Track and reuse previous searches
3. **Custom Search Engines**: Integration with specific search APIs
4. **Search Analytics**: Track search performance and user behavior
5. **Multi-Language Support**: Search in different languages
6. **Search Suggestions**: AI-powered search query suggestions

### Performance Improvements

1. **Search Caching**: Intelligent caching of search results
2. **Parallel Searches**: Multiple concurrent searches for complex queries
3. **Search Optimization**: AI-optimized search queries
4. **Result Ranking**: Better ranking of search results
5. **Search Personalization**: User-specific search preferences

## Conclusion

The web search integration provides GenLo with real-time access to current information, making it much more capable for answering questions about current events, weather, stock prices, and other time-sensitive topics. The implementation includes comprehensive citation support, location-based search, and robust error handling.

The system automatically detects when web search is needed and provides users with clickable citations to verify information sources. This ensures transparency and allows users to explore topics further through the original sources.

For more information, refer to the [OpenAI Web Search Documentation](https://platform.openai.com/docs/guides/web-search). 