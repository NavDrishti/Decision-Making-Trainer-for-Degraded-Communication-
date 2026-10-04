import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'NavDrishtiAI | Train Under Uncertainty. Decide With Confidence.',
  description:
    'Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments. Smart India Hackathon SIH26248.',
  keywords: [
    'NavDrishtiAI',
    'SIH26248',
    'degraded communication',
    'decision training',
    'perception vs ground truth',
    'AAR replay',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
