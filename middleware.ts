import { NextRequest, NextResponse } from 'next/server';
import { getCorsConfig } from '@/lib/middleware/cors';
import { getSecurityHeadersConfig } from '@/lib/middleware/security-headers';
import { rateLimiters, createDynamicRateLimiter } from '@/lib/middleware/rate-limit';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/ai-chat',
  '/api/image-gen',
  '/api/veo3',
  '/api/subscription',
  '/api/image-analysis'
];

// Define admin routes that require admin privileges
const adminRoutes = [
  '/admin',
  '/api/admin'
];

// Define public API routes (no authentication required)
const publicApiRoutes = [
  '/api/health',
  '/api/test',
  '/api/stripe'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply CORS
  const corsMiddleware = getCorsConfig();
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;
  
  // Apply security headers - temporarily disabled for Stripe testing
  // const securityHeadersMiddleware = getSecurityHeadersConfig();
  // let response = securityHeadersMiddleware(request);
  let response = NextResponse.next();
  
  // Rate limiting for different route types
  try {
    if (pathname.startsWith('/api/ai-chat') || pathname.startsWith('/api/ai-chat-enhanced')) {
      const rateLimitResponse = await rateLimiters.aiEndpoints(request);
      if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/openai/')) {
      const rateLimitResponse = await rateLimiters.openaiEndpoints(request);
      if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/evaluation/')) {
      const rateLimitResponse = await rateLimiters.evaluationEndpoints(request);
      if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/image-gen') || pathname.startsWith('/api/veo3')) {
      const rateLimitResponse = await rateLimiters.aiEndpoints(request);
      if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/auth')) {
      const rateLimitResponse = await rateLimiters.authEndpoints(request);
      if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/')) {
      const rateLimitResponse = await rateLimiters.generalApi(request);
      if (rateLimitResponse) return rateLimitResponse;
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Continue with request if rate limiting fails
  }
  
  // Authentication checks for protected routes
  if (isProtectedRoute(pathname) && !isPublicApiRoute(pathname)) {
    const authResponse = await checkAuthentication(request);
    if (authResponse) return authResponse;
  }
  
  // Admin route checks
  if (isAdminRoute(pathname)) {
    const adminResponse = await checkAdminAccess(request);
    if (adminResponse) return adminResponse;
  }
  
  // Additional security checks
  const securityResponse = performSecurityChecks(request);
  if (securityResponse) return securityResponse;
  
  return response;
}

// Helper functions
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route));
}

function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some(route => pathname.startsWith(route));
}

async function checkAuthentication(request: NextRequest): Promise<NextResponse | null> {
  // For API routes, check for valid session or API key
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.cookies.get('sb-access-token')?.value;
    
    // If no authentication provided, return 401
    if (!authHeader && !sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Additional authentication validation can be added here
    // For now, we'll assume the presence of auth headers/tokens is sufficient
    // In production, you should validate the actual tokens
  }
  
  return null;
}

async function checkAdminAccess(request: NextRequest): Promise<NextResponse | null> {
  // Check for admin privileges
  const adminKey = request.headers.get('x-admin-key');
  const isAdmin = request.cookies.get('admin-session')?.value;
  
  if (!adminKey && !isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }
  
  return null;
}

function performSecurityChecks(request: NextRequest): NextResponse | null {
  // Block suspicious requests
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ];
  
  // Allow legitimate bots but block suspicious ones
  const isSuspiciousBot = suspiciousPatterns.some(pattern => 
    pattern.test(userAgent) && !isLegitimateBot(userAgent)
  );
  
  if (isSuspiciousBot) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  
  // Block requests with suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip'
  ];
  
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => 
    request.headers.get(header) && !isValidIP(request.headers.get(header)!)
  );
  
  if (hasSuspiciousHeaders) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
  
  return null;
}

function isLegitimateBot(userAgent: string): boolean {
  const legitimateBots = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot'
  ];
  
  return legitimateBots.some(bot => userAgent.toLowerCase().includes(bot));
}

function isValidIP(ip: string): boolean {
  // Basic IP validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 