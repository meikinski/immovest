'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Sticky Bottom CTA - nur mobil sichtbar
 * Blendet sich aus, wenn der Haupt-CTA im Viewport ist
 */
export function StickyBottomCTA() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      // Zeige Button nach 200px Scroll
      const scrolled = window.scrollY > 200;

      // Prüfe ob ein CTA im Viewport ist
      const ctas = document.querySelectorAll('[data-cta="main"]');
      let ctaInViewport = false;

      ctas.forEach((cta) => {
        const rect = cta.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          ctaInViewport = true;
        }
      });

      setIsVisible(scrolled && !ctaInViewport);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white/20 backdrop-blur-xl border-t border-white/30 shadow-2xl p-4">
        <button
          onClick={() => router.push('/input-method')}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] px-6 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
        >
          Kostenlos testen
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
