import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';
import { PaywallProvider } from '@/contexts/PaywallContext';
import { SignupTracker } from '@/components/SignupTracker';
import { ChatAssistant } from '@/components/ChatAssistant';

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
      localization={deDE}
      telemetry={false}
      signInFallbackRedirectUrl="/input-method"
      signUpFallbackRedirectUrl="/input-method"
    >
      <SignupTracker />
      <PaywallProvider>
        {children}
        <ChatAssistant />
      </PaywallProvider>
    </ClerkProvider>
  );
}
