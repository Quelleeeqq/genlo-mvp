# 🔒 Advanced Security Guide - Production-Ready Security

This guide covers all additional security measures needed to make your Quelle AI application production-ready.

## 🛡️ Security Measures Implemented

### ✅ **1. Rate Limiting & DDoS Protection**

**What it does:**
- Prevents API abuse and DDoS attacks
- Limits requests per time window
- Different limits for different endpoint types

**Configuration:**
```typescript
// AI endpoints: 10 requests per minute
// Auth endpoints: 5 attempts per 15 minutes  
// General API: 30 requests per minute
// File uploads: 5 uploads per minute
```

**Files:**
- `lib/middleware/rate-limit.ts` - Rate limiting logic
- `middleware.ts` - Integration with Next.js middleware

### ✅ **2. Input Validation & Sanitization**

**What it does:**
- Validates all user inputs using Zod schemas
- Sanitizes HTML and text content
- Prevents XSS and injection attacks
- Content filtering for inappropriate prompts

**Features:**
- Email and password validation
- AI prompt content filtering
- File upload validation
- API request schema validation

**Files:**
- `lib/utils/validation.ts` - Validation schemas and helpers
- Updated API routes with validation

### ✅ **3. CORS Configuration**

**What it does:**
- Controls cross-origin requests
- Prevents unauthorized domain access
- Handles preflight requests properly

**Configurations:**
- **Production**: Strict origin control
- **Development**: Relaxed for local development
- **Public API**: Open access (no credentials)
- **Admin API**: Restricted access

**Files:**
- `lib/middleware/cors.ts` - CORS middleware
- `middleware.ts` - Integration

### ✅ **4. Security Headers**

**What it does:**
- Prevents common web vulnerabilities
- Implements Content Security Policy (CSP)
- Protects against clickjacking, XSS, etc.

**Headers Implemented:**
- `Strict-Transport-Security` - Force HTTPS
- `Content-Security-Policy` - Prevent XSS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing
- `Referrer-Policy` - Control referrer information
- `Permissions-Policy` - Control browser features

**Files:**
- `lib/middleware/security-headers.ts` - Security headers
- `middleware.ts` - Integration

### ✅ **5. Next.js Middleware Integration**

**What it does:**
- Centralized security enforcement
- Route-based protection
- Authentication checks
- Bot detection and blocking

**Features:**
- Protected route authentication
- Admin route access control
- Suspicious request detection
- Legitimate bot allowance

**Files:**
- `middleware.ts` - Main middleware file

## 🔧 Implementation Details

### Rate Limiting

```typescript
// Example usage in API route
import { rateLimiters } from '@/lib/middleware/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limiting is handled automatically by middleware
  // No additional code needed in individual routes
}
```

### Input Validation

```typescript
// Example usage in API route
import { apiSchemas, validationHelpers } from '@/lib/utils/validation';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Validate request
  const validationResult = apiSchemas.aiChatRequest.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ 
      error: 'Invalid request data',
      details: validationHelpers.formatValidationError(validationResult.error)
    }, { status: 400 });
  }
  
  // Sanitize inputs
  const sanitizedPrompt = validationHelpers.sanitizeText(validationResult.data.prompt);
}
```

### Security Headers

```typescript
// Headers are applied automatically by middleware
// Custom CSP for different contexts
import { cspConfigs } from '@/lib/middleware/security-headers';

// For AI endpoints
const aiCSP = cspConfigs.aiEndpoints;

// For payment pages
const paymentCSP = cspConfigs.payment;
```

## 🚀 Production Deployment Checklist

### Environment Variables

```bash
# Required for production
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Security-specific variables
ADMIN_DOMAIN=https://admin.your-domain.com
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true
CORS_ENABLED=true
```

### Vercel Configuration

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Monitoring & Logging

```typescript
// Add to your API routes for security monitoring
export async function POST(req: NextRequest) {
  // Log security events
  console.log('Security Event:', {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers.get('user-agent'),
    endpoint: req.nextUrl.pathname,
    method: req.method
  });
}
```

## 🔍 Security Testing

### 1. Rate Limiting Test

```bash
# Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/ai-chat \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test"}'
done
```

### 2. Input Validation Test

```bash
# Test XSS prevention
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"<script>alert(\"xss\")</script>"}'
```

### 3. Security Headers Test

```bash
# Check security headers
curl -I http://localhost:3000/api/ai-chat
```

