import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Cairo, Outfit } from 'next/font/google';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ترويج | Tarweej',
  description: 'Marketplace classifieds — buy and sell across sections.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${outfit.variable}`}>
      <body
        style={
          {
            ['--font-display' as string]: 'var(--font-cairo), Cairo, sans-serif',
            ['--font-body' as string]: 'var(--font-outfit), Outfit, sans-serif',
          } as CSSProperties
        }
      >
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
