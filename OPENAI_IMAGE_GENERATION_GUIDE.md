# OpenAI Image Generation Integration Guide

## Overview

This guide documents the comprehensive integration of OpenAI's image generation capabilities into the Quelle AI system. The implementation supports both the **Image API** and **Responses API**, providing maximum flexibility for different use cases and requirements.

### Key Features

- **Dual API Support**: Choose between Image API (faster, simpler) and Responses API (conversational, streaming)
- **Latest GPT Image Model**: Uses `gpt-image-1` for superior image quality and instruction following
- **Multi-Turn Editing**: Iteratively edit images across conversation turns
- **Streaming Support**: Get partial images during generation for faster feedback
- **Comprehensive Options**: Size, quality, format, compression, background, moderation controls
- **Enhanced Error Handling**: Robust error handling with specific error messages
- **Content Moderation**: Built-in content policy enforcement with configurable strictness

## Architecture

### Supported APIs

1. **Image API** (`/v1/images/generations`, `/v1/images/edits`)
   - Faster generation for single images
   - Lower latency
   - Simpler implementation
   - Best for: Single image generation, batch processing

2. **Responses API** (`/v1/responses`)
   - Conversational image generation
   - Multi-turn editing with context
   - Streaming partial images
   - Revised prompts
   - Best for: Chat interfaces, iterative editing

### Model Comparison

| Feature | Image API | Responses API |
|---------|-----------|---------------|
| **Speed** | ⚡ Faster | 🐌 Slower but conversational |
| **Streaming** | ❌ No | ✅ Yes (partial images) |
| **Multi-turn** | ❌ No | ✅ Yes (with context) |
| **Revised Prompts** | ❌ No | ✅ Yes |
| **Complexity** | 🟢 Simple | 🟡 Moderate |

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional
USE_IMAGE_API=true  # Use Image API instead of Responses API
```

### API Selection

```typescript
// Global configuration
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
    imageModel: 'gpt-image-1',
    useImageAPI: process.env.USE_IMAGE_API === 'true' // Global setting
  }
};

// Per-request override
const result = await openaiHandler.generateImage(prompt, {
  useImageAPI: true, // Override for this request
  quality: 'high',
  size: '1024x1024'
});
```

## Features

### 1. Basic Image Generation

Generate images from text prompts with comprehensive options:

```typescript
const result = await openaiHandler.generateImage("A serene mountain landscape", {
  size: '1024x1024',
  quality: 'high',
  format: 'png',
  compression: 90,
  background: 'transparent',
  moderation: 'auto'
});
```

**Response Format:**
```typescript
{
  imageBase64: string;        // Base64 encoded image
  revisedPrompt?: string;     // AI-optimized prompt (Responses API only)
  structuredData?: any;       // Enhanced metadata
}
```

### 2. Image-to-Image Generation

Generate images based on reference images:

```typescript
const result = await openaiHandler.generateImageFromImage(
  referenceImageBase64,
  "Add a sunset background",
  {
    size: '1024x1536',
    quality: 'medium',
    format: 'jpeg',
    compression: 85
  }
);
```

### 3. Multi-Turn Image Editing

Edit images across multiple conversation turns:

```typescript
// First generation
const firstResult = await openaiHandler.generateImage("A cat sitting");

// Edit the image using previous response ID
const editResult = await openaiHandler.editImageWithPreviousResponse(
  firstResult.responseId,
  "Make it look more realistic",
  { quality: 'high' }
);
```

### 4. Streaming Image Generation

Get partial images during generation for faster feedback:

```typescript
const result = await openaiHandler.generateImageStream(
  "A beautiful sunset over mountains",
  {
    partialImages: 2,
    quality: 'high'
  },
  (index, imageBase64) => {
    console.log(`Partial image ${index} received`);
    // Display partial image to user
  }
);
```

## Configuration Options

### Image Generation Options

| Option | Type | Values | Description |
|--------|------|--------|-------------|
| `size` | string | `1024x1024`, `1024x1536`, `1536x1024`, `auto` | Image dimensions |
| `quality` | string | `low`, `medium`, `high`, `auto` | Rendering quality |
| `format` | string | `png`, `jpeg`, `webp` | Output format |
| `compression` | number | 0-100 | Compression level (JPEG/WebP) |
| `background` | string | `transparent`, `opaque`, `auto` | Background type |
| `partialImages` | number | 1-3 | Number of partial images for streaming |
| `moderation` | string | `auto`, `low` | Content moderation strictness |
| `useImageAPI` | boolean | `true`, `false` | Override API choice |

### Auto-Selection

Use `"auto"` for `size`, `quality`, and `background` to let the model choose optimal settings:

```typescript
{
  size: "auto",
  quality: "auto", 
  background: "auto"
}
```

### Content Moderation

Control content filtering with the `moderation` parameter:

```typescript
// Standard filtering (default)
{ moderation: 'auto' }

