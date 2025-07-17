import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { 
      mode = 'generate', // 'generate' or 'analyze'
      prompt,
      imageUrl,
      imageBase64,
      detail = 'auto', // 'low', 'high', or 'auto'
      model = 'gpt-4.1-mini',
      maxTokens = 1000
    } = await req.json();

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    if (mode === 'generate') {
      // Image generation mode
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt is required for image generation.' }, { status: 400 });
      }

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model,
          input: prompt,
          tools: [{ type: 'image_generation' }],
          max_output_tokens: maxTokens
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI GPT Image generation error:', error);
        return NextResponse.json({ 
          error: `OpenAI GPT Image generation error: ${response.status} ${response.statusText}`,
          details: error
        }, { status: 500 });
      }

      const data = await response.json();
      
      // Extract image data from the response
      const imageData = data.output
        ?.filter((output: any) => output.type === 'image_generation_call')
        ?.map((output: any) => output.result) || [];

      if (imageData.length === 0) {
        return NextResponse.json({ 
          error: 'No image was generated' 
        }, { status: 500 });
      }

      return NextResponse.json({
        imageData: imageData[0], // Return the first generated image
        usage: data.usage,
        status: data.status
      });

    } else if (mode === 'analyze') {
      // Image analysis mode
      if (!imageUrl && !imageBase64) {
        return NextResponse.json({ error: 'Either imageUrl or imageBase64 is required for image analysis.' }, { status: 400 });
      }

      const input = [{
        role: 'user',
        content: [
          { type: 'input_text', text: prompt || 'What is in this image?' },
          {
            type: 'input_image',
            ...(imageUrl ? { image_url: imageUrl } : { image_url: `data:image/jpeg;base64,${imageBase64}` }),
            detail
          },
        ],
      }];

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model,
          input,
          max_output_tokens: maxTokens
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI GPT Image analysis error:', error);
        return NextResponse.json({ 
          error: `OpenAI GPT Image analysis error: ${response.status} ${response.statusText}`,
          details: error
        }, { status: 500 });
      }

      const data = await response.json();
      
      return NextResponse.json({
        output_text: data.output_text,
        usage: data.usage,
        status: data.status
      });

    } else {
      return NextResponse.json({ 
        error: 'Invalid mode. Use "generate" or "analyze".' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('GPT Image API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred with GPT Image.' 
    }, { status: 500 });
  }
}

// Handle file uploads for image analysis
export async function PUT(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string || 'What is in this image?';
    const image = formData.get('image') as File;
    const detail = formData.get('detail') as string || 'auto';
    const model = formData.get('model') as string || 'gpt-4.1-mini';
    const maxTokens = parseInt(formData.get('maxTokens') as string) || 1000;

    if (!image) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const input = [{
      role: 'user',
      content: [
        { type: 'input_text', text: prompt },
        {
          type: 'input_image',
          image_url: `data:image/${image.type.split('/')[1]};base64,${imageBase64}`,
          detail
        },
      ],
    }];

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
        max_output_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI GPT Image analysis error:', error);
      return NextResponse.json({ 
        error: `OpenAI GPT Image analysis error: ${response.status} ${response.statusText}`,
        details: error
      }, { status: 500 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      output_text: data.output_text,
      usage: data.usage,
      status: data.status
    });

  } catch (error) {
    console.error('GPT Image API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred with GPT Image.' 
    }, { status: 500 });
  }
} 