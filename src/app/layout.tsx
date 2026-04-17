import type { Metadata } from "next";
import "./globals.css";

import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { verifySession } from "@/lib/session";
import { logoutAction } from "./actions";
import { LogOut, UserCircle } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowTech - Automação de Prospecção",
  description: "Gerencie e automatize sua prospecção de leads.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} dark bg-background text-foreground antialiased`}>
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-8 py-4">
          <div className="container flex justify-between items-center mx-auto">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="FlowTech Logo" width={40} height={40} className="rounded-lg" />
              <span className="text-xl font-bold tracking-tight">FlowTech</span>
            </div>
            {session ? (
              <div className="flex items-center gap-8 text-sm font-medium">
                <nav className="flex gap-6">
                  <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
                  <Link href="/leads" className="hover:text-primary transition-colors">Leads</Link>
                  {session.role === "ADMIN" && (
                    <Link href="/admin" className="text-amber-500 hover:text-amber-400 transition-colors">Painel Admin</Link>
                  )}
                </nav>
                <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                  <div className="flex items-center gap-2 text-muted">
                    <UserCircle size={18} />
                    <span>{session.name}</span>
                  </div>
                  <form action={logoutAction}>
                    <button type="submit" className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                      <LogOut size={16} /> Sair
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <nav className="flex gap-6 text-sm font-medium">
                <Link href="/login" className="hover:text-primary transition-colors">Entrar</Link>
              </nav>
            )}
          </div>
        </header>

        <main className="pt-24 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
