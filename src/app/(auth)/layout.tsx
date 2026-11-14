import { ClerkProvider } from '@clerk/nextjs';
import { clerkLokalisierung } from '@/lib/clerkLokalisierung';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { SignupTracker } from '@/components/SignupTracker';
import { AnmeldeRueckkehr } from '@/components/AnmeldeRueckkehr';
import { MonitoringNutzer } from '@/components/MonitoringNutzer';
// TODO: ChatAssistant wieder einbinden, sobald der Chat ausgereift ist
// (import { ChatAssistant } from '@/components/ChatAssistant'; und <ChatAssistant /> nach {children})

/**
 * Auth Layout - WITH CLERK AND PAYWALL!
 *
 * This layout wraps all authenticated routes (sign-in, dashboard, profile, etc.)
 * with ClerkProvider and PaywallProvider.
 *
 * ClerkProvider enables authentication functionality.
 * PaywallProvider uses Clerk auth to manage premium features.
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
    <ClerkProvider
      localization={clerkLokalisierung}
      telemetry={false}
      signInFallbackRedirectUrl="/input-method"
      signUpFallbackRedirectUrl="/input-method"
      afterSignOutUrl="/"
    >
      <SignupTracker />
      <MonitoringNutzer />
      <PaywallProvider>
        {children}
      </PaywallProvider>
      {/* Nach den Seiten: läuft nach deren Effekten (z. B. dem Zurücksetzen auf /input-method) */}
      <AnmeldeRueckkehr />
    </ClerkProvider>
  );
}