// Less restrictive filtering
{ moderation: 'low' }
```

## API Integration

### Request Format

```typescript
POST /api/ai-chat-flow
{
  "message": "Generate an image of a cat",
  "referenceImageUrl": "data:image/png;base64,...", // Optional
  "imageOptions": {
    "size": "1024x1024",
    "quality": "high",
    "format": "png",
    "background": "transparent",
    "moderation": "auto",
    "useImageAPI": false
  }
}
```

### Response Format

```typescript
{
  "success": true,
  "type": "image",
  "content": "I've generated an image of a cat for you!",
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "enhancedPrompt": "A detailed image of a cat...",
  "imageMetadata": {
    "description": "A detailed image of a cat",
    "style": "realistic",
    "mood": "neutral",
    "composition": "standard",
    "revisedPrompt": "A cat sitting in a natural pose...",
    "imageId": "ig_123456789",
    "partialImagesReceived": 2
  },
  "structuredData": {
    "enhanced_prompt": "A detailed image of a cat...",
    "revised_prompt": "A cat sitting in a natural pose...",
    "image_id": "ig_123456789",
    "partial_images_received": 2
  }
}
```

## UI Components

### DashboardChat Updates

The DashboardChat component now supports:

1. **Base64 Image Display** - Direct rendering of generated images
2. **Image Metadata** - Display of style, mood, composition, and revised prompts
3. **Reference Image Upload** - Support for image-to-image generation
4. **Enhanced Prompt Display** - Show both original and AI-revised prompts
5. **Streaming Indicators** - Show partial image progress
6. **Error Handling** - User-friendly error messages

### Image Display Features

```typescript
// Image with metadata
<img
  src={`data:image/png;base64,${message.imageBase64}`}
  alt="Generated image"
  className="max-w-full h-auto rounded-lg border"
  style={{ maxHeight: '400px' }}
/>

// Metadata display
<div className="mt-2 space-y-1">
  <div className="text-xs opacity-70">
    <strong>Style:</strong> {message.imageMetadata.style}
  </div>
  <div className="text-xs opacity-70">
    <strong>Revised Prompt:</strong> {message.imageMetadata.revisedPrompt}
  </div>
  {message.imageMetadata.partialImagesReceived && (
    <div className="text-xs opacity-50">
      <strong>Partial Images:</strong> {message.imageMetadata.partialImagesReceived}
    </div>
  )}
</div>
```

## Error Handling

### Common Error Scenarios

1. **Rate Limiting**
   ```typescript
   if (error.message.includes('rate limit')) {
     return { error: 'Rate limit exceeded. Please try again.' };
   }
   ```

2. **Authentication Errors**
   ```typescript
   if (error.message.includes('API key')) {
     return { error: 'Authentication error. Please check your API configuration.' };
   }
   ```

3. **Content Policy Violations**
   ```typescript
   if (error.message.includes('content policy') || error.message.includes('moderation')) {
     return { error: 'The requested content violates our content policy.' };
   }
   ```

4. **Model Availability**
   ```typescript
   if (error.message.includes('model')) {
     return { error: 'Model not available. Please check your API access.' };
   }
   ```

5. **Image Generation Failures**
   ```typescript
   if (imageCall.status !== 'completed') {
     throw new Error(`Image generation failed with status: ${imageCall.status}`);
   }
   ```

### Fallback Mechanisms

- **Prompt Truncation**: Automatically truncate long prompts to fit API limits
- **Format Conversion**: Handle various image input formats (URL, base64, data URLs)
- **Graceful Degradation**: Fall back to regular image generation if image-to-image fails
- **API Fallback**: Automatically fall back to Image API if Responses API fails

## Best Practices

### Prompt Optimization

1. **Use Action Words**: Include terms like "draw", "create", "generate" for better results
2. **Be Specific**: Provide detailed descriptions for more accurate images
3. **Reference Images**: Use reference images for consistent style and features
4. **Iterative Editing**: Use multi-turn editing for refinements
5. **Content Guidelines**: Follow OpenAI's content policy to avoid moderation issues

### Performance Optimization

1. **API Selection**: Use Image API for single images, Responses API for conversational flows
2. **Streaming**: Use streaming for faster perceived response times
3. **Caching**: Cache generated images to avoid regeneration
4. **Compression**: Use appropriate compression levels for web delivery
5. **Size Selection**: Choose appropriate image sizes for your use case

### Security Considerations

1. **Input Validation**: Validate all user inputs before processing
2. **Rate Limiting**: Implement proper rate limiting to prevent abuse
3. **Content Filtering**: Monitor generated content for inappropriate material
4. **API Key Security**: Secure API keys and rotate them regularly
5. **Moderation**: Use appropriate moderation settings for your use case

## Usage Examples

### Basic Image Generation

```typescript
// Simple image generation
const result = await chatFlowController.processMessage(
  "Generate an image of a beautiful sunset over mountains"
);
```

### Image-to-Image Generation

```typescript
// Upload reference image and generate variations
const result = await chatFlowController.processMessage(
  "Add a sunset background to this image",
  referenceImageBase64
);
```

### Creative Image Requests

```typescript
// Creative prompts work well with the new model
const result = await chatFlowController.processMessage(
  "Draw a magical forest with glowing mushrooms and fairy lights"
);
```

### Multi-Turn Editing

```typescript
// First generation
const firstResult = await chatFlowController.processMessage(
  "Generate a portrait of a person"
);

