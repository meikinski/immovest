'use client';

import { useMemo } from 'react';
import { Info, CheckCircle, XCircle, Zap, TrendingUp } from 'lucide-react';
import { pruefeAfaBerechtigung, AfaPropertyData } from '@/lib/afaCalculator';
import { AfaModell, ImmobilienTyp, KfwStandard } from '@/store/useImmoStore';
import { Tooltip } from './Tooltip';

interface AfaSelectionProps {
  immobilienTyp: ImmobilienTyp;
  kaufdatum: string;
  bauantragsdatum: string | null;
  kfwStandard: KfwStandard;
  hatQngSiegel: boolean;
  kaufpreis: number;
  wohnflaeche: number;
  afaModell: AfaModell;
  nutzeSonderAfa: boolean;
  onImmobilienTypChange: (v: ImmobilienTyp) => void;
  onKaufdatumChange: (v: string) => void;
  onBauantragsdatumChange: (v: string | null) => void;
  onKfwStandardChange: (v: KfwStandard) => void;
  onHatQngSiegelChange: (v: boolean) => void;
  onAfaModellChange: (v: AfaModell) => void;
  onNutzeSonderAfaChange: (v: boolean) => void;
}

/**
 * AfA-Turbo Auswahlkomponente
 *
 * Ermöglicht die Auswahl des AfA-Modells und zeigt an,
 * welche Optionen aufgrund der Immobilieneigenschaften verfügbar sind.
 */
