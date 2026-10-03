import { useEffect, useRef } from 'react';
import { AUTOSAVE_KEY as STATE_KEY, useImmoStore } from '@/store/useImmoStore';

/**
 * Hook für automatische State Persistence
 * Speichert den Zustand automatisch im localStorage und lädt ihn beim Mount –
 * aber nur, wenn der Store leer ist (z. B. nach Reload oder Login-Redirect).
 * Eine gerade geöffnete gespeicherte Analyse darf nicht überschrieben werden.
 */
export function useStatePersistence() {
  const importData = useImmoStore((s) => s.importData);
  const exportState = useImmoStore((s) => s.exportState);
  const updateDerived = useImmoStore((s) => s.updateDerived);
  const hasLoadedRef = useRef(false);

  // Lade Zustand beim Mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const current = useImmoStore.getState();
    if (current.kaufpreis > 0 || current.adresse) return;

    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Nur laden, wenn tatsächlich Daten vorhanden sind
        if (parsed.kaufpreis > 0 || parsed.adresse) {
          console.log('[StatePersistence] Loading saved state from localStorage');
          importData(parsed);
          // Neuberechnung der abgeleiteten Werte nach dem Laden
          setTimeout(() => updateDerived(), 0);
        }
      } catch (error) {
        console.error('[StatePersistence] Failed to load state:', error);
      }
    }
  }, [importData, updateDerived]);

  // Speichere Zustand bei jeder Änderung
  useEffect(() => {
    const saveState = () => {
      try {
        const currentState = exportState();
        localStorage.setItem(STATE_KEY, JSON.stringify(currentState));
      } catch (error) {
        console.error('[StatePersistence] Failed to save state:', error);
      }
    };

    // Speichere alle 2 Sekunden, wenn es Änderungen gab
    const interval = setInterval(saveState, 2000);

    return () => clearInterval(interval);
  }, [exportState]);
}
