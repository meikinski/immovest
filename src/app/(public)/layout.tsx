import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';

/**
 * Public Layout - Always load Clerk
 *
 * Clerk is loaded for all users (including bots) to ensure:
 * ✅ Logged-in users see their profile button
 * ✅ No SSR/hydration issues
 * ✅ Consistent behavior
 *
 * Google can index pages even with Clerk loaded.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={deDE}
      telemetry={false}
      signInFallbackRedirectUrl="/input-method"
      signUpFallbackRedirectUrl="/input-method"
    >
      {children}
    </ClerkProvider>
  );
}
