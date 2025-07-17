import { NextResponse } from 'next/server';

export async function GET() {
  // In a real implementation, this would return the actual generated video
  // For now, we'll return a simple response indicating this is a mock
  
  const mockVideoData = {
    message: 'Mock Veo 3 video endpoint',
    note: 'In production, this would return the actual generated video file',
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(mockVideoData);
} 