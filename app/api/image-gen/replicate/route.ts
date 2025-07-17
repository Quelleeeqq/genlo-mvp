import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: NextRequest) {
  try {
    const replicateApiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateApiKey) {
      return NextResponse.json({ error: 'Replicate API key is not set.' }, { status: 500 });
    }

    const { 
      prompt, 
      model = 'black-forest-labs/flux-dev-lora',
      size = '1024x1024',
      quality = 'medium',
      format = 'png',
      negative_prompt = '',
      num_inference_steps = 50,
      guidance_scale = 7.5,
      seed = -1
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Parse size to width and height
    const [width, height] = size.split('x').map(Number);
    
    // Determine model based on size and quality
    let modelVersion = model;
    if (size.includes('1536') && !model.includes('sdxl')) {
      // Use SDXL for larger images
      modelVersion = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: replicateApiKey,
    });

    // Build input parameters
    const input: any = {
      prompt: prompt,
      negative_prompt: negative_prompt,
      width: width,
      height: height,
      num_inference_steps: num_inference_steps,
      guidance_scale: guidance_scale,
      seed: seed === -1 ? Math.floor(Math.random() * 1000000) : seed,
      scheduler: "K_EULER",
      num_outputs: 1,
    };

    // Add SDXL-specific parameters
    if (modelVersion.includes('sdxl')) {
      input.refine = quality === 'high' ? "expert_ensemble_refiner" : "base_image_refiner";
      input.high_noise_frac = quality === 'high' ? 0.8 : 0.7;
    }

    try {
      // Use the official Replicate library
      const output = await replicate.run(modelVersion as `${string}/${string}:${string}`, { input });
      
      // Replicate returns an array of URLs
      const imageUrl = Array.isArray(output) ? output[0] : output;
      
      if (!imageUrl) {
        throw new Error('No image returned from Replicate');
      }

      // Convert to base64 if requested
      if (format === 'png') {
        try {
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          
          return NextResponse.json({ 
            imageData: base64,
            format: 'base64',
            imageUrl: imageUrl // Keep URL as backup
          });
        } catch (error) {
          console.error('Error converting to base64:', error);
          // Fall back to URL
          return NextResponse.json({ 
            imageUrl: imageUrl,
            format: 'url'
          });
        }
      } else {
        return NextResponse.json({ 
          imageUrl: imageUrl,
          format: 'url'
        });
      }
    } catch (error) {
      console.error('Replicate generation error:', error);
      return NextResponse.json({ 
        error: `Replicate generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Replicate image generation error:', error);
    return NextResponse.json({ 
      error: (error as Error).message || 'Internal server error.' 
    }, { status: 500 });
  }
} 