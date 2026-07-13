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

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await verifySession();
    console.log("=== ROOT LAYOUT SESSÃO ===", session);
  } catch (e) {
    console.error("Session verification failed in Layout:", e);
  }

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        {session ? (
          <div className="app-layout">
            {/* Sidebar Lateral Premium */}
            <aside className="sidebar">
              {/* Logo / Brand */}
              <div className="sidebar-logo">
                <Link href="/">
                  <img src="/logo.png" alt="Flow Prospect" className="logo-img" />
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="sidebar-nav">
                <Link href="/" className="sidebar-link">
                  Dashboard
                </Link>
                <Link href="/leads" className="sidebar-link">
                  Leads
                </Link>
                <Link href="/agent-profile" className="sidebar-link flex items-center gap-2">
                  Perfil do Agente
                </Link>
                {session.role === "ADMIN" && (
                  <Link href="/admin" className="sidebar-link admin-link">
                    Admin
                  </Link>
                )}
              </nav>

              {/* User Profile + Logout at Bottom */}
              <div className="sidebar-footer">
                <div className="user-info">
                  <UserCircle size={18} />
                  <span className="user-name">{session.name}</span>
                </div>
                <form action={logoutAction} style={{ width: "100%" }}>
                  <button type="submit" className="logout-btn">
                    <LogOut size={14} /> Sair da Conta
                  </button>
                </form>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content-layout">
              {children}
            </main>
          </div>
        ) : (
          /* Tela de Login/Não logado */
          <main style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
