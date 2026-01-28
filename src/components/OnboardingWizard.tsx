'use client';

import { useEffect } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingWizardProps {
  step?: 'a' | 'a2' | 'b' | 'c' | 'tabs';
  autoStart?: boolean;
  delay?: number;
}

/**
 * OnboardingWizard Component
 *
 * Automatically starts a guided tour for first-time visitors.
 * Uses Driver.js to highlight and explain key input fields.
 *
 * @param step - Current step ('a', 'b', or 'c') to show relevant tour
 * @param autoStart - Whether to auto-start on first visit (default: true)
 * @param delay - Delay in ms before starting tour (default: 500ms to ensure DOM is ready)
 */
export function OnboardingWizard({
  step = 'a',
  autoStart = true,
  delay = 500
}: OnboardingWizardProps) {
  const { startTour, hasSeenOnboarding } = useOnboarding();

  useEffect(() => {
    // Only auto-start if enabled and user hasn't seen this step's onboarding
    if (!autoStart) return;
    if (hasSeenOnboarding(step)) return;

    // Delay to ensure DOM elements are mounted and ready
    const timer = setTimeout(() => {
      startTour({ step });
    }, delay);

    return () => clearTimeout(timer);
  }, [autoStart, delay, hasSeenOnboarding, startTour, step]);

  // This component doesn't render anything visible
  return null;
}
