'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PricingCards from '@/components/pricing/PricingCards';

export default function PricingPage() {
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
              <h1 className="text-xl font-bold text-gray-900">Premium Pläne</h1>
              <p className="text-sm text-gray-600">
                Wähle den Plan, der am besten zu dir passt
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <PricingCards />
    </div>
  );
}
