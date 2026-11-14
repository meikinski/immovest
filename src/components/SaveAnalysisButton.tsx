'use client';

import { signUpHref } from '@/lib/anmeldeLinks';
import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useImmoStore } from '@/store/useImmoStore';
import { saveAnalysis, saveScenario } from '@/lib/storage';
import { toast } from 'sonner';

interface ScenarioData {
  mieteDeltaPct: number;
  preisDeltaPct: number;
  zinsDeltaPp: number;
  tilgungDeltaPp: number;
  ekDeltaPct: number;
  sondertilgungJaehrlich?: number;
  wertentwicklungAktiv: boolean;
  wertentwicklungPct: number;
  darlehensTyp: 'annuitaet' | 'degressiv';
  mietInflationPct: number;
  kostenInflationPct: number;
  verkaufsNebenkostenPct: number;
  scenarioKaufpreis: number;
  scenarioMiete: number;
  scenarioZins: number;
  scenarioTilgung: number;
  scenarioEk: number;
  scenarioCashflowVorSteuer: number;
  scenarioCashflowNachSteuer: number;
  scenarioNettorendite: number;
  scenarioBruttorendite: number;
  scenarioEkRendite: number;
  scenarioNoiMonthly: number;
  scenarioDscr: number;
  scenarioRateMonat: number;
  scenarioAbzahlungsjahr: number;
}

interface SaveAnalysisButtonProps {
  scenarioData?: ScenarioData;
}

/**
 * Speichert die aktuelle Analyse im Konto (Supabase) und als lokale Kopie.
 * Speichern ist für jedes Konto kostenlos. Gibt die stabile analysisId zurück.
 */
export async function speichereAnalyse(userId: string | null | undefined): Promise<string> {
  const store = useImmoStore.getState();
  const stateData = store.exportState();
  // Stabile ID vor dem ersten Speichern vergeben – Supabase und localStorage nutzen dieselbe
  if (!stateData.analysisId) {
    stateData.analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stateData),
  });
  if (!response.ok) throw new Error('Failed to save analysis');

  const result = (await response.json()) as { analysisId: string };
  if (useImmoStore.getState().analysisId !== result.analysisId) store.setAnalysisId(result.analysisId);

  // Lokale Kopie als Backup (schnelles Öffnen, auch offline)
  try { saveAnalysis(userId || null, { ...stateData, analysisId: result.analysisId }); } catch { /* Speicher voll oder privater Modus */ }
  return result.analysisId;
}

/** Inhalt der Analyse ohne Zeitstempel und ID – ändert sich nur, wenn sich wirklich etwas ändert. */
function fingerabdruck(state: Record<string, unknown>, scenarioData?: ScenarioData): string {
  const inhalt = Object.fromEntries(
    Object.entries(state).filter(([k, v]) => typeof v !== 'function' && !['analysisId', 'createdAt', 'updatedAt'].includes(k))
  );
  return JSON.stringify([inhalt, scenarioData ?? null]);
}

export function SaveAnalysisButton({ scenarioData }: SaveAnalysisButtonProps) {
  const { userId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  // Stand, der zuletzt gespeichert wurde. Der Knopf zeigt „Gespeichert“, bis sich etwas ändert.
  const [gespeicherterStand, setGespeicherterStand] = useState<string | null>(null);
  const aktuellerStand = fingerabdruck(
    useImmoStore() as unknown as Record<string, unknown>,
    scenarioData
  );
  const saved = gespeicherterStand === aktuellerStand;
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    const standBeimSpeichern = aktuellerStand;

    try {
      const result = { analysisId: await speichereAnalyse(userId) };
      console.log('✅ Analyse gespeichert:', result.analysisId);

      // Save scenario if there are any changes
      if (scenarioData) {
        const hasScenarioChanges =
          scenarioData.mieteDeltaPct !== 0 ||
          scenarioData.preisDeltaPct !== 0 ||
          scenarioData.zinsDeltaPp !== 0 ||
          scenarioData.tilgungDeltaPp !== 0 ||
          scenarioData.ekDeltaPct !== 0;

        if (hasScenarioChanges) {
          try {
            // Save scenario to Supabase
            const scenarioResponse = await fetch('/api/scenarios', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                analysisId: result.analysisId,
                scenarioName: `Szenario ${new Date().toLocaleDateString('de-DE')}`,
                ...scenarioData,
              }),
            });

            if (scenarioResponse.ok) {
              const scenarioResult = await scenarioResponse.json();
              console.log('✅ Szenario gespeichert:', scenarioResult.scenarioId);

              // Also save to localStorage as backup
              saveScenario(userId || null, result.analysisId, {
                scenarioName: `Szenario ${new Date().toLocaleDateString('de-DE')}`,
                ...scenarioData,
                scenarioId: scenarioResult.scenarioId,
              });
            }
          } catch (scenarioError) {
            console.error('❌ Fehler beim Speichern des Szenarios:', scenarioError);
            // Don't fail the whole operation if scenario save fails
          }
        }
      }

      setGespeicherterStand(standBeimSpeichern);
      toast.success('Analyse gespeichert', {
        description: 'Du findest sie unter „Meine Analysen“.',
        action: { label: 'Öffnen', onClick: () => router.push('/analysen') },
      });
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern der Analyse', { description: 'Bitte versuch es noch einmal.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Speichern ist kostenlos, braucht aber ein Konto
  if (!userId) {
    return (
      <button
        type="button"
        onClick={() => router.push(signUpHref('save_analysis', '/step/tabs'))}
        className="btn-primary flex items-center gap-2"
      >
        <Save size={18} />
        Anmelden und speichern
      </button>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      aria-live="polite"
      className={[
        'btn-primary flex items-center gap-2 transition-all',
        saved ? 'bg-green-600 hover:bg-green-700' : '',
      ].join(' ')}
    >
      {saved ? (
        <>
          <Check size={18} />
          Gespeichert
        </>
      ) : (
        <>
          <Save size={18} />
          {isSaving ? 'Speichere …' : 'Analyse speichern'}
        </>
      )}
    </button>
  );
}
