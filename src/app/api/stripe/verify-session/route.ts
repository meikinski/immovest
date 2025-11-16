// src/app/api/stripe/verify-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

// Extended Stripe Subscription type with missing properties
type StripeSubscriptionExtended = Stripe.Subscription & {
  current_period_end?: number;
  items?: {
    data?: Array<{
      current_period_end?: number;
    }>;
  };
};

// Helper function to get current_period_end from subscription (same as webhook)
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID erforderlich' },
        { status: 400 }
      );
    }

    console.log('[VerifySession] Checking session:', sessionId, 'for user:', userId);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('[VerifySession] Session status:', session.status);
    console.log('[VerifySession] Payment status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          isPremium: false,
          message: 'Zahlung noch nicht abgeschlossen'
        },
        { status: 200 }
      );
    }

    // Payment is complete, get subscription
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    if (!subscriptionId || !customerId) {
      return NextResponse.json(
        { error: 'Keine Subscription-Daten in Session gefunden' },
        { status: 400 }
      );
    }

    console.log('[VerifySession] Subscription:', subscriptionId, 'Customer:', customerId);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as StripeSubscriptionExtended;

    console.log('[VerifySession] Subscription retrieved:', {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      items_period_end: subscription.items?.data?.[0]?.current_period_end,
    });

    const currentPeriodEnd = getCurrentPeriodEnd(subscription);

    if (!currentPeriodEnd) {
      console.error('[VerifySession] No current_period_end found in subscription');
      return NextResponse.json(
        { error: 'Subscription hat kein Ablaufdatum' },
        { status: 500 }
      );
    }

    const premiumUntil = new Date(currentPeriodEnd * 1000);

    if (isNaN(premiumUntil.getTime())) {
      console.error('[VerifySession] Invalid date from current_period_end:', currentPeriodEnd);
      return NextResponse.json(
        { error: 'Ungültiges Ablaufdatum' },
        { status: 500 }
      );
    }

    console.log('[VerifySession] Premium until:', premiumUntil.toISOString());

    // Manually update database (webhook fallback)
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Datenbank nicht konfiguriert' },
        { status: 500 }
      );
    }

    console.log('[VerifySession] Updating database for user:', userId);

    const { error: upsertError } = await supabase
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

    if (upsertError) {
      console.error('[VerifySession] Database error:', upsertError);
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Datenbank' },
        { status: 500 }
      );
    }

    console.log('[VerifySession] ✅ Successfully activated premium for user:', userId);

    return NextResponse.json({
      success: true,
      isPremium: true,
      premiumUntil: premiumUntil.toISOString(),
    });

  } catch (error) {
    console.error('[VerifySession] Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Verifizieren der Session' },
      { status: 500 }
    );
  }
}
