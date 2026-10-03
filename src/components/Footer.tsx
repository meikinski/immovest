'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FooterProps {
  noPadding?: boolean;
}

const productLinks = [
  { href: '/#ablauf', label: 'So funktioniert\'s' },
  { href: '/input-method', label: 'Jetzt starten' },
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

const socialLinks = [
  { href: 'https://www.instagram.com/imvestr.de', label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { href: 'https://www.tiktok.com/@imvestr.de', label: 'TikTok', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-5">{title}</h4>
      <ul className="space-y-3 text-sm text-slate-300">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-[#ff6b00] transition-colors">
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
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/input-method"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6b00] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-px hover:bg-[#ff6b00]/90"
              >
                Jetzt starten
                <span aria-hidden="true">→</span>
              </Link>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/5 ring-1 ring-white/10 rounded-full flex items-center justify-center text-slate-300 hover:bg-[#ff6b00] hover:ring-[#ff6b00] hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
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
          <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
