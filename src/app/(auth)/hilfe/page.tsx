'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookOpen, CircleHelp, Copy, GraduationCap, Mail } from 'lucide-react';
import { KontoSeite, KontoKarte } from '@/components/konto/KontoSeite';
import { useOnboarding } from '@/hooks/useOnboarding';

const KONTAKT = 'info@imvestr.de';

const BEGRIFFE: Array<[string, string]> = [
  ['Cashflow', 'Was nach Miete, Kreditrate, Kosten und Steuern im Monat übrig bleibt.'],
  ['DSCR', 'Wie oft die Miete nach Kosten die Kreditrate deckt. Banken wollen meist mindestens 1,2.'],
  ['AfA', 'Abschreibung: Ein Teil des Gebäudewerts senkt jedes Jahr deine Steuern.'],
  ['EK-Rendite', 'Rendite auf das Geld, das du selbst einbringst.'],
  ['Nettorendite', 'Jahresmiete nach laufenden Kosten im Verhältnis zum Gesamtpreis.'],
];

const FRAGEN: Array<[string, string]> = [
  ['Woher kommen die Marktdaten?', 'Aus einer aktuellen Recherche zu Angeboten und Vergleichsdaten für die Lage der Wohnung. Die Quellen stehen in der Analyse im Tab „Marktvergleich“.'],
  ['Kann ich Eingaben später ändern?', 'Ja. Öffne die Analyse und klick oben auf „Bearbeiten“. Alle Tabs rechnen danach neu.'],
  ['Wie speichere ich eine Analyse?', 'Im Tab „Szenarien & PDF Export“ mit „Analyse speichern“. Gespeicherte Analysen findest du unter „Meine Analysen“. Speichern gehört zu Premium.'],
  ['Wie kündige ich mein Abo?', 'Unter „Abo & Zahlung“ über „Abo verwalten“. Dort kannst du auch Rechnungen herunterladen und die Zahlungsart ändern.'],
  ['Ist das eine Anlageberatung?', 'Nein. imvestr ist ein Rechenwerkzeug. Die Ergebnisse sind Modellrechnungen und ersetzen keine Beratung.'],
];

export default function HilfePage() {
  const router = useRouter();
  const { resetOnboarding } = useOnboarding();

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(KONTAKT);
      toast.success('E-Mail-Adresse kopiert');
    } catch {
      toast.info(KONTAKT);
    }
  };

  return (
    <KontoSeite titel="Hilfe & Fragen" untertitel="Antworten, Begriffe und Kontakt">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <KontoKarte titel="Erste Schritte" icon={GraduationCap}>
          <p className="text-sm text-slate-600">Die Tour zeigt dir Schritt für Schritt, was du wo eingibst.</p>
          <button
            type="button"
            onClick={() => { resetOnboarding(); router.push('/step/a'); }}
            className="mt-3 rounded-xl bg-[#001d3d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#001d3d]/90"
          >
            Tour starten
          </button>
        </KontoKarte>

        <KontoKarte titel="Kontakt" icon={Mail}>
          <p className="text-sm text-slate-600">Etwas stimmt nicht oder du hast eine Frage? Schreib uns.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a href={`mailto:${KONTAKT}`} className="select-all text-[15px] font-bold text-[#001d3d] underline-offset-4 hover:underline">{KONTAKT}</a>
            <button type="button" onClick={kopieren} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-400">
              <Copy size={13} /> Kopieren
            </button>
          </div>
        </KontoKarte>

        <KontoKarte titel="Begriffe kurz erklärt" icon={BookOpen}>
          <dl className="mt-1">
            {BEGRIFFE.map(([begriff, text]) => (
              <div key={begriff} className="grid grid-cols-[110px_1fr] gap-3 border-t border-slate-100 py-2 text-sm first:border-t-0">
                <dt className="font-bold text-[#001d3d]">{begriff}</dt>
                <dd className="text-slate-600">{text}</dd>
              </div>
            ))}
          </dl>
        </KontoKarte>

        <KontoKarte titel="Häufige Fragen" icon={CircleHelp}>
          <div className="mt-1">
            {FRAGEN.map(([frage, antwort]) => (
              <details key={frage} className="group border-t border-slate-100 first:border-t-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5 text-sm font-semibold text-[#001d3d] [&::-webkit-details-marker]:hidden">
                  {frage}
                  <span className="text-lg font-bold leading-none text-[#ff6b00] group-open:hidden">+</span>
                  <span className="hidden text-lg font-bold leading-none text-[#ff6b00] group-open:inline">−</span>
                </summary>
                <p className="pb-3 text-sm text-slate-600">{antwort}</p>
              </details>
            ))}
          </div>
        </KontoKarte>
      </div>
    </KontoSeite>
  );
}
