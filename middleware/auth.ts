import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
  metadata?: any;
}

export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Valid token required');
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    // Return user information
    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user',
      metadata: user.user_metadata
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Optional auth - doesn't throw if no token provided
export async function optionalAuth(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user',
      metadata: user.user_metadata
    };
  } catch (error) {
    return null;
  }
}

// Role-based authorization
export function requireRole(allowedRoles: string[]) {
  return async (req: NextRequest): Promise<AuthenticatedUser> => {
    const user = await requireAuth(req);
    
    if (!allowedRoles.includes(user.role || 'user')) {
      throw new Error('Insufficient permissions');
    }
    
    return user;
  };
}

// Rate limiting with user context
export function getUserRateLimit(userId: string, maxRequests: number = 100, windowMs: number = 900000): boolean {
  const now = Date.now();
  const key = `user:${userId}`;
  
  // This is a simple in-memory rate limiter
  // In production, use Redis or similar
  const requests = (global as any).userRequests || new Map();
  const record = requests.get(key);
  
  if (!record || now > record.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs });
    (global as any).userRequests = requests;
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Create auth error response
export function createAuthErrorResponse(message: string, status: number = 401) {
  return NextResponse.json(
    { 
      error: message,
      code: 'AUTH_ERROR',
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Create rate limit error response
export function createRateLimitErrorResponse() {
  return NextResponse.json(
    { 
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_ERROR',
      timestamp: new Date().toISOString()
    },
    { status: 429 }
  );
} 