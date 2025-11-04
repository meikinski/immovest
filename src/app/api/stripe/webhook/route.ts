// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  console.log('[WEBHOOK] Retrieving subscription:', subscriptionId);

  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // Access the subscription data from the response
  const subscription = subscriptionResponse as unknown as { current_period_end: number };
  const premiumUntil = new Date(subscription.current_period_end * 1000);

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
  const sub = subscription as unknown as { metadata?: { userId?: string }; current_period_end: number; status: string; id: string };
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  // Type assertion for accessing properties
  const premiumUntil = new Date(sub.current_period_end * 1000);
  const isActive = sub.status === 'active';

  await supabase
    .from('user_premium_usage')
    .update({
      is_premium: isActive,
      premium_until: premiumUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', sub.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const sub = subscription as unknown as { id: string };
  await supabase
    .from('user_premium_usage')
    .update({
      is_premium: false,
      premium_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', sub.id);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Extend premium period
  const inv = invoice as unknown as { subscription?: string };
  const subscriptionId = inv.subscription;
  if (!subscriptionId) return;

  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  const subscription = subscriptionResponse as unknown as Stripe.Subscription;
  await handleSubscriptionUpdated(subscription);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error('Payment failed for invoice:', invoice.id);
  // Could send email notification here
}
