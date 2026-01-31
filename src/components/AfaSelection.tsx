'use client';

import { Info, TrendingUp, Zap } from 'lucide-react';
import { AfaModell } from '@/store/useImmoStore';
import { Tooltip } from './Tooltip';

interface AfaSelectionProps {
  baujahr: number;
  afaModell: AfaModell;
  nutzeSonderAfa: boolean;
  onAfaModellChange: (v: AfaModell) => void;
  onNutzeSonderAfaChange: (v: boolean) => void;
}

/**
 * Vereinfachte AfA-Auswahl Komponente
 *
 * Zeigt nur linear/degressiv bei Baujahr >= 2023.
 * Degressive AfA (5%) ist möglich für Neubauten 10/2023 - 09/2029.
 * Kombiniert mit Sonder-AfA (5%) ergibt sich bis zu 10% p.a.
 */
export function AfaSelection({
  baujahr,
  afaModell,
  nutzeSonderAfa,
  onAfaModellChange,
  onNutzeSonderAfaChange,
}: AfaSelectionProps) {
  // Nur bei Baujahr >= 2023 anzeigen
  if (baujahr < 2023) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#ff6b00]" />
        <h3 className="text-sm font-bold text-slate-700">
          Abschreibungsmethode (AfA)
        </h3>
        <Tooltip text="Bei Neubauten ab 2023 kannst du zwischen linearer (3% p.a.) und degressiver (5% vom Restwert) Abschreibung wählen. Die degressive AfA bringt in den ersten Jahren höhere Steuervorteile.">
          <Info className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
        </Tooltip>
      </div>

      {/* AfA-Modell Auswahl */}
      <div className="grid grid-cols-2 gap-3">
        {/* Linear 3% */}
        <button
          onClick={() => {
            onAfaModellChange('linear_3');
            onNutzeSonderAfaChange(false);
          }}
          className={`p-4 rounded-2xl border-2 transition-all text-left ${
            afaModell === 'linear_3'
              ? 'border-[#ff6b00] bg-orange-50 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="font-bold text-slate-700 mb-1">Linear 3%</div>
          <p className="text-xs text-slate-500">
            Konstant 3% p.a. vom Gebäudewert (~33 Jahre)
          </p>
        </button>

        {/* Degressiv 5% */}
        <button
          onClick={() => onAfaModellChange('degressiv_5')}
          className={`p-4 rounded-2xl border-2 transition-all text-left ${
            afaModell === 'degressiv_5'
              ? 'border-[#ff6b00] bg-orange-50 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-700">Degressiv 5%</span>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-xs text-slate-500">
            5% vom Restwert, höhere Anfangs-AfA
          </p>
        </button>
      </div>

      {/* Sonder-AfA Option - nur bei degressiv */}
      {afaModell === 'degressiv_5' && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={nutzeSonderAfa}
              onChange={(e) => onNutzeSonderAfaChange(e.target.checked)}
              className="mt-1 mr-3 accent-green-600 w-5 h-5"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-800">
                  + Sonder-AfA 5% (§ 7b EStG)
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold">
                  Bis zu 10% p.a.!
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Zusätzliche 5% für 4 Jahre bei EH40 + QNG-Siegel und Baukosten unter 5.200€/m².
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Info-Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-800">
          <strong>Hinweis:</strong> Die degressive AfA gilt für Neubauten mit Bauantrag zwischen 10/2023 und 09/2029.
          Die Sonder-AfA erfordert EH40-Standard mit QNG-Siegel. Bitte mit Steuerberater abstimmen.
        </p>
      </div>
    </div>
  );
}
