'use client';

import React from 'react';
import { Info, type LucideIcon } from 'lucide-react';
import { Tooltip } from '@/components/Tooltip';

export type KpiRating = 'good' | 'ok' | 'bad';

const RATING_STYLES: Record<KpiRating, { pill: string; value: string }> = {
  good: { pill: 'bg-emerald-50 text-emerald-700', value: 'text-emerald-600' },
  ok: { pill: 'bg-amber-50 text-amber-700', value: 'text-amber-600' },
  bad: { pill: 'bg-red-50 text-red-700', value: 'text-red-600' },
};

export function KpiTile({
  id,
  icon: Icon,
  label,
  value,
  unit,
  caption,
  rating,
  ratingLabel,
  colorValue = false,
  help,
  onShowFormula,
}: {
  id?: string;
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  rating?: KpiRating;
  ratingLabel?: string;
  /** Wert selbst einfärben (z. B. Cashflow), sonst neutral in Navy */
  colorValue?: boolean;
  help: string;
  onShowFormula?: () => void;
}) {
  const valueColor = colorValue && rating ? RATING_STYLES[rating].value : 'text-[#001d3d]';

  return (
    <div
      id={id}
      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={16} className="text-[#ff6b00] shrink-0" />
          <span className="text-xs font-semibold text-slate-600 truncate">{label}</span>
          <Tooltip
            text={(
              <div className="space-y-2">
                <p className="text-xs text-slate-700">{help}</p>
                {onShowFormula && (
                  <button
                    type="button"
                    className="text-xs font-bold text-[#ff6b00] hover:text-[#ff8c00] underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowFormula();
                    }}
                  >
                    Wie wird das berechnet?
                  </button>
                )}
              </div>
            )}
          >
            <Info size={13} className="text-slate-400 cursor-help shrink-0" />
          </Tooltip>
        </div>
        {rating && ratingLabel && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${RATING_STYLES[rating].pill}`}>
            {ratingLabel}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className={`text-3xl font-bold tracking-tight tabular-nums ${valueColor}`}>{value}</span>
        {unit && <span className="text-base font-semibold text-slate-400">{unit}</span>}
      </div>
      {caption && <p className="mt-1 text-xs text-slate-500">{caption}</p>}
    </div>
  );
}
