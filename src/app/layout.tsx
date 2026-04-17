import type { Metadata } from "next";
import "./globals.css";

import Link from "next/link";
import { Inter } from "next/font/google";
import { verifySession } from "@/lib/session";
import { logoutAction } from "./actions";
import { LogOut, UserCircle } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flow Prospect - Automação de Prospecção",
  description: "Automações que transformam os resultados do seu negócio com IA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await verifySession();
  } catch (e) {
    console.error("Session verification failed:", e);
  }

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(10, 14, 26, 0.75)',
          padding: '0.75rem 2rem',
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 2rem' }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <img src="/logo.png" alt="Flow Prospect" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            </Link>

            {/* Navigation */}
            {session ? (
              <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Link href="/" style={{
                  padding: '0.4rem 1rem', borderRadius: '9999px',
                  fontSize: '0.875rem', fontWeight: 500, color: 'white',
                  background: 'rgba(255,255,255,0.08)', textDecoration: 'none',
                }}>Dashboard</Link>
                <Link href="/leads" style={{
                  padding: '0.4rem 1rem', borderRadius: '9999px',
                  fontSize: '0.875rem', fontWeight: 500, color: '#8b92a5',
                  textDecoration: 'none', transition: 'color 0.2s',
                }}>Leads</Link>
                {session.role === "ADMIN" && (
                  <Link href="/admin" style={{
                    padding: '0.4rem 1rem', borderRadius: '9999px',
                    fontSize: '0.875rem', fontWeight: 500, color: '#f59e0b',
                    textDecoration: 'none',
                  }}>Admin</Link>
                )}
              </nav>
            ) : null}

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {session ? (
                <>
                  <span style={{ fontSize: '0.8rem', color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserCircle size={16} /> {session.name}
                  </span>
                  <form action={logoutAction}>
                    <button type="submit" style={{
                      background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#ef4444', padding: '0.35rem 0.9rem', borderRadius: '9999px',
                      fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                      transition: 'all 0.2s',
                    }}>
                      <LogOut size={14} /> Sair
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="premium-btn" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </header>

        <main style={{ paddingTop: '5rem', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
