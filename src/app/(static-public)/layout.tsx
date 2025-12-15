import { AuthProvider } from '@/components/AuthProvider';

/**
 * Static Public Layout - NO CLERK AT ALL
 *
 * This layout is specifically for pages that should NEVER have any Clerk code,
 * even for real users. This ensures Google and other search engines
 * never encounter any authentication-related redirects.
 *
 * Perfect for:
 * - Landing pages that need perfect SEO
 * - Pages that must be crawlable without any JavaScript auth logic
 */
export default function StaticPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always render without Clerk - for everyone
  return <AuthProvider isSignedIn={false}>{children}</AuthProvider>;
}
