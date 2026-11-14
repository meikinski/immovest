import type { RechnerInhalt } from './typen';
import { BEISPIEL_BASIS } from '@/lib/beispiel-report';

/**
 * Cashflow-Rechner, eingebettet in den bestehenden Beitrag /blog/cashflow-immobilie-berechnen
 * (rankt bereits für "cashflow immobilie berechnen", deshalb keine zweite URL).
 *
 * Vorbelegung: die Beispielwohnung der Startseite (BEISPIEL_BASIS), damit Rechner, Startseite und
 * Beispielreport dieselben Zahlen zeigen. Alle Beträge im Rechenbeispiel werden daraus mit
 * berechneSzenario() erzeugt, nichts ist hier fest eingetragen.
 */
const inhalt: RechnerInhalt = {
  slug: 'cashflow-immobilie-berechnen',
  art: 'cashflow',
  ort: { typ: 'blog', postSlug: 'cashflow-immobilie-berechnen' },
  h1: 'Cashflow Immobilie berechnen: Rechner, Formel und Beispiel',
  title: 'Cashflow Immobilie berechnen: Rechner mit Beispiel | imvestr',
  metaDescription:
    'Immobilien-Cashflow berechnen ohne Anmeldung: Cashflow-Rechner mit Beispiel aus Miete, Hausgeld, Zins, Tilgung und Steuer, dazu Formel und Richtwerte.',
  intro: [
    'Mit dem Cashflow-Rechner siehst du sofort, was eine vermietete Wohnung dir jeden Monat einbringt oder kostet: vor Steuern und nach Steuern. Die Felder sind mit einer echten Beispielwohnung vorbelegt. Trage deine eigenen Zahlen ein, das Ergebnis rechnet sich bei jeder Änderung neu. Ein Konto brauchst du dafür nicht.',
    'Der Rechner nutzt dieselbe Rechnung wie die vollständige Analyse in imvestr: Kaltmiete und umlagefähiges Hausgeld auf der einen Seite, Hausgeld, Rücklage für Instandhaltung, Mietausfall, Zinsen und Tilgung auf der anderen. Danach kommt der Steuereffekt aus Abschreibung (AfA), Zinsen und deinem persönlichen Steuersatz.',
  ],
  preset: BEISPIEL_BASIS,
  presetBundesland: 'SN',
  faq: [
    {
      frage: 'Wie rechnet der Cashflow-Rechner?',
      antwort:
        'Cashflow vor Steuern = Kaltmiete + umlagefähiges Hausgeld − Hausgeld gesamt − Instandhaltungsrücklage − Mietausfall − Zinsen − Tilgung. Gerechnet wird der erste Monat eines Annuitätendarlehens. Das Darlehen ist die Gesamtinvestition (Kaufpreis plus Grunderwerbsteuer, Notar, Makler und sonstige Kosten) abzüglich deines Eigenkapitals.',
    },
    {
      frage: 'Wie wird der Steuereffekt berechnet?',
      antwort:
        'Zu versteuern sind Warmmiete minus Hausgeld, Zinsen und Abschreibung (AfA). Dieser Betrag mal deinem persönlichen Steuersatz ist der Steuereffekt. Ist er positiv, zahlst du Steuern auf die Mieteinnahmen und der Cashflow nach Steuern sinkt. Ist er negativ, bekommst du Steuern zurück und der Cashflow steigt. Tilgung und kalkulatorische Rücklage sind nicht abziehbar.',
    },
    {
      frage: 'Warum zählt die Tilgung zum Cashflow, obwohl sie Vermögen aufbaut?',
      antwort:
        'Weil sie jeden Monat von deinem Konto abgeht. Der Cashflow beantwortet die Frage, ob die Wohnung deine Liquidität belastet. Dass die Tilgung gleichzeitig deine Restschuld senkt, zeigt die Vermögensentwicklung in der vollständigen Analyse.',
    },
    {
      frage: 'Welche Werte sind im Rechner voreingestellt?',
      antwort:
        'Die 2-Zimmer-Wohnung in Leipzig-Süd von unserer Startseite. Notar- und Maklerkosten, Instandhaltung je Quadratmeter, Mietausfall und Abschreibung stammen aus diesem Beispiel und stehen unter „Annahmen“. Die Grunderwerbsteuer richtet sich nach dem gewählten Bundesland.',
    },
    {
      frage: 'Brauche ich ein Konto, um den Cashflow zu berechnen?',
      antwort:
        'Nein. Der Rechner und die Kennzahlen der vollständigen Analyse funktionieren ohne Anmeldung. Ein kostenloses Konto brauchst du erst, wenn du eine Wohnung speichern oder Marktvergleich, Prognose, Szenarien und PDF-Report nutzen willst.',
    },
  ],
  relatedSlugs: ['nettomietrendite-berechnen', 'afa-immobilien-steuervorteil', 'dscr-immobilien'],
  verlinktVon: [
    'nettomietrendite-berechnen',
    'afa-immobilien-steuervorteil',
    'dscr-immobilien',
    'eigenkapitalrendite-immobilie',
    'immobilien-investment-einsteiger',
    'immobilien-rendite-tool-vergleich',
    'abschreibungen-neubau',
    'abschreibung-neubau-2026',
    'afa-berechnen-excel',
  ],
  lastModified: '2026-11-14',
};

export default inhalt;
