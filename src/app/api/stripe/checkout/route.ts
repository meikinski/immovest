// src/app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

/**
 * Parse the GA4 client_id from the _ga cookie.
 * Format: GA1.1.<client_id> → we extract the numeric part after the second dot.
 * Used to stitch server-side Measurement Protocol events with browser sessions in GA4.
 */
function parseGaClientId(cookieHeader: string | null): string {
  if (!cookieHeader) return '';
  const gaCookie = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('_ga='));
  if (!gaCookie) return '';
  // _ga cookie value: GA1.1.XXXXXXXXXX.XXXXXXXXXX → client_id is last two segments
  const value = gaCookie.split('=')[1] || '';
  const parts = value.split('.');
  if (parts.length >= 4) {
    // client_id format expected by GA4 Measurement Protocol: "XXXXXXXXXX.XXXXXXXXXX"
    return `${parts[2]}.${parts[3]}`;
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Get user's email from Clerk
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Keine E-Mail-Adresse gefunden' },
        { status: 400 }
      );
    }

    const { priceId } = await req.json();

    // Use the price ID from env if not provided
    const finalPriceId = priceId || process.env.STRIPE_PRICE_ID;

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Keine Preis-ID konfiguriert' },
        { status: 400 }
      );
    }

    // Determine plan type for analytics
    const planType = finalPriceId === process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID ? 'yearly' : 'monthly';

    // Extract GA4 client_id from _ga cookie so the server-side Measurement Protocol
    // event in the webhook uses the same client_id as the browser → prevents double-counting.
    const gaClientId = parseGaClientId(req.headers.get('cookie'));

    // Check if user already has a Stripe customer ID
    const supabase = getSupabaseServerClient();
    let stripeCustomerId: string | undefined;

    if (supabase) {
      const { data } = await supabase
        .from('user_premium_usage')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      stripeCustomerId = data?.stripe_customer_id;
    }

    // If no existing customer, create one or let Stripe create it with the user's email
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'], // Add 'sepa_debit' after activating SEPA in Stripe Dashboard
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/profile?success=true&session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: `${req.headers.get('origin')}/profile?canceled=true`,
      metadata: {
        userId,
        planType,
        // Pass GA4 client_id so the Stripe webhook can use it for the server-side
        // Measurement Protocol event — same client_id = proper de-duplication in GA4.
        ga_client_id: gaClientId,
      },
      client_reference_id: userId,
      billing_address_collection: 'required',
      locale: 'de',
      customer_email: userEmail, // Pre-fill with Clerk email
    };

    // If user already has a Stripe customer, use it (but only if it matches the current mode)
    // Test customers start with 'cus_test_' or are created with test keys
    // Live customers start with 'cus_' (without test prefix)
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    const isTestCustomer = stripeCustomerId?.includes('test_');

    // Only use existing customer if the mode matches
    if (stripeCustomerId && ((isLiveMode && !isTestCustomer) || (!isLiveMode && isTestCustomer))) {
      delete sessionParams.customer_email;
      sessionParams.customer = stripeCustomerId;
    }

    // Enable promotion codes (for Family & Friends discounts)
    sessionParams.allow_promotion_codes = true;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Checkout-Session' },
      { status: 500 }
    );
  }
}
