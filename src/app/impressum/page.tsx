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
              Anbieterin
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>Meike Hüttl</p>
              <p>handelnd unter „imvestr"</p>
              <p>Genter Straße 19</p>
              <p>50672 Köln</p>
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
                <span className="font-semibold">Telefon:</span> 0160/8244649
              </p>
            </div>
          </section>

          {/* Tax ID */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Umsatzsteuer-ID
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE362432094
              </p>
            </div>
          </section>

          {/* Responsible for Content */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Inhaltlich verantwortlich
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>(§ 18 Abs. 2 Medienstaatsvertrag – MStV)</p>
              <p>Meike Hüttl</p>
              <p>Genter Straße 19</p>
              <p>50672 Köln</p>
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
              <p>Unsere E-Mail-Adresse findest du oben im Impressum.</p>
            </div>
          </section>

          {/* Consumer Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Verbraucherstreitbeilegung
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
          </section>

          {/* Liability for Content */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Haftung für Inhalte
            </h2>
            <div className="space-y-2 text-gray-700">
              <p className="text-sm leading-relaxed">
                Wir sind als Diensteanbieterin für eigene Inhalte auf diesen Seiten nach den allgemeinen
                Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte
                fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen
                nach den allgemeinen Gesetzen bleiben hiervon unberührt.
              </p>
            </div>
          </section>

          {/* Liability for Links */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Haftung für Links
            </h2>
            <div className="space-y-2 text-gray-700">
              <p className="text-sm leading-relaxed">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
                Einfluss haben. Deshalb können wir für diese fremden Inhalte keine Gewähr übernehmen.
                Für die Inhalte der verlinkten Seiten ist stets die jeweilige Anbieterin oder Betreiberin
                der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige
                Links umgehend entfernen.
              </p>
            </div>
          </section>

          {/* Copyright */}
          <section>
            <h2 className="text-2xl font-bold text-[hsl(var(--brand))] mb-4">
              Urheberrecht
            </h2>
            <div className="space-y-2 text-gray-700">
              <p className="text-sm leading-relaxed">
                Die auf dieser Website veröffentlichten Inhalte und Werke unterliegen dem deutschen
                Urheberrecht. Jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedarf
                der vorherigen schriftlichen Zustimmung der Rechteinhaberin. Downloads und Kopien dieser
                Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet, sofern nicht
                ausdrücklich anders angegeben.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
