import { ClerkProvider } from '@clerk/nextjs';
import { clerkLokalisierung } from '@/lib/clerkLokalisierung';

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
      localization={clerkLokalisierung}
      telemetry={false}
      signInFallbackRedirectUrl="/input-method"
      signUpFallbackRedirectUrl="/input-method"
    >
      {children}
    </ClerkProvider>
  );
}
