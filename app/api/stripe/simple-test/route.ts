import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating simple test checkout session...');
    
    // Create a very simple checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
              description: 'A simple test product',
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Use payment instead of subscription for testing
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup-with-payment?canceled=true`,
    });

    console.log('Simple test session created:', session.id);
    console.log('Session URL:', session.url);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      configuration: {
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
        publishableKeyConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      }
    });

  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json(
      { 
        error: 'Simple test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 