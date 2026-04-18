import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';

/**
 * Blog Layout
 *
 * Wraps blog pages in ClerkProvider so the Header component (which uses
 * useAuth) works correctly during SSR and client-side rendering.
 */
export default function BlogLayout({
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
