# Vercel Deployment Checklist

## Environment Variables Required

### Core AI Services
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Together AI (if using)
TOGETHER_API_KEY=your_together_api_key_here

# Google AI (if using)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### Database & Authentication
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth (if using)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

### External Services
```env
# Replicate (for image generation)
REPLICATE_API_TOKEN=your_replicate_token

# Arcads (if using)
ARCAD_API_KEY=your_arcad_api_key

# Veo3 (if using)
VEO3_API_KEY=your_veo3_api_key
```

## Vercel Configuration Steps

### 1. Create vercel.json (if needed)
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. Update next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['openai', 'anthropic-ai']
  },
  images: {
    domains: [
      'replicate.delivery',
      'pbxt.replicate.delivery',
      'your-image-domains.com'
    ]
  }
}

module.exports = nextConfig
```

## Pre-Deployment Tasks

### ✅ **Completed**
- [x] OpenAI integration with o4-mini-2025-04-16
- [x] HTTP response headers system
- [x] Model evaluation system
- [x] API rate limiting and error handling
- [x] Comprehensive test interfaces

### 🔧 **Need to Complete**

#### 1. **Fix Evaluation API URL Issue**
The test-evaluation page has a URL parsing error:
```
Failed to parse URL from /api/evaluation/run
```

**Fix needed in `app/test-evaluation/page.tsx`:**
```typescript
// Change from:
const response = await fetch('/api/evaluation/run', {

// To:
const response = await fetch(`${window.location.origin}/api/evaluation/run`, {
```

#### 2. **Environment Variables**
- [ ] Add all required API keys to Vercel environment variables
- [ ] Test all AI providers work in production
- [ ] Verify Supabase connection works

#### 3. **Database Setup**
- [ ] Run Supabase migrations in production
- [ ] Verify all tables are created
- [ ] Test authentication flow

#### 4. **Performance Optimization**
- [ ] Add proper caching headers
- [ ] Optimize bundle size
- [ ] Add loading states for better UX

#### 5. **Security**
- [ ] Review API rate limiting
- [ ] Add input validation
- [ ] Set up proper CORS if needed

#### 6. **Monitoring**
- [ ] Add error tracking (Sentry, etc.)
- [ ] Set up logging for production
- [ ] Add health check endpoints

## Deployment Steps

### 1. **Prepare Repository**
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. **Deploy to Vercel**
1. Connect your GitHub repository to Vercel
2. Set all environment variables in Vercel dashboard
3. Deploy

### 3. **Post-Deployment Verification**
- [ ] Test all API endpoints
- [ ] Verify authentication works
- [ ] Test AI integrations
- [ ] Check error handling
- [ ] Verify custom headers are working

## Critical Issues to Fix

### 1. **Evaluation API URL Fix**
```typescript
// In app/test-evaluation/page.tsx, line 63
const loadEvalRuns = async () => {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch(`${baseUrl}/api/evaluation/run`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    // ... rest of the function
  } catch (error) {
    console.error('Failed to load eval runs:', error);
  }
};
```

### 2. **Add Error Boundaries**
Create error boundary components for better error handling in production.

### 3. **Add Loading States**
Improve UX by adding proper loading indicators throughout the app.

## Production Considerations

### 1. **Cost Management**
- Set up usage monitoring for AI APIs
- Implement rate limiting to prevent abuse
- Add cost alerts

### 2. **Scalability**
- Consider implementing caching for AI responses
- Add request queuing for high traffic
- Monitor performance metrics

### 3. **Security**
- Implement proper authentication
- Add request validation
- Set up monitoring for suspicious activity

## Final Checklist Before Deploy

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] All API endpoints tested
- [ ] Error handling verified
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Monitoring set up
- [ ] Documentation updated

## Quick Deploy Command
```bash
# If using Vercel CLI
vercel --prod

# Or deploy via GitHub integration
# Just push to main branch
``` 