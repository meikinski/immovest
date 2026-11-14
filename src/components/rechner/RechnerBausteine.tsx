import Link from 'next/link';
import { BUNDESLAENDER } from '@/config/grunderwerbsteuer';
import { getAllPostsSync } from '@/lib/blog';
import {
  cashflowAufstellung,
  eingabenAusPreset,
  formatEuro,
  formatEuroMitVorzeichen,
  formatProzent,
  rechneCashflow,
} from '@/lib/cashflowAufstellung';
import { formatZahl } from '@/lib/zahlen';
import { alleRechner, rechnerPfad } from '@/content/rechner';
import { istBundeslandInhalt, type BeliebigerRechnerInhalt, type DatenTabelle } from '@/content/rechner/typen';
import { CashflowRechner } from './CashflowRechner';
import { TrackedCtaLink } from './TrackedCtaLink';

/**
 * Bausteine einer Rechner-Seite. Alles außer dem interaktiven Rechner ist eine Server-Komponente
 * und steht damit ohne JavaScript im HTML. Der Rechner selbst wird mit den Preset-Werten
 * server-gerendert und übernimmt beim Hydrieren dieselben Zahlen.
 */

export const ctaOrt = (c: BeliebigerRechnerInhalt) => `rechner:${c.slug}`;

function Tabelle({ t }: { t: DatenTabelle }) {
  return (
    <figure className="not-prose my-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="mb-2 text-left text-base font-bold text-[#001d3d]">{t.titel}</caption>
          <thead>
            <tr>
              {t.spalten.map(s => (
                <th key={s} scope="col" className="border-b-2 border-slate-200 px-3 py-2 text-left font-semibold text-[#001d3d]">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.zeilen.map((z, i) => (
              <tr key={i} className="border-b border-slate-100">
                {z.map((zelle, j) => (j === 0
                  ? <th key={j} scope="row" className="px-3 py-2 text-left font-medium text-[#1d1d1f]">{zelle}</th>
                  : <td key={j} className="px-3 py-2 tabular-nums text-[#1d1d1f]">{zelle}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t.quelle && <figcaption className="mt-2 text-xs text-slate-500">{t.quelle}</figcaption>}
    </figure>
  );
}

/** Rechenbeispiel mit Aufstellung, komplett aus dem Preset berechnet */
function CashflowBeispiel({ c }: { c: BeliebigerRechnerInhalt }) {
  const p = c.preset;
  const { basis, ergebnis: e } = rechneCashflow(p, eingabenAusPreset(p));
  const zeilen = cashflowAufstellung(basis, e);
  const land = BUNDESLAENDER[c.presetBundesland];
  const steuer = e.scSteuerMonat;

  const annahmen: DatenTabelle = {
    titel: 'Annahmen im Beispiel',
    spalten: ['Annahme', 'Wert'],
    zeilen: [
      ['Kaufpreis', formatEuro(e.scKaufpreis)],
      ['Wohnfläche', `${formatZahl(p.flaeche, { max: 1 })} m²`],
      [`Grunderwerbsteuer (${land.name})`, formatProzent(p.grunderwerbsteuerPct)],
      ['Notar und Grundbuch', formatProzent(p.notarPct)],
      ['Makler', formatProzent(p.maklerPct)],
      ['Sonstige Kosten', formatEuro(p.sonstigeKosten)],
      ['Gesamtinvestition', formatEuro(e.scAnschaffung)],
      ['Eigenkapital', formatEuro(e.scEk)],
      ['Darlehen', formatEuro(e.scDarlehen)],
      ['Zins / anfängliche Tilgung', `${formatProzent(e.scZins)} / ${formatProzent(e.scTilgung)}`],
      ['Instandhaltungsrücklage', `${formatZahl(p.instandKalkProQmJahr)} € je m² und Jahr`],
      ['Mietausfall', `${formatProzent(p.mietausfallPct)} der Kaltmiete`],
      ['Abschreibung (AfA)', `${formatEuro(p.afaJaehrlich)} pro Jahr`],
      ['Persönlicher Steuersatz', formatProzent(p.steuersatzPct)],
    ],
  };

  return (
    <section aria-labelledby="beispiel-titel" className="my-10">
      <h2 id="beispiel-titel" className="text-2xl font-extrabold tracking-tight text-[#001d3d]">
        Rechenbeispiel: Cashflow einer vermieteten Wohnung
      </h2>
      <p className="mt-3 leading-relaxed text-[#1d1d1f]">
        Eine 2-Zimmer-Wohnung mit {formatZahl(p.flaeche, { max: 1 })} m² kostet {formatEuro(e.scKaufpreis)}. Mit
        Grunderwerbsteuer ({formatProzent(p.grunderwerbsteuerPct)} in {land.name}), Notar, Makler und sonstigen Kosten
        liegt die Gesamtinvestition bei {formatEuro(e.scAnschaffung)}. Bei {formatEuro(e.scEk)} Eigenkapital finanziert die
        Bank {formatEuro(e.scDarlehen)} zu {formatProzent(e.scZins)} Zins und {formatProzent(e.scTilgung)} anfänglicher
        Tilgung. Das ergibt eine Monatsrate von {formatEuro(e.scRateMonat)}.
      </p>
      <p className="mt-3 leading-relaxed text-[#1d1d1f]">
        Die Wohnung bringt {formatEuro(e.scMiete)} Kaltmiete und {formatEuro(p.hausgeldUmlegbar)} umlagefähiges Hausgeld ein.
        Nach Hausgeld, Rücklage, Zinsen und Tilgung bleiben vor Steuern {formatEuro(e.scCashflowVorSt)} im Monat.{' '}
        {steuer >= 0
          ? <>Weil Miete minus Hausgeld, Zinsen und AfA ein Plus ergibt, fallen beim Steuersatz von {formatProzent(p.steuersatzPct)} rund {formatEuro(steuer)} Steuern im Monat an.</>
          : <>Weil Hausgeld, Zinsen und AfA die Miete übersteigen, gibt es beim Steuersatz von {formatProzent(p.steuersatzPct)} rund {formatEuro(-steuer)} im Monat vom Finanzamt zurück.</>}{' '}
        Nach Steuern bleiben <strong>{formatEuro(e.scCashflowAfterTax)} pro Monat</strong>.
      </p>

      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm" data-testid="cashflow-aufstellung">
          <caption className="mb-2 text-left text-base font-bold text-[#001d3d]">Cashflow-Aufstellung pro Monat</caption>
          <thead>
            <tr>
              <th scope="col" className="border-b-2 border-slate-200 px-3 py-2 text-left font-semibold text-[#001d3d]">Posten</th>
              <th scope="col" className="border-b-2 border-slate-200 px-3 py-2 text-right font-semibold text-[#001d3d]">Betrag pro Monat</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map(z => (
              <tr key={z.key} className={z.summe ? 'border-y-2 border-slate-200 bg-slate-50 font-bold' : 'border-b border-slate-100'}>
                <th scope="row" className="px-3 py-2 text-left font-medium text-[#1d1d1f]">{z.summe ? <strong>= {z.label}</strong> : z.label}</th>
                <td className="px-3 py-2 text-right tabular-nums text-[#1d1d1f]">
                  {z.summe ? <strong>{formatEuro(z.betrag)}</strong> : formatEuroMitVorzeichen(z.betrag)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">Beträge auf volle Euro gerundet. Gerechnet wird der erste Monat eines Annuitätendarlehens.</p>
      </div>

      <Tabelle t={annahmen} />
    </section>
  );
}

/** Einleitung, Rechner, Rechenbeispiel, Datentabelle, Landestext und FAQ */
export function RechnerInhaltBlock({ c }: { c: BeliebigerRechnerInhalt }) {
  return (
    <div data-rechner={c.slug}>
      <div className="space-y-4 text-lg leading-relaxed text-[#1d1d1f]">
        {c.intro.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      {c.art === 'cashflow' && (
        <CashflowRechner preset={c.preset} presetBundesland={c.presetBundesland} seitenId={c.slug} />
      )}

      {c.art === 'cashflow' && <CashflowBeispiel c={c} />}

      {istBundeslandInhalt(c) && (
        <section className="my-10 space-y-4 leading-relaxed text-[#1d1d1f]">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#001d3d]">Was in {BUNDESLAENDER[c.bundesland].name} gilt</h2>
          {c.landesText.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      )}

      {c.datenTabelle && <Tabelle t={c.datenTabelle} />}

      <section aria-labelledby="rechner-faq" className="my-10">
        <h2 id="rechner-faq" className="text-2xl font-extrabold tracking-tight text-[#001d3d]">Fragen zum Rechner</h2>
        <div className="mt-4 space-y-5">
          {c.faq.map(e => (
            <div key={e.frage}>
              <h3 className="text-lg font-bold text-[#001d3d]">{e.frage}</h3>
              <p className="mt-1 leading-relaxed text-[#1d1d1f]">{e.antwort}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type Ziel = { titel: string; pfad: string };

/** Ziel eines relatedSlugs-Eintrags: Rechner (bevorzugt) oder Blogbeitrag */
function zielFuer(slug: string): Ziel | null {
  const rechner = alleRechner().find(r => r.slug === slug);
  if (rechner) return { titel: rechner.h1, pfad: rechnerPfad(rechner) };
  const eingebettet = alleRechner().find(r => r.ort.typ === 'blog' && r.ort.postSlug === slug);
  if (eingebettet) return { titel: eingebettet.h1, pfad: rechnerPfad(eingebettet) };
  const post = getAllPostsSync().find(p => p.slug === slug);
  return post ? { titel: post.title, pfad: `/blog/${post.slug}` } : null;
}

/** Drei verwandte Seiten und der CTA zur vollständigen Analyse */
export function RechnerLinks({ c }: { c: BeliebigerRechnerInhalt }) {
  const ziele = c.relatedSlugs.map(zielFuer).filter((z): z is Ziel => z !== null);
  return (
    <>
      <nav aria-labelledby="weitere-rechner" className="not-prose mt-14">
        <h2 id="weitere-rechner" className="text-xl font-extrabold tracking-tight text-[#001d3d]">Weitere Kennzahlen berechnen</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {ziele.map(z => (
            <li key={z.pfad}>
              <Link
                href={z.pfad}
                className="block h-full rounded-xl border border-slate-200 p-4 text-sm font-semibold text-[#001d3d] transition-colors hover:border-[#ff6b00] hover:text-[#ff6b00]"
              >
                {z.titel} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="not-prose mt-12 rounded-2xl bg-[#001d3d] px-8 py-10 text-center shadow-lg">
        <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white">Deine Wohnung vollständig analysieren</h2>
        <p className="mx-auto mb-7 max-w-md text-sm leading-relaxed text-gray-300">
          Link aus ImmoScout24 oder Immowelt einfügen oder Daten eingeben: Cashflow, Rendite und DSCR sofort, ohne Anmeldung.
          Mit kostenlosem Konto kommen Marktvergleich, Prognose, Szenarien und PDF-Report dazu.
        </p>
        <TrackedCtaLink
          href="/input-method"
          ctaName="volle_analyse"
          ctaLocation={ctaOrt(c)}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff6b00] px-7 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#e05e00]"
        >
          Vollständige Analyse starten →
        </TrackedCtaLink>
      </div>
    </>
  );
}

/** Link-Block in Blogbeiträgen ohne eigenen Rechner */
export function PassenderRechnerBlock({ c, postSlug }: { c: BeliebigerRechnerInhalt; postSlug: string }) {
  return (
    <aside className="not-prose my-10 rounded-2xl border border-[#ff6b00]/30 bg-orange-50 p-6" aria-label="Passender Rechner">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#ff6b00]">Rechner</p>
      <p className="mt-1 text-lg font-bold text-[#001d3d]">{c.h1}</p>
      <p className="mt-1 text-sm text-slate-600">Kostenlos und ohne Anmeldung, mit Rechenbeispiel.</p>
      <TrackedCtaLink
        href={rechnerPfad(c)}
        ctaName="rechner_link"
        ctaLocation={`blog:${postSlug}`}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#ff6b00] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#e05e00]"
      >
        Zum Rechner <span aria-hidden="true">→</span>
      </TrackedCtaLink>
    </aside>
  );
}
