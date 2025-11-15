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
              <h1 className="text-xl font-bold text-gray-900">Allgemeine Geschäftsbedingungen (AGB) für imvestr</h1>
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
              § 1 Geltungsbereich und Anbieterin
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Diese Allgemeinen Geschäftsbedingungen (&bdquo;AGB&ldquo;) gelten für die Nutzung der Plattform
                &bdquo;imvestr&ldquo; (nachfolgend &bdquo;Plattform&ldquo;) durch registrierte und nicht registrierte Nutzer
                (nachfolgend zusammen &bdquo;Nutzer&ldquo;).
              </p>
              <p>
                (2) Anbieterin der Plattform ist:
              </p>
              <p className="pl-4">
                Meike Hüttl<br />
                handelnd unter &bdquo;imvestr&ldquo;<br />
                Genter Straße 19<br />
                50672 Köln<br />
                E-Mail: info@imvestr.de
              </p>
              <p>
                (nachfolgend &bdquo;Anbieterin&ldquo;).
              </p>
              <p>
                (3) Mit der Nutzung der Plattform bzw. der Registrierung erklärt sich der Nutzer mit
                diesen AGB einverstanden. Abweichende oder entgegenstehende Bedingungen des Nutzers finden
                keine Anwendung, es sei denn, die Anbieterin stimmt ihrer Geltung ausdrücklich in Textform zu.
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
                (1) Die Plattform bietet ein digitales, KI-gestütztes Analysetool für Immobilieninvestitionen.
                Dazu gehören insbesondere:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Berechnungen und Modellierungen zu Rendite, Cashflow und weiteren Kennzahlen sowie</li>
                <li>automatisierte, KI-basierte Erläuterungen und Kommentare zu den eingegebenen Daten.</li>
              </ul>
              <p>
                (2) Die Anbieterin stellt die Plattform in verschiedenen Versionen zur Verfügung, insbesondere:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>
                  <strong>Kostenlose Version:</strong> Limitierter Funktionsumfang bzw. begrenzte Anzahl an Analysen.
                </li>
                <li>
                  <strong>Premium-Version:</strong> Erweiterter Funktionsumfang und höhere bzw. unbegrenzte
                  Nutzungskontingente gegen eine wiederkehrende Vergütung (monatlich oder jährlich).
                </li>
              </ul>
              <p>
                Die jeweils aktuellen Versionen, Funktionen und Preise sind auf der Plattform einsehbar.
              </p>
              <p>
                (3) Die Plattform dient ausschließlich Informations- und Planungszwecken. Die Ergebnisse
                beruhen teilweise auf Annahmen, externen Datenquellen und KI-Modellen. Sie können die
                individuelle Beratung durch Banken, Finanzierungsberater, Steuerberater oder Rechtsanwälte
                nicht ersetzen.
              </p>
              <p>
                (4) Die Anbieterin ist berechtigt, den Funktionsumfang der Plattform jederzeit zu ändern,
                zu erweitern oder einzuschränken, soweit dies für den Nutzer zumutbar ist. Ein Anspruch auf
                Beibehaltung bestimmter – insbesondere kostenloser – Funktionen besteht nicht.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 3 Registrierung und Nutzerkonto
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Die Nutzung bestimmter Funktionen der Plattform setzt eine Registrierung und das
                Anlegen eines Nutzerkontos voraus.
              </p>
              <p>
                (2) Mit Abschluss des Registrierungsprozesses gibt der Nutzer ein Angebot auf Abschluss
                eines unentgeltlichen Nutzungsvertrags über die Nutzung der Plattform ab. Der Vertrag
                kommt zustande, wenn die Anbieterin die Registrierung bestätigt oder den Zugang zur
                Plattform freischaltet.
              </p>
              <p>
                (3) Der Nutzer ist verpflichtet, bei der Registrierung und späteren Nutzung wahrheitsgemäße
                und vollständige Angaben zu machen und diese bei Änderungen unverzüglich zu aktualisieren.
              </p>
              <p>
                (4) Der Nutzer hat seine Zugangsdaten (insbesondere Passwort) geheim zu halten und vor dem
                Zugriff Dritter zu schützen. Eine Weitergabe an Dritte ist nicht gestattet. Der Nutzer ist
                verpflichtet, die Anbieterin bei Verdacht eines Missbrauchs des Kontos unverzüglich zu
                informieren.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 4 Premium-Abonnement und Zahlungsbedingungen
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Der Nutzer kann über die Plattform ein kostenpflichtiges Premium-Abonnement (&bdquo;Premium&ldquo;)
                abschließen. Die Laufzeiten (z. B. monatlich oder jährlich) sowie die jeweiligen Preise und
                Leistungen ergeben sich aus der zum Zeitpunkt des Vertragsschlusses auf der Plattform
                dargestellten Leistungsbeschreibung.
              </p>
              <p>
                (2) Mit Auswahl eines Premium-Abonnements und Abschluss des Zahlungsprozesses kommt ein
                kostenpflichtiger Vertrag zwischen dem Nutzer und der Anbieterin zustande.
              </p>
              <p>
                (3) Das Premium-Abonnement verlängert sich jeweils automatisch um die gewählte Laufzeit,
                sofern der Nutzer nicht fristgerecht kündigt.
              </p>
              <p>
                (4) Die Kündigung ist jederzeit mit Wirkung zum Ende der jeweiligen Mindestlaufzeit möglich
                und kann über die auf der Plattform bereitgestellte Kontoverwaltung oder per E-Mail an{' '}
                <a
                  href="mailto:info@imvestr.de"
                  className="text-[hsl(var(--brand))] hover:underline"
                >
                  info@imvestr.de
                </a>
                {' '}erfolgen. Bereits gezahlte Entgelte werden im Falle einer ordentlichen Kündigung für
                den laufenden Zeitraum nicht anteilig erstattet.
              </p>
              <p>
                (5) Die Vergütung ist jeweils im Voraus für die gesamte Laufzeit fällig. Die Abrechnung
                erfolgt über die auf der Plattform angebotenen Zahlungsmethoden und ggf. über eingebundene
                Zahlungsdienstleister.
              </p>
              <p>
                (6) Gerät der Nutzer mit Zahlungen in Verzug, ist die Anbieterin berechtigt, den Zugang
                zu Premium-Funktionen vorübergehend zu sperren oder bei fortbestehendem Verzug den Vertrag
                außerordentlich zu kündigen.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 5 Widerrufsrecht für Verbraucher
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Ist der Nutzer Verbraucher im Sinne des § 13 BGB, steht ihm bei Abschluss eines
                entgeltlichen Vertrags über die Plattform grundsätzlich ein gesetzliches Widerrufsrecht zu.
                Die Einzelheiten einschließlich der Widerrufsfrist und des Ablaufs ergeben sich aus der
                gesonderten Widerrufsbelehrung, die dem Nutzer beim Abschluss des Premium-Abonnements zur
                Verfügung gestellt wird.
              </p>
              <p>
                (2) Das Widerrufsrecht kann vorzeitig erlöschen, wenn die Anbieterin die vertraglich
                geschuldete Leistung vollständig erbracht hat, nachdem der Verbraucher ausdrücklich
                zugestimmt hat, dass die Anbieterin vor Ablauf der Widerrufsfrist mit der Ausführung der
                Leistung beginnt, und gleichzeitig seine Kenntnis davon bestätigt hat, dass er bei
                vollständiger Vertragserfüllung sein Widerrufsrecht verliert.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 6 Keine Anlageberatung, Haftung und Gewährleistung
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Die durch die Plattform bereitgestellten Berechnungen, Analysen und Kommentare dienen
                ausschließlich Informationszwecken. Sie stellen insbesondere keine Anlageberatung,
                Finanzierungsberatung, Rechtsberatung oder Steuerberatung dar und sind keine Empfehlung
                zum Kauf oder Verkauf bestimmter Immobilien.
              </p>
              <p>
                (2) Die Ergebnisse basieren auf den Eingaben des Nutzers sowie auf externen Datenquellen
                und statistischen bzw. KI-basierten Modellen. Der Nutzer ist selbst dafür verantwortlich,
                die Richtigkeit, Vollständigkeit und Plausibilität seiner Eingaben zu prüfen und die
                Ergebnisse kritisch zu hinterfragen.
              </p>
              <p>
                (3) Die Anbieterin haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für
                Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
              </p>
              <p>
                (4) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (&bdquo;Kardinalpflichten&ldquo;)
                ist die Haftung der Anbieterin auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
                Kardinalpflichten sind solche Pflichten, deren Erfüllung die ordnungsgemäße Durchführung
                des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Nutzer regelmäßig
                vertrauen darf.
              </p>
              <p>
                (5) Im Übrigen ist die Haftung der Anbieterin bei leicht fahrlässigen Pflichtverletzungen
                ausgeschlossen. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
              </p>
              <p>
                (6) Die Anbieterin übernimmt keine Gewähr für die ununterbrochene Verfügbarkeit der
                Plattform. Wartungen, Sicherheits- oder Kapazitätsgründe sowie Ereignisse, die nicht im
                Einflussbereich der Anbieterin liegen (z. B. Störungen von öffentlichen Kommunikationsnetzen,
                Ausfälle von Hosting-Providern), können zu kurzzeitigen Störungen oder Unterbrechungen führen.
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
                (1) Der Nutzer verpflichtet sich, die Plattform nur im Rahmen der geltenden Gesetze sowie
                dieser AGB zu nutzen.
              </p>
              <p>
                (2) Der Nutzer ist insbesondere verpflichtet,
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>keine rechtswidrigen, beleidigenden, diskriminierenden oder diffamierenden Inhalte über die Plattform zu verbreiten,</li>
                <li>keine Viren, Trojaner oder sonstige Schadsoftware zu übermitteln,</li>
                <li>keine technischen Schutzmaßnahmen oder Sicherheitssysteme der Plattform zu umgehen,</li>
                <li>die Plattform nicht durch automatisierte Abfragen oder sonstige Maßnahmen zu überlasten,</li>
                <li>seine Zugangsdaten nicht an Dritte weiterzugeben.</li>
              </ul>
              <p>
                (3) Bei Verstößen gegen diese Pflichten ist die Anbieterin berechtigt, den Zugang des
                Nutzers vorübergehend zu sperren oder das Nutzerkonto dauerhaft zu löschen und vom Vertrag
                zurückzutreten bzw. diesen außerordentlich zu kündigen. Weitergehende Ansprüche,
                insbesondere auf Schadensersatz, bleiben vorbehalten.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              § 8 Urheberrechte und Nutzungsrechte
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                (1) Die Inhalte der Plattform, insbesondere Texte, Konzepte, Grafiken, Logos, Bilder,
                Videos und Software, sind urheber- und/oder kennzeichenrechtlich geschützt. Rechteinhaberin
                ist die Anbieterin oder ihre jeweiligen Lizenzgeber.
              </p>
              <p>
                (2) Der Nutzer erhält ein einfaches, nicht übertragbares und nicht unterlizenzierbares
                Nutzungsrecht an der Plattform und den bereitgestellten Inhalten, beschränkt auf die
                vertragsgemäße Nutzung im Rahmen dieser AGB.
              </p>
              <p>
                (3) Die durch den Nutzer initiativ erstellten Analysen, Berichte und Berechnungen darf der
                Nutzer für eigene Zwecke speichern, ausdrucken und weiterverwenden, soweit dies nicht gegen
                Rechte Dritter oder diese AGB verstößt.
              </p>
              <p>
                (4) Eine über den vertraglich vorgesehenen Umfang hinausgehende Nutzung, insbesondere das
                systematische Auslesen, Kopieren oder Weiterverkaufen von Inhalten der Plattform, ist
                untersagt.
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
                Die Anbieterin verarbeitet personenbezogene Daten des Nutzers ausschließlich im Rahmen der
                geltenden Datenschutzgesetze. Einzelheiten zur Verarbeitung personenbezogener Daten, zu
                Zwecken, Rechtsgrundlagen und Rechten des Nutzers ergeben sich aus der Datenschutzerklärung,
                abrufbar unter:{' '}
                <a
                  href="/datenschutz"
                  className="text-[hsl(var(--brand))] hover:underline"
                >
                  [URL zur Datenschutzerklärung einfügen]
                </a>
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
                (1) Die Anbieterin ist berechtigt, diese AGB mit Wirkung für die Zukunft zu ändern, sofern
                hierfür ein sachlicher Grund besteht (z. B. Anpassung an gesetzliche Vorgaben, Änderung der
                Rechtsprechung, Erweiterung oder Änderung von Leistungen).
              </p>
              <p>
                (2) Über Änderungen der AGB wird die Anbieterin den Nutzer rechtzeitig in Textform (z. B.
                per E-Mail oder Hinweis in der Plattform) informieren.
              </p>
              <p>
                (3) Widerspricht der Nutzer den geänderten AGB nicht innerhalb von vier Wochen nach Zugang
                der Änderungsmitteilung in Textform, gelten die geänderten AGB als angenommen. Auf das
                Widerspruchsrecht und die Frist wird die Anbieterin in der Änderungsmitteilung besonders
                hinweisen. Im Falle des Widerspruchs kann die Anbieterin das Nutzungsverhältnis ordentlich
                kündigen.
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
                (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts
                (CISG). Ist der Nutzer Verbraucher und hat seinen gewöhnlichen Aufenthalt in einem anderen
                Staat, bleiben zwingende Verbraucherschutzvorschriften dieses Staates unberührt.
              </p>
              <p>
                (2) Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches
                Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im
                Zusammenhang mit diesen AGB der Sitz der Anbieterin. Gesetzliche Regelungen über
                ausschließliche Gerichtsstände bleiben unberührt.
              </p>
              <p>
                (3) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam oder undurchführbar
                sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Anstelle der
                unwirksamen oder undurchführbaren Bestimmung tritt die gesetzliche Regelung.
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
