import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export const metadata: Metadata = {
  title: 'LinkVault — Visual Link Dashboard',
  description: 'Save, organize, and browse your links visually',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LinkVault',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ErrorBoundary>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ErrorBoundary>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
