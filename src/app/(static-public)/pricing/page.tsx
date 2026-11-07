import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PricingSection } from '@/components/pricing/PricingSection';
import { PRICING_FAQ_SCHEMA } from '@/config/pricing';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-[#001d3d]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_FAQ_SCHEMA) }} />
      <Header variant="sticky" />
      <main>
        <PricingSection headingAs="h1" eyebrow="Preise" ort="pricing_page" paywallTrigger="pricing_page" />
      </main>
      <Footer />
    </div>
  );
}
