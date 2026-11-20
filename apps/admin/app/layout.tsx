import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Cairo, Outfit } from 'next/font/google';
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
  title: 'Tarweej Admin',
  description: 'ترويج admin ops dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cairo.variable} ${outfit.variable}`}>
      <body
        style={
          {
            ['--font-display' as string]: 'var(--font-cairo), Cairo, sans-serif',
            ['--font-body' as string]: 'var(--font-outfit), Outfit, sans-serif',
            ['--font' as string]: 'var(--font-outfit), Outfit, sans-serif',
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
