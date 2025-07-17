import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import ConditionalHeader from '@/components/ConditionalHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GenLo - AI-Powered Design & Video Creation Platform',
  description: 'Create stunning product photography, marketing campaigns, and AI-generated videos that convert. Professional AI tools for modern businesses.',
      keywords: 'AI, video generation, image generation, marketing, design, product photography, GenLo, DALL-E, GPT',
  authors: [{ name: 'GenLo Team' }],
  openGraph: {
    title: 'GenLo - AI-Powered Design & Video Creation Platform',
    description: 'Create stunning product photography, marketing campaigns, and AI-generated videos that convert.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GenLo - AI-Powered Design & Video Creation Platform',
    description: 'Create stunning product photography, marketing campaigns, and AI-generated videos that convert.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            {/* Header - only show if not on home page */}
            <ConditionalHeader />
            {/* Main content */}
            <main>
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 