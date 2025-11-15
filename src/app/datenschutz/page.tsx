'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function DatenschutzPage() {
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
              <h1 className="text-xl font-bold text-gray-900">Datenschutzerklärung</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              Wir freuen uns über Ihr Interesse an unserer Website und unserem Angebot &bdquo;imvestr&ldquo;. Der
              Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. Nachfolgend informieren
              wir Sie darüber, welche Daten wir erheben, wofür wir sie nutzen und welche Rechte Sie haben.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              1. Verantwortliche
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="pl-4 space-y-1">
                <p>Meike Hüttl</p>
                <p>handelnd unter &bdquo;imvestr&ldquo;</p>
                <p>Genter Straße 19</p>
                <p>50672 Köln</p>
                <p>
                  E-Mail:{' '}
                  <a
                    href="mailto:info@imvestr.de"
                    className="text-[hsl(var(--brand))] hover:underline"
                  >
                    info@imvestr.de
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              2. Arten der verarbeiteten Daten, Zwecke und Rechtsgrundlagen
            </h2>

            <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
              <p>
                Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Website,
                zur Erfüllung des Nutzungsvertrags, zur Abwicklung von Zahlungen oder zur Auswertung und
                Verbesserung unseres Angebots erforderlich ist oder Sie eingewilligt haben. Rechtsgrundlagen
                sind insbesondere Art. 6 Abs. 1 lit. a, b und f DSGVO.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  a) Beim Besuch der Website (Server-Logfiles)
                </h3>
                <p className="mb-2">
                  Beim Aufrufen unserer Website werden durch den von Ihnen verwendeten Browser automatisch
                  Informationen an unseren Server übermittelt und temporär in Logfiles gespeichert. Hierzu
                  gehören:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>IP-Adresse des anfragenden Endgeräts</li>
                  <li>Datum und Uhrzeit des Zugriffs</li>
                  <li>Name und URL der abgerufenen Datei</li>
                  <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                  <li>verwendeter Browser und Betriebssystem</li>
                </ul>
                <p className="mt-2">
                  Die Verarbeitung erfolgt zur Sicherstellung eines reibungslosen Verbindungsaufbaus, der
                  Systemsicherheit und zur technischen Administration der Website (Art. 6 Abs. 1 lit. f
                  DSGVO – berechtigtes Interesse).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  b) Registrierung und Nutzung Ihres Nutzerkontos
                </h3>
                <p className="mb-2">
                  Wenn Sie sich für ein Nutzerkonto registrieren und unsere Dienste nutzen, verarbeiten wir
                  u. a.:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>E-Mail-Adresse</li>
                  <li>Passwort (als Hash, nicht im Klartext)</li>
                  <li>optional: Name</li>
                  <li>Nutzungsdaten (z. B. eingegebene Immobiliendaten, Analysen, Berechnungsergebnisse, Einstellungen)</li>
                </ul>
                <p className="mt-2">
                  Diese Verarbeitung ist zur Durchführung des Nutzungsvertrags und zur Bereitstellung der
                  Funktionen erforderlich (Art. 6 Abs. 1 lit. b DSGVO).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  c) Premium-Abonnement und Zahlungsabwicklung (Stripe)
                </h3>
                <p className="mb-2">
                  Für kostenpflichtige Abonnements nutzen wir den Zahlungsdienstleister Stripe (Stripe, Inc.,
                  510 Townsend Street, San Francisco, CA 94103, USA). Stripe verarbeitet Zahlungsdaten
                  (z. B. Kartendaten, Kontoinformationen, Rechnungsadresse) unmittelbar auf seinen Systemen.
                  Wir erhalten keine vollständigen Zahlungsdaten (keine vollständigen Kreditkartennummern etc.).
                </p>
                <p className="mb-2">
                  Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Darüber hinaus kann
                  Stripe die Daten zu eigenen Zwecken verarbeiten; Einzelheiten entnehmen Sie bitte der
                  Datenschutzerklärung von Stripe:{' '}
                  <a
                    href="https://stripe.com/de/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--brand))] hover:underline"
                  >
                    [Stripe Privacy Policy]
                  </a>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  d) Benutzerauthentifizierung mit Clerk
                </h3>
                <p className="mb-2">
                  Für Registrierung, Login und Verwaltung Ihres Kontos nutzen wir den Dienst Clerk (Clerk, Inc.,
                  340 S Lemon Ave #3902, Walnut, CA 91789, USA). Dabei werden u. a. verarbeitet:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>E-Mail-Adresse</li>
                  <li>Passwort-Hash</li>
                  <li>ggf. weitere Profildaten (z. B. Name, Avatar)</li>
                  <li>technische Daten wie Logins, Geräteinformationen</li>
                </ul>
                <p className="mt-2">
                  Clerk unterstützt verschiedene Compliance-Standards (u. a. SOC 2, HIPAA) und bietet einen
                  Data Processing Addendum (DPA) inkl. Standardvertragsklauseln und/oder Data Privacy Framework
                  (DPF) für Datentransfers aus der EU.
                </p>
                <p className="mt-2">
                  Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung des Nutzerkontos) und unser
                  berechtigtes Interesse an sicherer Authentifizierung (Art. 6 Abs. 1 lit. f DSGVO).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  e) KI-gestützte Analysen mit OpenAI
                </h3>
                <p className="mb-2">
                  Für die automatisierte Auswertung und Kommentierung Ihrer Eingaben (z. B. Lage-Text,
                  Cashflow-Kommentar) nutzen wir Dienste der OpenAI L.L.C. (3180 18th Street, San Francisco,
                  CA 94110, USA) über deren API.
                </p>
                <p className="mb-2">
                  Dabei können folgende Daten an OpenAI übermittelt werden:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>von Ihnen eingegebene Immobiliendaten (z. B. Lage, Kaufpreis, Miete, Eckdaten zum Objekt)</li>
                  <li>daraus berechnete Kennzahlen (z. B. Cashflow, Rendite)</li>
                  <li>ggf. technische Metadaten zur Anfrage</li>
                </ul>
                <p className="mt-2">
                  Wir achten darauf, nur die für die Analyse notwendigen Daten zu übermitteln.
                </p>
                <p className="mt-2">
                  Nach den aktuellen Angaben von OpenAI werden Daten, die über die API übermittelt werden,
                  nicht zur Verbesserung oder zum Training von Modellen verwendet, es sei denn, der Kunde
                  stimmt ausdrücklich zu.
                </p>
                <p className="mt-2">
                  Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), da die KI-Analyse
                  zentraler Bestandteil unseres Dienstes ist.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  f) Webanalyse mit Google Analytics und Tag Manager
                </h3>
                <p className="mb-2">
                  Wir verwenden Google Tag Manager und Google Analytics 4 der Google Ireland Limited, Gordon
                  House, Barrow Street, Dublin 4, Irland (&bdquo;Google&ldquo;). Google Analytics ermöglicht uns, die
                  Nutzung der Website auszuwerten, um unser Angebot zu verbessern.
                </p>
                <p className="mb-2">
                  Google Analytics verarbeitet u. a.:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>pseudonymisierte Nutzerkennungen</li>
                  <li>ungefähre Standortdaten (Region/ Stadt, soweit aktiv)</li>
                  <li>Informationen zu Geräten, Browser, Verweildauer, Klickpfad</li>
                </ul>
                <p className="mt-2">
                  Google Analytics 4 speichert nach aktuellen Angaben für EU-Nutzer keine vollständigen
                  IP-Adressen, sondern verwirft diese, bevor sie protokolliert werden; dennoch gelten die so
                  gewonnenen Daten als personenbezogene bzw. personenbeziehbare Daten.
                </p>
                <p className="mt-2">
                  Die Nutzung von Google Analytics erfolgt nur mit Ihrer Einwilligung über unseren
                  Cookie-/Consent-Banner (Art. 6 Abs. 1 lit. a DSGVO). Sie können Ihre Einwilligung jederzeit
                  mit Wirkung für die Zukunft widerrufen, indem Sie die Cookie-Einstellungen auf unserer
                  Website anpassen.
                </p>
                <p className="mt-2">
                  Der Google Tag Manager selbst verarbeitet nach Angaben von Google keine personenbezogenen
                  Daten, sondern dient nur der Verwaltung von Tags.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  g) Cookies und ähnliche Technologien
                </h3>
                <p className="mb-2">
                  Wir verwenden Cookies und ähnliche Technologien, um:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>grundlegende Funktionen der Website bereitzustellen (technisch notwendige Cookies)</li>
                  <li>statistische Auswertungen (Analytics) und ggf. Marketingfunktionen zu ermöglichen (nur mit Einwilligung)</li>
                </ul>
                <p className="mt-2">
                  Technisch notwendige Cookies setzen wir auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Alle
                  weiteren Cookies werden nur mit Ihrer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO gesetzt.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              3. Empfänger und Kategorien von Empfängern
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Wir geben personenbezogene Daten nur an Dritte weiter, wenn dies gesetzlich erlaubt ist oder
                Sie eingewilligt haben. Empfänger können insbesondere sein:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>IT- und Hosting-Dienstleister (für Betrieb und Wartung der Systeme)</li>
                <li>Clerk (Authentifizierung)</li>
                <li>Stripe (Zahlungsabwicklung)</li>
                <li>Google (Analytics/Tag Manager)</li>
                <li>OpenAI (KI-Analysen)</li>
              </ul>
              <p className="mt-2">
                Mit allen Dienstleistern, die in unserem Auftrag personenbezogene Daten verarbeiten,
                schließen wir – soweit erforderlich – Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              4. Datenübermittlung in Drittländer
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Einige der oben genannten Dienstleister (z. B. OpenAI, Stripe, Clerk, Google) haben ihren
                Sitz in den USA oder verarbeiten Daten dort.
              </p>
              <p>
                Die Übermittlung personenbezogener Daten in die USA kann auf folgende Grundlagen gestützt
                werden:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Angemessenheitsbeschluss (EU–US Data Privacy Framework), sofern der jeweilige Dienst dort zertifiziert ist, und/oder</li>
                <li>Abschluss von EU-Standardvertragsklauseln (Standard Contractual Clauses – SCC) sowie zusätzliche Schutzmaßnahmen.</li>
              </ul>
              <p className="mt-2">
                Weitere Informationen zum Datenschutz der jeweiligen Dienstleister finden Sie in deren
                Datenschutzerklärungen.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              5. Speicherdauer
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke
                erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>
                  <strong>Nutzerkonto & Analysen:</strong> Solange Ihr Konto aktiv ist. Nach Löschung Ihres
                  Kontos werden Ihre Daten – vorbehaltlich gesetzlicher Aufbewahrungsfristen – gelöscht oder
                  anonymisiert.
                </li>
                <li>
                  <strong>Vertrags- und Abrechnungsdaten:</strong> entsprechend der handels- und
                  steuerrechtlichen Aufbewahrungsfristen (in der Regel bis zu 10 Jahre).
                </li>
                <li>
                  <strong>Server-Logfiles:</strong> in der Regel wenige Wochen, sofern keine
                  sicherheitsrelevante Auswertung erforderlich ist.
                </li>
                <li>
                  <strong>Cookies & Analytics-Daten:</strong> entsprechend Ihren Einstellungen im
                  Consent-Tool und den Vorgaben der jeweiligen Anbieter.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              6. Ihre Rechte
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Sie haben hinsichtlich der Sie betreffenden personenbezogenen Daten folgende Rechte:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>Auskunft (Art. 15 DSGVO)</li>
                <li>Berichtigung (Art. 16 DSGVO)</li>
                <li>Löschung (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch gegen bestimmte Verarbeitungen (Art. 21 DSGVO)</li>
                <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
              <p className="mt-2">
                Zur Geltendmachung Ihrer Rechte können Sie sich jederzeit an uns wenden:<br />
                E-Mail:{' '}
                <a
                  href="mailto:info@imvestr.de"
                  className="text-[hsl(var(--brand))] hover:underline"
                >
                  info@imvestr.de
                </a>
              </p>
              <p className="mt-2">
                Zudem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren
                (Art. 77 DSGVO), insbesondere in dem Mitgliedstaat Ihres gewöhnlichen Aufenthaltsortes,
                Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              7. Widerruf von Einwilligungen & Widerspruchsrecht
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Sie können uns gegenüber erteilte Einwilligungen (z. B. für Analytics) jederzeit mit Wirkung
                für die Zukunft widerrufen, u. a. durch Anpassung Ihrer Cookie-Einstellungen.
              </p>
              <p>
                Soweit wir Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
                verarbeiten, haben Sie das Recht, aus Gründen, die sich aus Ihrer besonderen Situation
                ergeben, Widerspruch einzulegen. Wir verarbeiten die personenbezogenen Daten dann nicht mehr,
                es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die Ihre Interessen
                überwiegen oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von
                Rechtsansprüchen.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              8. Datensicherheit
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Wir verwenden übliche technische und organisatorische Sicherheitsmaßnahmen, um Ihre Daten vor
                Verlust, Zerstörung, unbefugtem Zugriff oder Manipulation zu schützen. Dazu gehört
                insbesondere die Verwendung von SSL-/TLS-Verschlüsselung beim Aufruf unserer Website
                (erkennbar an &bdquo;https://&ldquo; und einem Schloss-Symbol im Browser).
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              9. Aktualität und Änderung dieser Datenschutzerklärung
            </h2>
            <div className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <p>
                Diese Datenschutzerklärung ist aktuell gültig und hat den Stand November 2025.
              </p>
              <p>
                Durch die Weiterentwicklung unserer Website oder unseres Angebots sowie aufgrund geänderter
                gesetzlicher oder behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung
                anzupassen. Die jeweils aktuelle Fassung können Sie jederzeit auf unserer Website unter
                [Link zur Datenschutzerklärung] abrufen.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
