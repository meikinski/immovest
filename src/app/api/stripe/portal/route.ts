// src/app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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

    // Get customer ID from Supabase
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Datenbank nicht konfiguriert' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('user_premium_usage')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Portal] Database error:', error);
      return NextResponse.json(
        { error: 'Fehler beim Abrufen der Kundendaten' },
        { status: 500 }
      );
    }

    if (!data?.stripe_customer_id) {
      console.error('[Portal] No customer ID found in database for user:', userId);

      // Fallback: Search Stripe for customer by metadata
      console.log('[Portal] Searching Stripe for customer with userId metadata...');
      try {
        const customers = await stripe.customers.list({
          limit: 1,
        });

        // Find customer with matching userId in metadata
        let matchingCustomer = null;
        for await (const customer of stripe.customers.list({ limit: 100 })) {
          if (customer.metadata?.userId === userId) {
            matchingCustomer = customer;
            break;
          }
        }

        if (matchingCustomer) {
          console.log('[Portal] Found customer in Stripe:', matchingCustomer.id);

          // Update database with the customer ID for future use
          await supabase
            .from('user_premium_usage')
            .upsert({
              user_id: userId,
              stripe_customer_id: matchingCustomer.id,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });

          // Create portal session with found customer
          const session = await stripe.billingPortal.sessions.create({
            customer: matchingCustomer.id,
            return_url: `${req.headers.get('origin')}/profile`,
          });

          console.log('[Portal] Portal session created successfully with fallback customer');
          return NextResponse.json({ url: session.url });
        }
      } catch (stripeError) {
        console.error('[Portal] Error searching Stripe:', stripeError);
      }

      return NextResponse.json(
        { error: 'Kein Abonnement gefunden. Falls du gerade gekauft hast, warte bitte einen Moment und versuche es erneut.' },
        { status: 404 }
      );
    }

    console.log('[Portal] Creating portal session for customer:', data.stripe_customer_id);

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/profile`,
    });

    console.log('[Portal] Portal session created successfully');
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Portal] Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Portal-Session. Bitte versuche es später erneut.' },
      { status: 500 }
    );
  }
}
