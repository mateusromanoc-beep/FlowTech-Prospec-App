"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Building2, ZipCode, Loader2, Sparkles, PlusCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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
      
      // Recarregar os dados do dashboard após o sucesso
      fetchData();
    } catch (error: any) {
      console.error(error);
      setLoading(false);
      alert(`Erro: ${error.message || "Erro ao conectar com o servidor"}. Por favor, verifique se as credenciais do Google Maps e Gemini estão ativas no n8n.`);
    }
  };

  return (
    <main className="container animate-fade-in p-8">
      {/* Welcome Section */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-xl" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">FlowTech Dashboard</h1>
        </div>
        <p className="text-muted text-lg">Bem-vindo ao centro de comando da sua automação de prospecção.</p>
      </section>

      {/* Hero Search Section */}
      <section className="glass p-8 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
        
        <form onSubmit={handleSubmit} className="relative z-10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Search size={20} className="text-primary" />
            Configurar Nova Busca
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              type="submit" 
              className="premium-btn py-3 px-8 text-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Iniciar Prospecção Real-time"}
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
