import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { headers } from 'next/headers';
import { SignupTracker } from '@/components/SignupTracker';

/**
 * Static Public Layout with server-side bot detection
 *
 * - Bots/Google: NO ClerkProvider → No Clerk JavaScript → Clean indexing
 * - Real users: ClerkProvider → Auth works client-side via useAuth()
 *
 * Perfect for:
 * - Landing pages that need perfect SEO
 * - Pages that must be crawlable without any JavaScript auth logic
 */
export default async function StaticPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side bot detection
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isBot = /googlebot|google-inspectiontool|google-pagespeed|chrome-lighthouse|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|showyoubot|outbrain|pinterest|slackbot|whatsapp|bot|crawler|spider|crawling/i.test(userAgent);

  // For bots: Skip Clerk entirely
  if (isBot) {
    return <>{children}</>;
  }

  // For real users: Provide ClerkProvider
  return (
    <ClerkProvider
      localization={deDE}
      telemetry={false}
      signInFallbackRedirectUrl="/input-method"
      signUpFallbackRedirectUrl="/input-method"
    >
      <SignupTracker />
      {children}
    </ClerkProvider>
  );
}
