"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Building2, Loader2, Sparkles, CheckCircle2, ArrowLeft, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ leads: any[], stats: any }>({
    leads: [],
    stats: { total: 0, today: 0, cities: 0, successRate: "0%" }
  });
  const [formData, setFormData] = useState({
    subcat: "",
    city: ""
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/leads?limit=5");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/prospect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Erro ao iniciar prospecção");

      const resData = await response.json();
      
      setLoading(false);
      alert(resData.message || "Prospecção concluída com sucesso!");
      
      fetchData();
    } catch (error: any) {
      console.error(error);
      setLoading(false);
      alert(`Erro: ${error.message || "Erro ao conectar com o servidor"}`);
    }
  };

  return (
    <main className="container animate-fade-in p-8">
      {/* Welcome Section / ANOVA Style Hero */}
      <section className="mb-16 mt-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
          <Sparkles size={16} /> A.I Driven SaaS Platform
        </div>
        <h1 className="title max-w-4xl mx-auto leading-tight">
          Transform Your Lead Gen with <br className="hidden md:block"/>
          <span className="neon-text">AI-Powered Solutions</span>
        </h1>
        <p className="subtitle max-w-2xl mx-auto mt-4 text-lg">
          Our AI platform automates repetitive prospecting tasks, connecting you directly with high-quality regional leads in seconds.
        </p>
      </section>

      {/* Hero Search Section */}
      <section className="glass p-10 mb-16 relative overflow-hidden bg-[rgba(10,11,16,0.8)] border-primary/20">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Cpu size={250} />
        </div>
        
        <form onSubmit={handleSubmit} className="relative z-10 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <img src="/logo.png" alt="FlowProspect Logo" className="w-24 h-24 mb-6 rounded-2xl bg-white p-2 object-contain shadow-[0_0_30px_rgba(49,88,255,0.2)]" />
            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Search size={22} className="text-primary" />
              Preencha os campos e encontre seus leads!
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="input-group">
              <label className="text-sm font-medium text-muted flex items-center gap-2">
                <MapPin size={14} /> Cidade
              </label>
              <input 
                type="text" 
                placeholder="Ex: Americana" 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                required
                className="w-full"
              />
            </div>
            
            <div className="input-group">
              <label className="text-sm font-medium text-muted flex items-center gap-2">
                <Building2 size={14} /> Tipologia / Ramo
              </label>
              <input 
                type="text" 
                placeholder="Ex: Autopeças" 
                value={formData.subcat}
                onChange={(e) => setFormData({...formData, subcat: e.target.value})}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button 
              type="submit" 
              className="premium-btn py-4 px-12 text-lg w-full md:w-auto"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : "Iniciar Prospecção Real-time"}
            </button>
          </div>
        </form>
      </section>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Leads", value: data.stats.total, change: "+100%", icon: Building2 },
          { label: "Novos Hoje", value: data.stats.today, change: data.stats.today > 0 ? "+100%" : "0%", icon: Sparkles },
          { label: "Cidades Ativas", value: data.stats.cities, change: "Real-time", icon: MapPin },
          { label: "Taxa de Sucesso", value: data.stats.successRate, change: "Calculado", icon: Search },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon size={20} className="text-primary" />
              </div>
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">
                {stat.change}
              </span>
            </div>
            <h4 className="text-3xl font-bold mb-1">{stat.value}</h4>
            <p className="text-sm text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Leads Preview Placeholder */}
      <section className="glass p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold">Resumo Recente</h3>
          <Link href="/leads" className="text-primary text-sm font-semibold hover:underline">Ver todos os Leads</Link>
        </div>
        
        <div className="overflow-x-auto">
          {data.leads.length === 0 ? (
            <div className="py-12 text-center text-muted">
              Nenhum lead encontrado. Inicie uma nova busca acima.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-muted text-sm">
                  <th className="pb-4 font-medium">Empresa</th>
                  <th className="pb-4 font-medium">Cidade</th>
                  <th className="pb-4 font-medium">Tipo</th>
                  <th className="pb-4 font-medium">Data</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map((lead, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 font-medium">{lead.name}</td>
                    <td className="py-4 text-muted">{lead.city}</td>
                    <td className="py-4 text-muted">{lead.type}</td>
                    <td className="py-4 text-muted text-sm">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded-full bg-success/20 text-success text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                        <CheckCircle2 size={10} /> CONCLUÍDO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <style jsx>{`
        .justify-between { display: flex; justify-content: space-between; }
        .items-center { align-items: center; }
        .flex { display: flex; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mt-8 { margin-top: 2rem; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .text-xl { font-size: 1.25rem; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .text-3xl { font-size: 1.875rem; }
        .font-bold { font-weight: 700; }
        .font-medium { font-weight: 500; }
        .p-8 { padding: 2rem; }
        .p-6 { padding: 1.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .w-full { width: 100%; }
        .text-left { text-align: left; }
        .rounded-full { border-radius: 9999px; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }

        @media (min-width: 768px) {
          .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 640px) {
          .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
      `}</style>
    </main>
  );
}
