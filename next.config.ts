import type { NextConfig } from "next";

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
        source: '/sign-up',
        destination: '/input-method',
        permanent: false, // 302 redirect
      },
      {
        source: '/sign-up/:path*',
        destination: '/input-method',
        permanent: false, // 302 redirect for all sign-up sub-paths
      },
    ];
  },
};

export default nextConfig;
