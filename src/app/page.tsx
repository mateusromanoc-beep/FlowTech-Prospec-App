"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Building2, Loader2, Sparkles, CheckCircle2, ArrowRight, Cpu } from "lucide-react";
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
    <main className="container animate-fade-in" style={{ padding: '2rem' }}>
      {/* ========== HERO SECTION (Estilo FlowTech) ========== */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', paddingTop: '4rem', paddingBottom: '3rem',
      }}>
        {/* Logo centralizado */}
        <motion.img
          src="/logo.png"
          alt="Flow Prospect"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ height: '120px', width: 'auto', marginBottom: '2rem', objectFit: 'contain' }}
        />

        {/* Título grande com gradiente */}
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '1.5rem' }}
        >
          Automatize tudo!
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ color: '#8b92a5', fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.7, marginBottom: '2.5rem' }}
        >
          Automações que transformam os resultados do seu negócio, <strong style={{ color: 'white' }}>deixe a IA trabalhar para você!</strong>
        </motion.p>

        {/* Botões lado a lado */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <a href="#search-section" className="premium-btn" style={{ gap: '0.5rem' }}>
            Iniciar Prospecção <ArrowRight size={18} />
          </a>
          <Link href="/leads" className="outline-btn">
            Ver Resultados
          </Link>
        </motion.div>
      </section>

      {/* ========== FORMULÁRIO DE BUSCA ========== */}
      <section id="search-section" className="glass" style={{
        padding: '2.5rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', opacity: 0.03, pointerEvents: 'none' }}>
          <Cpu size={280} />
        </div>
        
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Search size={20} style={{ color: 'var(--secondary)' }} />
              Preencha os campos e encontre seus leads!
            </h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button type="submit" className="premium-btn" disabled={loading} style={{ minWidth: '260px' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>Iniciar Prospecção <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ========== STATS ========== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { label: "Total de Leads", value: data.stats.total, icon: Building2 },
          { label: "Novos Hoje", value: data.stats.today, icon: Sparkles },
          { label: "Cidades Ativas", value: data.stats.cities, icon: MapPin },
          { label: "Taxa de Sucesso", value: data.stats.successRate, icon: Search },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="glass"
            style={{ padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(108,58,237,0.1)', borderRadius: '0.5rem' }}>
                <stat.icon size={18} style={{ color: 'var(--secondary)' }} />
              </div>
            </div>
            <h4 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stat.value}</h4>
            <p style={{ fontSize: '0.85rem', color: '#8b92a5' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ========== TABELA RECENTE ========== */}
      <section className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Resumo Recente</h3>
          <Link href="/leads" style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Ver todos os Leads</Link>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {data.leads.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: '#8b92a5' }}>
              Nenhum lead encontrado. Inicie uma nova busca acima.
            </div>
          ) : (
            <table>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ textAlign: 'left' }}>Empresa</th>
                  <th style={{ textAlign: 'left' }}>Cidade</th>
                  <th style={{ textAlign: 'left' }}>Tipo</th>
                  <th style={{ textAlign: 'left' }}>Data</th>
                  <th style={{ textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map((lead: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ fontWeight: 500 }}>{lead.name}</td>
                    <td style={{ color: '#8b92a5' }}>{lead.city}</td>
                    <td style={{ color: '#8b92a5' }}>{lead.type}</td>
                    <td style={{ color: '#8b92a5', fontSize: '0.85rem' }}>
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '9999px',
                        background: 'rgba(16,185,129,0.15)', color: '#10b981',
                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      }}>
                        <CheckCircle2 size={10} /> Concluído
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
