import type { Metadata } from 'next';
import { Hanken_Grotesk } from 'next/font/google';
import { auth } from '@/auth';
import './globals.css';
import Providers from '@/components/Providers';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hanken',
});

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Notus — Executive Precision',
  description: 'Enterprise note-taking, calendar & canvas application',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="th" className={`${hanken.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-body">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
