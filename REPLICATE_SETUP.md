# Replicate API Setup for Image Generation

## Quick Fix for Image Generation

Your image generator is not working because the Replicate API key is not configured. Here's how to fix it:

### Step 1: Get Your Replicate API Key

1. **Go to [Replicate](https://replicate.com/)**
2. **Sign up for a free account** (no credit card required)
3. **Go to your [API Tokens page](https://replicate.com/account/api-tokens)**
4. **Click "Create API token"**
5. **Copy your API token** (starts with `r8_`)

### Step 2: Add to Your Environment

1. **Open your `.env.local` file** in your project root
2. **Add this line:**
   ```env
   REPLICATE_API_TOKEN=r8_your_api_key_here
   ```
3. **Replace `r8_your_api_key_here`** with your actual API token
4. **Save the file**

### Step 3: Restart Your Server

1. **Stop your development server** (Ctrl+C)
2. **Start it again:**
   ```bash
   npm run dev
   ```

### Step 4: Test Image Generation

1. **Go to your dashboard**
2. **Try asking:** "Generate an image of a beautiful sunset"
3. **You should now see an image generated!**

## Alternative: Use OpenAI (if you have OpenAI API key)

If you prefer to use OpenAI instead of Replicate:

1. **Add your OpenAI API key to `.env.local`:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. **The system will automatically fallback to OpenAI** when Replicate is not configured

## Free Tier Limits

- **Replicate**: Free tier available, pay per generation
- **OpenAI**: Requires credits, but high quality

## Troubleshooting

**"API key not configured" error:**
- Make sure you added the API key to `.env.local`
- Restart your development server
- Check that the API key starts with `r8_`

**"Rate limit exceeded" error:**
- Wait a few minutes before trying again
- Consider upgrading your Replicate plan

## Need Help?

- **Replicate Support**: [https://replicate.com/docs](https://replicate.com/docs)
- **Free API Key**: [https://replicate.com/](https://replicate.com/)

---

**That's it! Your image generation should work perfectly after adding the API key.** 