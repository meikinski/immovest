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
              <p className="text-sm text-gray-600">
                Informationen gemäß Art. 13 DSGVO
              </p>
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
              Wir freuen uns über Ihr Interesse an unserer Website. Der Schutz Ihrer persönlichen Daten
              ist uns ein wichtiges Anliegen. Nachfolgend informieren wir Sie ausführlich über den Umgang
              mit Ihren Daten.
            </p>
          </section>

          {/* Controller */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              1. Verantwortlicher
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>Verantwortlich für die Datenverarbeitung ist:</p>
              <div className="pl-4 space-y-1">
                <p className="font-semibold">imvestr.</p>
                <p>[Unternehmensform]</p>
                <p>[Straße und Hausnummer]</p>
                <p>[PLZ] [Ort]</p>
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

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              2. Erhebung und Speicherung personenbezogener Daten sowie Art und Zweck von deren Verwendung
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  a) Beim Besuch der Website
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-2">
                  Beim Aufrufen unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden
                  Browser automatisch Informationen an den Server unserer Website gesendet. Diese
                  Informationen werden temporär in einem sog. Logfile gespeichert. Folgende Informationen
                  werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-gray-700">
                  <li>IP-Adresse des anfragenden Rechners</li>
                  <li>Datum und Uhrzeit des Zugriffs</li>
                  <li>Name und URL der abgerufenen Datei</li>
                  <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                  <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  b) Bei Registrierung und Nutzung unserer Dienste
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-2">
                  Bei der Nutzung unserer Dienste erheben wir folgende personenbezogene Daten:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-gray-700">
                  <li>E-Mail-Adresse</li>
                  <li>Name (optional)</li>
                  <li>Nutzungsdaten (eingegebene Immobiliendaten, Berechnungsergebnisse)</li>
                  <li>Zahlungsinformationen (bei Premium-Abonnements, verarbeitet durch Stripe)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  c) Clerk Authentication
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Für die Benutzerauthentifizierung nutzen wir den Dienst Clerk (Clerk, Inc., 340 S Lemon Ave
                  #3902, Walnut, CA 91789, USA). Clerk verarbeitet dabei Ihre E-Mail-Adresse, Passwort-Hash
                  und optional weitere Profildaten. Weitere Informationen finden Sie in der{' '}
                  <a
                    href="https://clerk.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--brand))] hover:underline"
                  >
                    Datenschutzerklärung von Clerk
                  </a>
                  .
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  d) Zahlungsabwicklung mit Stripe
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Für die Abwicklung von Zahlungen nutzen wir Stripe (Stripe, Inc., 510 Townsend Street,
                  San Francisco, CA 94103, USA). Stripe verarbeitet Ihre Zahlungsdaten direkt. Wir erhalten
                  keine vollständigen Kreditkartendaten. Weitere Informationen finden Sie in der{' '}
                  <a
                    href="https://stripe.com/de/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--brand))] hover:underline"
                  >
                    Datenschutzerklärung von Stripe
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Analytics & Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              3. Einsatz von Google Analytics / Google Tag Manager
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Diese Website nutzt Google Tag Manager. Google Tag Manager ist eine Lösung, mit der wir
              sog. Website-Tags über eine Oberfläche verwalten können. Der Tag Manager selbst verarbeitet
              keine personenbezogenen Daten der Nutzer.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Wir verwenden Google Analytics, einen Webanalysedienst der Google Ireland Limited, Gordon
              House, Barrow Street, Dublin 4, Irland (&ldquo;Google&rdquo;). Google Analytics verwendet Cookies.
              Die durch das Cookie erzeugten Informationen über die Benutzung dieser Website werden in
              der Regel an einen Server von Google in den USA übertragen und dort gespeichert.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              Sie können die Speicherung der Cookies durch eine entsprechende Einstellung Ihrer
              Browser-Software verhindern oder über unseren Cookie-Banner widersprechen.
            </p>
          </section>

          {/* OpenAI */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              4. KI-gestützte Analysen (OpenAI)
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Für die Durchführung von Immobilienanalysen nutzen wir KI-Dienste von OpenAI (OpenAI, L.L.C.,
              3180 18th Street, San Francisco, CA 94110, USA). Die von Ihnen eingegebenen Immobiliendaten
              werden zur Analyse an OpenAI übermittelt. OpenAI nutzt Ihre Daten nicht zum Training von
              KI-Modellen. Weitere Informationen finden Sie in der{' '}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--brand))] hover:underline"
              >
                Datenschutzerklärung von OpenAI
              </a>
              .
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              5. Ihre Rechte
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Sie haben das Recht:
            </p>
            <ul className="list-disc list-inside pl-4 space-y-2 text-sm text-gray-700">
              <li>gemäß Art. 15 DSGVO Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen</li>
              <li>gemäß Art. 16 DSGVO unverzüglich die Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen</li>
              <li>gemäß Art. 17 DSGVO die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen</li>
              <li>gemäß Art. 18 DSGVO die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen</li>
              <li>gemäß Art. 20 DSGVO Ihre personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten</li>
              <li>gemäß Art. 7 Abs. 3 DSGVO Ihre einmal erteilte Einwilligung jederzeit gegenüber uns zu widerrufen</li>
              <li>gemäß Art. 77 DSGVO sich bei einer Aufsichtsbehörde zu beschweren</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              6. Dauer der Speicherung
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die Erfüllung der
              verfolgten Zwecke notwendig ist oder Sie Ihr Nutzerkonto bei uns führen. Nach Löschung
              Ihres Accounts werden Ihre Daten gelöscht, es sei denn, ihre Aufbewahrung ist zur Erfüllung
              gesetzlicher Aufbewahrungsfristen erforderlich.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              7. Datensicherheit
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer)
              in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt
              wird. Ob eine einzelne Seite unseres Internetauftrittes verschlüsselt übertragen wird, erkennen
              Sie an der geschlossenen Darstellung des Schüssel- beziehungsweise Schloss-Symbols in der unteren
              Statusleiste Ihres Browsers.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              8. Aktualität und Änderung dieser Datenschutzerklärung
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Diese Datenschutzerklärung ist aktuell gültig und hat den Stand November 2025. Durch die
              Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher beziehungsweise
              behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung zu ändern.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
