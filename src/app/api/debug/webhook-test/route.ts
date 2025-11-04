// Debug endpoint to test webhook and Supabase connection
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: {} as Record<string, unknown>
  };

  // 1. Check Clerk Auth
  try {
    const { userId } = await auth();
    diagnostics.checks.clerk = {
      status: 'ok',
      userId: userId || 'not authenticated',
    };
  } catch (error) {
    diagnostics.checks.clerk = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // 2. Check Supabase Connection
  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      diagnostics.checks.supabase = {
        status: 'error',
        error: 'Supabase client not initialized - check environment variables',
      };
    } else {
      // Try to query the user_premium_usage table
      const { data, error } = await supabase
        .from('user_premium_usage')
        .select('count')
        .limit(1);

      if (error) {
        diagnostics.checks.supabase = {
          status: 'error',
          error: error.message,
          hint: 'Check if tables exist and RLS policies are correct',
        };
      } else {
        diagnostics.checks.supabase = {
          status: 'ok',
          message: 'Successfully connected to Supabase',
          tableAccessible: true,
        };
      }
    }
  } catch (error) {
    diagnostics.checks.supabase = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // 3. Check Environment Variables
  diagnostics.checks.env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
  };

  return NextResponse.json(diagnostics, { status: 200 });
}

// Test webhook simulation - manually trigger premium activation
export async function POST(req: Request) {
  try {
    console.log('🔍 [DEBUG] POST /api/debug/webhook-test called');

    const { userId } = await auth();
    console.log('[DEBUG] User ID:', userId);

    if (!userId) {
      console.error('[DEBUG] No userId - not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      console.error('[DEBUG] Supabase not initialized');
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    console.log('[DEBUG] Supabase client initialized');

    // Simulate premium activation for current user
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1); // 1 month from now

    console.log('[DEBUG] Attempting upsert with data:', {
      user_id: userId,
      is_premium: true,
      premium_until: premiumUntil.toISOString(),
    });

    const { data, error } = await supabase
      .from('user_premium_usage')
      .upsert({
        user_id: userId,
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
        stripe_customer_id: 'test_customer',
        stripe_subscription_id: 'test_subscription',
      })
      .select();

    if (error) {
      console.error('[DEBUG] Supabase error:', error);
      console.error('[DEBUG] Error code:', error.code);
      console.error('[DEBUG] Error message:', error.message);
      console.error('[DEBUG] Error details:', error.details);
      console.error('[DEBUG] Error hint:', error.hint);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          fullError: error,
        },
        { status: 500 }
      );
    }

    console.log('[DEBUG] ✅ Success! Data:', data);

    return NextResponse.json({
      success: true,
      message: 'Premium status activated for testing',
      userId,
      premiumUntil: premiumUntil.toISOString(),
      data,
    });
  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
