import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    console.log('Verifying Stripe configuration...');
    
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

    // Test Stripe API connection
    console.log('Testing Stripe API connection...');
    const account = await stripe.accounts.retrieve();
    
    console.log('Stripe account details:', {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      country: account.country,
      default_currency: account.default_currency
    });

    // Test creating a simple product
    console.log('Testing product creation...');
    const testProduct = await stripe.products.create({
      name: 'Test Product',
      description: 'Test product for verification',
    });

    console.log('Test product created:', testProduct.id);

    // Clean up test product
    await stripe.products.del(testProduct.id);
    console.log('Test product cleaned up');

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        country: account.country,
        default_currency: account.default_currency
      },
      message: 'Stripe configuration is working correctly'
    });

  } catch (error: any) {
    console.error('Stripe verification error:', error);
    
    return NextResponse.json({
      error: 'Stripe verification failed',
      details: error.message,
      code: error.code,
      type: error.type
    }, { status: 500 });
  }
} 