### 4. CORS Test

```bash
# Test CORS from different origin
curl -X POST http://localhost:3000/api/ai-chat \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

## 🚨 Security Monitoring

### 1. Set Up Logging

```typescript
// Create security logging service
export class SecurityLogger {
  static logSecurityEvent(event: SecurityEvent) {
    console.log('SECURITY EVENT:', {
      timestamp: new Date().toISOString(),
      type: event.type,
      ip: event.ip,
      userAgent: event.userAgent,
      endpoint: event.endpoint,
      details: event.details
    });
  }
}
```

### 2. Monitor Rate Limiting

```typescript
// Track rate limit violations
if (rateLimitExceeded) {
  SecurityLogger.logSecurityEvent({
    type: 'RATE_LIMIT_EXCEEDED',
    ip: req.ip,
    userAgent: req.headers.get('user-agent'),
    endpoint: req.nextUrl.pathname,
    details: { limit: config.maxRequests, window: config.windowMs }
  });
}
```

### 3. Monitor Suspicious Activity

```typescript
// Track suspicious requests
if (isSuspiciousRequest) {
  SecurityLogger.logSecurityEvent({
    type: 'SUSPICIOUS_REQUEST',
    ip: req.ip,
    userAgent: req.headers.get('user-agent'),
    endpoint: req.nextUrl.pathname,
    details: { reason: 'suspicious_headers' }
  });
}
```

## 🔄 Security Maintenance

### 1. Regular Updates

- Update dependencies monthly
- Monitor security advisories
- Keep Node.js and Next.js updated
- Review and update rate limits

### 2. Security Audits

- Run `npm audit` weekly
- Use security scanning tools
- Review access logs regularly
- Test security measures monthly

### 3. Incident Response

```typescript
// Security incident response plan
export class SecurityIncident {
  static async handleIncident(incident: SecurityIncident) {
    // 1. Log the incident
    SecurityLogger.logSecurityEvent(incident);
    
    // 2. Block suspicious IPs
    await this.blockIP(incident.ip);
    
    // 3. Alert administrators
    await this.sendAlert(incident);
    
    // 4. Review and adjust security measures
    await this.reviewSecurityMeasures(incident);
  }
}
```

## 📊 Security Metrics

### Key Metrics to Monitor

1. **Rate Limit Violations**
   - Track frequency and patterns
   - Identify potential attacks

2. **Failed Authentication Attempts**
   - Monitor brute force attempts
   - Track suspicious login patterns

3. **Input Validation Failures**
   - Monitor XSS attempts
   - Track injection attempts

4. **Suspicious Requests**
   - Monitor bot activity
   - Track unusual user agents

### Dashboard Example

```typescript
// Security metrics dashboard
export class SecurityMetrics {
  static async getMetrics() {
    return {
      rateLimitViolations: await this.getRateLimitViolations(),
      failedAuthAttempts: await this.getFailedAuthAttempts(),
      suspiciousRequests: await this.getSuspiciousRequests(),
      inputValidationFailures: await this.getInputValidationFailures()
    };
  }
}
```

## 🆘 Emergency Procedures

### 1. Security Breach Response

1. **Immediate Actions**
   - Block affected IPs
   - Rotate API keys
   - Review access logs
   - Notify users if necessary

2. **Investigation**
   - Analyze security logs
   - Identify attack vectors
   - Assess damage scope
   - Document incident

3. **Recovery**
   - Implement additional security measures
   - Update security policies
   - Monitor for similar attacks
   - Review and improve security

### 2. Contact Information

- **Security Team**: security@your-domain.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX
- **Security Documentation**: [Internal Wiki Link]

## 📚 Additional Resources

### Security Tools

- **OWASP ZAP**: Web application security scanner
- **Snyk**: Dependency vulnerability scanning
- **Helmet.js**: Security middleware for Express
- **Rate Limiter**: Redis-based rate limiting

### Security Standards

- **OWASP Top 10**: Web application security risks
- **CIS Controls**: Cybersecurity best practices
- **NIST Framework**: Cybersecurity framework
- **GDPR**: Data protection regulations

### Security Testing

- **Penetration Testing**: Regular security assessments
- **Vulnerability Scanning**: Automated security scans
- **Code Review**: Security-focused code reviews
- **Security Training**: Team security awareness

---

**Remember: Security is an ongoing process. Regularly review, update, and test your security measures!** 