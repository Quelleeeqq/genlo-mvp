import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('Debug - Request body:', JSON.stringify(body, null, 2));
    console.log('Debug - Body type:', typeof body);
    console.log('Debug - Has prompt:', !!body.prompt);
    console.log('Debug - Has messages:', !!body.messages);
    console.log('Debug - Messages length:', body.messages?.length || 0);
    
    return NextResponse.json({ 
      success: true,
      receivedBody: body,
      hasPrompt: !!body.prompt,
      hasMessages: !!body.messages,
      messagesLength: body.messages?.length || 0
    });
  } catch (error) {
    console.error('Debug - Error parsing body:', error);
    return NextResponse.json({ 
      error: 'Failed to parse request body',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
} 