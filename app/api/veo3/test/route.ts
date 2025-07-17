import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || 'love bus';
    
    // Get API key from environment variables
    const apiKey = process.env.VEO3_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Veo 3 API key not configured. Please set VEO3_API_KEY or GOOGLE_AI_STUDIO_API_KEY environment variable.' 
      }, { status: 500 });
    }
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/veo-3:generateVideo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        aspectRatio: '16:9',
        resolution: '1080p',
        duration: '8',
        style: 'realistic'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI Studio Error:', errorText);
      return NextResponse.json({ 
        error: `Google AI Studio API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      prompt: prompt,
      result: result,
      message: 'Google AI Studio test successful!'
    });

  } catch (error) {
    console.error('Test Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
} 