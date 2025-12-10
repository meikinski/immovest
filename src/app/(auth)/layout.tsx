import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';

/**
 * Auth Layout - WITH CLERK!
 *
 * This layout wraps all authenticated routes (sign-in, dashboard, profile, etc.)
 * with ClerkProvider to enable authentication functionality.
 *
 * These pages are NOT meant to be indexed by Google, so it's fine to have
 * Clerk's external scripts here.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={deDE} telemetry={false}>
      {children}
    </ClerkProvider>
  );
}
