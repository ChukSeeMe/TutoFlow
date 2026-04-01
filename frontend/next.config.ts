import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Allow self-hosted assets, Google Fonts, Unsplash images, next-auth endpoints
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Next.js requires unsafe-inline/eval in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.googleusercontent.com https://*.azurecontainerapps.io",
      "connect-src 'self' https://accounts.google.com https://login.microsoftonline.com https://*.azurecontainerapps.io",
      "frame-src 'self' https://accounts.google.com https://login.microsoftonline.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],

  // TypeScript and ESLint errors are caught in CI — don't block the Docker build
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Allow Unsplash and Google profile images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },

  // Proxy /api/backend/* → Docker backend service (avoids CORS + localhost resolution)
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Compress responses
  compress: true,

  // Remove powered-by header
  poweredByHeader: false,
};

export default nextConfig;
