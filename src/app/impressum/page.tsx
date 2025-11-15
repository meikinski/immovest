'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ImpressumPage() {
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
              <h1 className="text-xl font-bold text-gray-900">Impressum</h1>
              <p className="text-sm text-gray-600">
                Angaben gemäß § 5 TMG
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Company Information */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Anbieter
            </h2>
            <div className="space-y-2 text-gray-700">
              <p className="font-semibold">imvestr.</p>
              <p>[Unternehmensform]</p>
              <p>[Straße und Hausnummer]</p>
              <p>[PLZ] [Ort]</p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Kontakt
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">E-Mail:</span>{' '}
                <a
                  href="mailto:info@imvestr.de"
                  className="text-[hsl(var(--brand))] hover:underline"
                >
                  info@imvestr.de
                </a>
              </p>
              <p>
                <span className="font-semibold">Telefon:</span> [Telefonnummer]
              </p>
            </div>
          </section>

          {/* Register Entry */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Registereintrag
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">Registergericht:</span> [Name des Registergerichts]
              </p>
              <p>
                <span className="font-semibold">Registernummer:</span> [HRB/HRA Nummer]
              </p>
              <p>
                <span className="font-semibold">Umsatzsteuer-ID:</span> [USt-IdNr. gemäß § 27a UStG]
              </p>
            </div>
          </section>

          {/* Responsible for Content */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>[Vor- und Nachname]</p>
              <p>[Straße und Hausnummer]</p>
              <p>[PLZ] [Ort]</p>
            </div>
          </section>

          {/* EU Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              EU-Streitschlichtung
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[hsl(var(--brand))] hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
            </div>
          </section>

          {/* Consumer Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Verbraucherstreitbeilegung/Universalschlichtungsstelle
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Haftungsausschluss
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">Haftung für Inhalte</h3>
                <p className="text-sm leading-relaxed">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                  nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                  Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                  Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                  Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
                  Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Haftung für Links</h3>
                <p className="text-sm leading-relaxed">
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
                  Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                  Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
                  Seiten verantwortlich.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Urheberrecht</h3>
                <p className="text-sm leading-relaxed">
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
                  dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
                  der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                  Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
