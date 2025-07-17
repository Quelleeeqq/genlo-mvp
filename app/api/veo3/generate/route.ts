import { NextRequest, NextResponse } from 'next/server';
import { getChatResponse } from '@/lib/ai';
import Replicate from "replicate";

interface Veo3Request {
  scene1: string;
  scene2: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: '1080p' | '4k' | '720p';
  duration: '8' | '15';
  style: 'realistic' | 'cinematic' | 'documentary' | 'hyperrealistic' | 'dramatic';
  audioGeneration: 'native' | 'dialogue' | 'effects' | 'silent';
  seed?: number;
  enhancePrompt?: boolean;
  negativePrompt?: string;
  userId?: string; // For subscription validation
}

interface Veo3Provider {
  name: string;
  endpoint: string;
  rateLimit?: number;
  model?: string;
}

const veoProviders: Record<string, Veo3Provider> = {
  'google-ai-studio': {
    name: 'Google AI Studio',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3:generateVideo',
    rateLimit: 10
  },
  'google-cloud': {
    name: 'Google Cloud Vertex AI',
    endpoint: 'https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/veo-3.0-generate-preview:generateVideo',
    rateLimit: 10
  },
  'replicate': {
    name: 'Replicate',
    endpoint: 'https://api.replicate.com/v1/predictions',
    model: 'google/veo-3-fast'
  },
  'aimlapi': {
    name: 'AI/ML API',
    endpoint: 'https://api.aimlapi.com/v1/generate/video/veo-3'
  },
  'pollo': {
    name: 'Pollo AI',
    endpoint: 'https://api.pollo.ai/v1/veo3/generate'
  }
};

