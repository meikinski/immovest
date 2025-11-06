// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to get current_period_end from subscription
// In newer Stripe API versions, this might be in subscription.items.data[0]
function getCurrentPeriodEnd(subscription: Stripe.Subscription): number | undefined {
  // Try top-level first (older API versions)
  // @ts-expect-error - current_period_end exists in Stripe API but may not be in type definition
  if (subscription.current_period_end) {
    // @ts-expect-error - Stripe type definition incomplete
    return subscription.current_period_end;
  }

  // Try subscription items (newer API versions)
  // @ts-expect-error - Stripe API property not in types
  if (subscription.items?.data?.[0]?.current_period_end) {
    // @ts-expect-error - Property missing from type definition
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

  console.log('[WEBHOOK] Retrieving subscription:', subscriptionId);

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

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
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.log('[WEBHOOK] No userId in subscription metadata, skipping update');
    return;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return;

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

  const { error } = await supabase
    .from('user_premium_usage')
    .update({
      is_premium: isActive,
      premium_until: premiumUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ [WEBHOOK] Error updating subscription:', error);
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

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Extend premium period
  const subscriptionId = invoice.subscription as string | undefined;
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
