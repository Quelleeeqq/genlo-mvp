import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ 
    message: 'Headers test',
    headers: Object.fromEntries(request.headers.entries())
  });
  
  // Log all headers being set
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  return response;
} 