export function AfaSelection({
  immobilienTyp,
  kaufdatum,
  bauantragsdatum,
  kfwStandard,
  hatQngSiegel,
  kaufpreis,
  wohnflaeche,
  afaModell,
  nutzeSonderAfa,
  onImmobilienTypChange,
  onKaufdatumChange,
  onBauantragsdatumChange,
  onKfwStandardChange,
  onHatQngSiegelChange,
  onAfaModellChange,
  onNutzeSonderAfaChange,
}: AfaSelectionProps) {
  // Berechtigungs-Prüfung
  const propertyData: AfaPropertyData = useMemo(
    () => ({
      immobilienTyp,
      kaufdatum,
      bauantragsdatum,
      kfwStandard,
      hatQngSiegel,
      kaufpreis,
      wohnflaeche,
    }),
    [immobilienTyp, kaufdatum, bauantragsdatum, kfwStandard, hatQngSiegel, kaufpreis, wohnflaeche]
  );

  const berechtigung = useMemo(
    () => pruefeAfaBerechtigung(propertyData),
    [propertyData]
  );

  // Formatierung
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#ff6b00]" />
        <h3 className="text-sm font-bold text-slate-700">
          AfA-Turbo (Abschreibung)
        </h3>
        <Tooltip text="Die neuen AfA-Regelungen ab 2023 ermöglichen bis zu 10% jährliche Abschreibung für Neubauten mit EH40-Standard und QNG-Siegel.">
          <Info className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
        </Tooltip>
      </div>

      {/* Immobilientyp */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
          Immobilientyp
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['neubau', 'bestand', 'sanierung'] as ImmobilienTyp[]).map((typ) => (
            <button
              key={typ}
              onClick={() => onImmobilienTypChange(typ)}
              className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                immobilienTyp === typ
                  ? 'bg-[#ff6b00] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {typ === 'neubau' && 'Neubau'}
              {typ === 'bestand' && 'Bestand'}
              {typ === 'sanierung' && 'Sanierung'}
            </button>
          ))}
        </div>
      </div>

      {/* Kaufdatum */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
          Kaufdatum / Anschaffungsdatum
        </label>
        <input
          type="date"
          value={kaufdatum}
          onChange={(e) => onKaufdatumChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
        />
      </div>

      {/* Bauantragsdatum - nur bei Neubau */}
      {immobilienTyp === 'neubau' && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] flex items-center gap-1">
            Bauantragsdatum (optional)
            <Tooltip text="Für degressive AfA muss der Bauantrag zwischen 01.10.2023 und 30.09.2029 gestellt worden sein.">
              <Info className="w-3 h-3 text-slate-400" />
            </Tooltip>
          </label>
          <input
            type="date"
            value={bauantragsdatum || ''}
            onChange={(e) => onBauantragsdatumChange(e.target.value || null)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
          />
        </div>
      )}

      {/* AfA-Modell Auswahl */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
          AfA-Modell wählen
        </label>

        {/* Linear 2% */}
        <label
          className={`flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${
            afaModell === 'linear_2'
              ? 'border-[#ff6b00] bg-orange-50 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            type="radio"
            name="afaModell"
            value="linear_2"
            checked={afaModell === 'linear_2'}
            onChange={() => onAfaModellChange('linear_2')}
            className="mt-1 mr-3 accent-[#ff6b00]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Linear 2%</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Für Immobilien vor 2023 (50 Jahre Abschreibungsdauer)
            </p>
          </div>
        </label>

        {/* Linear 3% */}
        <label
          className={`flex items-start p-4 border rounded-2xl transition-all ${
            !berechtigung.linear_3
              ? 'opacity-50 cursor-not-allowed border-slate-200'
              : afaModell === 'linear_3'
              ? 'border-[#ff6b00] bg-orange-50 shadow-sm cursor-pointer'
              : 'border-slate-200 hover:border-slate-300 cursor-pointer'
          }`}
        >
          <input
            type="radio"
            name="afaModell"
            value="linear_3"
            checked={afaModell === 'linear_3'}
            onChange={() => berechtigung.linear_3 && onAfaModellChange('linear_3')}
            disabled={!berechtigung.linear_3}
            className="mt-1 mr-3 accent-[#ff6b00]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Linear 3%</span>
              {berechtigung.linear_3 ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verfügbar
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Nicht verfügbar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Für Immobilien ab 2023 (~33 Jahre Abschreibungsdauer)
            </p>
            {!berechtigung.linear_3 && berechtigung.gruende.keineLinear3 && (
              <p className="text-xs text-red-500 mt-1">
                {berechtigung.gruende.keineLinear3}
              </p>
            )}
          </div>
        </label>

        {/* Degressiv 5% */}
        <label
          className={`flex items-start p-4 border rounded-2xl transition-all ${
            !berechtigung.degressiv_5
              ? 'opacity-50 cursor-not-allowed border-slate-200'
              : afaModell === 'degressiv_5'
              ? 'border-[#ff6b00] bg-orange-50 shadow-sm cursor-pointer'
              : 'border-slate-200 hover:border-slate-300 cursor-pointer'
          }`}
        >
          <input
            type="radio"
            name="afaModell"
            value="degressiv_5"
            checked={afaModell === 'degressiv_5'}
            onChange={() => berechtigung.degressiv_5 && onAfaModellChange('degressiv_5')}
            disabled={!berechtigung.degressiv_5}
            className="mt-1 mr-3 accent-[#ff6b00]"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Degressiv 5%</span>
              <Zap className="w-4 h-4 text-yellow-500" />
              {berechtigung.degressiv_5 ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verfügbar
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Nicht verfügbar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              5% vom Restbuchwert für Neubauten 10/2023 - 09/2029
            </p>
            {!berechtigung.degressiv_5 && berechtigung.gruende.keineDegressiv && (
              <p className="text-xs text-red-500 mt-1">
                {berechtigung.gruende.keineDegressiv}
              </p>
            )}
          </div>
        </label>
      </div>

      {/* Sonder-AfA - nur bei degressiv und wenn berechtigt */}
      {afaModell === 'degressiv_5' && (
        <div className="space-y-3">
          {/* EH40 / QNG-Siegel Auswahl */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">
                KfW-Standard
              </label>
              <select
                value={kfwStandard || 'kein'}
                onChange={(e) =>
                  onKfwStandardChange(
                    e.target.value === 'kein' ? null : (e.target.value as KfwStandard)
                  )
                }
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-base font-bold text-[#001d3d] focus:ring-4 focus:ring-[#ff6b00]/10 focus:border-[#ff6b00] outline-none transition-all shadow-sm"
              >
                <option value="kein">Kein KfW</option>
                <option value="EH55">EH55</option>
                <option value="EH40">EH40</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] flex items-center gap-1">
                QNG-Siegel
                <Tooltip text="Qualitätssiegel Nachhaltiges Gebäude - erforderlich für die Sonderabschreibung">
                  <Info className="w-3 h-3 text-slate-400" />
                </Tooltip>
              </label>
              <button
                onClick={() => onHatQngSiegelChange(!hatQngSiegel)}
                className={`w-full py-4 px-5 rounded-2xl text-base font-bold transition-all ${
                  hatQngSiegel
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {hatQngSiegel ? 'Ja, vorhanden' : 'Nein'}
              </button>
            </div>
          </div>

          {/* Sonder-AfA Checkbox */}
          {berechtigung.sonderAfa ? (
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
                      + Sonderabschreibung 5%
                    </span>
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold">
                      Bis zu 10% p.a.!
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Zusätzliche 5% Sonderabschreibung nach § 7b EStG für die ersten 4 Jahre.
                    Zusammen mit der degressiven AfA bis zu <strong>10% pro Jahr</strong> möglich!
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-start">
                <XCircle className="w-5 h-5 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-600">
                    Sonderabschreibung nicht verfügbar
                  </span>
                  {berechtigung.gruende.keineSonderAfa && (
                    <p className="text-sm text-slate-500 mt-1">
                      {berechtigung.gruende.keineSonderAfa}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Voraussetzungen: EH40-Standard + QNG-Siegel + max. 5.200€/m²
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info-Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <p className="text-sm text-blue-800">
          <strong>Hinweis:</strong> Die dargestellten AfA-Optionen dienen der Berechnung
          und ersetzen keine Steuerberatung. Bitte konsultieren Sie Ihren Steuerberater
          für die optimale Wahl in Ihrer Situation.
        </p>
      </div>
    </div>
  );
}
