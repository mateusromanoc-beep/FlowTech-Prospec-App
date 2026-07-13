"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bot, Save, Loader2, Sparkles, Building2, Briefcase, Award, Users, MessageSquareCode } from "lucide-react";
import Link from "next/link";
import { getAgentProfileAction, saveAgentProfileAction } from "./actions";

export default function AgentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; message: string }>({ type: "", message: "" });
  
  const [formData, setFormData] = useState({
    companyName: "",
    businessActivity: "",
    servicesOffered: "",
    targetAudience: "",
    customTone: "profissional",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getAgentProfileAction();
        if (res.error) {
          setStatus({ type: "error", message: res.error });
        } else if (res.profile) {
          setFormData({
            companyName: res.profile.companyName,
            businessActivity: res.profile.businessActivity,
            servicesOffered: res.profile.servicesOffered,
            targetAudience: res.profile.targetAudience || "",
            customTone: res.profile.customTone || "profissional",
          });
        }
      } catch (err) {
        console.error(err);
        setStatus({ type: "error", message: "Erro de conexão ao carregar o perfil." });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await saveAgentProfileAction(formData);
      if (res.error) {
        setStatus({ type: "error", message: res.error });
      } else {
        setStatus({ type: "success", message: "Perfil do Agente atualizado com sucesso!" });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Erro de conexão ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
        <Loader2 size={40} className="animate-spin" style={{ color: "var(--primary)" }} />
        <p className="text-muted">Carregando Perfil do Agente...</p>
      </div>
    );
  }

  return (
    <main className="container animate-fade-in p-8" style={{ maxWidth: "800px" }}>
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Bot size={28} style={{ color: "var(--secondary)" }} /> Perfil do Agente
            </h1>
            <p className="text-muted">Personalize a IA com as informações da sua própria empresa.</p>
          </div>
        </div>
      </header>

      {/* Card Principal */}
      <div className="glass p-8 relative overflow-hidden">
        {/* Efeito decorativo */}
        <div style={{ position: "absolute", top: "-50px", right: "-50px", opacity: 0.02, pointerEvents: "none" }}>
          <Bot size={240} />
        </div>

        <form onSubmit={handleSubmit} style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
            <Sparkles size={18} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Dados de Abordagem do Agente</h3>
          </div>

          {status.message && (
            <div style={{
              padding: "1rem 1.25rem",
              borderRadius: "0.75rem",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              background: status.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              border: status.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
              color: status.type === "success" ? "#34d399" : "#f87171",
            }}>
              {status.message}
            </div>
          )}

          {/* Nome da Empresa */}
          <div className="input-group">
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#8b92a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Building2 size={15} /> Nome da sua Empresa / Marca
            </label>
            <input
              type="text"
              placeholder="Ex: FlowTech Soluções Web"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </div>

          {/* Atividade da Empresa */}
          <div className="input-group">
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#8b92a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase size={15} /> O que sua empresa faz? (Atividade Principal)
            </label>
            <textarea
              placeholder="Descreva brevemente seu modelo de negócio ou especialidade. Ex: Agência de automações de processos de vendas com inteligência artificial para pequenos negócios locais."
              value={formData.businessActivity}
              onChange={(e) => setFormData({ ...formData, businessActivity: e.target.value })}
              required
              rows={3}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "0.75rem",
                padding: "0.875rem 1.25rem",
                color: "white",
                outline: "none",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>

          {/* Serviços Oferecidos */}
          <div className="input-group">
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#8b92a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award size={15} /> Quais serviços/produtos você quer oferecer na abordagem?
            </label>
            <textarea
              placeholder="Ex: Integração de CRM com WhatsApp, chat inteligente de atendimento e automação de planilhas de prospecção."
              value={formData.servicesOffered}
              onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
              required
              rows={3}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "0.75rem",
                padding: "0.875rem 1.25rem",
                color: "white",
                outline: "none",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>

          {/* Público-Alvo */}
          <div className="input-group">
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#8b92a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={15} /> Quem é seu cliente ideal / público-alvo? (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Donos de e-commerce, consultórios, imobiliárias"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            />
          </div>

          {/* Tom da Mensagem */}
          <div className="input-group">
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#8b92a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquareCode size={15} /> Tom preferencial para a abordagem comercial
            </label>
            <select
              value={formData.customTone}
              onChange={(e) => setFormData({ ...formData, customTone: e.target.value })}
              className="w-full"
            >
              <option value="profissional">Profissional e Fluido (Recomendado)</option>
              <option value="descontraido">Leve e Amigável</option>
              <option value="direto">Direto ao Ponto e Objetivo</option>
              <option value="consultivo">Consultivo e Educativo</option>
            </select>
          </div>

          {/* Botão de Ação */}
          <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              className="premium-btn"
              style={{ minWidth: "180px", gap: "0.5rem" }}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> Salvar Perfil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
