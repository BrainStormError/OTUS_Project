import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google';

import { CSP_NONCE_HEADER } from '@/proxy';

import './globals.css';

// Pages are rendered per request so the CSP nonce from proxy.ts can be applied
// to Next.js scripts (a static prerender cannot carry a per-request nonce).
export const dynamic = 'force-dynamic';

// Self-hosted webfonts: Inter (dark theme), Manrope (light theme), and a
// monospace face for technical metadata. next/font serves them from the app
// origin, which keeps the existing `font-src 'self' data:` CSP valid.
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono-web',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Смотровик',
  description: 'Смотровик — личный дневник фильмов и сериалов.',
};

const themeScript = `(function(){try{var t=window.localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get(CSP_NONCE_HEADER) ?? undefined;

  return (
    <html
      lang="ru"
      data-theme="light"
      className={`${inter.variable} ${manrope.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
