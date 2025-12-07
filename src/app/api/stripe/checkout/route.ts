// src/app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

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
      payment_method_types: ['card', 'sepa_debit'],
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
      },
      client_reference_id: userId,
      billing_address_collection: 'required',
      locale: 'de',
      customer_email: userEmail, // Pre-fill with Clerk email
    };

    // If user already has a Stripe customer, use it instead of customer_email
    if (stripeCustomerId) {
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
