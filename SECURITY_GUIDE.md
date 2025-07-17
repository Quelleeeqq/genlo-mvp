# 🔒 Security Guide - API Key Management

This guide ensures your API keys are properly secured and never exposed in the browser console or network tab.

## ✅ Current Security Status

Your application is now properly configured with the following security measures:

### ✅ Server-Side API Calls
- All API keys are stored in environment variables
- All external API calls are made server-side (in `/api` routes)
- No API keys are exposed to the frontend
- Frontend components only make requests to your own API endpoints

### ✅ Environment Variable Protection
- API keys are stored in `.env.local` (not committed to version control)
- Only `NEXT_PUBLIC_` prefixed variables are exposed to the browser
- All sensitive keys use standard environment variable names

### ✅ Secure API Routes
- `/api/ai-chat` - Handles chat requests server-side
- `/api/image-gen` - Handles image generation server-side  
- `/api/veo3/generate` - Handles video generation server-side
- `/api/image-analysis` - Handles image analysis server-side

## 🔧 Security Measures Implemented

### 1. Removed Hardcoded API Keys
- ❌ Removed hardcoded Google AI Studio API key from source code
- ❌ Removed hardcoded OpenAI API key from documentation
- ✅ All API keys now use environment variables

### 2. Environment Variable Usage
```typescript
// ✅ Secure - Server-side only
const apiKey = process.env.OPENAI_API_KEY;
const googleKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
const replicateKey = process.env.REPLICATE_API_TOKEN;

// ❌ Never do this - Exposes keys to browser
const apiKey = 'sk-...'; // Hardcoded
```

### 3. Frontend Security
```typescript
// ✅ Secure - Frontend only calls your API
const response = await fetch('/api/ai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: userInput })
});

// ❌ Never do this - Exposes API key in network tab
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${apiKey}` } // Key visible in network tab
});
```

## 🛡️ Best Practices

### 1. Environment Variables
```bash
# ✅ Good - Use .env.local (not committed to git)
OPENAI_API_KEY=sk-your-actual-key-here
GOOGLE_AI_STUDIO_API_KEY=your-google-key-here

# ❌ Bad - Never commit real keys
OPENAI_API_KEY=sk-your-actual-key-here
```

### 2. API Route Structure
```typescript
// ✅ Secure API route structure
export async function POST(req: NextRequest) {
  // Get API key from environment (server-side only)
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }
  
  // Make external API call server-side
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  // Return sanitized response to frontend
  return NextResponse.json({ text: result });
}
```

### 3. Frontend Component Security
```typescript
// ✅ Secure frontend component
const handleSubmit = async () => {
  // Only send user input to your API
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userInput })
  });
  
  // No API keys in request body or headers
};
```

## 🔍 Verification Steps

### 1. Check Network Tab
1. Open browser DevTools → Network tab
2. Make a request (chat, image generation, etc.)
3. Verify that:
   - ✅ No API keys appear in request headers
   - ✅ No API keys appear in request body
   - ✅ Only your domain appears in requests
   - ✅ No direct calls to external APIs (OpenAI, Google, etc.)

### 2. Check Console
1. Open browser DevTools → Console tab
2. Verify that:
   - ✅ No API keys are logged
   - ✅ No sensitive data is exposed
   - ✅ Only application logs appear

### 3. Check Environment Variables
1. Verify `.env.local` exists and contains your keys
2. Verify `.env.local` is in `.gitignore`
3. Verify no keys are committed to version control

## 🚨 Security Checklist

- [ ] ✅ All API keys moved to environment variables
- [ ] ✅ No hardcoded keys in source code
- [ ] ✅ No API keys in documentation
- [ ] ✅ All external API calls made server-side
- [ ] ✅ Frontend only calls your API endpoints
- [ ] ✅ `.env.local` file exists and is not committed
- [ ] ✅ Environment variables properly configured
- [ ] ✅ API routes validate API key presence
- [ ] ✅ No sensitive data logged to console
- [ ] ✅ Network requests don't expose API keys

## 🔄 API Key Rotation

### When to Rotate Keys
- Every 90 days (recommended)
- After security incidents
- When team members leave
- When keys are accidentally exposed

### How to Rotate Keys
1. Generate new API keys from providers
2. Update `.env.local` with new keys
3. Test all functionality
4. Revoke old keys from provider dashboards

## 🚀 Production Deployment

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Never commit `.env.local` to git
3. Use Vercel's environment variable interface

### Environment Variables for Production
```bash
# Required for production
OPENAI_API_KEY=sk-your-production-key
GOOGLE_AI_STUDIO_API_KEY=your-production-google-key
REPLICATE_API_TOKEN=your-production-replicate-key
ANTHROPIC_API_KEY=your-production-anthropic-key

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
```

## 🆘 Troubleshooting

### "API key not configured" Error
1. Check `.env.local` file exists
2. Verify API key variable names match exactly
3. Restart development server after changes
4. Check for typos in environment variable names

### "Unauthorized" Error
1. Verify API key is valid and active
2. Check API key permissions
3. Verify billing status with provider
4. Check rate limits

### Frontend Can't Access API
1. Verify API routes are in `/api` directory
2. Check Next.js configuration
3. Verify CORS settings if needed
4. Check network connectivity

## 📞 Support

If you encounter security issues:
1. Immediately rotate affected API keys
2. Check application logs for exposure
3. Review recent code changes
4. Contact support if needed

---

**Remember: Security is an ongoing process. Regularly review and update your security measures!** 