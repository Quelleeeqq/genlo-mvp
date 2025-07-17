# 🚦 Enhanced Rate Limiting Guide - Production-Ready Protection

This guide covers the comprehensive rate limiting system implemented in your Quelle AI application to prevent API abuse and ensure fair usage.

## 📋 Overview

The enhanced rate limiting system provides:
- **User-based rate limiting** with Supabase Auth integration
- **Tier-based limits** for different subscription levels
- **Endpoint-specific limits** for different API types
- **IP-based fallback** for unauthenticated requests
- **Real-time monitoring** and detailed headers
- **Graceful degradation** with proper error responses

## 🏗️ Architecture

### Core Components

1. **`lib/middleware/rate-limit.ts`** - Main rate limiting logic
2. **`middleware.ts`** - Integration with Next.js middleware
3. **`app/test-rate-limit/page.tsx`** - Test dashboard
4. **Enhanced API routes** - Rate limit headers and monitoring

### Rate Limit Types

#### 1. User-Based Rate Limiting
- Uses Supabase Auth to identify users
- Different limits for authenticated vs anonymous users
- Persistent across sessions

#### 2. Tier-Based Rate Limiting
- **Basic Tier**: Basic limits
- **Pro Tier**: Higher limits
- **Enterprise Tier**: Maximum limits

#### 3. Endpoint-Specific Limits
- **AI Chat**: 10 requests/minute (default)
- **OpenAI**: 20 requests/minute
- **Evaluation**: 3 requests/5 minutes
- **General API**: 30 requests/minute
- **Auth**: 5 attempts/15 minutes

## 🚀 Implementation

### 1. Rate Limiter Configuration

```typescript
// lib/middleware/rate-limit.ts
export const rateLimiters = {
  aiEndpoints: async (req: NextRequest) => {
    const limiter = await createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      keyGenerator: generateUserKey,
      userBased: true,
      tierBased: true
    });
    return limiter(req);
  },
  // ... other limiters
};
```

### 2. User Key Generation

```typescript
async function generateUserKey(req: NextRequest): Promise<string> {
  try {
    // Try to get user from Supabase session
    const authHeader = req.headers.get('authorization');
    const sessionToken = req.cookies.get('sb-access-token')?.value;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        return `user:${user.id}`;
      }
    }
    
    // Fallback to IP-based rate limiting
    return `ip:${req.ip || 'unknown'}`;
  } catch (error) {
    return `ip:${req.ip || 'unknown'}`;
  }
}
```

### 3. Tier-Based Limits

```typescript
const tierLimits = {
  basic: {
    aiEndpoints: { windowMs: 60 * 1000, maxRequests: 10 },
    generalApi: { windowMs: 60 * 1000, maxRequests: 30 },
    fileUpload: { windowMs: 60 * 1000, maxRequests: 5 }
  },
  pro: {
    aiEndpoints: { windowMs: 60 * 1000, maxRequests: 50 },
    generalApi: { windowMs: 60 * 1000, maxRequests: 100 },
    fileUpload: { windowMs: 60 * 1000, maxRequests: 20 }
  },
  enterprise: {
    aiEndpoints: { windowMs: 60 * 1000, maxRequests: 200 },
    generalApi: { windowMs: 60 * 1000, maxRequests: 500 },
    fileUpload: { windowMs: 60 * 1000, maxRequests: 100 }
  }
};
```

### 4. Middleware Integration

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rate limiting for different route types
  try {
    if (pathname.startsWith('/api/ai-chat') || pathname.startsWith('/api/ai-chat-enhanced')) {
      const rateLimitResponse = await rateLimiters.aiEndpoints(request);
      if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/openai/')) {
      const rateLimitResponse = await rateLimiters.openaiEndpoints(request);
      if (rateLimitResponse) return rateLimitResponse;
    }
    // ... other endpoints
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Continue with request if rate limiting fails
  }
  
  // ... rest of middleware
}
```

## 📊 Rate Limit Headers

### Response Headers

When rate limits are applied, the following headers are included:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1703123456789
X-RateLimit-Reset-Time: 2023-12-21T10:30:45.789Z
X-RateLimit-Tier: free
Retry-After: 45
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded for your tier. Please upgrade or try again later.",
  "retryAfter": 45,
  "limit": 10,
  "remaining": 0,
  "resetTime": 1703123456789,
  "tier": "basic"
}
```

## 🧪 Testing

### 1. Test Dashboard

Visit `/test-rate-limit` to access the rate limiting test dashboard:

- Test individual endpoints
- Run bulk tests (5x requests)
- View rate limit headers
- Monitor rate limit responses

### 2. Manual Testing

```bash
# Test AI chat endpoint
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}' \
  -v

# Test with authentication
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"Hello"}' \
  -v
```

### 3. Bulk Testing

```bash
# Test rate limiting with multiple requests
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/ai-chat \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Test message '$i'"}' \
    -w "Request $i: %{http_code}\n"
done
```

