import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment verification request received');
    
    const { sessionId } = await request.json();
    console.log('Session ID:', sessionId);

    if (!sessionId) {
      console.log('No session ID provided');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    console.log('Retrieving session from Stripe...');
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

    // Get subscription details if available
    let subscriptionDetails = null;
    if (session.subscription && typeof session.subscription === 'string') {
      try {
        console.log('Retrieving subscription details...');
        const fullSubscription = await stripe.subscriptions.retrieve(session.subscription);
        subscriptionDetails = {
          id: fullSubscription.id,
          status: fullSubscription.status,
          current_period_end: new Date((fullSubscription as any).current_period_end * 1000).toISOString()
        };
        console.log('Subscription details retrieved:', subscriptionDetails);
      } catch (subError) {
        console.error('Error retrieving subscription:', subError);
      }
    }

    // Extract metadata
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const billingCycle = session.metadata?.billingCycle;

    console.log('Metadata extracted:', { userId, plan, billingCycle });

    // Try to update database, but don't fail if it doesn't work
    if (userId && subscriptionDetails) {
      try {
        console.log('Attempting to update database...');
        const { error: dbError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionDetails.id,
            stripe_customer_id: session.customer || null,
            plan: plan,
            billing_cycle: billingCycle,
            status: subscriptionDetails.status,
            current_period_end: subscriptionDetails.current_period_end,
            cancel_at_period_end: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Database error:', dbError);
          console.log('Database update failed, but payment verification succeeded');
        } else {
          console.log('Database updated successfully');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        console.log('Database update failed, but payment verification succeeded');
      }
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        subscription: subscriptionDetails
      }
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({
      error: 'Failed to verify payment',
      details: error.message,
      code: error.code,
      type: error.type
    }, { status: 500 });
  }
} 