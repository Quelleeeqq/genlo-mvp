import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get subscription details if it exists
    let subscription = null;
    if (session.subscription) {
      const subscriptionData = await stripe.subscriptions.retrieve(session.subscription as string);
      subscription = subscriptionData;
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        metadata: session.metadata
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        plan: session.metadata?.plan || 'unknown',
        billingCycle: session.metadata?.billingCycle || 'monthly'
      } : null
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
} 