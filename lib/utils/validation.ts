import { z } from 'zod';

// Base validation schemas
export const baseSchemas = {
  // Email validation
  email: z.string().email('Invalid email address'),
  
  // Password validation (minimum 8 chars, at least one letter and number)
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  
  // Username validation
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  // URL validation
  url: z.string().url('Invalid URL'),
  
  // File size validation (in bytes)
  fileSize: (maxSize: number) => z.number().max(maxSize, `File size must be less than ${maxSize} bytes`),
  
  // File type validation
  fileType: (allowedTypes: string[]) => z.string().refine(
    (type) => allowedTypes.includes(type),
    `File type must be one of: ${allowedTypes.join(', ')}`
  )
};

// AI-specific validation schemas
export const aiSchemas = {
  // Chat prompt validation
  chatPrompt: z.string()
    .min(1, 'Prompt cannot be empty')
    .max(4000, 'Prompt must be less than 4000 characters')
    .refine(
      (prompt) => !prompt.includes('<script>') && !prompt.includes('javascript:'),
      'Prompt contains invalid content'
    ),
  
  // Image generation prompt validation
  imagePrompt: z.string()
    .min(1, 'Prompt cannot be empty')
    .max(1000, 'Image prompt must be less than 1000 characters')
    .refine(
      (prompt) => {
        const forbiddenWords = ['nude', 'naked', 'explicit', 'porn', 'adult'];
        return !forbiddenWords.some(word => prompt.toLowerCase().includes(word));
      },
      'Prompt contains inappropriate content'
    ),
  
  // Video generation prompt validation
  videoPrompt: z.string()
    .min(1, 'Prompt cannot be empty')
    .max(500, 'Video prompt must be less than 500 characters')
    .refine(
      (prompt) => {
        const forbiddenWords = ['nude', 'naked', 'explicit', 'porn', 'adult', 'violence'];
        return !forbiddenWords.some(word => prompt.toLowerCase().includes(word));
      },
      'Prompt contains inappropriate content'
    ),
  
  // Model validation
  model: z.enum([
    // Claude 4
    'claude-opus-4-20250514',
    'claude-opus-4-0',
    'claude-sonnet-4-20250514',
    'claude-sonnet-4-0',
    // Claude 3.7
    'claude-3-7-sonnet-20250219',
    'claude-3-7-sonnet-latest',
    // Claude 3.5
    'claude-3-5-haiku-20241022',
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20240620',
    // Claude 3
    'claude-3-opus-20240229',
    'claude-3-opus-latest',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    // Other supported models
    'gpt-4',
    'gpt-3.5-turbo',
    'replicate',
    'google-ai-studio'
  ]),
  
  // Temperature validation
  temperature: z.number().min(0).max(2),
  
  // Max tokens validation
  maxTokens: z.number().min(1).max(4000),
  
  // Image size validation
  imageSize: z.enum([
    '256x256',
    '512x512',
    '1024x1024',
    '1024x1536',
    '1536x1024',
    '1792x1024',
    '1024x1792'
  ]),
  
  // Video aspect ratio validation
  videoAspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:4']),
  
  // Video resolution validation
  videoResolution: z.enum(['720p', '1080p', '4K']),
  
  // Video duration validation
  videoDuration: z.enum(['8', '16', '24', '32'])
};

// User input validation schemas
export const userSchemas = {
  // User registration
  registration: z.object({
    email: baseSchemas.email,
    password: baseSchemas.password,
    fullName: z.string().min(1).max(100),
    agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms')
  }),
  
  // User login
  login: z.object({
    email: baseSchemas.email,
    password: z.string().min(1, 'Password is required')
  }),
  
  // Profile update
  profileUpdate: z.object({
    fullName: z.string().min(1).max(100).optional(),
    avatarUrl: baseSchemas.url.optional(),
    bio: z.string().max(500).optional()
  })
};

// File upload validation schemas
export const fileSchemas = {
  // Image upload
  imageUpload: z.object({
    file: z.instanceof(File),
    maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  }),
  
  // Video upload
  videoUpload: z.object({
    file: z.instanceof(File),
    maxSize: z.number().default(100 * 1024 * 1024), // 100MB default
    allowedTypes: z.array(z.string()).default(['video/mp4', 'video/webm', 'video/quicktime'])
  })
};

// API request validation schemas
export const apiSchemas = {
  // AI Chat request
  aiChatRequest: z.object({
    prompt: aiSchemas.chatPrompt.optional(),
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1),
      timestamp: z.union([z.string(), z.date()]).optional()
    })).optional(),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1),
      timestamp: z.union([z.string(), z.date()]).optional()
    })).optional(),
    systemPrompt: z.string().max(5000).optional(),
    model: aiSchemas.model.optional(),
    temperature: aiSchemas.temperature.optional(),
    maxTokens: aiSchemas.maxTokens.optional(),
    provider: z.enum(['anthropic', 'vertex-ai']).optional(),
    vertexConfig: z.object({
      projectId: z.string(),
      region: z.string(),
      location: z.string().optional()
    }).optional()
  }).refine(
    (data) => data.prompt || (data.messages && data.messages.length > 0),
    'Either prompt or messages must be provided'
  ),
  
  // Image generation request
  imageGenerationRequest: z.object({
    prompt: aiSchemas.imagePrompt,
    model: aiSchemas.model.optional(),
    size: aiSchemas.imageSize.optional(),
    quality: z.enum(['low', 'medium', 'high']).optional(),
    format: z.enum(['png', 'jpg', 'webp']).optional(),
    negative_prompt: z.string().max(500).optional(),
    num_inference_steps: z.number().min(1).max(100).optional(),
    guidance_scale: z.number().min(0).max(20).optional(),
    seed: z.number().optional()
  }),
  
  // Video generation request
  videoGenerationRequest: z.object({
    scene1: aiSchemas.videoPrompt,
    scene2: aiSchemas.videoPrompt,
    aspectRatio: aiSchemas.videoAspectRatio.optional(),
    resolution: aiSchemas.videoResolution.optional(),
    duration: aiSchemas.videoDuration.optional(),
    style: z.enum(['realistic', 'cinematic', 'documentary', 'hyperrealistic', 'dramatic']).optional(),
    audioGeneration: z.enum(['native', 'dialogue', 'effects', 'silent']).optional(),
    userId: z.string().optional()
  })
};

// Validation helper functions
export const validationHelpers = {
  // Sanitize HTML content
  sanitizeHtml: (html: string): string => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  },
  
  // Sanitize text content
  sanitizeText: (text: string): string => {
    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '')
      .trim();
  },
  
  // Validate file size
  validateFileSize: (file: File, maxSize: number): boolean => {
    return file.size <= maxSize;
  },
  
  // Validate file type
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },
  
  // Generate validation error message
  formatValidationError: (error: z.ZodError): string => {
    return error.errors.map(err => err.message).join(', ');
  }
};

// Export all schemas
export const schemas = {
  base: baseSchemas,
  ai: aiSchemas,
  user: userSchemas,
  file: fileSchemas,
  api: apiSchemas
};

// Type exports for TypeScript
export type ChatRequest = z.infer<typeof apiSchemas.aiChatRequest>;
export type ImageGenerationRequest = z.infer<typeof apiSchemas.imageGenerationRequest>;
export type VideoGenerationRequest = z.infer<typeof apiSchemas.videoGenerationRequest>;
export type UserRegistration = z.infer<typeof userSchemas.registration>;
export type UserLogin = z.infer<typeof userSchemas.login>; 