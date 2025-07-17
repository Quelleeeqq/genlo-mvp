import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('Processing checkout session completed:', session.id);
    
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const billingCycle = session.metadata?.billingCycle;
    
    if (!userId || !plan) {
      console.error('Missing userId or plan in session metadata');
      return;
    }

    // Update user's subscription status in database
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription,
        plan: plan,
        billing_cycle: billingCycle,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating subscription in database:', error);
    } else {
      console.log('Successfully updated subscription for user:', userId);
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

export async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('Processing subscription created:', subscription.id);
    
    const userId = subscription.metadata?.userId;
    const plan = subscription.metadata?.plan;
    
    if (!userId || !plan) {
      console.error('Missing userId or plan in subscription metadata');
      return;
    }

    // Update subscription details
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription in database:', error);
    } else {
      console.log('Successfully updated subscription for user:', userId);
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

export async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('Processing subscription updated:', subscription.id);
    
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription in database:', error);
    } else {
      console.log('Successfully updated subscription:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

export async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('Processing subscription deleted:', subscription.id);
    
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription in database:', error);
    } else {
      console.log('Successfully cancelled subscription:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

export async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    console.log('Processing invoice payment succeeded:', invoice.id);
    
    // Update subscription period if this is a recurring payment
    if (invoice.subscription) {
      const subscriptionData = await stripe.subscriptions.retrieve(invoice.subscription as string);
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          current_period_end: new Date((subscriptionData as any).current_period_end * 1000),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionData.id);

      if (error) {
        console.error('Error updating subscription period:', error);
      } else {
        console.log('Successfully updated subscription period:', subscriptionData.id);
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

export async function handleInvoicePaymentFailed(invoice: any) {
  try {
    console.log('Processing invoice payment failed:', invoice.id);
    
    // You might want to send an email to the customer here
    // or update their subscription status to 'past_due'
    
    if (invoice.subscription) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription);

      if (error) {
        console.error('Error updating subscription status:', error);
      } else {
        console.log('Successfully updated subscription status to past_due:', invoice.subscription);
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
} 