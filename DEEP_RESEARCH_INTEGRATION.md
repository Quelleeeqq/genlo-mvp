# Deep Research Integration Guide

## Overview

I've successfully integrated OpenAI's deep research models into your Quelle beta chat system. This adds powerful research capabilities that can find, analyze, and synthesize hundreds of sources to create comprehensive reports at the level of a research analyst.

## What's New

### 🔍 **Deep Research Models**
- **o3-deep-research**: Advanced reasoning model optimized for browsing and data analysis
- **o4-mini-deep-research**: Faster, more cost-effective deep research model
- **Web Search**: Real-time access to current information from the internet
- **Code Interpreter**: Complex data analysis and visualization capabilities
- **MCP Support**: Integration with remote Model Context Protocol servers for private data

### 🎯 **Smart Routing System**
The chat system now intelligently routes requests to the most appropriate AI model:

1. **Claude (Anthropic)**: Business creativity, trend insights, general conversation
2. **OpenAI Reasoning Models**: Complex business analysis and strategic planning
3. **OpenAI Deep Research**: Comprehensive research tasks with web search and data analysis
4. **OpenAI DALL-E 3**: Image generation and editing

## How It Works

### 1. **Request Detection**
The system automatically detects deep research requests using:
- **Keywords**: "comprehensive research", "market analysis", "industry report", etc.
- **Phrases**: "research the", "analyze the", "study the", etc.
- **Patterns**: Questions about research, studies, investigations, etc.

### 2. **Prompt Enhancement**
Before conducting research, the system:
1. Uses a faster model (gpt-4.1) to rewrite and enhance the user's prompt
2. Adds specific instructions for comprehensive research
3. Ensures all necessary details are included

### 3. **Deep Research Execution**
The enhanced prompt is sent to OpenAI's deep research models with:
- **Web Search**: Access to current internet information
- **Code Interpreter**: Data analysis and visualization tools
- **MCP Servers**: Private data sources (if configured)

### 4. **Comprehensive Results**
The system returns:
- Detailed research findings with inline citations
- Source metadata and references
- Data analysis and visualizations
- Structured reports and recommendations

## API Endpoints

### 1. **Deep Research API**
```
POST /api/openai/deep-research
```

**Request Body:**
```json
{
  "prompt": "Research the economic impact of AI on healthcare",
  "model": "o3-deep-research",
  "tools": ["web_search_preview", "code_interpreter"],
  "maxToolCalls": 20,
  "background": false,
  "mcpServers": []
}
```

**Response:**
```json
{
  "output_text": "Comprehensive research findings...",
  "output_items": [...],
  "usage": {...},
  "status": "completed"
}
```

### 2. **Prompt Enhancement API**
```
POST /api/openai/prompt-enhancement
```

**Request Body:**
```json
{
  "prompt": "Research AI in healthcare",
  "mode": "rewrite"
}
```

**Response:**
```json
{
  "enhanced_prompt": "Detailed research instructions...",
  "usage": {...}
}
```

## Usage Examples

### Example 1: Market Research
**User Input:** "Research the market opportunity for electric vehicles in Europe"

**System Response:**
- Detects deep research request
- Enhances prompt with specific research instructions
- Conducts web search for current market data
- Analyzes trends and statistics
- Returns comprehensive market analysis with citations

### Example 2: Competitive Analysis
**User Input:** "Analyze the competitive landscape for cloud computing providers"

**System Response:**
- Identifies major competitors
- Gathers market share data
- Analyzes pricing strategies
- Compares features and capabilities
- Provides strategic recommendations

### Example 3: Industry Trends
**User Input:** "What are the latest trends in artificial intelligence?"

**System Response:**
- Searches for recent AI developments
- Analyzes industry reports
- Identifies emerging technologies
- Provides trend analysis with data
- Includes future predictions

## Configuration

### Environment Variables
```env
# Required for deep research
OPENAI_API_KEY=your_openai_api_key_here

# Optional: MCP server configuration
MCP_SERVER_URL=https://your-mcp-server.com
MCP_SERVER_LABEL=your_data_source
```

### Model Selection
- **o3-deep-research**: Best quality, comprehensive analysis
- **o4-mini-deep-research**: Faster, more cost-effective
- **gpt-4.1**: For prompt enhancement and clarification

## Best Practices

### 1. **Prompt Quality**
- Be specific about what you want to research
- Include relevant context and constraints
- Specify the desired output format

### 2. **Research Scope**
- Focus on specific topics rather than broad areas
- Include time constraints if relevant
- Specify geographic or industry scope

### 3. **Output Expectations**
- Request specific data types (statistics, trends, etc.)
- Ask for structured formats (tables, reports, etc.)
- Specify citation requirements

## Safety and Security

### 1. **Data Protection**
- Only connect to trusted MCP servers
- Review tool calls and model messages
- Log research activities for audit purposes

### 2. **Content Filtering**
- Implement schema validation for tool arguments
- Review web search results before display
- Filter inappropriate or malicious content

### 3. **Rate Limiting**
- Set appropriate `maxToolCalls` limits
- Monitor API usage and costs
- Implement request throttling

## Cost Considerations

### 1. **Model Costs**
- **o3-deep-research**: Higher cost, better quality
- **o4-mini-deep-research**: Lower cost, good quality
- **Web search**: Additional cost per search
- **Code interpreter**: Additional cost for analysis

### 2. **Optimization**
- Use background mode for long-running tasks
- Set appropriate tool call limits
- Cache research results when possible

## Troubleshooting

### Common Issues

1. **"Deep research requires at least one data source"**
   - Ensure web search or code interpreter is enabled
   - Check tool configuration in the request

2. **"OpenAI API key is not configured"**
   - Add OPENAI_API_KEY to your environment variables
   - Verify the API key is valid and has sufficient credits

3. **"Request timeout"**
   - Use background mode for long research tasks
   - Reduce maxToolCalls limit
   - Break complex research into smaller tasks

4. **"No research results found"**
   - Try rephrasing your research question
   - Be more specific about what you're looking for
   - Check if the topic has sufficient online information

## Future Enhancements

### Planned Features
1. **MCP Server Integration**: Connect to private data sources
2. **Research Templates**: Pre-built research frameworks
3. **Result Caching**: Store and reuse research results
4. **Collaborative Research**: Share research with team members
5. **Export Options**: PDF, Word, or PowerPoint reports

### Advanced Capabilities
1. **Multi-language Research**: Research in different languages
2. **Real-time Monitoring**: Track research progress
3. **Custom Data Sources**: Integrate with internal databases
4. **Research Workflows**: Automated research pipelines

## Testing

### Test Research Requests
1. **Market Analysis**: "Research the global smartphone market"
2. **Technology Trends**: "Analyze emerging AI technologies"
3. **Industry Reports**: "Study the renewable energy sector"
4. **Competitive Intelligence**: "Research Tesla's competitors"
5. **Economic Impact**: "Analyze the impact of COVID-19 on e-commerce"

### Expected Results
- Comprehensive research findings
- Inline citations and source links
- Data analysis and visualizations
- Structured recommendations
- Source metadata and references

## Support

For questions or issues with the deep research integration:
1. Check the console logs for detailed error messages
2. Verify your OpenAI API key and credits
3. Test with simpler research requests first
4. Review the API response for specific error details

The deep research integration provides powerful capabilities for comprehensive analysis and research tasks, making your Quelle beta platform a complete AI research assistant. 