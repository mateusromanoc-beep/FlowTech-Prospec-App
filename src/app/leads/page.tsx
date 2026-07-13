"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, MapPin, Building2, Phone, Filter, ArrowLeft, Download, ExternalLink, MessageSquare, Trash2, Bot, Copy, CheckCircle, X, Loader2, MessageCircle } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [leads, setLeads] = useState<any[]>([]);

  // Estado do modal de IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Carregamento inicial de dados (Real)
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch("/api/leads");
        const data = await response.json();
        // Ajuste para o novo formato { leads: [], stats: {} }
        setLeads(data.leads || []);
      } catch (error) {
        console.error("Erro ao carregar leads:", error);
      }
    };
    fetchLeads();
  }, []);

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
      // Fallback para navegadores mais antigos
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
    const headers = ["Nome", "Telefone", "Website", "Endereço", "Cidade", "Tipo", "Avaliação"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map(l => [
        `"${l.name}"`,
        `"${l.phone || ""}"`,
        `"${l.website || ""}"`,
        `"${l.address || ""}"`,
        `"${l.city || ""}"`,
        `"${l.type || ""}"`,
        `"${l.rating || ""}"`
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
      Avaliação: l.rating || ""
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `leads_prospeccao_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const categories = ["Todos", ...Array.from(new Set(leads.map(l => l.type).filter(Boolean)))];

  const filteredLeads = leads.filter(lead => 
    (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     lead.city.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === "Todos" || lead.type === filterType)
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
            <p className="text-muted">Gerencie todos os leads capturados pela sua automação.</p>
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
      <div className="glass p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou cidade..." 
            className="w-full pl-10 bg-white/5 border-white/10 rounded-lg focus:border-primary outline-none py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-muted" />
          <select 
            className="bg-white/5 border-white/10 rounded-lg outline-none py-2 px-4 text-white cursor-pointer hover:bg-white/10"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === "Todos" ? "Todas Tipologias" : cat}</option>
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
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 size={24} className="text-primary" />
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
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

              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{lead.name}</h3>
              
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
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                      Visitar Website
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
                {/* Linha 1: Botão Ligar + Website */}
                <div className="flex gap-2">
                  <a 
                    href={lead.phone ? `tel:${lead.phone}` : "#"}
                    className={`flex-1 flex items-center justify-center gap-2 premium-btn ${!lead.phone && 'opacity-50 pointer-events-none'}`}
                  >
                    <Phone size={16} /> Ligar
                  </a>
                  {lead.website && (
                    <a 
                      href={lead.website}
                      target="_blank"
                      className="p-3 glass hover:bg-primary/20 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>

                {/* Linha 2: WhatsApp + Gerar Abordagem IA */}
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
                  >
                    <Bot size={16} /> Abordagem IA
                  </button>
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
