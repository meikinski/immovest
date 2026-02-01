'use client';

import React, { useState } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { saveScenario } from '@/lib/storage';
import { toast } from 'sonner';

interface SaveScenarioButtonProps {
  analysisId?: string;
  scenarioData: {
    scenarioName: string;
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
    // Calculated results
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
  };
}

export function SaveScenarioButton({ analysisId, scenarioData }: SaveScenarioButtonProps) {
  const { userId } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!analysisId) {
      toast.error('Bitte speichere zuerst die Analyse');
      return;
    }

    setIsSaving(true);

    try {
      // Save to Supabase via API
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId,
          ...scenarioData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save scenario');
      }

      const result = await response.json();
      console.log('✅ Szenario gespeichert:', result.scenarioId);

      // Also save to localStorage as backup
      saveScenario(userId || null, analysisId, {
        ...scenarioData,
        scenarioId: result.scenarioId,
      });

      setSaved(true);
      toast.success('Szenario erfolgreich gespeichert');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern des Szenarios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving || !analysisId}
      className={[
        'btn-primary flex items-center gap-2 transition-all',
        saved ? 'bg-green-600 hover:bg-green-700' : '',
        !analysisId ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
      title={!analysisId ? 'Bitte speichere zuerst die Analyse' : ''}
    >
      {saved ? (
        <>
          <Check size={18} />
          Gespeichert
        </>
      ) : isSaving ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Speichere...
        </>
      ) : (
        <>
          <Save size={18} />
          Szenario speichern
        </>
      )}
    </button>
  );
}
