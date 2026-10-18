/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
];

// Navigation payload cache policies. Both stay private: no shared cache may
// store them. The document is revalidated on every use through its ETag; the
// flight payload is a data-free shell that may live for a year and is replaced
// when the deployment marker changes the build (see src/proxy.ts).
//
// They live in `headers()` rather than in the proxy: this Next version strips
// the `RSC` header and the `_rsc` query from the request the proxy sees, and a
// proxy-set header wins over `headers()`. `headers()` still matches on `_rsc`.
// The `api/` and `_next/` paths are excluded so read policies and immutable
// asset headers stay untouched.
const SERVE_PATH = '(?!api/|_next/).*';
const DOCUMENT_CACHE_CONTROL = 'private, no-cache';
const FLIGHT_CACHE_CONTROL = 'private, max-age=31536000';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Reuse the client Router Cache for the whole session: a visited route
    // stays usable for the maximum window, aligned with the flight-response
    // policy. Build changes are handled by the proxy build marker, not by a
    // short window.
    staleTimes: {
      dynamic: 31536000,
      static: 31536000,
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: `/:path(${SERVE_PATH})`,
        missing: [{ type: 'query', key: '_rsc' }],
        headers: [{ key: 'Cache-Control', value: DOCUMENT_CACHE_CONTROL }],
      },
      {
        source: `/:path(${SERVE_PATH})`,
        has: [{ type: 'query', key: '_rsc' }],
        headers: [{ key: 'Cache-Control', value: FLIGHT_CACHE_CONTROL }],
      },
    ];
  },
  // Dynamic detail URLs are served by static shell routes. The document bytes
  // must not vary per URL: a per-URL flight payload would need its own CSP
  // digest, which cannot be known at build time. The client reads the id from
  // the browser path after hydration and fetches it through the read contract.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/film/:tmdbId', destination: '/shell/film' },
        { source: '/series/:tmdbId', destination: '/shell/series' },
        { source: '/films/:id', destination: '/shell/record' },
        { source: '/groups/:id/admin', destination: '/shell/group-admin' },
        { source: '/groups/:id', destination: '/shell/group' },
        { source: '/u/:handle', destination: '/shell/profile' },
      ],
    };
  },
};

export default nextConfig;
