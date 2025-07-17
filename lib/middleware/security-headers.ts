import { NextRequest, NextResponse } from 'next/server';

interface SecurityHeadersConfig {
  enableHSTS?: boolean;
  enableCSP?: boolean;
  enableXFrameOptions?: boolean;
  enableXContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
  enablePermissionsPolicy?: boolean;
  enableXDNSPrefetchControl?: boolean;
}

export function createSecurityHeadersMiddleware(config: SecurityHeadersConfig = {}) {
  const {
    enableHSTS = process.env.NODE_ENV === 'production',
    enableCSP = true,
    enableXFrameOptions = true,
    enableXContentTypeOptions = true,
    enableReferrerPolicy = true,
    enablePermissionsPolicy = true,
    enableXDNSPrefetchControl = true
  } = config;

  return function securityHeaders(req: NextRequest) {
    const response = NextResponse.next();
    
    // HTTP Strict Transport Security (HSTS)
    if (enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
        // Content Security Policy (CSP) - Completely disabled for Stripe testing
    // if (enableCSP) {
    //   console.log('CSP temporarily disabled for all pages to test Stripe compatibility');
    //   // Don't set CSP header for any pages during testing
    // }
    
    // X-Frame-Options (prevent clickjacking)
    if (enableXFrameOptions) {
      response.headers.set('X-Frame-Options', 'DENY');
    }
    
    // X-Content-Type-Options (prevent MIME type sniffing)
    if (enableXContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }
    
    // Referrer Policy
    if (enableReferrerPolicy) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    
    // Permissions Policy (formerly Feature Policy)
    if (enablePermissionsPolicy) {
      const permissionsPolicy = [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
        'ambient-light-sensor=()',
        'autoplay=()',
        'encrypted-media=()',
        'picture-in-picture=()',
        'publickey-credentials-get=()',
        'screen-wake-lock=()',
        'sync-xhr=()',
        'web-share=()',
        'xr-spatial-tracking=()'
      ];
      
      response.headers.set('Permissions-Policy', permissionsPolicy.join(', '));
    }
    
    // X-DNS-Prefetch-Control
    if (enableXDNSPrefetchControl) {
      response.headers.set('X-DNS-Prefetch-Control', 'off');
    }
    
    // Additional security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    return response;
  };
}

// Predefined security header configurations
export const securityHeaderConfigs = {
  // Strict security for production
  production: createSecurityHeadersMiddleware({
    enableHSTS: true,
    enableCSP: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
    enableXDNSPrefetchControl: true
  }),
  
  // Relaxed security for development
  development: createSecurityHeadersMiddleware({
    enableHSTS: false, // Disable HSTS in development
    enableCSP: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: false, // Disable in development for easier debugging
    enableXDNSPrefetchControl: true
  }),
  
  // Minimal security for public APIs
  publicApi: createSecurityHeadersMiddleware({
    enableHSTS: false,
    enableCSP: false, // Disable CSP for API endpoints
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: false,
    enableXDNSPrefetchControl: true
  })
};

// Helper function to get appropriate security config based on environment
export function getSecurityHeadersConfig() {
  if (process.env.NODE_ENV === 'production') {
    return securityHeaderConfigs.production;
  }
  return securityHeaderConfigs.development;
}

// Custom CSP builder for different contexts
export function buildCSP(directives: Record<string, string[]> = {}) {
  const defaultDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'"],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'self'"]
  };
  
  const mergedDirectives = { ...defaultDirectives, ...directives };
  
  return Object.entries(mergedDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

// CSP configurations for different contexts
export const cspConfigs = {
  // Default CSP
  default: buildCSP(),
  
  // CSP for AI endpoints (allow external AI APIs)
  aiEndpoints: buildCSP({
    'connect-src': [
      "'self'",
      'https://api.openai.com',
      'https://api.anthropic.com',
      'https://api.replicate.com',
      'https://generativelanguage.googleapis.com',
      'https://*.supabase.co'
    ]
  }),
  
  // CSP for payment pages (allow Stripe)
  payment: buildCSP({
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com'
    ]
  }),
  
  // CSP for admin pages (more restrictive)
  admin: buildCSP({
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'connect-src': ["'self'", 'https://*.supabase.co']
  })
}; 