'use client';

import { useCallback, useEffect, useState } from 'react';
import { driver, DriveStep, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingOptions {
  step?: 'a' | 'a2' | 'b' | 'c' | 'tabs';
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
            title: 'Willkommen bei imvestr!',
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
            description: 'Variiert je nach Bundesland (3,5% - 6,5%). Wird später automatisch vorausgefüllt, sobald du die Adresse eingibst.',
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

    if (step === 'a2') {
      return [
        {
          popover: {
            title: 'Objektdaten erfassen',
            description: 'Jetzt gibst du die wichtigsten Details zur Immobilie ein. Diese Daten beeinflussen die Berechnungen im nächsten Schritt.',
            side: 'bottom' as const,
            align: 'center' as const,
          }
        },
        {
          element: '#objekttyp-selector',
          popover: {
            title: 'Objekttyp wählen',
            description: 'Wichtig: Bei Wohnungen musst du später Hausgeld (WEG-Umlage) eingeben. Bei Häusern und MFH gibt es stattdessen separate Verwaltungskosten. Der Objekttyp beeinflusst auch den Gebäudeanteil für die Abschreibung.',
            ...commonConfig.popover,
          }
        },
        {
          element: '[data-step-nav="next"]',
          popover: {
            title: 'Weiter zu Mieteinnahmen',
            description: 'Im nächsten Schritt erfasst du alle Einnahmen und laufenden Kosten.',
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
            title: 'Schritt 2: Mieteinnahmen & Kosten',
            description: 'Jetzt erfasst du die monatlichen Mieteinnahmen und alle laufenden Kosten. Die meisten Werte sind bereits vorausgefüllt – du kannst sie aber anpassen.',
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
            description: 'Diese Nebenkosten kannst du auf den Mieter umlegen (z.B. Heizung, Wasser, Müll). Übliche Verteilung: 60% umlegbar, 40% nicht umlegbar. Wenn im Exposé nur das Gesamthausgeld steht, teile es entsprechend auf.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#hausgeld-nicht-umlegbar-input',
          popover: {
            title: 'Hausgeld nicht umlegefähig',
            description: 'WEG-Kosten die du selbst trägst: Hausverwaltung, Instandhaltungsrücklage. Üblich sind ca. 40% des Gesamthausgelds. Beispiel: Bei 250€ Gesamthausgeld → 150€ umlegbar, 100€ nicht umlegbar.',
            ...commonConfig.popover,
          }
        },
        {
          popover: {
            title: 'Kalkulatorische Kosten',
            description: 'Das sind Kosten, die du NICHT direkt bezahlst, aber einkalkulieren solltest. Sie dienen zur realistischen Bewertung deiner Rendite.',
            side: 'bottom' as const,
            align: 'center' as const,
          }
        },
        {
          element: '#mietausfall-input',
          popover: {
            title: 'Kalkulatorischer Mietausfall',
            description: 'Puffer für Leerstand oder Mietausfall (z.B. Mieter zahlt nicht). Standard: 2% der Jahresmiete. Musst du normalerweise NICHT anpassen – ist bereits optimal vorausgefüllt.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#instandhaltung-input',
          popover: {
            title: 'Instandhaltungskosten pro m²',
            description: 'Rücklagen für Reparaturen (Heizung, Dach, etc.). Standard: 10 €/m²/Jahr. Bei Altbauten (vor 1980) eher 12-15 €, bei Neubauten 5-8 €. Der Wert ist vorausgefüllt, kannst du aber anpassen.',
            ...commonConfig.popover,
          }
        },
        {
          popover: {
            title: 'Steuern & Abschreibung',
            description: 'Diese Werte beeinflussen deinen Cashflow NACH Steuern. Die meisten Werte sind automatisch berechnet – nur bei speziellen Fällen musst du etwas ändern.',
            side: 'bottom' as const,
            align: 'center' as const,
          }
        },
        {
          element: '#afa-input',
          popover: {
            title: 'AfA-Satz (Abschreibung)',
            description: 'Die "Abschreibung für Abnutzung" reduziert deine Steuerlast. Der Wert wird automatisch berechnet basierend auf dem Baujahr: Altbau (vor 1925) = 2,5%, Neubau (ab 1925) = 2%, Neubau (ab 2023) = 3%. Musst du NICHT anpassen.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#gebaeude-input',
          popover: {
            title: 'Gebäudeanteil am Kaufpreis',
            description: 'Nur das Gebäude (nicht das Grundstück) kann abgeschrieben werden. Standard: Wohnung 75%, Haus 80%, MFH 85%. Wird automatisch gesetzt. Nur ändern, wenn du einen Kaufvertrag mit genauem Wert hast.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#steuersatz-input',
          popover: {
            title: 'Dein persönlicher Steuersatz',
            description: 'Dein Grenzsteuersatz (was du auf zusätzliches Einkommen zahlst). Typisch: 30-45%. Wichtig für Cashflow NACH Steuern. Wenn unsicher: 42% ist ein guter Durchschnitt.',
            ...commonConfig.popover,
          }
        },
        {
          element: '[data-step-nav="next"]',
          popover: {
            title: 'Fast fertig!',
            description: 'Im letzten Schritt erfasst du nur noch dein Eigenkapital und die Kreditkonditionen. Danach siehst du die vollständige Analyse!',
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
            title: 'Schritt 3: Finanzierung planen',
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
            description: 'Aktueller Zinssatz deiner Bank. Stand Januar 2026: ca. 3,0-4,0%. Wenn unsicher: Nutze 3,5%.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#tilgung-input',
          popover: {
            title: 'Tilgung',
            description: 'Anfangstilgung pro Jahr. Typisch: 1-3%. Bei Kapitalanlage kannst du auch niedrig mit 1% ansetzen – höhere Tilgung bedeutet schnellere Entschuldung, niedrigere Tilgung bedeutet mehr Liquidität.',
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

    if (step === 'tabs') {
      return [
        {
          element: '#results-header',
          popover: {
            title: 'Deine Immobilienanalyse',
            description: 'Hier siehst du alle wichtigen Kennzahlen auf einen Blick. Die Analyse basiert auf deinen Eingaben aus den vorherigen Schritten.',
            side: 'bottom' as const,
            align: 'start' as const,
          }
        },
        {
          element: '#tabs-navigation',
          popover: {
            title: 'Verschiedene Analysen',
            description: 'Wechsle zwischen KPI-Analyse, Marktvergleich, Prognose und Szenario-Planung. Premium-Features sind mit einem Schloss markiert.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#kpi-brutto',
          popover: {
            title: 'Bruttomietrendite',
            description: 'Zeigt das Verhältnis der Jahresmiete zum Kaufpreis. Faustregel: Ab 4% interessant, ab 5% sehr gut. Kosten sind hier noch NICHT eingerechnet.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#kpi-netto',
          popover: {
            title: 'Nettomietrendite',
            description: 'Die realistische Rendite NACH allen laufenden Kosten (Hausgeld, Instandhaltung, Mietausfall). Das ist die wichtigste Kennzahl für Kapitalanleger.',
            ...commonConfig.popover,
          }
        },
        {
          element: '#kpi-cashflow',
          popover: {
            title: 'Cashflow vor Steuern',
            description: 'Dein monatlicher Überschuss oder Zuschuss. Positiver Cashflow = Immobilie erwirtschaftet Geld. Negativer Cashflow = Du musst monatlich etwas dazuzahlen.',
            ...commonConfig.popover,
          }
        },
        {
          popover: {
            title: 'Weitere Funktionen',
            description: 'Du kannst die Eingaben jederzeit über "Bearbeiten" anpassen oder mit "Neue Analyse" ein weiteres Objekt bewerten. Viel Erfolg!',
            side: 'bottom' as const,
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
      doneBtnText: 'Fertig',
      progressText: 'Schritt {{current}} von {{total}}',
      stagePadding: 35, // Large padding to show labels and full context
      stageRadius: 24, // Rounded corners (1.5rem = 24px) like cards
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
