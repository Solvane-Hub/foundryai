import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

/**
 * Application typography.
 *
 * `next/font` downloads at BUILD time and self-hosts the result, so there is no
 * runtime request to Google and no layout shift from a late webfont.
 * `display: 'swap'` keeps first paint readable if the font is still decoding.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/** Reserved for correlation IDs, versions and chunk identifiers. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-inter',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: 'FoundryAI',
    template: '%s · FoundryAI',
  },
  description:
    'An AI-native operating system for entrepreneurship. Move from idea to launch with evidence-backed guidance.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
