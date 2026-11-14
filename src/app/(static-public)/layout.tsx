import { ClerkProvider } from '@clerk/nextjs';
import { clerkLokalisierung } from '@/lib/clerkLokalisierung';
import { SignupTracker } from '@/components/SignupTracker';
import { AnmeldeRueckkehr } from '@/components/AnmeldeRueckkehr';
import { MonitoringNutzer } from '@/components/MonitoringNutzer';

/**
 * Static Public Layout
 *
 * Always renders ClerkProvider so that client components using useUser(),
 * useSignIn() etc. have a valid context during SSR — including for bots.
 *
 * Previously, bot detection was used to skip ClerkProvider for Googlebot.
 * This caused HTTP 500 because the page.tsx is a Client Component that calls
 * useUser() unconditionally. Next.js SSR-renders client components on the
 * server, and useUser() without a ClerkProvider throws → 500.
 *
 * The middleware already prevents auth redirects for these public routes,
 * so ClerkProvider here is safe for bots and real users alike.
 */
export default function StaticPublicLayout({
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
      <SignupTracker />
      <MonitoringNutzer />
      {children}
      {/* Nach den Seiten: läuft nach deren Effekten (z. B. dem Zurücksetzen auf /input-method) */}
      <AnmeldeRueckkehr />
    </ClerkProvider>
  );
}
