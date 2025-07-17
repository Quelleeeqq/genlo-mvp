import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('Test verify payment request received');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { sessionId } = body;

    if (!sessionId) {
      console.log('No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('Retrieving session:', sessionId);
    
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      subscription: session.subscription,
      metadata: session.metadata
    });

    if (!session) {
      console.log('Session not found');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed, status:', session.payment_status);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    console.log('Payment verified successfully');
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        subscription: session.subscription,
        metadata: session.metadata
      }
    });

  } catch (error: any) {
    console.error('Test verify payment error:', error);
    return NextResponse.json({
      error: 'Failed to verify payment',
      details: error.message,
      code: error.code,
      type: error.type
    }, { status: 500 });
  }
} 