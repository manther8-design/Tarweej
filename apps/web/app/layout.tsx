import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Cairo, Inter, Tajawal } from 'next/font/google';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ترويج | Tarweej',
  description: 'Marketplace classifieds — buy and sell across sections.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable} ${inter.variable}`}>
      <body
        style={
          {
            ['--font-display' as string]:
              'var(--font-cairo), var(--font-tajawal), Cairo, Tajawal, sans-serif',
            ['--font-body' as string]:
              'var(--font-cairo), var(--font-tajawal), Cairo, Tajawal, sans-serif',
            ['--font-en' as string]: 'var(--font-inter), Inter, sans-serif',
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
