import { NextRequest, NextResponse } from 'next/server';
import { imageGenerationService } from '@/lib/ai/services/image-service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as string || 'gpt-image-1';
    const quality = formData.get('quality') as string || 'medium';
    const format = formData.get('format') as string || 'png';
    const background = formData.get('background') as string || 'opaque';
    const output_compression = formData.get('output_compression') as string;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Get image files
    const images = formData.getAll('image') as File[];
    const mask = formData.get('mask') as File | null;

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required.' }, { status: 400 });
    }

    // For now, we'll use the first image and mask if provided
    const image = images[0];

    const response = await imageGenerationService.editImage({
      prompt,
      model,
      quality,
      format,
      background,
      output_compression: output_compression ? parseInt(output_compression) : undefined,
      image,
      mask: mask || undefined
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Image editing error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during image editing.' 
    }, { status: 500 });
  }
} 