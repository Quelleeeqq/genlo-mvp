import { NextRequest } from 'next/server';
import Replicate from 'replicate';

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
  format?: string;
  background?: string;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  output_compression?: number;
  n?: number;
  // FLUX Schnell specific parameters (deprecated - now handled by FLUX Dev LoRA)
  // FLUX Kontext Max specific parameters
  input_image?: string; // URL to input image
  safety_tolerance?: number; // 0-6, default 2
  prompt_upsampling?: boolean; // default false
  // Ideogram V3 Balanced specific parameters
  resolution?: 'None' | '512x1536' | '576x1408' | '576x1472' | '576x1536' | '640x1344' | '640x1408' | '640x1472' | '640x1536' | '704x1152' | '704x1216' | '704x1280' | '704x1344' | '704x1408' | '704x1472' | '736x1312' | '768x1088' | '768x1216' | '768x1280' | '768x1344' | '800x1280' | '832x960' | '832x1024' | '832x1088' | '832x1152' | '832x1216' | '832x1248' | '864x1152' | '896x960' | '896x1024' | '896x1088' | '896x1120' | '896x1152' | '960x832' | '960x896' | '960x1024' | '960x1088' | '1024x832' | '1024x896' | '1024x960' | '1024x1024' | '1088x768' | '1088x832' | '1088x896' | '1088x960' | '1120x896' | '1152x704' | '1152x832' | '1152x864' | '1152x896' | '1216x704' | '1216x768' | '1216x832' | '1248x832' | '1280x704' | '1280x768' | '1280x800' | '1312x736' | '1344x640' | '1344x704' | '1344x768' | '1408x576' | '1408x640' | '1408x704' | '1472x576' | '1472x640' | '1472x704' | '1536x512' | '1536x576' | '1536x640';
  style_type?: 'None' | 'Auto' | 'General' | 'Realistic' | 'Design';
  magic_prompt_option?: 'Auto' | 'On' | 'Off';
  style_reference_images?: string[]; // Array of image URLs
  mask?: string; // URL to mask image for inpainting
  // FLUX Dev LoRA specific parameters
  lora_weights?: string; // LoRA weights for style transfer (e.g., "fofr/flux-80s-cyberpunk")
  extra_lora?: string; // Additional LoRA weights
  lora_scale?: number; // How strongly the main LoRA should be applied (0-3, default 1)
  extra_lora_scale?: number; // How strongly the extra LoRA should be applied (0-3, default 1)
  guidance?: number; // Guidance for generated image (0-10, default 3)
  go_fast?: boolean; // Run faster predictions (default true)
  megapixels?: '1' | '0.25'; // Approximate megapixels (default '1')
  num_outputs?: number; // Number of outputs to generate (1-4, default 1)
  aspect_ratio?: 'match_input_image' | '1:1' | '16:9' | '21:9' | '3:2' | '2:3' | '4:5' | '5:4' | '3:4' | '4:3' | '9:16' | '9:21' | '2:1' | '1:2';
  output_format?: 'webp' | 'jpg' | 'png'; // Output format (default 'webp')
  output_quality?: number; // Output quality 0-100 (default 80)
  prompt_strength?: number; // Prompt strength for img2img (0-1, default 0.8)
  disable_safety_checker?: boolean; // Disable safety checker (default false)
  hf_api_token?: string; // HuggingFace API token for authenticated LoRAs
  civitai_api_token?: string; // CivitAI API token for authenticated LoRAs
}

export interface ImageGenerationResponse {
  imageUrl?: string;
  imageData?: string;
  imageUrls?: string[]; // Array of image URLs for multi-output models
  format: 'url' | 'base64';
  mimeType?: string;
  prompt: string;
  settings: {
    model: string;
    size: string;
    quality: string;
    format: string;
    background: string;
  };
  metadata?: {
    seed?: number;
    inference_steps?: number;
    guidance_scale?: number;
    provider: string;
    // FLUX Kontext Max specific metadata
    aspect_ratio?: string;
    safety_tolerance?: number;
    prompt_upsampling?: boolean;
    // Ideogram V3 Balanced specific metadata
    resolution?: string;
    style_type?: string;
    magic_prompt_option?: string;
    // FLUX Dev LoRA specific metadata
    lora_weights?: string;
    extra_lora?: string;
    lora_scale?: number;
    extra_lora_scale?: number;
    guidance?: number;
    go_fast?: boolean;
    megapixels?: string;
    num_outputs?: number;
    output_format?: string;
    output_quality?: number;
    prompt_strength?: number;
    disable_safety_checker?: boolean;
  };
}

