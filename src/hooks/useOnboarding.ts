'use client';

import { useCallback, useEffect, useState } from 'react';
import { driver, DriveStep, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingOptions {
  step?: 'a' | 'b' | 'c';
  onComplete?: () => void;
  onSkip?: () => void;
}

export function useOnboarding() {
  const [driverObj, setDriverObj] = useState<Driver | null>(null);

  // Check if user has seen onboarding
  const hasSeenOnboarding = useCallback((step?: string): boolean => {
    if (typeof window === 'undefined') return true;

    const key = step ? `hasSeenOnboarding_${step}` : 'hasSeenOnboarding';
    return localStorage.getItem(key) === 'true';
  }, []);

  // Mark onboarding as completed
  const markAsCompleted = useCallback((step?: string): void => {
    if (typeof window === 'undefined') return;

    const key = step ? `hasSeenOnboarding_${step}` : 'hasSeenOnboarding';
    localStorage.setItem(key, 'true');
  }, []);

  // Reset onboarding (for testing or "show tour again")
  const resetOnboarding = useCallback((step?: string): void => {
    if (typeof window === 'undefined') return;

    if (step) {
      localStorage.removeItem(`hasSeenOnboarding_${step}`);
    } else {
      // Reset all steps
      localStorage.removeItem('hasSeenOnboarding');
      localStorage.removeItem('hasSeenOnboarding_a');
      localStorage.removeItem('hasSeenOnboarding_b');
      localStorage.removeItem('hasSeenOnboarding_c');
    }
  }, []);

  // Get tour steps based on current step
  const getTourSteps = useCallback((step: string = 'a'): DriveStep[] => {
    const commonConfig = {
      popover: {
        side: 'bottom' as const,
        align: 'start' as const,
      }
    };

    if (step === 'a') {
      return [
        {
          popover: {
            title: '🎯 Willkommen bei imvestr!',
            description: 'Ich zeige dir kurz, wie du eine Immobilie in 2 Minuten bewertest. Bereit?',
            side: 'bottom' as const,
            align: 'center' as const,
          }
        },
        {
          element: '#kaufpreis-input',
          popover: {
            title: 'Kaufpreis',
            description: 'Der Angebotspreis der Immobilie. Beispiel: 300.000 €. Findest du im Exposé.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#grunderwerbsteuer-input',
          popover: {
            title: 'Grunderwerbsteuer',
            description: 'Variiert je nach Bundesland (3,5% - 6,5%). Wird automatisch vorausgefüllt basierend auf der Adresse.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#notar-input',
          popover: {
            title: 'Notar & Grundbuch',
            description: 'Typischerweise ca. 1,5% - 2% des Kaufpreises. Diese Kosten musst du zusätzlich einplanen.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#makler-input',
          popover: {
            title: 'Maklergebühr',
            description: 'Falls eine Maklerprovision anfällt. Sonst einfach auf 0% lassen.',
            ...commonConfig.popover,
          }
        },
        {
          element: '[data-step-nav="next"]',
          popover: {
            title: 'Weiter zur Objektbeschreibung',
            description: 'Klick hier, um zur Objektbeschreibung zu kommen. Danach erfasst du Mieten und Eigenkapital.',
            side: 'top' as const,
            align: 'center' as const,
          }
        }
      ];
    }

    if (step === 'b') {
      return [
        {
          popover: {
            title: '💰 Schritt 2: Mieteinnahmen erfassen',
            description: 'Jetzt erfasst du die monatlichen Mieteinnahmen und laufenden Kosten.',
            side: 'bottom' as const,
            align: 'center' as const,
          }
        },
        {
          element: '#miete-input',
          popover: {
            title: 'Monatliche Kaltmiete',
            description: 'Was würdest du monatlich an Miete bekommen? Beispiel: 1.200 €. Falls vermietet: Steht im Exposé. Falls leer: Schau auf ImmoScout nach vergleichbaren Objekten.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#hausgeld-umlegbar-input',
          popover: {
            title: 'Hausgeld umlegefähig',
            description: 'Diese Nebenkosten kannst du auf den Mieter umlegen (z.B. Heizung, Wasser, Müll).',
            ...commonConfig.popover,
          }
        },
        {
          element: '#hausgeld-nicht-umlegbar-input',
          popover: {
            title: 'Hausgeld nicht umlegefähig',
            description: 'WEG-Kosten die du selbst trägst: Hausverwaltung, Instandhaltungsrücklage. Nur bei Eigentumswohnungen. Steht meist im Exposé. Beispiel: 250 €/Monat.',
            ...commonConfig.popover,
          }
        },
        {
          element: '[data-step-nav="next"]',
          popover: {
            title: 'Weiter zur Finanzierung',
            description: 'Im letzten Schritt erfasst du dein Eigenkapital und die Finanzierungskonditionen.',
            side: 'top' as const,
            align: 'center' as const,
          }
        }
      ];
    }

    if (step === 'c') {
      return [
        {
          popover: {
            title: '🏦 Schritt 3: Finanzierung planen',
            description: 'Zum Schluss erfasst du dein Eigenkapital und die Kreditkonditionen.',
            side: 'bottom' as const,
            align: 'center' as const,
          }
        },
        {
          element: '#eigenkapital-input',
          popover: {
            title: 'Dein Eigenkapital',
            description: 'Wie viel Geld bringst du selbst ein? Typisch sind 20-30% vom Kaufpreis. Beispiel: Bei 300.000 € Kaufpreis → 60.000 € Eigenkapital.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#zins-input',
          popover: {
            title: 'Zinssatz',
            description: 'Aktueller Zinssatz deiner Bank. Stand 2025: ca. 3,5-4,5%. Wenn unsicher: Nutze 4%.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#tilgung-input',
          popover: {
            title: 'Tilgung',
            description: 'Anfangstilgung pro Jahr. Standard sind 2-3%. Je höher, desto schneller bist du schuldenfrei.',
            ...commonConfig.popover,
          }
        },
        {
          element: '[data-step-nav="next"]',
          popover: {
            title: 'Fertig! Zur Analyse',
            description: 'Klick hier, um deine vollständige Immobilienanalyse mit Cashflow, Rendite und KI-Einschätzung zu sehen.',
            side: 'top' as const,
            align: 'center' as const,
          }
        }
      ];
    }

    return [];
  }, []);

  // Start the tour
  const startTour = useCallback((options: OnboardingOptions = {}) => {
    const { step = 'a', onComplete, onSkip } = options;

    // Get steps for current step
    const steps = getTourSteps(step);

    if (steps.length === 0) return;

    // Create driver instance
    const newDriverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Weiter',
      prevBtnText: 'Zurück',
      doneBtnText: 'Verstanden',
      progressText: 'Schritt {{current}} von {{total}}',
      steps,
      onDestroyStarted: () => {
        // Mark as completed when tour is destroyed (completed or skipped)
        markAsCompleted(step);

        // Check if completed or skipped
        const activeIndex = newDriverObj.getActiveIndex();
        const isCompleted = activeIndex === steps.length - 1;

        if (isCompleted && onComplete) {
          onComplete();
        } else if (!isCompleted && onSkip) {
          onSkip();
        }

        newDriverObj.destroy();
      },
      onPopoverRender: (popover) => {
        // Add custom styling to match imvestr brand
        const popoverElement = popover.wrapper;
        popoverElement.style.maxWidth = '400px';

        // Add brand color to progress bar
        const progressBar = popoverElement.querySelector('.driver-popover-progress-text');
        if (progressBar) {
          (progressBar as HTMLElement).style.color = 'hsl(var(--brand))';
        }
      }
    });

    setDriverObj(newDriverObj);
    newDriverObj.drive();
  }, [getTourSteps, markAsCompleted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverObj) {
        driverObj.destroy();
      }
    };
  }, [driverObj]);

  return {
    startTour,
    hasSeenOnboarding,
    markAsCompleted,
    resetOnboarding,
  };
}
