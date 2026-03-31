import { ClientProviders } from '@/providers/client-providers';
import { QueryProvider } from '@/providers/query-provider';
import { Geist, Geist_Mono } from 'next/font/google';
import { siteConfig } from '@/lib/site-config';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://0.email'),
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    // images: [siteConfig.openGraph.images[0].url],
    url: siteConfig.alternates.canonical,
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <Suspense>
          <QueryProvider>
            <ClientProviders>{children}</ClientProviders>
          </QueryProvider>
        </Suspense>
      </body>
    </html>
  );
}
