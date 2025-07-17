import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { 
      prompt, 
      model = 'o3-deep-research', 
      tools = ['web_search_preview', 'code_interpreter'],
      maxToolCalls = 20,
      background = false,
      webhookUrl,
      mcpServers = []
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    // Build tools array for the API
    const toolsArray = [];
    
    // Add web search if requested
    if (tools.includes('web_search_preview')) {
      toolsArray.push({ type: 'web_search_preview' });
    }
    
    // Add code interpreter if requested
    if (tools.includes('code_interpreter')) {
      toolsArray.push({ 
        type: 'code_interpreter', 
        container: { type: 'auto' } 
      });
    }
    
    // Add MCP servers if provided
    mcpServers.forEach((server: any) => {
      toolsArray.push({
        type: 'mcp',
        server_label: server.label,
        server_url: server.url,
        require_approval: 'never'
      });
    });

    // Ensure at least one data source is provided for deep research
    if (toolsArray.length === 0) {
      return NextResponse.json({ 
        error: 'Deep research requires at least one data source: web search, code interpreter, or MCP server.' 
      }, { status: 400 });
    }

    const requestBody: any = {
      model,
      input: prompt,
      tools: toolsArray,
      max_tool_calls: maxToolCalls
    };

    // Add background mode if requested
    if (background) {
      requestBody.background = true;
      if (webhookUrl) {
        requestBody.webhook_url = webhookUrl;
      }
    }

    console.log('Deep research request:', {
      model,
      tools: toolsArray.map(t => t.type),
      background,
      maxToolCalls
    });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI deep research API error:', error);
      return NextResponse.json({ 
        error: `OpenAI deep research API error: ${response.status} ${response.statusText}`,
        details: error
      }, { status: 500 });
    }

    const data = await response.json();
    
    // Extract the output text and any output items
    const outputText = data.output_text || '';
    const outputItems = data.output || [];
    
    // Log usage information for debugging
    if (data.usage) {
      console.log('Deep research API usage:', {
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens,
        total_tokens: data.usage.total_tokens
      });
    }

    // Log output items for debugging
    if (outputItems.length > 0) {
      console.log('Deep research output items:', outputItems.map((item: any) => ({
        type: item.type,
        status: item.status,
        action: item.action?.type || 'N/A'
      })));
    }

    return NextResponse.json({
      output_text: outputText,
      output_items: outputItems,
      usage: data.usage,
      status: data.status,
      id: data.id
    });

  } catch (error) {
    console.error('Deep research API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during deep research.' 
    }, { status: 500 });
  }
} 