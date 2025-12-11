import { auth } from '@clerk/nextjs/server';
import { AuthProvider } from '@/components/AuthProvider';

/**
 * Layout for interactive public pages (/ and /input-method)
 *
 * Server-side auth check WITHOUT loading Clerk client-side:
 * - Uses auth() from Clerk server-side only
 * - Passes auth status to client components via React Context
 * - NO Clerk JavaScript loaded on client → Google sees clean HTML
 * - Users still see correct auth state (profile button when logged in)
 *
 * This ensures:
 * ✅ Google can index without ANY Clerk scripts or redirects
 * ✅ Users see profile button when logged in
 * ✅ Zero client-side Clerk overhead for public pages
 */
export default async function PublicInteractiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check (NO client-side Clerk needed!)
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return <AuthProvider isSignedIn={isSignedIn}>{children}</AuthProvider>;
}
