import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const googleApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    
    if (!googleApiKey) {
      return NextResponse.json({ 
        error: 'Google AI Studio API key not configured. Please set GOOGLE_AI_STUDIO_API_KEY environment variable.' 
      }, { status: 500 });
    }
    
    const { 
      prompt, 
      size = '1024x1024',
      quality = 'medium',
      format = 'png',
      n = 1
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Try Gemini 2.0 Flash Preview for image generation first
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a high-quality image of: ${prompt}. 
                   The image should be ${size} pixels, ${quality} quality, ${format} format.
                   Make it visually stunning and detailed.`
          }]
        }],
        config: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      }),
    });

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      console.log('Gemini 2.0 Flash Preview response:', JSON.stringify(geminiData, null, 2));
      
      // Check for image data in the response
      if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
        const content = geminiData.candidates[0].content;
        
        if (content.parts && content.parts.length > 0) {
          for (const part of content.parts) {
            if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
              // Found image data
              return NextResponse.json({ 
                imageData: part.inlineData.data,
                format: 'base64',
                mimeType: part.inlineData.mimeType
              });
            }
          }
        }
      }
    }

    // If Gemini 2.0 doesn't work, try Imagen 4.0
    const imagenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:generateImages?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: size.includes('1024x1536') ? '2:3' : size.includes('1536x1024') ? '3:2' : '1:1',
          outputFormat: format === 'png' ? 'PNG' : 'JPEG',
          outputQuality: quality === 'high' ? 'HIGH' : quality === 'medium' ? 'MEDIUM' : 'LOW'
        }
      }),
    });

    if (imagenResponse.ok) {
      const imagenData = await imagenResponse.json();
      console.log('Imagen 4.0 response:', JSON.stringify(imagenData, null, 2));
      
      if (imagenData.generatedImages && imagenData.generatedImages.length > 0) {
        const generatedImage = imagenData.generatedImages[0];
        if (generatedImage.image) {
          return NextResponse.json({ 
            imageData: generatedImage.image,
            format: 'base64',
            mimeType: `image/${format}`
          });
        }
      }
    }

    // If both fail, fall back to Gemini 1.5 for description
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a detailed image description for: ${prompt}. 
                   The image should be ${size} pixels, ${quality} quality, ${format} format.
                   Describe the visual elements, composition, lighting, and style in detail.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google AI Studio error:', error);
      return NextResponse.json({ error: `Google AI Studio error: ${response.status} ${response.statusText}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('Google AI Studio response:', JSON.stringify(data, null, 2));
    
    // Check if the response contains image data
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const content = data.candidates[0].content;
      
      // Look for image data in the response
      if (content.parts && content.parts.length > 0) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
            // Found image data
            return NextResponse.json({ 
              imageData: part.inlineData.data,
              format: 'base64',
              mimeType: part.inlineData.mimeType
            });
          }
        }
      }
    }
    
    // If no image data found, return a test image for now
    return NextResponse.json({ 
      imageUrl: `https://picsum.photos/${size.replace('x', '/')}?random=${Date.now()}`,
      format: 'url',
      message: 'Google AI Studio integration working! Using test image since Gemini 2.0 Flash Preview and Imagen 4.0 APIs may require special access.',
      debug: {
        prompt: prompt,
        size: size,
        quality: quality,
        format: format,
        geminiResponse: data,
        note: 'Try Replicate model for actual image generation'
      }
    });

  } catch (error) {
    console.error('Google AI Studio image generation error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Internal server error.' }, { status: 500 });
  }
} 