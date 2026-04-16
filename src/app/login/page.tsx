"use client";

import { useState } from "react";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulação de login
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold mb-2 text-white">Bem-vindo</h2>
          <p className="text-muted">Acesse o painel de prospecção estratégica</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="input-group">
            <label className="text-sm font-medium text-muted flex items-center gap-2">
              <Mail size={14} /> Email
            </label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              required
            />
          </div>

          <div className="input-group">
            <label className="text-sm font-medium text-muted flex items-center gap-2">
              <Lock size={14} /> Senha
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
            />
          </div>

          <button 
            type="submit" 
            className="premium-btn w-full py-3"
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                <LogIn size={18} />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted">
          Protegido por criptografia de ponta a ponta.
        </p>
      </motion.div>

      <style jsx>{`
        .min-h-screen { min-height: 100vh; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .text-center { text-align: center; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mt-8 { margin-top: 2rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .w-full { width: 100%; }
        .max-w-md { max-width: 28rem; }
        .text-3xl { font-size: 1.875rem; }
        .font-extrabold { font-weight: 800; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
