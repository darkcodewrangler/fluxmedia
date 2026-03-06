import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/marketing/header';
import { Footer } from '@/components/marketing/footer';
import { ProjectStats } from '@/components/marketing/project-stats';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'FluxMedia - Unified Media Uploads for TypeScript',
    template: '%s | FluxMedia',
  },
  description:
    'Simplify media uploads with one unified API. FluxMedia works with Cloudinary, S3, R2, and more. TypeScript-first. Open source.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.fluxmedia.dev'),
  applicationName: 'FluxMedia',
  authors: [{ name: 'FluxMedia' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'FluxMedia',
    title: 'FluxMedia - Unified Media Uploads for TypeScript',
    description:
      'Simplify media uploads with one unified API. FluxMedia works with Cloudinary, S3, R2, and more.',
    images: ['/fluxmedia-logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FluxMedia - Unified Media Uploads for TypeScript',
    description:
      'Simplify media uploads with one unified API. FluxMedia works with Cloudinary, S3, R2, and more.',
    images: ['/fluxmedia-logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          jetbrainsMono.variable
        )}
      >
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header stats={<ProjectStats />} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
