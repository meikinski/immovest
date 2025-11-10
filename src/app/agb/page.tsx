'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AGBPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--bg))] to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Zurück"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Allgemeine Geschäftsbedingungen</h1>
              <p className="text-sm text-gray-600">
                AGB für die Nutzung von imvestr.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 1 Geltungsbereich
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für die Nutzung
                der Plattform imvestr. (nachfolgend „Plattform") durch registrierte und nicht registrierte
                Nutzer.
              </p>
              <p>
                (2) Anbieter der Plattform ist imvestr., [Adresse], [E-Mail: info@imvestr.de]
                (nachfolgend „Anbieter").
              </p>
              <p>
                (3) Mit der Nutzung der Plattform erklärt sich der Nutzer mit diesen AGB einverstanden.
                Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, der Anbieter
                stimmt ihrer Geltung ausdrücklich schriftlich zu.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 2 Leistungsumfang
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Die Plattform bietet KI-gestützte Analysen von Immobilieninvestitionen, einschließlich
                Rendite- und Cashflow-Berechnungen.
              </p>
              <p>
                (2) Der Anbieter stellt die Plattform in zwei Versionen zur Verfügung:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>
                  <strong>Kostenlose Version:</strong> Limitierte Anzahl von Analysen mit grundlegenden
                  Funktionen
                </li>
                <li>
                  <strong>Premium-Version:</strong> Unbegrenzte Analysen mit erweiterten Funktionen gegen
                  monatliche oder jährliche Gebühr
                </li>
              </ul>
              <p>
                (3) Der Anbieter behält sich das Recht vor, den Funktionsumfang der Plattform jederzeit zu
                erweitern oder einzuschränken, sofern dies für den Nutzer zumutbar ist.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 3 Registrierung und Vertragsschluss
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Die Nutzung bestimmter Funktionen der Plattform erfordert eine kostenlose Registrierung.
              </p>
              <p>
                (2) Mit der Registrierung gibt der Nutzer ein verbindliches Angebot zum Abschluss eines
                Nutzungsvertrages ab. Der Vertrag kommt mit der Bestätigung der Registrierung durch den
                Anbieter zustande.
              </p>
              <p>
                (3) Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu machen
                und diese aktuell zu halten.
              </p>
              <p>
                (4) Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten selbst verantwortlich.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 4 Premium-Abonnement
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Der Nutzer kann ein kostenpflichtiges Premium-Abonnement abschließen. Die aktuellen
                Preise sind auf der Plattform einsehbar.
              </p>
              <p>
                (2) Das Premium-Abonnement verlängert sich automatisch um den gewählten Zeitraum
                (monatlich oder jährlich), sofern es nicht fristgerecht gekündigt wird.
              </p>
              <p>
                (3) Die Kündigungsfrist beträgt einen Monat zum Ende der jeweiligen Laufzeit.
              </p>
              <p>
                (4) Die Kündigung erfolgt über die Plattform oder per E-Mail an{' '}
                <a
                  href="mailto:info@imvestr.de"
                  className="text-[hsl(var(--brand))] hover:underline"
                >
                  info@imvestr.de
                </a>
                .
              </p>
              <p>
                (5) Bei Zahlungsverzug kann der Anbieter das Premium-Abonnement aussetzen.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 5 Widerrufsrecht
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Verbrauchern steht ein gesetzliches Widerrufsrecht zu.
              </p>
              <p>
                (2) Das Widerrufsrecht erlischt bei Verträgen über die Erbringung von Dienstleistungen,
                wenn der Anbieter die Dienstleistung vollständig erbracht hat und mit der Ausführung der
                Dienstleistung erst begonnen hat, nachdem der Verbraucher dazu seine ausdrückliche
                Zustimmung gegeben hat und gleichzeitig seine Kenntnis davon bestätigt hat, dass er sein
                Widerrufsrecht bei vollständiger Vertragserfüllung durch den Anbieter verliert.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 6 Haftungsausschluss und Gewährleistung
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Die durch die Plattform bereitgestellten Analysen und Berechnungen dienen ausschließlich
                zu Informationszwecken und stellen keine Anlageberatung dar.
              </p>
              <p>
                (2) Der Nutzer ist selbst dafür verantwortlich, die Richtigkeit und Vollständigkeit der
                eingegebenen Daten zu überprüfen. Der Anbieter übernimmt keine Haftung für fehlerhafte
                Eingaben des Nutzers.
              </p>
              <p>
                (3) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für
                Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
              </p>
              <p>
                (4) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung einer wesentlichen
                Vertragspflicht (Kardinalpflicht). In diesem Fall ist die Haftung auf den vertragstypischen,
                vorhersehbaren Schaden begrenzt.
              </p>
              <p>
                (5) Der Anbieter übernimmt keine Gewähr für die ständige Verfügbarkeit der Plattform.
                Wartungsarbeiten können zu vorübergehenden Unterbrechungen führen.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 7 Pflichten des Nutzers
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Der Nutzer verpflichtet sich, die Plattform nur im Rahmen der geltenden Gesetze zu nutzen.
              </p>
              <p>
                (2) Der Nutzer ist insbesondere verpflichtet:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>keine rechtswidrigen, beleidigenden oder diffamierenden Inhalte zu übermitteln</li>
                <li>keine Schadsoftware oder schädlichen Code zu übermitteln</li>
                <li>keine technischen Maßnahmen zu umgehen oder die Plattform zu überlasten</li>
                <li>seine Zugangsdaten nicht an Dritte weiterzugeben</li>
              </ul>
              <p>
                (3) Bei Verstößen gegen diese Pflichten kann der Anbieter das Nutzerkonto sperren oder
                löschen.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 8 Urheberrecht und Nutzungsrechte
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Alle Inhalte der Plattform, insbesondere Texte, Grafiken, Bilder und Software,
                unterliegen dem Urheberrecht des Anbieters oder seiner Lizenzgeber.
              </p>
              <p>
                (2) Der Nutzer erhält ein nicht-exklusives, nicht übertragbares Nutzungsrecht an den
                Inhalten der Plattform für die Dauer der Nutzung.
              </p>
              <p>
                (3) Die vom Nutzer erstellten Analysen und Berechnungen dürfen für eigene Zwecke gespeichert
                und verwendet werden.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 9 Datenschutz
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Der Anbieter verarbeitet personenbezogene Daten des Nutzers im Einklang mit den geltenden
                Datenschutzbestimmungen. Weitere Informationen finden Sie in unserer{' '}
                <a
                  href="/datenschutz"
                  className="text-[hsl(var(--brand))] hover:underline"
                >
                  Datenschutzerklärung
                </a>
                .
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 10 Änderungen der AGB
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Der Anbieter behält sich das Recht vor, diese AGB jederzeit zu ändern, sofern dies für
                den Nutzer zumutbar ist.
              </p>
              <p>
                (2) Nutzer werden über Änderungen der AGB per E-Mail oder über die Plattform informiert.
              </p>
              <p>
                (3) Widerspricht der Nutzer den geänderten AGB nicht innerhalb von vier Wochen nach
                Bekanntgabe, gelten die geänderten AGB als angenommen. Der Anbieter wird den Nutzer in
                der Änderungsmitteilung auf diese Folge hinweisen.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 11 Schlussbestimmungen
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Auf Verträge zwischen dem Anbieter und dem Nutzer findet das Recht der Bundesrepublik
                Deutschland unter Ausschluss des UN-Kaufrechts Anwendung.
              </p>
              <p>
                (2) Ist der Nutzer Verbraucher, so gilt diese Rechtswahl nur insoweit, als nicht der
                gewährte Schutz durch zwingende Bestimmungen des Rechts des Staates, in dem der Verbraucher
                seinen gewöhnlichen Aufenthalt hat, entzogen wird.
              </p>
              <p>
                (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die
                Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
              </p>
            </div>
          </section>

          {/* Effective Date */}
          <section className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Stand:</strong> November 2025
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
