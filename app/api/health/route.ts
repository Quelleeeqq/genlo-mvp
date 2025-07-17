import { NextRequest, NextResponse } from 'next/server';
import { createAPIResponse } from '@/lib/utils/api-response-headers';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        api: 'operational',
        database: 'operational', // You can add actual DB checks here
        ai: 'operational' // You can add actual AI service checks here
      }
    };

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Add custom headers
    const customHeaders = {
      'x-quelle-processing-ms': processingTime.toString(),
      'x-quelle-status': 'healthy'
    };

    return createAPIResponse(health, 200, customHeaders);
  } catch (error) {
    const endTime = Date.now();
    console.error(`Health check error (${endTime - startTime}ms):`, error);
    
    return createAPIResponse({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
} 