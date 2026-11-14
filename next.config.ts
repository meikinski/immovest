import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* Performance Optimizations */
  compress: true, // Enable gzip compression

  /* Production optimizations */
  productionBrowserSourceMaps: false, // Disable source maps in production for faster builds

  /* Image optimization */
  images: {
    formats: ['image/avif', 'image/webp'], // Use modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  /* Experimental features for better performance */
  experimental: {
    optimizePackageImports: ['lucide-react'], // Tree-shake lucide-react icons
  },

  /* Redirects with proper HTTP status codes for SEO/crawling */
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/input-method',
        permanent: false, // 302 redirect
      },
      {
        source: '/preise',
        destination: '/pricing',
        statusCode: 301, // dauerhaft (permanent: true würde 308 senden)
      },
    ];
  },
};

// Fehlerüberwachung (siehe docs/MONITORING.md). Ohne SENTRY_AUTH_TOKEN werden keine Sourcemaps hochgeladen,
// der Build läuft trotzdem. Browser-Ereignisse gehen über /monitoring (eigene Domain, kein Werbeblocker-Verlust).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  telemetry: false,
});
