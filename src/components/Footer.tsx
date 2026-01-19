'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#264171]/8 bg-white px-6 py-16 md:py-20 text-sm text-[#6C7F99] mt-16 md:mt-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo.png"
                  alt="imvestr Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              </div>
              <span className="text-xl font-semibold tracking-tight text-[#264171]">imvestr</span>
            </div>
            <p className="text-center md:text-left text-[#6C7F99] max-w-sm">
              imvestr. Deine KI für smarte Immobilien-Investments.<br />
              <span className="font-medium text-[#264171]">Schnell. Klar. Vertrauenswürdig.</span>
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="font-semibold text-[#264171] mb-2">Rechtliches</h3>
            <a href="mailto:info@imvestr.de" className="hover:text-[hsl(var(--brand))] transition-colors">
              info@imvestr.de
            </a>
            <Link href="/impressum" className="hover:text-[hsl(var(--brand))] transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-[hsl(var(--brand))] transition-colors">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-[hsl(var(--brand))] transition-colors">
              AGB
            </Link>
          </div>

          {/* Social Media */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="font-semibold text-[#264171] mb-2">Folge uns</h3>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/imvestr.de"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[hsl(var(--brand))] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@imvestr.de"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[hsl(var(--brand))] transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-[#264171]/8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="rounded-xl border border-[#E6AE63]/20 bg-[#E6AE63]/5 px-4 py-3 max-w-md">
            <p className="text-xs font-medium text-[#264171] leading-relaxed">
              <ShieldCheck className="inline h-4 w-4 mr-1 text-[#E6AE63]" />
              Keine Anlageberatung. Ergebnisse sind Modell-Schätzungen und hängen von deinen Eingaben ab.
            </p>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} imvestr. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}
