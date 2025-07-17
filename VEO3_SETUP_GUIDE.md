# 🎬 Veo 3 Integration Setup Guide

This guide will help you set up real Veo 3 video generation in your GenLo project.

## 🚀 Quick Start

### 1. Choose Your Veo 3 Provider

You have several options for accessing Veo 3:

#### **Option A: Google Cloud Vertex AI (Recommended)**
- **Cost**: $20/month (Google AI Pro subscription)
- **Quality**: Best quality, official Google implementation
- **Setup**: Requires Google Cloud account and AI Pro subscription

#### **Option B: Replicate**
- **Cost**: ~$0.50-1.00 per video
- **Quality**: High quality, easy setup
- **Setup**: Simple API key registration

#### **Option C: AI/ML API**
- **Cost**: ~$0.75 per video
- **Quality**: High quality, reliable
- **Setup**: API key registration

#### **Option D: Pollo AI**
- **Cost**: ~$0.60 per video
- **Quality**: High quality, good performance
- **Setup**: API key registration

### 2. Environment Setup

Copy `env.example` to `.env.local` and configure your chosen provider:

```bash
# Copy environment file
cp env.example .env.local
```

#### For Google Cloud Vertex AI:
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
# Use Google AI Pro subscription for Veo 3 access
```

#### For Replicate:
```env
REPLICATE_API_KEY=your_replicate_api_key
```

#### For AI/ML API:
```env
AIMLAPI_API_KEY=your_aimlapi_api_key
```

#### For Pollo AI:
```env
POLLO_API_KEY=your_pollo_api_key
```

### 3. API Key Setup

#### **Google Cloud Vertex AI Setup**

1. **Create Google Cloud Project**:
   ```bash
   # Install Google Cloud CLI
   gcloud auth login
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. **Enable Vertex AI API**:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   ```

3. **Subscribe to Google AI Pro**:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Subscribe to Google AI Pro ($20/month)
   - This gives you access to Veo 3

4. **Get API Key**:
   ```bash
   gcloud auth application-default login
   # This creates credentials in ~/.config/gcloud/application_default_credentials.json
   ```

#### **Replicate Setup**

1. **Sign up at [Replicate](https://replicate.com/)**
2. **Get API key from dashboard**
3. **Add to .env.local**:
   ```env
   REPLICATE_API_KEY=r8_your_api_key_here
   ```

#### **AI/ML API Setup**

1. **Sign up at [AI/ML API](https://aimlapi.com/)**
2. **Get API key from dashboard**
3. **Add to .env.local**:
   ```env
   AIMLAPI_API_KEY=your_api_key_here
   ```

#### **Pollo AI Setup**

1. **Sign up at [Pollo AI](https://pollo.ai/)**
2. **Get API key from dashboard**
3. **Add to .env.local**:
   ```env
   POLLO_API_KEY=your_api_key_here
   ```

## 🎯 Usage

### 1. Access the Veo 3 Generator

Use the video generation features in the dashboard

### 2. Configure Your Video

1. **Enter API Keys**: Your OpenAI key and Veo 3 provider key
2. **Describe Scenes**: Write detailed descriptions for your two scenes
3. **Set Parameters**:
   - **Aspect Ratio**: 16:9 (widescreen), 9:16 (portrait), 1:1 (square)
   - **Resolution**: 720p, 1080p, or 4K
   - **Duration**: 8, 16, 24, or 32 seconds per scene
   - **Style**: Realistic, Cinematic, Documentary, Hyperrealistic, Dramatic
   - **Audio**: Native, Dialogue, Effects, or Silent

### 3. Generate Video

Click "Generate Video with Veo 3" and watch the real-time progress:
1. **Research**: AI analyzes your scenes
2. **Prompt Generation**: Creates optimized Veo 3 prompts
3. **Veo 3 Generation**: Generates actual videos
4. **Merge**: Combines scenes into final video

## 🔧 Advanced Configuration

### Video Merging with FFmpeg

For proper video merging, install FFmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

Add to `.env.local`:
```env
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### Video Storage

For production, consider adding video storage:

```env
# Cloudinary (recommended)
CLOUDINARY_URL=cloudinary://your_cloud_name:your_api_key@your_cloud_name

# Or AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

## 💰 Cost Optimization

### Google Cloud Vertex AI
- **Best for**: High volume, consistent quality
- **Cost**: $20/month flat rate
- **Limit**: 100 videos/month included

### Replicate
- **Best for**: Low volume, pay-per-use
- **Cost**: ~$0.50-1.00 per video
- **Limit**: No monthly limits

### AI/ML API
- **Best for**: Balanced cost/quality
- **Cost**: ~$0.75 per video
- **Limit**: No monthly limits

### Pollo AI
- **Best for**: Fast generation, good quality
- **Cost**: ~$0.60 per video
- **Limit**: No monthly limits

## 🐛 Troubleshooting

### Common Issues

#### **"API key not found"**
- Check your `.env.local` file
- Ensure API key is correct
- Restart your development server

#### **"Rate limit exceeded"**
- Wait a few minutes before retrying
- Consider upgrading your plan
- Check provider-specific limits

#### **"Video generation failed"**
- Check your prompt quality
- Ensure scenes are appropriate
- Try different style settings

#### **"Authentication failed"**
- Verify API key format
- Check provider account status
- Ensure proper permissions

### Debug Mode

Enable debug logging by adding to `.env.local`:
```env
DEBUG=true
NODE_ENV=development
```

## 🚀 Production Deployment

### Vercel Deployment

1. **Add environment variables** in Vercel dashboard
2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring

### Add Analytics

```typescript
// Track video generation metrics
const analytics = {
  provider: settings.veoProvider,
  duration: settings.duration,
  resolution: settings.resolution,
  cost: calculateCost(settings),
  success: true
};
```

### Error Tracking

```typescript
// Add to your error handlers
console.error('Veo 3 Error:', {
  provider: settings.veoProvider,
  error: error.message,
  timestamp: new Date().toISOString()
});
```

## 🔒 Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** to prevent abuse
4. **Validate user inputs** before sending to APIs
5. **Monitor usage** to detect unusual patterns

## 📞 Support

- **Google Cloud**: [Vertex AI Documentation](https://cloud.google.com/vertex-ai)
- **Replicate**: [API Documentation](https://replicate.com/docs)
- **AI/ML API**: [Documentation](https://aimlapi.com/docs)
- **Pollo AI**: [Documentation](https://pollo.ai/docs)

---

**Ready to generate amazing videos with Veo 3! 🎬** 