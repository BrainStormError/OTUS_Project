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

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Reuse the client Router Cache for dynamic routes so returning to a
    // recently visited section or moving back/forward does not trigger a new
    // full server render. `static` stays at the default to keep prefetch useful.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
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
