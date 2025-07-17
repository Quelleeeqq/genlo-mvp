import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed
} from '@/lib/stripe/webhook-handlers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'setup_intent.created':
        const setupIntent = event.data.object;
        console.log('Setup intent created:', setupIntent.id);
        // Customer is setting up payment method
        break;

      case 'setup_intent.succeeded':
        const successfulSetup = event.data.object;
        console.log('Setup intent succeeded:', successfulSetup.id);
        // Payment method successfully set up
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object;
        await handleSubscriptionCreated(subscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id);
        // One-time payment successful
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        console.log('Payment intent failed:', failedPaymentIntent.id);
        // One-time payment failed
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 