## 🔧 Configuration

### Environment Variables

```env
# Rate limiting configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEBUG=false

# Tier-based limits (optional overrides)
BASIC_TIER_AI_LIMIT=10
PRO_TIER_AI_LIMIT=50
ENTERPRISE_TIER_AI_LIMIT=200
```

### Custom Rate Limits

```typescript
// Create custom rate limiter
const customLimiter = await createRateLimiter({
  windowMs: 30 * 1000, // 30 seconds
  maxRequests: 5, // 5 requests per 30 seconds
  keyGenerator: (req) => Promise.resolve(`custom:${req.ip}`),
  userBased: false
});
```

## 📈 Monitoring

### 1. Rate Limit Store

```typescript
import { rateLimitStore } from '@/lib/middleware/rate-limit';

// Monitor current rate limit usage
console.log('Current rate limit entries:', rateLimitStore.size);

// Get specific user's rate limit info
const userKey = 'user:123';
const info = getRateLimitInfo(userKey);
console.log('User rate limit info:', info);
```

### 2. Logging

```typescript
// Rate limit events are automatically logged
console.log('Rate limit exceeded:', {
  user: userId,
  endpoint: pathname,
  limit: maxRequests,
  remaining: 0,
  resetTime: resetTime
});
```

### 3. Metrics

```typescript
// Track rate limit metrics
const metrics = {
  totalRequests: 1000,
  rateLimitedRequests: 50,
  rateLimitPercentage: 5.0,
  averageRequestsPerMinute: 25
};
```

## 🚨 Production Considerations

### 1. Redis Integration

For production, replace the in-memory store with Redis:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Update rate limit store to use Redis
const rateLimitStore = {
  async get(key: string) {
    const data = await redis.get(`rate_limit:${key}`);
    return data ? JSON.parse(data) : null;
  },
  async set(key: string, value: any) {
    await redis.setex(`rate_limit:${key}`, Math.ceil(value.resetTime / 1000), JSON.stringify(value));
  }
};
```

### 2. Distributed Rate Limiting

```typescript
// For multi-instance deployments
const rateLimitKey = `rate_limit:${userId}:${endpoint}`;
const current = await redis.get(rateLimitKey);

if (current) {
  const data = JSON.parse(current);
  if (data.count >= maxRequests) {
    return rateLimitExceededResponse;
  }
  await redis.incr(rateLimitKey);
} else {
  await redis.setex(rateLimitKey, windowMs / 1000, JSON.stringify({
    count: 1,
    resetTime: Date.now() + windowMs
  }));
}
```

### 3. Rate Limit Bypass

For admin or special users:

```typescript
// Check for admin bypass
const adminKey = req.headers.get('x-admin-key');
if (adminKey === process.env.ADMIN_BYPASS_KEY) {
  return null; // Skip rate limiting
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Rate limits not working**: Check middleware configuration
2. **User-based limits not applying**: Verify Supabase Auth setup
3. **Headers not showing**: Ensure API routes use `createAPIResponse`
4. **Memory leaks**: Monitor `rateLimitStore` size

### Debug Mode

```typescript
// Enable debug logging
if (process.env.RATE_LIMIT_DEBUG === 'true') {
  console.log('Rate limit check:', {
    key: userKey,
    current: current,
    limit: maxRequests,
    remaining: maxRequests - (current?.count || 0)
  });
}
```

### Performance Optimization

```typescript
// Use efficient key generation
const userKey = req.headers.get('x-user-id') || req.ip;

// Batch Redis operations
const pipeline = redis.pipeline();
pipeline.get(key);
pipeline.incr(key);
pipeline.expire(key, windowMs / 1000);
const results = await pipeline.exec();
```

## 📚 API Reference

### Rate Limiter Functions

```typescript
// Create rate limiter
createRateLimiter(config: RateLimitConfig): Promise<RateLimitFunction>

// Get rate limit info
getRateLimitInfo(key: string): RateLimitResult | null

// Create dynamic rate limiter
createDynamicRateLimiter(endpointType: string): Promise<RateLimitFunction>
```

### Configuration Options

```typescript
interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Maximum requests per window
  keyGenerator?: (req: NextRequest) => Promise<string>;
  userBased?: boolean;        // Whether to use user-based rate limiting
  tierBased?: boolean;        // Whether to apply tier-based limits
}
```

## 🎯 Best Practices

1. **Set appropriate limits** based on your API costs and user needs
2. **Use tier-based limits** to encourage upgrades
3. **Monitor rate limit usage** to optimize limits
4. **Provide clear error messages** with retry information
5. **Use Redis in production** for distributed deployments
6. **Test rate limits thoroughly** before deployment
7. **Document rate limits** in your API documentation

This enhanced rate limiting system provides comprehensive protection against API abuse while maintaining a good user experience for legitimate users. 