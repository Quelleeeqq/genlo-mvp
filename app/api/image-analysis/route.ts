import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string || 'Please analyze this image and describe what you see. Provide insights, observations, or answer any questions about the content.';
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'Image is required.' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = image.type;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI Vision API error:', error);
      return NextResponse.json({ 
        error: `OpenAI Vision API error: ${response.status} ${response.statusText}` 
      }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return NextResponse.json({
        description: data.choices[0].message.content,
        analysis: data.choices[0].message.content,
        model: 'gpt-4o',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        error: 'No response content from OpenAI Vision API' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Image analysis error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during image analysis.' 
    }, { status: 500 });
  }
} 