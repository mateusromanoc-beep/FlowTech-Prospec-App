import type { Metadata } from "next";
import "./globals.css";

import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowTech - Automação de Prospecção",
  description: "Gerencie e automatize sua prospecção de leads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} dark bg-background text-foreground antialiased`}>
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-8 py-4">
          <div className="container flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="FlowTech Logo" width={40} height={40} className="rounded-lg" />
              <span className="text-xl font-bold tracking-tight">FlowTech</span>
            </div>
            <nav className="flex gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
              <Link href="/leads" className="hover:text-primary transition-colors">Leads</Link>
            </nav>
          </div>
        </header>
        <main className="pt-24 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
