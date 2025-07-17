# AI Services Setup Guide

This guide will help you set up all AI services for the Quelle platform, including chat, image generation, and video generation.

## Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Chat Services
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Image Generation Services
OPENAI_API_KEY=your_openai_api_key_here
REPLICATE_API_TOKEN=your_replicate_api_token_here
GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_api_key

# Video Generation Services
VEO3_PROVIDER=google-ai-studio
VEO3_API_KEY=your_google_ai_studio_api_key

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 1. Chat Service Setup

### Anthropic Claude (Recommended)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account and get your API key
3. Add to `.env.local`: `ANTHROPIC_API_KEY=your_key_here`

**Features:**
- High-quality responses
- Conversation history support
- Streaming responses (simulated)
- Fallback responses when API is unavailable

### Alternative: OpenAI GPT
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get your API key
3. Add to `.env.local`: `OPENAI_API_KEY=your_key_here`

## 2. Image Generation Setup

### Option A: Replicate (Recommended - Free Tier Available)
1. Go to [Replicate](https://replicate.com/)
2. Sign up and get your API token
3. Add to `.env.local`: `REPLICATE_API_TOKEN=your_token_here`

**Features:**
- Free tier available
- Multiple Stable Diffusion models
- High-quality image generation
- Custom parameters (steps, guidance, etc.)
- Official JavaScript library support
- Automatic model versioning

### Option B: OpenAI DALL-E
1. Use your OpenAI API key from chat setup
2. Add to `.env.local`: `OPENAI_API_KEY=your_key_here`

**Features:**
- GPT Image 1 (latest model)
- DALL-E 3 for high quality
- DALL-E 2 for lower cost
- Image editing capabilities

### Option C: Google AI Studio
1. Get your API key from [Google AI Studio](https://aistudio.google.com/)
2. Add to `.env.local`: `GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_api_key`

**Features:**
- Gemini 2.0 Flash Preview
- Imagen 4.0 integration
- High-quality results

## 3. Video Generation Setup

### Google AI Studio Veo 3 (Recommended)
1. Get your API key from [Google AI Studio](https://aistudio.google.com/)
2. Subscribe to Google AI Pro ($20/month) for Veo 3 access
3. Add to `.env.local`:
   ```env
   VEO3_PROVIDER=google-ai-studio
   VEO3_API_KEY=your_google_ai_studio_api_key
   ```

**Features:**
- High-quality video generation
- Multiple aspect ratios
- Audio generation
- Various styles and resolutions

### Alternative: Replicate Veo 3
1. Use your Replicate API token from image generation
2. Add to `.env.local`:
   ```env
   VEO3_PROVIDER=replicate
   VEO3_API_KEY=your_replicate_api_token_here
   ```

## 4. Testing Your Setup

### Test Chat Service
1. Start your development server: `npm run dev`
2. Go to the dashboard or any page with the chat component
3. Try asking a question
4. You should get a response from Claude or the fallback system

### Test Image Generation
1. Use the image generation features in the dashboard
2. Enter a prompt like "a beautiful sunset over mountains"
3. Select a model (Replicate recommended for free tier)
4. Click "Generate Image"
5. You should see a generated image

### Test Video Generation
1. Use the video generation features in the dashboard
2. Enter a video concept
3. Select your preferred settings
4. Click "Generate Video"
5. The system will research and optimize your prompt, then generate videos

## 5. Service Configuration

### Chat Service Configuration
The chat service automatically:
- Uses conversation history for context
- Provides fallback responses when APIs are unavailable
- Handles rate limits and errors gracefully
- Supports multiple AI models

### Image Generation Configuration
The image service supports:
- Multiple providers (Replicate, OpenAI, Google AI Studio)
- Various image sizes and formats
- Quality settings
- Image editing capabilities
- Automatic provider selection based on model

### Video Generation Configuration
The video service includes:
- Research and prompt optimization
- Multiple Veo 3 providers
- Various aspect ratios and resolutions
- Audio generation options
- Style customization

## 6. Cost Optimization

### Free Tier Options
- **Replicate**: Free tier with limited credits
- **Google AI Studio**: Free tier available
- **Anthropic**: Free tier with limited requests

### Paid Options
- **OpenAI**: Pay-per-use pricing
- **Google AI Pro**: $20/month for Veo 3 access
- **Replicate**: Pay-per-use for additional credits

## 7. Troubleshooting

### Common Issues

**"API key not configured" error**
- Check your `.env.local` file
- Restart your development server
- Verify API keys are correct

**"Rate limit exceeded" error**
- Wait a few minutes and try again
- Check your API provider's rate limits
- Consider upgrading your plan

**"Model not available" error**
- Check if the model is supported by your provider
- Verify your API key has access to the model
- Try a different model

**Image generation fails**
- Check your Replicate or OpenAI API token
- Verify you have sufficient credits
- Try a simpler prompt

**Video generation fails**
- Ensure you have Google AI Pro subscription for Veo 3
- Check your API key configuration
- Try a different provider

### Getting Help
1. Check the browser console for detailed error messages
2. Verify your environment variables are set correctly
3. Test individual services using the test endpoints
4. Check your API provider's status page

## 8. Production Deployment

### Vercel Deployment
1. Add your environment variables to Vercel dashboard
2. Deploy your application
3. Test all services in production

### Environment Variables for Production
Make sure to add all required environment variables to your production environment:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `GOOGLE_AI_STUDIO_API_KEY`
- `VEO3_PROVIDER`
- `VEO3_API_KEY`

## 9. Security Notes

- ✅ API keys are stored securely in environment variables
- ✅ Keys are never exposed to the frontend
- ✅ All API calls are made server-side
- ⚠️ Keep your `.env.local` file private and never commit it
- ⚠️ Regularly rotate your API keys
- ⚠️ Monitor your API usage and costs

Your AI services are now ready to power the Quelle platform! 🚀 