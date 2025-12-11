import { auth } from '@clerk/nextjs/server';
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { headers } from 'next/headers';
import { AuthProvider } from '@/components/AuthProvider';

/**
 * Best Practice Solution for Google Indexing + Full User Experience
 *
 * Server-side bot detection to completely skip ClerkProvider for bots:
 * - Bots/Google: NO ClerkProvider → No Clerk JavaScript → Clean indexing
 * - Real users: Full ClerkProvider → UserButton with all features
 *
 * This is the ONLY reliable solution because:
 * ✅ Bot detection happens server-side (before ANY JavaScript loads)
 * ✅ Bots never see ClerkProvider in the component tree
 * ✅ No Clerk scripts injected for bots (no redirect errors)
 * ✅ Real users get full functionality (UserButton, profile, subscription)
 */
export default async function PublicInteractiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side bot detection (comprehensive pattern for ALL crawlers and tools)
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isBot = /googlebot|google-inspectiontool|google-pagespeed|chrome-lighthouse|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|showyoubot|outbrain|pinterest|slackbot|whatsapp|bot|crawler|spider|crawling/i.test(userAgent);

  // For bots: Skip Clerk entirely
  if (isBot) {
    return <AuthProvider isSignedIn={false}>{children}</AuthProvider>;
  }

  // For real users: Full Clerk with auth check
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