// Check subscription status using the subscription API
async function checkProSubscription(userId?: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    // Call the subscription check endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subscription/check?userId=${userId}`);
    
    if (!response.ok) {
      console.error('Subscription check failed:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.success && data.subscription.isPro;
  } catch (error) {
    console.error('Subscription check failed:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Veo3Request = await req.json();
    
    // Validate required fields
    if (!body.scene1 || !body.scene2) {
      return NextResponse.json({ 
        error: 'Missing required fields: scene1, scene2' 
      }, { status: 400 });
    }

    // Check subscription status
    const isProMember = await checkProSubscription(body.userId);
    if (!isProMember) {
      return NextResponse.json({ 
        error: 'Veo 3 Fast Video Generation is only available for Pro members. Please upgrade your subscription to access this feature.',
        requiresUpgrade: true,
        feature: 'veo3-fast-video-generation'
      }, { status: 403 });
    }

    // Get API keys from environment variables
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const veoProvider = process.env.VEO3_PROVIDER || 'google-ai-studio';
    const veoKey = process.env.VEO3_API_KEY;

    if (!anthropicKey) {
      return NextResponse.json({ 
        error: 'Anthropic API key not configured on server' 
      }, { status: 500 });
    }

    if (!veoKey) {
      return NextResponse.json({ 
        error: 'Veo 3 Fast API key not configured on server' 
      }, { status: 500 });
    }

    // Step 1: Research scenes using OpenAI
    const researchPrompt = `Research and provide context for these two video scenes to help generate better Veo 3 prompts:

Scene 1: ${body.scene1}
Scene 2: ${body.scene2}

Provide relevant context, visual references, and technical considerations for video generation.`;

    const researchResult = await getChatResponse(researchPrompt, undefined, anthropicKey);
    
    // Step 2: Generate Veo 3 Fast optimized prompts
    const promptGenerationPrompt = `Based on the research, create Veo 3 Fast optimized prompts for these scenes:

Research: ${researchResult}

Scene 1: ${body.scene1}
Scene 2: ${body.scene2}

Settings:
- Aspect Ratio: ${body.aspectRatio}
- Resolution: ${body.resolution}
- Duration: ${body.duration} seconds
- Style: ${body.style}
- Audio: ${body.audioGeneration}

Create detailed, Veo 3 Fast optimized prompts that will produce high-quality videos. Focus on:
1. Clear visual descriptions
2. Camera movements and angles
3. Lighting and atmosphere
4. Character actions and expressions
5. Environmental details
6. Audio cues and sound design

Format as two separate prompts for Scene 1 and Scene 2.`;

    const promptResult = await getChatResponse(promptGenerationPrompt, undefined, anthropicKey);
    
    // Step 3: Generate videos with real Veo 3 Fast API
    const provider = veoProviders[veoProvider as keyof typeof veoProviders];
    const videoResults = await generateRealVeo3Videos(body, provider, promptResult, veoKey);
    
    // Step 4: Return the results
    return NextResponse.json({
      success: true,
      research: researchResult,
      prompts: promptResult,
      videos: videoResults,
      provider: provider.name,
      cost: veoProvider === 'google-cloud' 
        ? 'Included in Google AI Pro ($20/month)'
        : veoProvider === 'replicate'
        ? 'Based on Replicate Veo 3 Fast pricing'
        : 'Based on API provider pricing'
    });

  } catch (error) {
    console.error('Veo 3 Generation Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'An error occurred during Veo 3 generation.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during video generation.' 
    }, { status: 500 });
  }
}

async function generateRealVeo3Videos(
  settings: Veo3Request, 
  provider: Veo3Provider, 
  prompts: string,
  veoKey: string
): Promise<{ scene1: string; scene2: string; merged: string }> {
  
  // Parse prompts to get individual scene prompts
  const scenePrompts = parseScenePrompts(prompts, settings);
  
  try {
    let scene1Video: string;
    let scene2Video: string;

    // Generate Scene 1
    console.log('Generating Scene 1 with Veo 3 Fast...');
    scene1Video = await generateVeo3Video(scenePrompts.scene1, settings, provider, veoKey);
    
    // Generate Scene 2
    console.log('Generating Scene 2 with Veo 3 Fast...');
    scene2Video = await generateVeo3Video(scenePrompts.scene2, settings, provider, veoKey);

    // Merge videos (in a real implementation, you'd use FFmpeg or similar)
    const mergedVideo = await mergeVideos([scene1Video, scene2Video]);

    return {
      scene1: scene1Video,
      scene2: scene2Video,
      merged: mergedVideo
    };

  } catch (error) {
    console.error('Veo 3 Fast video generation failed:', error);
    throw new Error(`Failed to generate Veo 3 Fast videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateVeo3Video(
  prompt: string, 
  settings: Veo3Request, 
  provider: Veo3Provider,
  veoKey: string
): Promise<string> {
  
  switch (provider.name.toLowerCase()) {
    case 'google ai studio':
      return await generateGoogleAIStudioVeo3Video(prompt, settings, provider, veoKey);
    
    case 'google cloud vertex ai':
      return await generateGoogleVeo3Video(prompt, settings, provider, veoKey);
    
    case 'replicate':
      return await generateReplicateVeo3Video(prompt, settings, provider, veoKey);
    
    case 'ai/ml api':
      return await generateAimlapiVeo3Video(prompt, settings, provider, veoKey);
    
    case 'pollo ai':
      return await generatePolloVeo3Video(prompt, settings, provider, veoKey);
    
    default:
      throw new Error(`Unsupported Veo 3 Fast provider: ${provider.name}`);
  }
}

async function generateGoogleAIStudioVeo3Video(
  prompt: string, 
  settings: Veo3Request, 
  provider: Veo3Provider,
  veoKey: string
): Promise<string> {
  // Google AI Studio Veo 3 Fast implementation
  const endpoint = `${provider.endpoint}?key=${veoKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      aspectRatio: settings.aspectRatio,
      resolution: settings.resolution,
      duration: parseInt(settings.duration),
      style: settings.style,
      audioGeneration: settings.audioGeneration,
      cameraMovement: "static",
      lighting: "natural",
      quality: "high"
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google AI Studio Veo 3 API error: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.candidates[0].content.parts[0].videoUrl;
}

async function generateGoogleVeo3Video(
  prompt: string, 
  settings: Veo3Request, 
  provider: Veo3Provider,
  veoKey: string
): Promise<string> {
  // Google Cloud Vertex AI Veo 3 Fast implementation
  const endpoint = provider.endpoint.replace('{PROJECT_ID}', process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id');
  
  const requestBody = {
    instances: [{
      prompt: prompt,
      aspectRatio: settings.aspectRatio,
      resolution: settings.resolution,
      duration: parseInt(settings.duration),
      style: settings.style,
      audioGeneration: settings.audioGeneration,
      // Additional Veo 3 specific parameters
      cameraMovement: "static",
      lighting: "natural",
      quality: "high"
    }],
    parameters: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${veoKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Veo 3 Fast API error: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.predictions[0].videoUrl;
}

async function generateReplicateVeo3Video(
  prompt: string, 
  settings: Veo3Request, 
  provider: Veo3Provider,
  veoKey: string
): Promise<string> {
  // Use Replicate NodeJS library
  const replicateApiKey = process.env.REPLICATE_API_TOKEN || veoKey;
  if (!replicateApiKey) {
    throw new Error("Replicate API key is not configured");
  }
  const replicate = new Replicate({ auth: replicateApiKey });

  // Updated to use Veo 3 Fast model with supported parameters
  const input = {
    prompt: prompt,
    seed: settings.seed || Math.floor(Math.random() * 1000000), // Use provided seed or random
    enhance_prompt: settings.enhancePrompt ?? true, // Use Gemini to enhance prompts
    negative_prompt: settings.negativePrompt || "blurry, low quality, distorted, artifacts, watermark, text overlay"
  };

  // Run the Veo 3 Fast model using Replicate library
  const output = await replicate.run("google/veo-3-fast", { input });

  // Replicate returns an array or a single URL
  if (Array.isArray(output)) {
    if (!output[0]) throw new Error("No video returned from Replicate");
    return output[0];
  } else if (typeof output === "string") {
    return output;
  }
  throw new Error("Unexpected Replicate output format");
}

async function generateAimlapiVeo3Video(
  prompt: string, 
  settings: Veo3Request, 
  provider: Veo3Provider,
  veoKey: string
): Promise<string> {
  // AI/ML API Veo 3 Fast implementation
  const requestBody = {
    model: "veo-3",
    prompt: prompt,
    aspect_ratio: settings.aspectRatio,
    resolution: settings.resolution,
    duration: parseInt(settings.duration),
    style: settings.style,
    audio_generation: settings.audioGeneration,
    quality: "high",
    seed: Math.floor(Math.random() * 1000000)
  };

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${veoKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`AI/ML API error: ${errorData.error || response.statusText}`);
  }

  const result = await response.json();
  return result.video_url;
}

async function generatePolloVeo3Video(
  prompt: string, 
  settings: Veo3Request, 
  provider: Veo3Provider,
  veoKey: string
): Promise<string> {
  // Pollo AI Veo 3 Fast implementation
  const requestBody = {
    prompt: prompt,
    aspect_ratio: settings.aspectRatio,
    resolution: settings.resolution,
    duration: parseInt(settings.duration),
    style: settings.style,
    audio_generation: settings.audioGeneration,
    quality: "high",
    negative_prompt: "blurry, low quality, distorted, artifacts"
  };

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${veoKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Pollo AI error: ${errorData.error || response.statusText}`);
  }

  const result = await response.json();
  return result.video_url;
}

function parseScenePrompts(prompts: string, settings: Veo3Request): { scene1: string; scene2: string } {
  // Simple parsing - in a real implementation, you might want more sophisticated parsing
  const lines = prompts.split('\n');
  let scene1Prompt = '';
  let scene2Prompt = '';
  let currentScene = '';

  for (const line of lines) {
    if (line.toLowerCase().includes('scene 1') || line.toLowerCase().includes('first scene')) {
      currentScene = 'scene1';
    } else if (line.toLowerCase().includes('scene 2') || line.toLowerCase().includes('second scene')) {
      currentScene = 'scene2';
    } else if (line.trim() && currentScene) {
      if (currentScene === 'scene1') {
        scene1Prompt += line.trim() + ' ';
      } else if (currentScene === 'scene2') {
        scene2Prompt += line.trim() + ' ';
      }
    }
  }

  // Fallback if parsing fails
  if (!scene1Prompt.trim()) {
    scene1Prompt = `${settings.scene1}. ${getStyleModifiers(settings.style)}. ${settings.duration} seconds duration. ${settings.aspectRatio} aspect ratio. ${getResolutionSpecs(settings.resolution)}. ${getAudioModifiers(settings.audioGeneration)}.`;
  }
  
  if (!scene2Prompt.trim()) {
    scene2Prompt = `${settings.scene2}. ${getStyleModifiers(settings.style)}. ${settings.duration} seconds duration. ${settings.aspectRatio} aspect ratio. ${getResolutionSpecs(settings.resolution)}. ${getAudioModifiers(settings.audioGeneration)}.`;
  }

  return {
    scene1: scene1Prompt.trim(),
    scene2: scene2Prompt.trim()
  };
}

function getStyleModifiers(style: string): string {
  const modifiers = {
    realistic: 'photorealistic, natural lighting, realistic physics',
    cinematic: 'cinematic, dramatic lighting, film grain, professional cinematography, depth of field',
    documentary: 'documentary style, handheld camera, natural, authentic, real-world lighting',
    hyperrealistic: 'hyperrealistic, ultra-detailed, stunning visual quality, perfect lighting',
    dramatic: 'dramatic, high contrast, moody lighting, intense atmosphere, cinematic tension'
  };
  return modifiers[style as keyof typeof modifiers] || modifiers.realistic;
}

function getResolutionSpecs(resolution: string): string {
  const specs = {
    '4k': '4K resolution, ultra-high definition',
    '1080p': '1080p Full HD resolution',
    '720p': '720p HD resolution'
  };
  return specs[resolution as keyof typeof specs] || specs['1080p'];
}

function getAudioModifiers(audio: string): string {
  const modifiers = {
    native: 'with natural dialogue, ambient sounds, and realistic audio',
    dialogue: 'with clear dialogue and speech',
    effects: 'with ambient sounds and sound effects',
    silent: 'silent video'
  };
  return modifiers[audio as keyof typeof modifiers] || modifiers.native;
}

async function mergeVideos(videoUrls: string[]): Promise<string> {
  // In a real implementation, you would:
  // 1. Download the videos
  // 2. Use FFmpeg to merge them
  // 3. Upload the merged video to your storage
  // 4. Return the merged video URL
  
  // For now, we'll return the first video as a placeholder
  // You should implement proper video merging with FFmpeg
  console.log('Merging videos:', videoUrls);
  
  // Placeholder - implement actual video merging
  return videoUrls[0];
} 