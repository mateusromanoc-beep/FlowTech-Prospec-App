"use client";

import { useState } from "react";
import { LogIn, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData).catch(() => ({ error: "Erro de conexão." }));
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative', zIndex: 1 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{ padding: '2.5rem', width: '100%', maxWidth: '420px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.png" alt="Flow Prospect" style={{ height: '80px', width: 'auto', margin: '0 auto 1.5rem', display: 'block', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Bem-vindo de volta</h1>
          <p style={{ color: '#8b92a5', fontSize: '0.9rem' }}>Acesse sua conta Flow Prospect</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} /> Email
            </label>
            <input name="email" type="email" placeholder="seu@email.com" required />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} /> Senha
            </label>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" className="premium-btn" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? (
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <LogIn size={18} />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#8b92a5' }}>
          Verificação de segurança com Inteligência Artificial.
        </p>
      </motion.div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
