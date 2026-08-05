"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Building2, Loader2, Sparkles, CheckCircle2, ArrowRight, Cpu, Trash2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ leads: any[], stats: any }>({
    leads: [],
    stats: { total: 0, today: 0, cities: 0, successRate: "0%", plan: { name: "STARTER", limit: 500, consumed: 0 } }
  });
  const [formData, setFormData] = useState({
    subcat: "",
    city: "",
    source: "google" // "google" ou "linkedin"
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

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData({
          ...data,
          leads: data.leads.filter(l => l.id !== id)
        });
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao excluir lead");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao excluir");
    }
  };

  const planName = data.stats.plan?.name || "STARTER";
  const limit = data.stats.plan?.limit || 500;
  const consumed = data.stats.plan?.consumed || 0;
  const percentage = limit === -1 ? 0 : Math.min(100, Math.round((consumed / limit) * 100));

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
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Search size={20} style={{ color: 'var(--secondary)' }} />
              Preencha os campos e encontre seus leads!
            </h3>

            {/* Selector de Origem Premium */}
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, source: "google" })}
                style={{
                  padding: '8px 20px',
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: formData.source === "google" ? 'var(--primary)' : 'transparent',
                  color: formData.source === "google" ? 'white' : '#8b92a5'
                }}
              >
                🌐 Google Maps (Empresas)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, source: "linkedin" })}
                style={{
                  padding: '8px 20px',
                  borderRadius: '25px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: formData.source === "linkedin" ? '#0077b5' : 'transparent',
                  color: formData.source === "linkedin" ? 'white' : '#8b92a5'
                }}
              >
                💼 LinkedIn (Decisores)
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} /> Cidade
              </label>
              <input 
                type="text" 
                placeholder={formData.source === "linkedin" ? "Ex: São Paulo" : "Ex: Americana"} 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                required
              />
            </div>
            
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#8b92a5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={14} /> {formData.source === "linkedin" ? "Cargo / Nicho" : "Tipologia / Ramo"}
              </label>
              <input 
                type="text" 
                placeholder={formData.source === "linkedin" ? "Ex: CEO Tecnologia" : "Ex: Autopeças"} 
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

        {/* Barra de Progresso do Plano */}
        <div style={{ maxWidth: '800px', margin: '3rem auto 0', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} style={{ color: 'var(--secondary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Plano {planName === "UNLIMITED" ? "Ilimitado" : planName}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#8b92a5' }}>
              {limit === -1 ? `${consumed} consumidos este mês` : `${consumed} / ${limit} leads consumidos`}
            </span>
          </div>
          {limit !== -1 && (
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${percentage}%`, 
                background: percentage > 90 ? '#ef4444' : percentage > 75 ? '#f59e0b' : 'var(--primary)',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
          )}
        </div>
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
                  <th style={{ textAlign: 'left' }}>Nome / Empresa</th>
                  <th style={{ textAlign: 'left' }}>Cidade</th>
                  <th style={{ textAlign: 'left' }}>Tipo / Ramo</th>
                  <th style={{ textAlign: 'left' }}>Origem</th>
                  <th style={{ textAlign: 'left' }}>Data</th>
                  <th style={{ textAlign: 'left' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map((lead: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ fontWeight: 500 }}>{lead.name}</td>
                    <td style={{ color: '#8b92a5' }}>{lead.city}</td>
                    <td style={{ color: '#8b92a5' }}>{lead.type}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '4px',
                        background: lead.source === "linkedin" ? 'rgba(0, 119, 181, 0.15)' : 'rgba(235, 64, 52, 0.15)',
                        color: lead.source === "linkedin" ? '#0077b5' : '#eb4034',
                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      }}>
                        {lead.source === "linkedin" ? "💼 LinkedIn" : "🌐 Google Maps"}
                      </span>
                    </td>
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
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(lead.id)}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Excluir Lead"
                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      >
                        <Trash2 size={16} />
                      </button>
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
