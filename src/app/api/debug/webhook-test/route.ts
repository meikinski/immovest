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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Simulate premium activation for current user
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1); // 1 month from now

    const { data, error } = await supabase
      .from('user_premium_usage')
      .upsert({
        user_id: userId,
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
        stripe_customer_id: 'test_customer',
        stripe_subscription_id: 'test_subscription',
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Premium status activated for testing',
      userId,
      premiumUntil: premiumUntil.toISOString(),
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
