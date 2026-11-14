// src/app/api/premium/status/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      // Supabase not configured - return fallback
      // Client will use localStorage
      return NextResponse.json(
        { isPremium: false, usageCount: 0, usingFallback: true },
        { status: 200 }
      );
    }

    // Check premium status from Supabase
    const { data, error } = await supabase
      .from('user_premium_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's ok for new users
      console.error('Error fetching premium status:', error);
      return NextResponse.json(
        { error: 'Fehler beim Abrufen des Premium-Status' },
        { status: 500 }
      );
    }

    if (!data) {
      // User has no premium record yet - create one
      const { error: insertError } = await supabase
        .from('user_premium_usage')
        .insert({
          user_id: userId,
          usage_count: 0,
          is_premium: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating premium record:', insertError);
        return NextResponse.json(
          { isPremium: false, usageCount: 0 },
          { status: 200 }
        );
      }

      return NextResponse.json({
        isPremium: false,
        usageCount: 0,
        premiumUntil: null,
      });
    }

    // Check if premium subscription is still active
    const isPremiumActive =
      data.is_premium &&
      data.premium_until &&
      new Date(data.premium_until) > new Date();

    return NextResponse.json({
      isPremium: isPremiumActive,
      usageCount: data.usage_count || 0,
      premiumUntil: data.premium_until,
      stripeCustomerId: data.stripe_customer_id,
    });
  } catch (error) {
    console.error('Premium status error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

/**
 * Früher hat der Browser hier usage_count hochgezählt. Das Gratis-Kontingent wird jetzt ausschließlich
 * serverseitig in /api/agent/run verbucht (src/lib/gratisAnalyse.ts). Bleibt als No-op für Browser mit
 * altem Code im Cache: schreibt nichts und liefert den aktuellen Stand.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, deprecated: true }, { status: 200 });
    }

    const { data } = await supabase
      .from('user_premium_usage')
      .select('usage_count')
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json({ success: true, deprecated: true, newCount: data?.usage_count ?? 0 });
  } catch (error) {
    console.error('Premium status (POST, no-op) error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