// Edit in follow-up
const editResult = await chatFlowController.processMessage(
  "Make it more realistic and add better lighting"
);
```

### High-Quality Transparent Images

```typescript
const result = await openaiHandler.generateImage(
  "Draw a 2D pixel art style sprite sheet of a tabby gray cat",
  {
    background: 'transparent',
    quality: 'high',
    format: 'png'
  }
);
```

## Cost and Performance

### Token Usage

The number of tokens generated depends on image dimensions and quality:

| Quality | Square (1024×1024) | Portrait (1024×1536) | Landscape (1536×1024) |
|---------|-------------------|---------------------|----------------------|
| Low | 272 tokens | 408 tokens | 400 tokens |
| Medium | 1056 tokens | 1584 tokens | 1568 tokens |
| High | 4160 tokens | 6240 tokens | 6208 tokens |

### Performance Tips

1. **Use Low Quality for Prototypes**: Start with low quality for faster iteration
2. **Choose Appropriate Sizes**: Use smaller sizes for faster generation
3. **Streaming for UX**: Use streaming to show progress to users
4. **Cache Results**: Cache generated images to avoid regeneration
5. **Batch Processing**: Use Image API for batch operations

## Testing

### Unit Tests

```typescript
describe('Image Generation', () => {
  test('should generate image from text prompt', async () => {
    const result = await openaiHandler.generateImage('A simple test image');
    expect(result.imageBase64).toBeDefined();
    expect(result.revisedPrompt).toBeDefined();
  });

  test('should handle image-to-image generation', async () => {
    const result = await openaiHandler.generateImageFromImage(
      testImageBase64,
      'Add a background'
    );
    expect(result.imageBase64).toBeDefined();
  });

  test('should handle API selection', async () => {
    const result = await openaiHandler.generateImage('Test', { useImageAPI: true });
    expect(result.imageBase64).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('API Integration', () => {
  test('should return image response', async () => {
    const response = await fetch('/api/ai-chat-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Generate a test image' })
    });
    
    const data = await response.json();
    expect(data.type).toBe('image');
    expect(data.imageBase64).toBeDefined();
  });

  test('should handle content policy violations', async () => {
    const response = await fetch('/api/ai-chat-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Generate inappropriate content' })
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('content policy');
  });
});
```

## Troubleshooting

### Common Issues

1. **Images Not Generating**
   - Check API key configuration
   - Verify model availability (`gpt-image-1`)
   - Check rate limits
   - Ensure API organization verification is complete

2. **Poor Image Quality**
   - Use higher quality settings
   - Provide more detailed prompts
   - Use reference images for consistency
   - Try different formats (PNG vs JPEG)

3. **Slow Generation**
   - Use streaming for faster feedback
   - Optimize prompt length
   - Check network connectivity
   - Consider using Image API for single images

4. **Content Policy Violations**
   - Review your prompts for inappropriate content
   - Use `moderation: 'low'` for less restrictive filtering
   - Follow OpenAI's content policy guidelines

5. **Format Issues**
   - Verify base64 encoding
   - Check image format compatibility
   - Ensure proper MIME types
   - Test with different output formats

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
console.log('Image generation prompt:', finalPrompt);
console.log('Image generation options:', options);
console.log('API response:', data);
console.log('API selection:', useImageAPI ? 'Image API' : 'Responses API');
```

## Future Enhancements

### Planned Features

1. **Batch Generation**: Generate multiple images simultaneously
2. **Style Transfer**: Apply artistic styles to generated images
3. **Advanced Editing**: More sophisticated image editing capabilities
4. **Image Analysis**: Analyze and describe generated images
5. **Custom Models**: Support for fine-tuned models
6. **WebP Optimization**: Better WebP support with advanced compression
7. **Mask-Based Editing**: Support for precise image editing with masks

### Performance Improvements

1. **Caching Layer**: Implement intelligent caching for generated images
2. **CDN Integration**: Use CDN for faster image delivery
3. **Progressive Loading**: Implement progressive image loading
4. **Compression Optimization**: Advanced compression algorithms
5. **Parallel Processing**: Generate multiple images in parallel

## Conclusion

The OpenAI image generation integration provides a powerful, flexible system for generating high-quality images with advanced features like multi-turn editing, streaming, and comprehensive metadata. The dual API support ensures optimal performance for different use cases, while robust error handling and content moderation keep the system secure and reliable.

The implementation follows best practices for security, performance, and user experience while maintaining backward compatibility with existing systems. Users can generate high-quality images with detailed control over the generation process, and the system provides rich metadata and optimization features.

For more information, refer to the [OpenAI Image Generation Documentation](https://platform.openai.com/docs/guides/images). 