# Google AI Studio Setup for Veo 3 Video Generation

## Quick Setup with Your API Key

Get your Google AI Studio API key from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Create Environment File

Create a `.env.local` file in your project root with the following content:

```env
# Google AI Studio for Veo 3
VEO3_PROVIDER=google-ai-studio
VEO3_API_KEY=your_google_ai_studio_api_key

# Required for other features
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase (if you're using it)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Subscribe to Google AI Pro

Veo 3 requires a **Google AI Pro** subscription ($20/month):

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign up for **Google AI Pro** subscription
3. This gives you access to Veo 3 and other advanced AI models

### Step 3: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Use the video generation features in the dashboard

3. Try generating a video (make sure you're logged in as a Pro user)

## How It Works

Your API key is used to authenticate with Google AI Studio's Veo 3 API. The system will:

1. Take your video generation request
2. Use OpenAI to research and optimize prompts
3. Send the optimized prompts to Google AI Studio's Veo 3 API
4. Return the generated video URLs

## API Endpoint

The system uses this endpoint:
```
https://generativelanguage.googleapis.com/v1beta/models/veo-3:generateVideo?key=YOUR_API_KEY
```

## Security Notes

- ✅ Your API key is stored securely in environment variables
- ✅ The key is never exposed to the frontend
- ✅ Only Pro users can access Veo 3 generation
- ⚠️ Keep your `.env.local` file private and never commit it to version control

## Troubleshooting

### "API key not valid" error
- Make sure you have a Google AI Pro subscription
- Verify your API key is correct
- Check that Veo 3 is enabled in your Google AI Studio account

### "Rate limit exceeded" error
- Google AI Pro has rate limits for Veo 3
- Wait a few minutes and try again
- Consider upgrading to a higher tier if needed

### "Subscription required" error
- Make sure you're logged in as a Pro user
- Check that the subscription system is working
- Verify your user has Pro status in the database

## Next Steps

1. **Test the integration** - Try generating a few videos
2. **Monitor usage** - Keep track of your API calls and costs
3. **Optimize prompts** - The system uses OpenAI to optimize prompts for better results
4. **Scale up** - Consider implementing video caching and CDN for production

## Cost Breakdown

- **Google AI Pro**: $20/month (includes Veo 3 access)
- **OpenAI API**: ~$0.01-0.05 per prompt optimization
- **Video storage**: Consider Cloudinary or similar for video hosting

Your setup is now ready to generate Veo 3 videos using Google AI Studio! 🎬 