import type { Metadata } from "next";
import "./globals.css";

import Link from "next/link";
import { Inter } from "next/font/google";
import { verifySession } from "@/lib/session";
import { logoutAction } from "./actions";
import { LogOut, UserCircle, Cpu } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flow Prospect - Automação de Prospecção",
  description: "Gerencie e automatize sua prospecção de leads com IA.",
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
        {/* Background Overlay */}
        <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(circle_at_50%_0%,rgba(49,88,255,0.05),transparent_70%)]" />

        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-4 md:px-8 py-4 rounded-b-xl md:rounded-b-3xl">
          <div className="container flex flex-row justify-between items-center mx-auto">
            <Link href="/" className="flex flex-row items-center gap-3 group">
              <img src="/logo.png" alt="FlowTech Logo" className="w-10 h-10 rounded-lg object-contain bg-white" />
              <span className="text-xl md:text-2xl font-black tracking-tighter uppercase flex gap-1">
                <span className="text-blue-500">Flow</span>
                <span className="text-purple-500">Prospect</span>
              </span>
            </Link>
            {session ? (
              <div className="flex flex-row items-center gap-4 md:gap-8 text-sm font-medium">
                <nav className="hidden md:flex gap-6">
                  <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
                  <Link href="/leads" className="hover:text-primary transition-colors">Leads</Link>
                  {session.role === "ADMIN" && (
                    <Link href="/admin" className="text-amber-500 hover:text-amber-400 transition-colors">Painel Admin</Link>
                  )}
                </nav>
                <div className="flex flex-row items-center gap-4 md:pl-6 border-l border-white/10">
                  <div className="hidden md:flex items-center gap-2 text-muted">
                    <UserCircle size={18} />
                    <span>{session.name}</span>
                  </div>
                  <form action={logoutAction}>
                    <button type="submit" className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                      <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
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

        <main className="pt-28 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
