import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('Direct checkout request received');
    
    const { plan, billingCycle, email, userId } = await request.json();
    console.log('Request data:', { plan, billingCycle, email, userId });

    if (!plan || !billingCycle || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a simple checkout session with minimal configuration
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `${billingCycle} subscription`,
            },
            unit_amount: plan === 'basic' ? 4900 : plan === 'pro' ? 12900 : 24900, // $49, $129, $249
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup-with-payment?canceled=true`,
      customer_email: email,
      metadata: {
        userId: userId || '',
        plan: plan,
        billingCycle: billingCycle
      },
      // Use hosted checkout to avoid CSP issues
      ui_mode: 'hosted',
    });

    console.log('Direct checkout session created:', session.id);
    
    // Return the checkout URL directly
    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Direct checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 