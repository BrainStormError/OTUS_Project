import type { Metadata } from 'next';

import './globals.css';

// Pages are rendered per request so the CSP nonce from proxy.ts can be applied
// to Next.js scripts (a static prerender cannot carry a per-request nonce).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Movie Tracker',
  description: 'Movie tracker foundation',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="light" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
