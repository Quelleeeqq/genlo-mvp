import { NextRequest, NextResponse } from 'next/server';

interface CorsConfig {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function createCorsMiddleware(config: CorsConfig = {}) {
  const {
    origin = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_BASE_URL 
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials = true,
    maxAge = 86400 // 24 hours
  } = config;

  return function cors(req: NextRequest) {
    const requestOrigin = req.headers.get('origin');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      
      // Set CORS headers
      if (origin === true || (Array.isArray(origin) && origin.includes(requestOrigin || ''))) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
      } else if (typeof origin === 'string') {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else {
        response.headers.set('Access-Control-Allow-Origin', '*');
      }
      
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      response.headers.set('Access-Control-Max-Age', maxAge.toString());
      
      if (credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      return response;
    }
    
    // Handle actual requests
    const response = NextResponse.next();
    
    // Set CORS headers for actual requests
    if (origin === true || (Array.isArray(origin) && origin.includes(requestOrigin || ''))) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
    } else if (typeof origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  };
}

// Predefined CORS configurations
export const corsConfigs = {
  // Strict CORS for production
  production: createCorsMiddleware({
    origin: process.env.NEXT_PUBLIC_BASE_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }),
  
  // Relaxed CORS for development
  development: createCorsMiddleware({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }),
  
  // Public API CORS (no credentials)
  publicApi: createCorsMiddleware({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false
  }),
  
  // Admin API CORS (restricted)
  adminApi: createCorsMiddleware({
    origin: process.env.ADMIN_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
    credentials: true
  })
};

// Helper function to get appropriate CORS config based on environment
export function getCorsConfig() {
  if (process.env.NODE_ENV === 'production') {
    return corsConfigs.production;
  }
  return corsConfigs.development;
} 