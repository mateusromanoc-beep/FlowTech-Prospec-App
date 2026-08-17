"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, Building2, Phone, Filter, ArrowLeft, Download, ExternalLink, MessageSquare, Trash2, Bot, Copy, CheckCircle, X, Loader2, MessageCircle, Sparkles, User, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import * as XLSX from "xlsx";

// Formatar número para WhatsApp (padrão BR +55)
function formatPhoneForWhatsApp(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, "");
  // Se começar com 0, remove o 0
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  // Se não começar com 55 (código BR), adiciona
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  return cleaned;
}

export default function LeadsPage() {
  const [filterSource, setFilterSource] = useState("Todos");
  const [filterUser, setFilterUser] = useState<string>("me");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [leads, setLeads] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("USER");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado do modal de IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Ler o parâmetro userId da URL no carregamento inicial
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlUserId = params.get("userId");
      if (urlUserId) {
        setFilterUser(urlUserId);
      }
    }
  }, []);

  // Carregamento de dados com suporte a filtro de usuário para ADMIN
  const fetchLeads = async (selectedUser = filterUser) => {
    setLoading(true);
    try {
      let url = "/api/leads";
      if (selectedUser && selectedUser !== "me") {
        url += `?userId=${selectedUser}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setLeads(data.leads || []);
      setUserRole(data.userRole || "USER");
      setCurrentUserId(data.currentUserId || null);
      if (data.users) {
        setAvailableUsers(data.users);
      }
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(filterUser);
  }, [filterUser]);

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads(leads.filter(l => l.id !== id));
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao excluir lead");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao excluir");
    }
  };

  // Gerar mensagem de abordagem via IA
  const handleGenerateMessage = async (lead: any) => {
    setSelectedLead(lead);
    setShowAIModal(true);
    setAiLoading(true);
    setAiMessage("");
    setAiError("");
    setCopied(false);

    try {
      const res = await fetch("/api/ai/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          type: lead.type,
          city: lead.city,
          phone: lead.phone,
          website: lead.website,
          rating: lead.rating,
          review_summary: lead.review_summary,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao gerar mensagem");
      }

      const data = await res.json();
      setAiMessage(data.message);
    } catch (err: any) {
      console.error("Erro IA:", err);
      setAiError(err.message || "Não foi possível gerar a mensagem. Tente novamente.");
    } finally {
      setAiLoading(false);
    }
  };

  // Copiar mensagem para clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aiMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = aiMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Gerar link do WhatsApp com mensagem
  const getWhatsAppLinkWithMessage = (phone: string, message: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Telefone", "Website", "Endereço", "Cidade", "Tipo", "Avaliação", "Origem", "Usuário"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map(l => [
        `"${l.name}"`,
        `"${l.phone || ""}"`,
        `"${l.website || ""}"`,
        `"${l.address || ""}"`,
        `"${l.city || ""}"`,
        `"${l.type || ""}"`,
        `"${l.rating || ""}"`,
        `"${l.source || "google"}"`,
        `"${l.userName || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_prospeccao_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLeads.map(l => ({
      Nome: l.name,
      Telefone: l.phone || "",
      Website: l.website || "",
      Endereço: l.address || "",
      Cidade: l.city || "",
      Tipo: l.type || "",
      Avaliação: l.rating || "",
      Origem: l.source === "linkedin" ? "LinkedIn" : "Google Maps",
      Usuario: l.userName || ""
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `leads_prospeccao_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const categories = ["Todos", ...Array.from(new Set(leads.map(l => l.type).filter(Boolean)))];

  const filteredLeads = leads.filter(lead => 
    (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     lead.city.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === "Todos" || lead.type === filterType) &&
    (filterSource === "Todos" || (filterSource === "google" && (lead.source === "google" || !lead.source)) || lead.source === filterSource)
  );

  return (
    <main className="container animate-fade-in p-8">
      {/* Header com Navegação */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Explorador FlowTech</h1>
            <p className="text-muted">
              {userRole === "ADMIN" && filterUser !== "me" && filterUser !== "all" ? (
                <>Auditoria individual de leads do usuário selecionado.</>
              ) : (
                <>Gerencie todos os leads capturados pela sua automação.</>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="premium-btn" onClick={exportToCSV} disabled={filteredLeads.length === 0}>
            <Download size={18} /> CSV
          </button>
          <button className="premium-btn" onClick={exportToXLSX} disabled={filteredLeads.length === 0} style={{ background: '#107c41', borderColor: '#185c37' }}>
            <Download size={18} /> XLSX
          </button>
        </div>
      </header>

      {/* Controles de Filtro e Busca */}
      <div className="glass p-6 mb-8 flex flex-col md:flex-row gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[240px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou cidade..." 
            className="w-full pl-10 bg-white/5 border-white/10 rounded-lg focus:border-primary outline-none py-2 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Seletor de Usuário exclusivo para ADMIN */}
          {userRole === "ADMIN" && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-primary/30 rounded-lg px-2 py-1">
              <Users size={16} className="text-primary" />
              <select 
                className="bg-transparent border-none outline-none py-1 px-1 text-white text-xs font-semibold cursor-pointer"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="me" className="bg-[#1e1f26]">Meus Leads</option>
                <option value="all" className="bg-[#1e1f26]">Todos os Usuários</option>
                <optgroup label="Usuários Individuais" className="bg-[#1e1f26]">
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id.toString()} className="bg-[#1e1f26]">
                      {u.name} ({u.role})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Filter size={18} className="text-muted" />
            <select 
              className="bg-white/5 border-white/10 rounded-lg outline-none py-2 px-3 text-white text-sm cursor-pointer hover:bg-white/10"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="Todos" className="bg-[#1e1f26]">Todas as Origens</option>
              <option value="google" className="bg-[#1e1f26]">🌐 Google Maps</option>
              <option value="linkedin" className="bg-[#1e1f26]">💼 LinkedIn</option>
            </select>
          </div>

          <select 
            className="bg-white/5 border-white/10 rounded-lg outline-none py-2 px-3 text-white text-sm cursor-pointer hover:bg-white/10"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-[#1e1f26]">{cat === "Todos" ? "Todas Tipologias" : cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Leads (Cards Premium) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredLeads.map((lead) => (
            <motion.div 
              key={lead.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass p-6 hover:border-primary/50 transition-colors group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 size={24} className="text-primary" />
                  </div>
                  {/* Badge de Origem */}
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: lead.source === "linkedin" ? 'rgba(0, 119, 181, 0.15)' : 'rgba(235, 64, 52, 0.15)',
                    color: lead.source === "linkedin" ? '#0077b5' : '#eb4034',
                    textTransform: 'uppercase'
                  }}>
                    {lead.source === "linkedin" ? "LinkedIn" : "Google Maps"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-yellow-400 text-sm font-bold">
                    ★ {lead.rating}
                  </div>
                  <button 
                    onClick={() => handleDelete(lead.id)}
                    className="text-white/30 hover:text-red-400 transition-colors ml-4"
                    title="Excluir Lead"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{lead.name}</h3>
              
              {/* Identificação de quem capturou o Lead (visível apenas para Administradores) */}
              {userRole === "ADMIN" && lead.userName && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md w-fit">
                  <User size={12} />
                  <span>Prospectado por: <strong>{lead.userName}</strong></span>
                </div>
              )}
              
              <div className="space-y-2 mb-6 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" /> {lead.address}, {lead.city}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-primary" /> {lead.phone || "Não informado"}
                </div>
                {lead.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink size={14} className="text-primary" /> 
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400 truncate max-w-[200px]">
                      {lead.source === "linkedin" ? "Abrir LinkedIn" : "Visitar Website"}
                    </a>
                  </div>
                )}
                {lead.review_summary && (
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" /> 
                    <span className="italic truncate">"{lead.review_summary}"</span>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Linha 1: Ação Principal (LinkedIn ou Ligar) + Link Externo */}
                <div className="flex gap-2">
                  {lead.source === "linkedin" ? (
                    <a 
                      href={lead.website || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 premium-btn"
                      style={{ background: '#0077b5', borderColor: '#005f91' }}
                    >
                      <ExternalLink size={16} /> Abrir LinkedIn
                    </a>
                  ) : (
                    <a 
                      href={lead.phone ? `tel:${lead.phone}` : "#"}
                      className={`flex-1 flex items-center justify-center gap-2 premium-btn ${!lead.phone && 'opacity-50 pointer-events-none'}`}
                    >
                      <Phone size={16} /> Ligar
                    </a>
                  )}
                  {lead.website && lead.source !== "linkedin" && (
                    <a 
                      href={lead.website}
                      target="_blank"
                      className="p-3 glass hover:bg-primary/20 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>

                {/* Linha 2: WhatsApp + Abordagem IA (para ambos os tipos de lead) */}
                <div className="flex gap-2">
                  <a
                    href={lead.phone ? `https://wa.me/${formatPhoneForWhatsApp(lead.phone)}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`whatsapp-btn ${!lead.phone ? 'opacity-40 pointer-events-none' : ''}`}
                    style={!lead.phone ? { pointerEvents: 'none' } : {}}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <button
                    onClick={() => handleGenerateMessage(lead)}
                    className="ai-btn"
                    style={lead.source === "linkedin" ? { background: 'linear-gradient(135deg, #0077b5 0%, #8b5cf6 100%)', borderColor: '#8b5cf6' } : {}}
                  >
                    <Bot size={16} /> {lead.source === "linkedin" ? "Abordagem IA" : "Abordagem IA"}
                  </button>
                </div>

                {/* Linha 3: Criador de Sites IA */}
                <div className="flex gap-2">
                  {userRole === "USER_PRO" || userRole === "ADMIN" ? (
                    <>
                      <Link
                        href={`/site-builder?leadId=${lead.id}`}
                        className="flex-1 flex items-center justify-center gap-2 premium-btn"
                        style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', borderColor: '#d946ef', marginTop: '0.25rem' }}
                      >
                        <Sparkles size={16} /> {lead.generatedHtml ? "Editar Site IA" : "Criar Site IA"}
                      </Link>
                      {lead.generatedHtml && (
                        <a
                          href={`/preview/${lead.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 glass hover:bg-primary/20 transition-colors flex items-center justify-center"
                          style={{ marginTop: '0.25rem', borderRadius: '9999px', width: '46px', height: '46px' }}
                          title="Visualizar site publicado do cliente"
                        >
                          <ExternalLink size={18} style={{ color: 'var(--secondary)' }} />
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 premium-btn"
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.15)', color: 'rgba(255, 255, 255, 0.4)', boxShadow: 'none', marginTop: '0.25rem' }}
                    >
                      <Sparkles size={16} /> Criar Site IA 🔒
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
          <p className="text-muted">Nenhum lead encontrado com estes filtros.</p>
        </div>
      )}

      {/* ========== MODAL DE IA (renderizado via Portal no body) ========== */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showAIModal && (
            <motion.div
              className="ai-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { if (e.target === e.currentTarget && !aiLoading) setShowAIModal(false); }}
            >
              <motion.div
                className="ai-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                {/* Header do Modal */}
                <div className="ai-modal-header">
                  <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '0.75rem' }}>
                    <Bot size={22} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3>Mensagem de Abordagem</h3>
                    {selectedLead && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                        Para: {selectedLead.name}
                      </p>
                    )}
                  </div>
                  {!aiLoading && (
                    <button
                      onClick={() => setShowAIModal(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* Conteúdo */}
                {aiLoading ? (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader2 size={16} className="animate-spin" style={{ color: '#8B5CF6' }} />
                      Gerando mensagem personalizada...
                    </p>
                    <div className="ai-loading-skeleton">
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line" />
                    </div>
                  </div>
                ) : aiError ? (
                  <div>
                    <div className="ai-modal-message" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                      ⚠️ {aiError}
                    </div>
                    <div className="ai-modal-actions">
                      <button
                        onClick={() => selectedLead && handleGenerateMessage(selectedLead)}
                        className="premium-btn"
                        style={{ fontSize: '0.85rem', padding: '0.75rem 1.5rem' }}
                      >
                        Tentar novamente
                      </button>
                      <button
                        onClick={() => setShowAIModal(false)}
                        className="outline-btn"
                        style={{ fontSize: '0.85rem', padding: '0.75rem 1.5rem' }}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="ai-modal-message">
                      {aiMessage}
                    </div>
                    <div className="ai-modal-actions">
                      <button
                        onClick={handleCopy}
                        className={`premium-btn ${copied ? 'copy-btn-success' : ''}`}
                        style={{ fontSize: '0.85rem', padding: '0.75rem 1.5rem' }}
                      >
                        {copied ? <><CheckCircle size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                      </button>
                      {selectedLead?.phone && (
                        <a
                          href={getWhatsAppLinkWithMessage(selectedLead.phone, aiMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whatsapp-btn"
                          style={{ fontSize: '0.85rem', padding: '0.75rem 1.5rem' }}
                        >
                          <MessageCircle size={16} /> Enviar via WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => selectedLead && handleGenerateMessage(selectedLead)}
                        className="outline-btn"
                        style={{ fontSize: '0.85rem', padding: '0.75rem 1.5rem' }}
                      >
                        Regenerar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
          {showUpgradeModal && (
            <motion.div
              className="ai-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
            >
              <motion.div
                className="ai-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '450px', padding: '2.5rem', textAlign: 'center' }}
              >
                <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                  <Sparkles size={40} style={{ color: '#ec4899' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>Recurso Exclusivo User Pro</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  A criação automatizada de websites com IA baseada nas informações do Google Maps está disponível apenas para parceiros com acesso <strong>User Pro</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a
                    href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20o%20upgrade%20para%20o%20plano%20User%20Pro!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="premium-btn"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', borderColor: '#d946ef', width: '100%', fontSize: '0.9rem' }}
                  >
                    Falar com Suporte & Fazer Upgrade
                  </a>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="outline-btn"
                    style={{ width: '100%', fontSize: '0.9rem' }}
                  >
                    Voltar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style jsx>{`
        .p-8 { padding: 2rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-1 { flex: 1; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .grid { display: grid; }
        .w-full { width: 100%; }
        .italic { font-style: italic; }
        
        @media (min-width: 768px) {
          .md\\:flex-row { flex-direction: row; }
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1280px) {
          .xl\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </main>
  );
}
