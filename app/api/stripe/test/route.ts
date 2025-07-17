import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Stripe configuration...');
    
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return NextResponse.json(
        { error: 'Stripe publishable key not configured' },
        { status: 500 }
      );
    }

    // Test Stripe account connection
    const account = await stripe.accounts.retrieve();
    
    // Test creating a simple checkout session
    const testSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup-with-payment?canceled=true`,
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        country: account.country,
        default_currency: account.default_currency,
      },
      testSession: {
        id: testSession.id,
        url: testSession.url,
      },
      configuration: {
        secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
        publishableKeyConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      }
    });

  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json(
      { 
        error: 'Stripe test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 