"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Building2, Phone, Filter, ArrowLeft, Download, ExternalLink, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [leads, setLeads] = useState<any[]>([]);

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
        <button className="premium-btn" onClick={exportToCSV} disabled={filteredLeads.length === 0}>
          <Download size={18} /> Exportar CSV
        </button>
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
          <p className="text-muted">Nenhum lead encontrado com estes filtros.</p>
        </div>
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
          .md\:flex-row { flex-direction: row; }
          .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1280px) {
          .xl\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </main>
  );
}
