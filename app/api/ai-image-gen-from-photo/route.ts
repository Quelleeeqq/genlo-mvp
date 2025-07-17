import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const image = formData.get('image') as File;

    if (!image || !prompt) {
      return NextResponse.json({ error: 'Image and prompt are required.' }, { status: 400 });
    }

    // Analyze the image with GPT-4o Vision
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = image.type;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              { type: 'text', text: 'Describe this product image in detail for use in an AI image generation prompt.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.2
      }),
    });

    const analysisData = await analysisResponse.json();
    const imageDescription = analysisData.choices?.[0]?.message?.content || '';

    // Combine user prompt and image description
    const dallePrompt = `${prompt}\n\nReference product description: ${imageDescription}`;

    // Generate a new image with DALL·E 3
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: dallePrompt,
        n: 1,
        size: '1024x1024'
      }),
    });

    const dalleData = await dalleResponse.json();

    if (!dalleData.data || !dalleData.data[0]?.url) {
      return NextResponse.json({ error: 'Image generation failed.' }, { status: 500 });
    }

    return NextResponse.json({ generatedImage: dalleData.data[0].url });
  } catch (error) {
    return NextResponse.json({ error: 'Image generation failed.' }, { status: 500 });
  }
} 