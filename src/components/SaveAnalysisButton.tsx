'use client';

import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
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

export function SaveAnalysisButton({ scenarioData }: SaveAnalysisButtonProps) {
  const { userId } = useAuth();
  const exportState = useImmoStore((s) => s.exportState);
  const setAnalysisId = useImmoStore((s) => s.setAnalysisId);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const stateData = exportState();

      // Save to Supabase via API
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save analysis');
      }

      const result = await response.json();
      console.log('✅ Analyse gespeichert:', result.analysisId);

      // Update analysisId in store
      setAnalysisId(result.analysisId);

      // Also save to localStorage as backup
      saveAnalysis(userId || null, stateData);

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

      setSaved(true);
      toast.success('Analyse erfolgreich gespeichert');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern der Analyse');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
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
          {isSaving ? 'Speichere...' : 'Immobilie speichern'}
        </>
      )}
    </button>
  );
}
