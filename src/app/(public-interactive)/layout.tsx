import { auth } from '@clerk/nextjs/server';
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { AuthProvider } from '@/components/AuthProvider';

/**
 * Layout for interactive public pages (/ and /input-method)
 *
 * Hybrid strategy for best of both worlds:
 * - SSR: Detects auth state + wraps with ClerkProvider (for UserButton to work)
 * - Passes isSignedIn to components via AuthProvider
 * - Components conditionally load Clerk features only for signed-in users
 *
 * Why this works for Google indexing:
 * ✅ Google/Bots are NEVER signed in → components show static links only
 * ✅ Real signed-in users get full Clerk (UserButton, profile, subscription)
 * ✅ Clerk JS only loads for authenticated users (not bots)
 */
export default async function PublicInteractiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <ClerkProvider
      localization={deDE}
      telemetry={false}
      signInFallbackRedirectUrl="/input-method"
      signUpFallbackRedirectUrl="/input-method"
    >
      <AuthProvider isSignedIn={isSignedIn}>{children}</AuthProvider>
    </ClerkProvider>
  );
}
