import { ClerkProvider } from '@clerk/nextjs';
import { clerkLokalisierung } from '@/lib/clerkLokalisierung';

/**
 * Rechner-Seiten: wie der Blog nur ClerkProvider für den Header (useAuth), keine Anmeldung nötig.
 * Kein robots-Override: die Seiten erben index/follow aus dem Root-Layout.
 */
export default function RechnerLayout({ children }: { children: React.ReactNode }) {
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
