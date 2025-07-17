import { NextRequest, NextResponse } from 'next/server';
import Replicate from "replicate";

interface Veo3SimpleRequest {
  prompt: string;
  seed?: number;
  enhance_prompt?: boolean;
  negative_prompt?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: Veo3SimpleRequest = await req.json();
    
    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json({ 
        error: 'Missing required field: prompt' 
      }, { status: 400 });
    }

    // Initialize Replicate with API token
    const replicateApiKey = process.env.REPLICATE_API_TOKEN || process.env.VEO3_API_KEY;
    const replicate = new Replicate({
      auth: replicateApiKey
    });

    if (!replicateApiKey) {
      return NextResponse.json({ 
        error: 'REPLICATE_API_TOKEN or VEO3_API_KEY environment variable is not set' 
      }, { status: 500 });
    }

    const input = {
      prompt: body.prompt,
      seed: body.seed || Math.floor(Math.random() * 1000000),
      enhance_prompt: body.enhance_prompt ?? true,
      negative_prompt: body.negative_prompt || "blurry, low quality, distorted, artifacts, watermark, text overlay"
    };

    console.log('Generating video with Replicate Veo 3 Fast...');
    console.log('Input:', input);

    const output = await replicate.run("google/veo-3-fast", { input });

    console.log('Replicate output:', output);

    // Validate output format (should be a URI string)
    if (typeof output !== 'string') {
      throw new Error(`Invalid output format from Replicate. Expected URI string, got: ${typeof output}`);
    }
    
    const videoUrl = output as string;
    if (!videoUrl.startsWith('http')) {
      throw new Error(`Invalid URI format from Replicate. Expected HTTP URL, got: ${videoUrl}`);
    }

    // Return the video URL
    return NextResponse.json({
      success: true,
      prompt: body.prompt,
      videoUrl: videoUrl,
      videoUri: videoUrl, // Alias for clarity
      message: 'Video generated successfully with Replicate Veo 3 Fast!',
      outputFormat: 'uri',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Replicate Veo 3 Fast Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'An error occurred during video generation.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during video generation.' 
    }, { status: 500 });
  }
} 