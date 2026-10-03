'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FooterProps {
  noPadding?: boolean;
}

const productLinks = [
  { href: '/#ablauf', label: 'So funktioniert\'s' },
  { href: '/pricing', label: 'Preise' },
];

const resourceLinks = [
  { href: '/blog', label: 'Blog' },
  { href: '/blog/cashflow-immobilie-berechnen', label: 'Cashflow berechnen' },
  { href: '/blog/nettomietrendite-berechnen', label: 'Nettomietrendite' },
];

const legalLinks = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">{title}</h4>
      <ul className="space-y-1 md:space-y-3 text-sm text-slate-300">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-block py-2 md:py-0 hover:text-[#ff6b00] transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ noPadding = false }: FooterProps) {
  return (
    <footer className={`relative bg-[#001d3d] text-white ${noPadding ? 'pt-16' : 'pt-16 pb-8'}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6b00]/60 to-transparent" />
      <div className={`max-w-7xl mx-auto ${noPadding ? '' : 'px-6'}`}>
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-6">
            <div className="flex items-center gap-3 mb-5">
              <Image
                src="/logo.png"
                alt="imvestr Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-2xl font-extrabold tracking-tighter">imvestr</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm mb-6">
              Die intelligenteste Art, Immobilien zu bewerten und Investment-Entscheidungen auf Basis von echten Daten zu treffen.
            </p>
            <Link
              href="/input-method"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6b00] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-px hover:bg-[#ff6b00]/90"
            >
              Jetzt starten
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="md:col-span-3">
            <LinkColumn title="Produkt" links={productLinks} />
          </div>
          <div className="md:col-span-3">
            <LinkColumn title="Ressourcen" links={resourceLinks} />
          </div>
        </div>
        <div className={`mt-12 pt-6 border-t border-white/10 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 text-xs text-slate-500 ${noPadding ? 'pb-6' : ''}`}>
          <p>
            © {new Date().getFullYear()} imvestr. Alle Rechte vorbehalten. Keine Anlageberatung – alle Ergebnisse sind Modellrechnungen.
          </p>
          <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-6 gap-y-1 text-sm md:text-xs">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="py-2 md:py-0 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
