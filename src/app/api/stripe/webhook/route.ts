// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Extended Stripe Subscription type with missing properties
type StripeSubscriptionExtended = Stripe.Subscription & {
  current_period_end?: number;
  items?: {
    data?: Array<{
      current_period_end?: number;
    }>;
  };
};

// Extended Stripe Invoice type with missing properties
type StripeInvoiceExtended = Stripe.Invoice & {
  subscription?: string;
};

// Helper function to get current_period_end from subscription
function getCurrentPeriodEnd(subscription: StripeSubscriptionExtended): number | undefined {
  // Try top-level first (older API versions)
  if (subscription.current_period_end) {
    return subscription.current_period_end;
  }

  // Try subscription items (newer API versions)
  if (subscription.items?.data?.[0]?.current_period_end) {
    return subscription.items.data[0].current_period_end;
  }

  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Optional: Filter test events in production
    // Uncomment this block if you only want to process live events in production
    /*
    if (process.env.NODE_ENV === 'production' && !event.livemode) {
      console.log('⚠️ [WEBHOOK] Ignoring test event in production:', event.type);
      return NextResponse.json({ received: true, message: 'Test event ignored' });
    }
    */

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 [WEBHOOK] checkout.session.completed received');
  console.log('[WEBHOOK] Session ID:', session.id);

  const userId = session.metadata?.userId || session.client_reference_id;
  if (!userId) {
    console.error('❌ [WEBHOOK] No userId found in checkout session');
    console.error('[WEBHOOK] Session metadata:', session.metadata);
    console.error('[WEBHOOK] client_reference_id:', session.client_reference_id);
    return;
  }

  console.log('✅ [WEBHOOK] Found userId:', userId);

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.error('❌ [WEBHOOK] Supabase not configured - check environment variables');
    console.error('[WEBHOOK] NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('[WEBHOOK] SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    return;
  }

  console.log('✅ [WEBHOOK] Supabase client initialized');

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!subscriptionId) {
    console.error('❌ [WEBHOOK] No subscription ID found in checkout session');
    return;
  }

  if (!customerId) {
    console.error('❌ [WEBHOOK] No customer ID found in checkout session');
    return;
  }

  console.log('[WEBHOOK] Retrieving subscription:', subscriptionId);

  // Update Stripe customer metadata to link with Clerk userId
  try {
    await stripe.customers.update(customerId, {
      metadata: {
        userId: userId,
      },
    });
    console.log('✅ [WEBHOOK] Updated Stripe customer metadata with userId');
  } catch (error) {
    console.error('⚠️ [WEBHOOK] Error updating customer metadata:', error);
    // Continue anyway - this is not critical
  }

  // Update Stripe subscription metadata to link with userId
  try {
    await stripe.subscriptions.update(subscriptionId, {
      metadata: {
        userId: userId,
      },
    });
    console.log('✅ [WEBHOOK] Updated Stripe subscription metadata with userId');
  } catch (error) {
    console.error('⚠️ [WEBHOOK] Error updating subscription metadata:', error);
    // Continue anyway - this is not critical
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as StripeSubscriptionExtended;

  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  console.log('[WEBHOOK] Subscription retrieved:', {
    id: subscription.id,
    status: subscription.status,
    current_period_end: subscription.current_period_end,
    current_period_end_from_items: subscription.items?.data?.[0]?.current_period_end,
    current_period_end_resolved: currentPeriodEnd,
  });

  if (!currentPeriodEnd) {
    console.error('❌ [WEBHOOK] Subscription has no current_period_end');
    console.error('[WEBHOOK] Full subscription object:', JSON.stringify(subscription, null, 2));
    return;
  }

  const premiumUntil = new Date(currentPeriodEnd * 1000);

  if (isNaN(premiumUntil.getTime())) {
    console.error('❌ [WEBHOOK] Invalid date created from current_period_end:', currentPeriodEnd);
    return;
  }

  console.log('[WEBHOOK] Premium until:', premiumUntil.toISOString());
  console.log('[WEBHOOK] Updating Supabase for user:', userId);

  // Update or insert user premium status
  const { error } = await supabase
    .from('user_premium_usage')
    .upsert({
      user_id: userId,
      is_premium: true,
      premium_until: premiumUntil.toISOString(),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('❌ [WEBHOOK] Error updating premium status:', error);
    console.error('[WEBHOOK] Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log(`✅ [WEBHOOK] Premium activated for user ${userId} until ${premiumUntil}`);
    console.log('[WEBHOOK] Database updated successfully!');
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  console.log('[WEBHOOK] Handling subscription update:', subscription.id);

  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  if (!currentPeriodEnd) {
    console.error('❌ [WEBHOOK] Subscription has no current_period_end');
    return;
  }

  const premiumUntil = new Date(currentPeriodEnd * 1000);

  if (isNaN(premiumUntil.getTime())) {
    console.error('❌ [WEBHOOK] Invalid date from current_period_end:', currentPeriodEnd);
    return;
  }

  const isActive = subscription.status === 'active';

  // Try to update by subscription_id first
  const { error, data } = await supabase
    .from('user_premium_usage')
    .update({
      is_premium: isActive,
      premium_until: premiumUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
    .select();

  if (error) {
    console.error('❌ [WEBHOOK] Error updating subscription:', error);
  } else if (!data || data.length === 0) {
    console.warn('⚠️ [WEBHOOK] No rows updated - subscription ID not found in database:', subscription.id);

    // Try to find by customer ID and update
    const customerId = subscription.customer as string;
    if (customerId) {
      const { error: updateError } = await supabase
        .from('user_premium_usage')
        .update({
          is_premium: isActive,
          premium_until: premiumUntil.toISOString(),
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (updateError) {
        console.error('❌ [WEBHOOK] Error updating by customer ID:', updateError);
      } else {
        console.log('✅ [WEBHOOK] Subscription updated via customer ID fallback');
      }
    }
  } else {
    console.log('✅ [WEBHOOK] Subscription updated for user');
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  console.log('[WEBHOOK] Deactivating subscription:', subscription.id);

  const { error } = await supabase
    .from('user_premium_usage')
    .update({
      is_premium: false,
      premium_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ [WEBHOOK] Error deleting subscription:', error);
  } else {
    console.log('✅ [WEBHOOK] Subscription deleted for user');
  }
}

async function handleInvoicePaymentSucceeded(invoice: StripeInvoiceExtended) {
  // Extend premium period
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) {
    console.log('[WEBHOOK] Invoice has no subscription, skipping');
    return;
  }

  console.log('[WEBHOOK] Payment succeeded for subscription:', subscriptionId);

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(subscription);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error('Payment failed for invoice:', invoice.id);
  // Could send email notification here
}
