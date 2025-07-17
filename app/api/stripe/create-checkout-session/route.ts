import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

const PLANS = {
  basic: {
    monthly: 'price_1OqK8tC1Qz0nB1itlBTrA4oG', // Replace with your actual price ID
    yearly: 'price_1OqK8tC1Qz0nB1itlBTrA4oG', // Replace with your actual price ID
    name: 'Basic Plan',
    price: { monthly: 49, yearly: 488 }
  },
  pro: {
    monthly: 'price_1OqK8tC1Qz0nB1itlBTrA4oG', // Replace with your actual price ID
    yearly: 'price_1OqK8tC1Qz0nB1itlBTrA4oG', // Replace with your actual price ID
    name: 'Pro Plan',
    price: { monthly: 129, yearly: 1285 }
  },
  enterprise: {
    monthly: 'price_1OqK8tC1Qz0nB1itlBTrA4oG', // Replace with your actual price ID
    yearly: 'price_1OqK8tC1Qz0nB1itlBTrA4oG', // Replace with your actual price ID
    name: 'Enterprise Plan',
    price: { monthly: 249, yearly: 2480 }
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe checkout session request received');
    
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }
    
    const { plan, billingCycle, email, userId } = await request.json();
    console.log('Request data:', { plan, billingCycle, email, userId });

    if (!plan || !billingCycle || !email) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    if (!selectedPlan) {
      console.error('Invalid plan selected:', plan);
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }
    
    console.log('Selected plan:', selectedPlan);

    // Create or get the product
    console.log('Creating/getting product...');
    let product;
    const products = await stripe.products.list({ limit: 100 });
    product = products.data.find(p => p.name === selectedPlan.name);
    
    if (!product) {
      console.log('Creating new product:', selectedPlan.name);
      product = await stripe.products.create({
        name: selectedPlan.name,
        description: `${selectedPlan.name} - ${billingCycle} billing`,
      });
    } else {
      console.log('Found existing product:', product.id);
    }

    // Create or get the price
    console.log('Creating/getting price...');
    const prices = await stripe.prices.list({ 
      product: product.id,
      limit: 100 
    });
    
    const interval = billingCycle === 'monthly' ? 'month' : 'year';
    const priceAmount = selectedPlan.price[billingCycle as 'monthly' | 'yearly'];
    console.log('Looking for price with interval:', interval, 'amount:', priceAmount);
    
    let price = prices.data.find(p => 
      p.recurring?.interval === interval && 
      p.unit_amount === priceAmount * 100
    );

    if (!price) {
      console.log('Creating new price for product:', product.id);
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceAmount * 100,
        currency: 'usd',
        recurring: {
          interval: interval as 'month' | 'year',
        },
      });
      console.log('Created price:', price.id);
    } else {
      console.log('Found existing price:', price.id);
    }

    // Create Stripe checkout session
    console.log('Creating checkout session...');
    console.log('Using price ID:', price.id);
    console.log('Success URL:', `${process.env.NEXT_PUBLIC_BASE_URL}/auth/success?session_id={CHECKOUT_SESSION_ID}`);
    console.log('Cancel URL:', `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup-with-payment?canceled=true`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
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
      subscription_data: {
        metadata: {
          userId: userId || '',
          plan: plan,
          billingCycle: billingCycle
        }
      },
      // Add these options to help with CSP issues
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    });

    console.log('Checkout session created successfully:', session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 