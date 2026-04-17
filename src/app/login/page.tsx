"use client";

import { useState } from "react";
import { LogIn, Mail, Lock, Loader2, AlertCircle, Cpu } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(49,88,255,0.05),transparent_60%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-10 w-full max-w-md relative z-10 border-primary/20 shadow-2xl shadow-primary/5"
      >
        <div className="text-center mb-10">
          <div className="mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
            <Cpu size={40} className="text-secondary" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-muted text-sm">Sign in to your Flow Prospect account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="text-sm font-medium text-muted flex items-center gap-2">
              <Mail size={14} /> Email
            </label>
            <input name="email" type="email" placeholder="seu@email.com" required />
          </div>

          <div className="input-group">
            <label className="text-sm font-medium text-muted flex items-center gap-2">
              <Lock size={14} /> Password
            </label>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>

          <button type="submit" className="premium-btn w-full py-4 mt-4" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              <>
                <LogIn size={20} />
                Access Dashboard
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted">
          AI-Powered Security Verification.
        </p>
      </motion.div>
      <style jsx>{`
        .min-h-screen { min-height: 100vh; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .text-center { text-align: center; }
        .mb-10 { margin-bottom: 2.5rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-4 { margin-top: 1rem; }
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .w-full { width: 100%; }
        .max-w-md { max-width: 28rem; }
        .text-3xl { font-size: 1.875rem; }
        .font-black { font-weight: 900; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
