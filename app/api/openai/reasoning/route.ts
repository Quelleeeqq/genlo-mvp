import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'o4-mini', reasoning = { effort: 'medium' }, systemPrompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    // Build the input array for the Responses API
    const input = [];
    
    // Add system message if provided
    if (systemPrompt) {
      input.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // Add user message
    input.push({
      role: 'user',
      content: prompt
    });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        reasoning,
        input,
        max_output_tokens: 4000, // Reserve space for reasoning and output
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI reasoning API error:', error);
      return NextResponse.json({ 
        error: `OpenAI reasoning API error: ${response.status} ${response.statusText}` 
      }, { status: 500 });
    }

    const data = await response.json();
    
    // Extract the output text from the response
    const outputText = data.output_text || '';
    
    // Log usage information for debugging
    if (data.usage) {
      console.log('Reasoning API usage:', {
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens,
        reasoning_tokens: data.usage.output_tokens_details?.reasoning_tokens || 0,
        total_tokens: data.usage.total_tokens
      });
    }

    return NextResponse.json({
      output_text: outputText,
      usage: data.usage,
      status: data.status
    });

  } catch (error) {
    console.error('Reasoning API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during reasoning.' 
    }, { status: 500 });
  }
} 