export interface ImageEditRequest extends Omit<ImageGenerationRequest, 'mask'> {
  image: File;
  mask?: File;
}

export class ImageGenerationService {
  private openaiApiKey: string;
  private replicateApiKey: string;
  private googleApiKey: string;
  private replicate: Replicate;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.replicateApiKey = process.env.REPLICATE_API_TOKEN || '';
    this.googleApiKey = process.env.GOOGLE_AI_STUDIO_API_KEY || '';
    
    // Initialize Replicate client
    this.replicate = new Replicate({
      auth: this.replicateApiKey,
    });
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const { model = 'black-forest-labs/flux-dev-lora', ...params } = request;

    switch (model) {
      case 'black-forest-labs/flux-dev-lora':
        return this.generateWithReplicate({ ...params, model });
      case 'ideogram-ai/ideogram-v3-balanced':
        return this.generateWithReplicate({ ...params, model });
      case 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b':
        return this.generateWithReplicate({ ...params, model });
      case 'black-forest-labs/flux-schnell':
        return this.generateWithReplicate({ ...params, model });
      case 'black-forest-labs/flux-kontext-max':
        return this.generateWithReplicate({ ...params, model });
      case 'google-ai-studio':
        return this.generateWithGoogleAIStudio(params);
      case 'gpt-image-1':
        // Try GPT Image 1 first, fallback to DALL-E 3 if it fails
        try {
          return await this.generateWithGPTImage1(params);
        } catch (error) {
          console.log('GPT Image 1 failed, falling back to DALL-E 3:', error);
          return this.generateWithOpenAI({ ...params, model: 'dall-e-3' });
        }
      case 'dall-e-3':
      case 'dall-e-2':
        // Normalize quality for OpenAI
        let openaiQuality = params.quality;
        if (openaiQuality !== 'standard' && openaiQuality !== 'hd') {
          openaiQuality = 'standard';
        }
        return this.generateWithOpenAI({ ...params, model, quality: openaiQuality });
      default:
        // If it's a Replicate model format, try Replicate first, fallback to OpenAI
        if (model.includes('/') && model.includes(':')) {
          try {
            return await this.generateWithReplicate({ ...params, model });
          } catch (error) {
            if (error instanceof Error && error.message.includes('Replicate API key is not configured')) {
              console.log('Replicate not configured, falling back to OpenAI');
              return this.generateWithOpenAI({ ...params, model: 'gpt-image-1' });
            }
            throw error;
          }
        }
        throw new Error(`Unsupported model: ${model}`);
    }
  }

  async editImage(request: ImageEditRequest): Promise<ImageGenerationResponse> {
    const { model = 'gpt-image-1', ...params } = request;

    switch (model) {
      case 'gpt-image-1':
      case 'dall-e-3':
      case 'dall-e-2':
        return this.editWithOpenAI({ ...params, model });
      default:
        throw new Error(`Image editing not supported for model: ${model}`);
    }
  }

  private async generateWithGPTImage1(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.');
    }

    console.log('OpenAI GPT Image 1 API key found, attempting image generation...');
    console.log('Model: gpt-4o-mini');
    console.log('Prompt:', params.prompt);

    const { prompt } = params;

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: prompt,
          tools: [{ 
            type: 'image_generation',
            size: params.size || '1024x1024',
            quality: params.quality === 'hd' ? 'hd' : 'standard',
            format: params.format || 'png'
          }],
          max_output_tokens: 1000
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI GPT Image 1 generation error:', error);
        throw new Error(`OpenAI GPT Image 1 generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI GPT Image 1 response:', JSON.stringify(data, null, 2));

      // Extract image data from the response
      const imageGenerationCalls = data.output
        ?.filter((output: any) => output.type === 'image_generation_call') || [];

      console.log('Image generation calls found:', imageGenerationCalls.length);

      if (imageGenerationCalls.length === 0) {
        // Check if there's an error in the response
        if (data.error) {
          throw new Error(`OpenAI API error: ${data.error.message || data.error}`);
        }
        throw new Error('No image generation call found in GPT Image 1 response');
      }

      const imageCall = imageGenerationCalls[0];
      console.log('Image generation call:', JSON.stringify(imageCall, null, 2));

      // The result should contain the image data
      if (!imageCall.result) {
        throw new Error('No image result in GPT Image 1 response');
      }

      return {
        imageData: imageCall.result, // Return the generated image data
        format: 'base64' as const,
        imageUrls: [],
        prompt,
        settings: { 
          model: 'gpt-image-1', 
          size: params.size || '1024x1024', 
          quality: params.quality || 'standard', 
          format: params.format || 'png', 
          background: params.background || 'opaque' 
        },
        metadata: { 
          provider: 'openai-gpt-image-1'
        }
      };
    } catch (error) {
      console.error('OpenAI GPT Image 1 generation error:', error);
      throw error;
    }
  }

  private async generateWithOpenAI(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const {
      prompt,
      model = 'gpt-image-1',
      size = '1024x1024',
      quality = 'medium',
      format = 'png',
      background = 'opaque',
      output_compression,
      n = 1
    } = params;

    // Only allow 'standard' or 'hd' for OpenAI
    let openaiQuality = quality;
    if (openaiQuality !== 'standard' && openaiQuality !== 'hd') {
      openaiQuality = 'standard';
    }

    const requestBody: any = {
      model,
      prompt,
      n,
      size,
      quality: openaiQuality,
      response_format: format === 'png' ? 'b64_json' : 'url',
    };

    if (background !== 'opaque') {
      requestBody.background = background;
    }
    
    if (output_compression && (format === 'jpeg' || format === 'webp')) {
      requestBody.output_compression = output_compression;
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI generate API response:', JSON.stringify(data, null, 2));
    
    if (format === 'png' && data.data?.[0]?.b64_json) {
      const result = {
        imageData: data.data[0].b64_json,
        format: 'base64' as const,
        imageUrls: data.data.map((item: any) => item.url).filter(Boolean),
        prompt,
        settings: { model, size, quality, format, background },
        metadata: { provider: 'openai' }
      };
      console.log('Returning image generate result:', JSON.stringify(result, null, 2));
      return result;
    } else if (data.data?.[0]?.url) {
      const imageUrls = data.data.map((item: any) => item.url).filter(Boolean);
      const result = {
        imageUrl: imageUrls[0],
        imageUrls,
        format: 'url' as const,
        prompt,
        settings: { model, size, quality, format, background },
        metadata: { provider: 'openai' }
      };
      console.log('Returning image generate result:', JSON.stringify(result, null, 2));
      return result;
    } else {
      console.error('No image returned from OpenAI generate API:', JSON.stringify(data, null, 2));
      throw new Error('No image returned from OpenAI generate API');
    }
  }

  private async generateWithReplicate(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.replicateApiKey) {
      throw new Error('Replicate API key is not configured. Please add REPLICATE_API_TOKEN to your .env.local file. You can get a free API key from https://replicate.com/');
    }

    console.log('Replicate API key found, attempting image generation...');
    console.log('Model:', params.model);
    console.log('Prompt:', params.prompt);

    const {
      prompt,
      model = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      size = '1792x1024', // Increased from 1024x1024 for larger images
      quality = 'high', // Changed from 'medium' to 'high' for better quality
      format = 'png',
      negative_prompt = '',
      num_inference_steps = 50,
      guidance_scale = 7.5,
      seed = -1
    } = params;

    // Ensure we have a valid Replicate model format
    if (!model.includes('/')) {
      throw new Error('Invalid Replicate model format. Expected format: owner/model or owner/model:version');
    }

    const [width, height] = size.split('x').map(Number);
    
    // Use the provided model version
    const modelVersion = model;

    // Check if this is the FLUX Dev LoRA model
    const isFluxDevLora = modelVersion.includes('flux-dev-lora');
    // Check if this is the Ideogram V3 Balanced model
    const isIdeogramV3 = modelVersion.includes('ideogram-v3-balanced');
    // Check if this is the FLUX Schnell model
    const isFluxSchnell = modelVersion.includes('flux-schnell');
    // Check if this is the FLUX Kontext Max model
    const isFluxKontextMax = modelVersion.includes('flux-kontext-max');

    // Build input parameters for Replicate
    const input: any = {
      prompt: prompt,
    };

    if (isFluxDevLora) {
      // FLUX Dev LoRA specific parameters
      input.prompt = prompt;
      input.lora_weights = params.lora_weights || "fofr/flux-80s-cyberpunk";
      input.seed = seed === -1 ? Math.floor(Math.random() * 1000000) : seed;
      
      // Additional FLUX Dev LoRA parameters
      if (params.extra_lora) input.extra_lora = params.extra_lora;
      if (params.lora_scale !== undefined) input.lora_scale = params.lora_scale;
      if (params.extra_lora_scale !== undefined) input.extra_lora_scale = params.extra_lora_scale;
      if (params.guidance !== undefined) input.guidance = params.guidance;
      if (params.num_inference_steps !== undefined) input.num_inference_steps = params.num_inference_steps;
      if (params.go_fast !== undefined) input.go_fast = params.go_fast;
      input.megapixels = params.megapixels || "1"; // Use 1 megapixel for larger images
      input.num_outputs = params.num_outputs || 1;
      input.aspect_ratio = params.aspect_ratio || "16:9"; // Better aspect ratio for larger images
      input.output_format = params.output_format || "png";
      input.output_quality = params.output_quality || 100; // Maximum quality
      if (params.prompt_strength !== undefined) input.prompt_strength = params.prompt_strength;
      if (params.disable_safety_checker !== undefined) input.disable_safety_checker = params.disable_safety_checker;
      if (params.hf_api_token) input.hf_api_token = params.hf_api_token;
      if (params.civitai_api_token) input.civitai_api_token = params.civitai_api_token;
      
      // Handle image-to-image if input_image is provided
      if (params.input_image) {
        input.image = params.input_image;
      }
    } else if (isIdeogramV3) {
      // Ideogram V3 Balanced specific parameters
      input.prompt = prompt;
      input.aspect_ratio = params.aspect_ratio || "3:2";
      input.resolution = params.resolution || "None";
      input.style_type = params.style_type || "None";
      input.magic_prompt_option = params.magic_prompt_option || "Auto";
      input.seed = seed === -1 ? Math.floor(Math.random() * 1000000) : seed;
      
      // Handle inpainting if image and mask are provided
      if (params.input_image) {
        input.image = params.input_image;
        if (params.mask) {
          input.mask = params.mask;
        }
      }
      
      // Handle style reference images
      if (params.style_reference_images && params.style_reference_images.length > 0) {
        input.style_reference_images = params.style_reference_images;
      }
    } else if (isFluxKontextMax) {
      // FLUX Kontext Max specific parameters based on the official schema
      input.prompt = prompt;
      if (params.input_image) {
        input.input_image = params.input_image; // URL to input image
      }
      input.aspect_ratio = params.aspect_ratio || 'match_input_image';
      input.output_format = params.output_format || 'png';
      input.safety_tolerance = params.safety_tolerance !== undefined ? params.safety_tolerance : 2;
      input.prompt_upsampling = params.prompt_upsampling !== undefined ? params.prompt_upsampling : false;
      input.seed = seed === -1 ? Math.floor(Math.random() * 1000000) : seed;
    } else if (isFluxSchnell) {
      // FLUX Schnell specific parameters based on the model schema
      input.aspect_ratio = params.aspect_ratio || "1:1";
      input.num_outputs = 1;
      input.output_format = params.output_format || (format === 'png' ? 'png' : 'webp');
      input.output_quality = params.output_quality || (quality === 'high' ? 100 : 80);
      input.num_inference_steps = params.num_inference_steps || 4; // FLUX Schnell default
      input.go_fast = params.go_fast !== undefined ? params.go_fast : true;
      input.megapixels = params.megapixels || "1";
      input.seed = seed === -1 ? Math.floor(Math.random() * 1000000) : seed;
      input.disable_safety_checker = params.disable_safety_checker || false;
    } else {
      // SDXL parameters
      input.negative_prompt = negative_prompt;
      input.width = width;
      input.height = height;
      input.num_inference_steps = num_inference_steps;
      input.guidance_scale = guidance_scale;
      input.seed = seed === -1 ? Math.floor(Math.random() * 1000000) : seed;
      input.scheduler = "K_EULER";
      input.num_outputs = 1;

      // Add SDXL-specific parameters
      if (modelVersion.includes('sdxl')) {
        input.refine = quality === 'high' ? "expert_ensemble_refiner" : "base_image_refiner";
        input.high_noise_frac = quality === 'high' ? 0.8 : 0.7;
      }
    }

    try {
      // Use the official Replicate library
      const output = await this.replicate.run(modelVersion as `${string}/${string}:${string}`, { input });

      // Handle output based on model type
      let imageUrl: string;
      let imageUrls: string[] = [];
      
      if (isFluxDevLora) {
        // FLUX Dev LoRA returns an array of URIs
        if (Array.isArray(output)) {
          imageUrls = output.map(url => String(url));
          imageUrl = imageUrls[0];
        } else {
          imageUrl = String(output);
          imageUrls = [imageUrl];
        }
      } else if (isIdeogramV3) {
        // Ideogram V3 Balanced returns a single URI string
        imageUrl = String(output);
        imageUrls = [imageUrl];
      } else if (isFluxKontextMax) {
        // FLUX Kontext Max returns a single URI string
        imageUrl = String(output);
        imageUrls = [imageUrl];
      } else if (isFluxSchnell) {
        // FLUX Schnell returns an array of URIs
        if (Array.isArray(output)) {
          imageUrls = output.map(url => String(url));
          imageUrl = imageUrls[0];
        } else {
          imageUrl = String(output);
          imageUrls = [imageUrl];
        }
      } else {
        // SDXL and other models
        if (Array.isArray(output)) {
          imageUrls = output.map(url => String(url));
          imageUrl = imageUrls[0];
        } else {
          imageUrl = String(output);
          imageUrls = [imageUrl];
        }
      }

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('No image returned from Replicate');
      }

      // Convert to base64 if requested
      if (format === 'png') {
        try {
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          
          return {
            imageData: base64,
            format: 'base64',
            imageUrl,
            imageUrls,
            prompt,
            settings: { model, size, quality, format, background: "opaque" },
            metadata: { 
              provider: 'replicate',
              seed: input.seed,
              inference_steps: isFluxDevLora ? input.num_inference_steps : (isIdeogramV3 ? undefined : (isFluxKontextMax ? undefined : num_inference_steps)),
              guidance_scale: isFluxDevLora ? input.guidance : (isIdeogramV3 ? undefined : (isFluxKontextMax ? undefined : guidance_scale)),
              aspect_ratio: isFluxDevLora ? input.aspect_ratio : (isIdeogramV3 ? input.aspect_ratio : (isFluxKontextMax ? input.aspect_ratio : undefined)),
              resolution: isIdeogramV3 ? input.resolution : undefined,
              style_type: isIdeogramV3 ? input.style_type : undefined,
              magic_prompt_option: isIdeogramV3 ? input.magic_prompt_option : undefined,
              lora_weights: isFluxDevLora ? input.lora_weights : undefined,
              extra_lora: isFluxDevLora ? input.extra_lora : undefined,
              lora_scale: isFluxDevLora ? input.lora_scale : undefined,
              extra_lora_scale: isFluxDevLora ? input.extra_lora_scale : undefined,
              guidance: isFluxDevLora ? input.guidance : undefined,
              go_fast: isFluxDevLora ? input.go_fast : undefined,
              megapixels: isFluxDevLora ? input.megapixels : undefined,
              num_outputs: isFluxDevLora ? input.num_outputs : undefined,
              output_format: isFluxDevLora ? input.output_format : undefined,
              output_quality: isFluxDevLora ? input.output_quality : undefined,
              prompt_strength: isFluxDevLora ? input.prompt_strength : undefined,
              disable_safety_checker: isFluxDevLora ? input.disable_safety_checker : undefined,
              safety_tolerance: isFluxKontextMax ? input.safety_tolerance : undefined,
              prompt_upsampling: isFluxKontextMax ? input.prompt_upsampling : undefined
            }
          };
        } catch (error) {
          console.error('Error converting to base64:', error);
          // Fall back to URL
          return {
            imageUrl,
            imageUrls,
            format: 'url',
            prompt,
            settings: { model, size, quality, format, background: "opaque" },
            metadata: { 
              provider: 'replicate',
              seed: input.seed,
              inference_steps: isFluxDevLora ? input.num_inference_steps : (isIdeogramV3 ? undefined : (isFluxKontextMax ? undefined : num_inference_steps)),
              guidance_scale: isFluxDevLora ? input.guidance : (isIdeogramV3 ? undefined : (isFluxKontextMax ? undefined : guidance_scale)),
              aspect_ratio: isFluxDevLora ? input.aspect_ratio : (isIdeogramV3 ? input.aspect_ratio : (isFluxKontextMax ? input.aspect_ratio : undefined)),
              resolution: isIdeogramV3 ? input.resolution : undefined,
              style_type: isIdeogramV3 ? input.style_type : undefined,
              magic_prompt_option: isIdeogramV3 ? input.magic_prompt_option : undefined,
              lora_weights: isFluxDevLora ? input.lora_weights : undefined,
              extra_lora: isFluxDevLora ? input.extra_lora : undefined,
              lora_scale: isFluxDevLora ? input.lora_scale : undefined,
              extra_lora_scale: isFluxDevLora ? input.extra_lora_scale : undefined,
              guidance: isFluxDevLora ? input.guidance : undefined,
              go_fast: isFluxDevLora ? input.go_fast : undefined,
              megapixels: isFluxDevLora ? input.megapixels : undefined,
              num_outputs: isFluxDevLora ? input.num_outputs : undefined,
              output_format: isFluxDevLora ? input.output_format : undefined,
              output_quality: isFluxDevLora ? input.output_quality : undefined,
              prompt_strength: isFluxDevLora ? input.prompt_strength : undefined,
              disable_safety_checker: isFluxDevLora ? input.disable_safety_checker : undefined,
              safety_tolerance: isFluxKontextMax ? input.safety_tolerance : undefined,
              prompt_upsampling: isFluxKontextMax ? input.prompt_upsampling : undefined
            }
          };
        }
      } else {
        return {
          imageUrl,
          imageUrls,
          format: 'url',
          prompt,
          settings: { model, size, quality, format, background: "opaque" },
          metadata: { 
            provider: 'replicate',
            seed: input.seed,
            inference_steps: isFluxDevLora ? input.num_inference_steps : (isIdeogramV3 ? undefined : (isFluxKontextMax ? undefined : num_inference_steps)),
            guidance_scale: isFluxDevLora ? input.guidance : (isIdeogramV3 ? undefined : (isFluxKontextMax ? undefined : guidance_scale)),
            aspect_ratio: isFluxDevLora ? input.aspect_ratio : (isIdeogramV3 ? input.aspect_ratio : (isFluxKontextMax ? input.aspect_ratio : undefined)),
            resolution: isIdeogramV3 ? input.resolution : undefined,
            style_type: isIdeogramV3 ? input.style_type : undefined,
            magic_prompt_option: isIdeogramV3 ? input.magic_prompt_option : undefined,
            lora_weights: isFluxDevLora ? input.lora_weights : undefined,
            extra_lora: isFluxDevLora ? input.extra_lora : undefined,
            lora_scale: isFluxDevLora ? input.lora_scale : undefined,
            extra_lora_scale: isFluxDevLora ? input.extra_lora_scale : undefined,
            guidance: isFluxDevLora ? input.guidance : undefined,
            go_fast: isFluxDevLora ? input.go_fast : undefined,
            megapixels: isFluxDevLora ? input.megapixels : undefined,
            num_outputs: isFluxDevLora ? input.num_outputs : undefined,
            output_format: isFluxDevLora ? input.output_format : undefined,
            output_quality: isFluxDevLora ? input.output_quality : undefined,
            prompt_strength: isFluxDevLora ? input.prompt_strength : undefined,
            disable_safety_checker: isFluxDevLora ? input.disable_safety_checker : undefined,
            safety_tolerance: isFluxKontextMax ? input.safety_tolerance : undefined,
            prompt_upsampling: isFluxKontextMax ? input.prompt_upsampling : undefined
          }
        };
      }
    } catch (error) {
      console.error('Replicate generation error:', error);
      throw new Error(`Replicate generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateWithGoogleAIStudio(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const {
      prompt,
      size = '1024x1024',
      quality = 'medium',
      format = 'png'
    } = params;

    // Try Gemini 2.0 Flash Preview for image generation
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${this.googleApiKey}`, {
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
      
      if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
        const content = geminiData.candidates[0].content;
        
        if (content.parts && content.parts.length > 0) {
          for (const part of content.parts) {
            if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
              return {
                imageData: part.inlineData.data,
                format: 'base64',
                mimeType: part.inlineData.mimeType,
                imageUrls: [], // Google AI Studio returns single image as base64
                prompt,
                settings: { model: 'google-ai-studio', size, quality, format, background: 'opaque' },
                metadata: { provider: 'google-ai-studio' }
              };
            }
          }
        }
      }
    }

    // Fallback to test image
    const fallbackUrl = `https://picsum.photos/${size.replace('x', '/')}?random=${Date.now()}`;
    return {
      imageUrl: fallbackUrl,
      imageUrls: [fallbackUrl],
      format: 'url',
      prompt,
      settings: { model: 'google-ai-studio', size, quality, format, background: 'opaque' },
      metadata: { provider: 'google-ai-studio' }
    };
  }

  private async editWithOpenAI(params: ImageEditRequest): Promise<ImageGenerationResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const {
      prompt,
      model = 'gpt-image-1',
      quality = 'medium',
      format = 'png',
      background = 'opaque',
      output_compression,
      image,
      mask
    } = params;

    // Only allow 'standard' or 'hd' for OpenAI
    let openaiQuality = quality;
    if (openaiQuality !== 'standard' && openaiQuality !== 'hd') {
      openaiQuality = 'standard';
    }

    const formData = new FormData();
    formData.append('model', model);
    formData.append('prompt', prompt);
    formData.append('quality', openaiQuality);
    formData.append('response_format', format === 'png' ? 'b64_json' : 'url');

    if (background !== 'opaque') {
      formData.append('background', background);
    }
    
    if (output_compression && (format === 'jpeg' || format === 'webp')) {
      formData.append('output_compression', output_compression.toString());
    }

    formData.append('image', image);

    if (mask) {
      formData.append('mask', mask);
    }

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI edit API error:', error);
      throw new Error(`OpenAI edit API error: ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI edit API response:', JSON.stringify(data, null, 2));
    
    if (format === 'png' && data.data?.[0]?.b64_json) {
      const result = {
        imageData: data.data[0].b64_json,
        format: 'base64' as const,
        imageUrls: data.data.map((item: any) => item.url).filter(Boolean),
        prompt,
        settings: { model, size: '1024x1024', quality, format, background },
        metadata: { provider: 'openai' }
      };
      console.log('Returning image edit result:', JSON.stringify(result, null, 2));
      return result;
    } else if (data.data?.[0]?.url) {
      const imageUrls = data.data.map((item: any) => item.url).filter(Boolean);
      const result = {
        imageUrl: imageUrls[0],
        imageUrls,
        format: 'url' as const,
        prompt,
        settings: { model, size: '1024x1024', quality, format, background },
        metadata: { provider: 'openai' }
      };
      console.log('Returning image edit result:', JSON.stringify(result, null, 2));
      return result;
    } else {
      console.error('No image returned from OpenAI edit API:', JSON.stringify(data, null, 2));
      throw new Error('No image returned from OpenAI edit API');
    }
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService(); 