import { NextRequest, NextResponse } from 'next/server';

// Environment variable validation
export function validateEnvironmentVariables() {
  const required = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Input validation for chat requests
export function validateChatInput(input: any) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input format');
  }
  
  if (!input.messages || !Array.isArray(input.messages)) {
    throw new Error('Messages array is required');
  }
  
  // Check for prompt injection attempts
  const suspiciousPatterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /roleplay as/i,
    /act as a different ai/i,
    /bypass safety/i,
    /ignore safety/i
  ];
  
  const content = JSON.stringify(input);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      throw new Error('Suspicious content detected');
    }
  }
  
  // Validate message structure
  for (const message of input.messages) {
    if (!message.role || !message.content) {
      throw new Error('Invalid message structure');
    }
    
    if (typeof message.content !== 'string') {
      throw new Error('Message content must be a string');
    }
    
    if (message.content.length > 10000) {
      throw new Error('Message content too long');
    }
  }
  
  return true;
}

// Security headers
export function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.supabase.com",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

// Rate limiting helper
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  
  static checkLimit(identifier: string, maxRequests: number = 100, windowMs: number = 900000): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  static getRemaining(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record) return 100;
    return Math.max(0, 100 - record.count);
  }
}

// Cost monitoring
export class CostMonitor {
  private static costs = new Map<string, number>();
  private static dailyCosts = new Map<string, number>();
  
  static trackCost(provider: string, tokens: number, model: string) {
    const cost = this.calculateCost(provider, tokens, model);
    const today = new Date().toDateString();
    
    // Track daily costs
    const dailyKey = `${provider}-${today}`;
    const currentDaily = this.dailyCosts.get(dailyKey) || 0;
    this.dailyCosts.set(dailyKey, currentDaily + cost);
    
    // Check daily limit
    const maxDailyCost = parseFloat(process.env.MAX_COST_PER_DAY || '50');
    if (currentDaily + cost > maxDailyCost) {
      throw new Error(`Daily cost limit exceeded: $${maxDailyCost}`);
    }
    
    // Track total costs
    const current = this.costs.get(provider) || 0;
    this.costs.set(provider, current + cost);
    
    return cost;
  }
  
  private static calculateCost(provider: string, tokens: number, model: string): number {
    // Rough cost estimates (you should update these with actual rates)
    const rates: Record<string, Record<string, number>> = {
      openai: {
        'o4-mini-2025-04-16': 0.00015, // $0.15 per 1K tokens
        'gpt-4o': 0.005,
        'gpt-4o-mini': 0.00015,
        'gpt-3.5-turbo': 0.0005
      },
      anthropic: {
        'claude-3-5-sonnet-20241022': 0.003,
        'claude-3-haiku-20240307': 0.00025
      }
    };
    
    const rate = rates[provider]?.[model] || 0.001;
    return (tokens / 1000) * rate;
  }
  
  static getDailyCost(provider: string): number {
    const today = new Date().toDateString();
    const key = `${provider}-${today}`;
    return this.dailyCosts.get(key) || 0;
  }
  
  static getTotalCost(provider: string): number {
    return this.costs.get(provider) || 0;
  }
}

// Request logging
export function logSecurityEvent(event: string, details: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details
  };
  
  // In production, send to a logging service
  if (process.env.NODE_ENV === 'production') {
    console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
  } else {
    console.log(`[SECURITY] ${event}:`, details);
  }
}

// IP address extraction
export function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// User agent validation
export function validateUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  
  // Block suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

// Request size validation
export function validateRequestSize(body: any, maxSize: number = 1024 * 1024): boolean {
  const size = JSON.stringify(body).length;
  return size <= maxSize;
} 