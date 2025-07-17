import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; userId?: string }>();

// Supabase client for user authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => Promise<string>; // Custom key generator
  userBased?: boolean; // Whether to use user-based rate limiting
  tierBased?: boolean; // Whether to apply different limits based on user tier
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  userId?: string;
}

export async function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
    try {
      const key = config.keyGenerator 
        ? await config.keyGenerator(req) 
        : req.ip || 'anonymous';
      
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Get current rate limit data
      const current = rateLimitStore.get(key);
      
      if (!current || current.resetTime < now) {
        // First request or window expired
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
          userId: current?.userId
        });
        return null; // Allow request
      }
      
      if (current.count >= config.maxRequests) {
        // Rate limit exceeded
        return NextResponse.json(
          { 
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((current.resetTime - now) / 1000),
            limit: config.maxRequests,
            remaining: 0,
            resetTime: current.resetTime
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': current.resetTime.toString(),
              'X-RateLimit-Reset-Time': new Date(current.resetTime).toISOString()
            }
          }
        );
      }
      
      // Increment count
      current.count++;
      rateLimitStore.set(key, current);
      
      return null; // Allow request
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request but log the issue
      return null;
    }
  };
}

// Enhanced key generator with user authentication
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
    
    if (sessionToken) {
      const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
      
      if (user && !error) {
        return `user:${user.id}`;
      }
    }
    
    // Fallback to IP-based rate limiting
    return `ip:${req.ip || 'unknown'}`;
  } catch (error) {
    console.error('Error generating user key:', error);
    return `ip:${req.ip || 'unknown'}`;
  }
}

// Get user tier for tier-based rate limiting
async function getUserTier(req: NextRequest): Promise<'basic' | 'pro' | 'enterprise'> {
  try {
    const authHeader = req.headers.get('authorization');
    const sessionToken = req.cookies.get('sb-access-token')?.value;
    
    let user = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) user = data.user;
    } else if (sessionToken) {
      const { data, error } = await supabase.auth.getUser(sessionToken);
      if (!error) user = data.user;
    }
    
    if (user) {
      // Query user's subscription tier from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
      
      return profile?.subscription_tier || 'basic';
    }
    
    return 'basic';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'basic';
  }
}

// Tier-based rate limit configuration
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

// Predefined rate limiters - create them synchronously for now
export const rateLimiters = {
  // AI endpoints with user-based rate limiting
  aiEndpoints: async (req: NextRequest) => {
    const limiter = await createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // Default: 10 requests per minute
      keyGenerator: generateUserKey,
      userBased: true,
      tierBased: true
    });
    return limiter(req);
  },
  
  // General API endpoints
  generalApi: async (req: NextRequest) => {
    const limiter = await createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // Default: 30 requests per minute
      keyGenerator: generateUserKey,
      userBased: true,
      tierBased: true
    });
    return limiter(req);
  },
  
  // Authentication endpoints (strict)
  authEndpoints: async (req: NextRequest) => {
    const limiter = await createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      keyGenerator: (req) => Promise.resolve(`ip:${req.ip || 'unknown'}`), // IP-based for auth
      userBased: false
    });
    return limiter(req);
  },
  
  // File upload rate limiting
  fileUpload: async (req: NextRequest) => {
    const limiter = await createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // Default: 5 uploads per minute
      keyGenerator: generateUserKey,
      userBased: true,
      tierBased: true
    });
    return limiter(req);
  },
  
  // OpenAI endpoints (separate from general AI)
  openaiEndpoints: async (req: NextRequest) => {
    const limiter = await createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests per minute
      keyGenerator: generateUserKey,
      userBased: true,
      tierBased: true
    });
    return limiter(req);
  },
  
  // Evaluation endpoints (for model testing)
  evaluationEndpoints: async (req: NextRequest) => {
    const limiter = await createRateLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3, // 3 evaluation runs per 5 minutes
      keyGenerator: generateUserKey,
      userBased: true,
      tierBased: false
    });
    return limiter(req);
  }
};

// Dynamic rate limiter that adjusts based on user tier
export async function createDynamicRateLimiter(endpointType: 'aiEndpoints' | 'generalApi' | 'fileUpload') {
  return async function dynamicRateLimit(req: NextRequest): Promise<NextResponse | null> {
    try {
      const userTier = await getUserTier(req);
      const limits = tierLimits[userTier][endpointType];
      
      const key = await generateUserKey(req);
      const now = Date.now();
      
      const current = rateLimitStore.get(key);
      
      if (!current || current.resetTime < now) {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + limits.windowMs,
          userId: current?.userId
        });
        return null;
      }
      
      if (current.count >= limits.maxRequests) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded for your tier. Please upgrade or try again later.',
            retryAfter: Math.ceil((current.resetTime - now) / 1000),
            limit: limits.maxRequests,
            remaining: 0,
            resetTime: current.resetTime,
            tier: userTier
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': limits.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': current.resetTime.toString(),
              'X-RateLimit-Tier': userTier
            }
          }
        );
      }
      
      current.count++;
      rateLimitStore.set(key, current);
      
      return null;
    } catch (error) {
      console.error('Dynamic rate limiting error:', error);
      return null;
    }
  };
}

// Rate limit info helper
export function getRateLimitInfo(key: string): RateLimitResult | null {
  const current = rateLimitStore.get(key);
  if (!current) return null;
  
  return {
    allowed: current.count < 100, // Default limit
    remaining: Math.max(0, 100 - current.count),
    resetTime: current.resetTime,
    limit: 100,
    userId: current.userId
  };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, value] of entries) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

// Export rate limit store for monitoring
export { rateLimitStore }; 