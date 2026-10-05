import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { CSP_NONCE_HEADER } from '@/proxy';

import './globals.css';

// Pages are rendered per request so the CSP nonce from proxy.ts can be applied
// to Next.js scripts (a static prerender cannot carry a per-request nonce).
export const dynamic = 'force-dynamic';

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
    <html lang="ru" data-theme="light" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
