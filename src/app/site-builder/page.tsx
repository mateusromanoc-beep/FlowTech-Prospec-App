"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles, Code, Play, Copy, CheckCircle, Download, Monitor, Smartphone, Send, Loader2, Lock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SiteBuilderPage() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(true);
  const [lead, setLead] = useState<any>(null);

  // Estados do Criador
  const [htmlCode, setHtmlCode] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Estados de Refinamento com IA
  const [aiPrompt, setAiPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [generationStep, setGenerationStep] = useState("");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Carregar dados do Lead e verificar permissão
  useEffect(() => {
    if (!leadId) {
      setError("ID do lead não fornecido.");
      setLoading(false);
      return;
    }

    const loadLead = async () => {
      try {
        setGenerationStep("Verificando credenciais de acesso...");
        const res = await fetch(`/api/leads/${leadId}`);
        
        if (res.status === 403) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao buscar lead.");
        }

        const data = await res.json();
        setLead(data);

        // Se o lead já tiver um HTML salvo no banco, carrega ele diretamente sem re-gerar
        if (data.generatedHtml) {
          setHtmlCode(data.generatedHtml);
          setLoading(false);
        } else {
          // Se não tiver, inicia a geração do site automático pela primeira vez
          generateInitialSite(data.id);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Não foi possível carregar os dados do lead.");
        setLoading(false);
      }
    };

    loadLead();
  }, [leadId]);

  // 2. Lógica para gerar o site inicial
  const generateInitialSite = async (id: number) => {
    try {
      setGenerationStep("IA do FlowTech analisando os dados da empresa...");
      await new Promise(r => setTimeout(r, 800));
      setGenerationStep("Estruturando design responsivo e seções de conversão...");
      await new Promise(r => setTimeout(r, 800));
      setGenerationStep("Buscando imagens profissionais e gerando código-fonte...");

      const res = await fetch("/api/ai/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao gerar site com IA.");
      }

      const data = await res.json();
      setHtmlCode(data.htmlCode);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro durante a geração com inteligência artificial.");
      setLoading(false);
    }
  };

  // 3. Salvar o código editado manualmente
  const handleSaveCode = async () => {
    if (!lead) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/leads/${lead.id}/save-site`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlCode }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar o site.");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 4. Copiar link de preview público para enviar ao cliente
  const handleCopyLink = async () => {
    if (!lead) return;
    const previewUrl = `${window.location.protocol}//${window.location.host}/preview/${lead.id}`;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = previewUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // 5. Lógica para refinar o site com novas instruções
  const handleRefineSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || refining || !lead) return;

    setRefining(true);
    const userPrompt = aiPrompt;
    setAiPrompt("");

    try {
      const res = await fetch("/api/ai/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          customPrompt: userPrompt,
          previousCode: htmlCode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao refinar site.");
      }

      const data = await res.json();
      setHtmlCode(data.htmlCode);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao aplicar ajustes: " + err.message);
    } finally {
      setRefining(false);
    }
  };

  // 6. Copiar código para a área de transferência
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = htmlCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 7. Baixar arquivo index.html
  const handleDownloadFile = () => {
    if (!lead) return;
    const blob = new Blob([htmlCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanName = lead.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.href = url;
    link.download = `index_${cleanName}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  // --- TELA DE ACESSO NEGADO / UPGRADE ---
  if (!hasAccess) {
    return (
      <main className="container flex items-center justify-center min-h-[90vh] p-8">
        <motion.div 
          className="glass text-center p-12 max-w-xl border border-white/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div style={{ display: 'inline-flex', padding: '1.25rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '2rem', marginBottom: '2rem', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
            <Lock size={48} style={{ color: '#ec4899' }} />
          </div>
          <h1 className="text-3xl font-extrabold mb-4 text-white">Função User Pro Requerida</h1>
          <p className="text-muted leading-relaxed mb-8 text-base">
            O criador automatizado de websites é um recurso de nível corporativo e está disponível exclusivamente para usuários com a função <strong>User Pro</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20o%20upgrade%20para%20User%20Pro!"
              target="_blank"
              rel="noopener noreferrer"
              className="premium-btn py-3 px-8"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', borderColor: '#d946ef' }}
            >
              Solicitar Acesso Pro
            </a>
            <Link href="/leads" className="outline-btn py-3 px-8">
              Voltar para os Leads
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  // --- TELA DE CARREGAMENTO / LOADING ---
  if (loading) {
    return (
      <main className="container flex flex-col items-center justify-center min-h-[85vh] p-8">
        <div className="text-center max-w-md">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            style={{ display: 'inline-flex', marginBottom: '2rem' }}
          >
            <Loader2 size={64} className="text-primary" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-3 text-white">Construindo Site Profissional</h2>
          <p className="text-muted text-sm mb-6">Aguarde, estamos estruturando o site com inteligência comercial.</p>
          
          <div className="glass px-6 py-4 border border-white/5 rounded-xl flex items-center gap-3">
            <Sparkles size={18} className="text-secondary animate-pulse" />
            <span className="text-xs font-semibold text-white/90">{generationStep}</span>
          </div>
        </div>
      </main>
    );
  }

  // --- TELA DE ERRO ---
  if (error) {
    return (
      <main className="container flex flex-col items-center justify-center min-h-[80vh] p-8">
        <div className="glass text-center p-8 max-w-md border border-red-500/20">
          <h2 className="text-2xl font-bold mb-3 text-red-400">Ocorreu um Erro</h2>
          <p className="text-muted text-sm mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => window.location.reload()} className="premium-btn text-xs py-2 px-6">
              Tentar Novamente
            </button>
            <Link href="/leads" className="outline-btn text-xs py-2 px-6">
              Voltar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="builder-container">
      {/* Header do Criador */}
      <header className="builder-header glass">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{lead?.name}</h1>
            <p className="text-[10px] text-muted">{lead?.type || "Nicho não informado"} • {lead?.city}</p>
          </div>
        </div>

        {/* Botões de Ações Globais */}
        <div className="flex items-center gap-3">
          {/* Cópia do Link Público para Enviar ao Lead */}
          <button 
            onClick={handleCopyLink} 
            className={`action-pill ${copiedLink ? 'success' : ''}`}
            style={{ background: 'rgba(34, 211, 238, 0.1)', borderColor: 'rgba(34, 211, 238, 0.3)', color: 'var(--secondary)' }}
            title="Copiar link real do site gerado para enviar ao cliente"
          >
            {copiedLink ? <><CheckCircle size={14} /> Link Copiado!</> : <><ExternalLink size={14} /> Link para o Cliente</>}
          </button>

          {/* Salvamento Manual */}
          <button 
            onClick={handleSaveCode} 
            disabled={saving}
            className={`action-pill ${saved ? 'success' : ''}`}
            style={saved ? { background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: '#34d399' } : {}}
            title="Salvar alterações manuais feitas no código"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            ) : saved ? (
              <><CheckCircle size={14} /> Salvo!</>
            ) : (
              <><Play size={14} /> Salvar Alterações</>
            )}
          </button>

          <button 
            onClick={handleCopyCode} 
            className={`action-pill ${copied ? 'success' : ''}`}
          >
            {copied ? <><CheckCircle size={14} /> Copiado</> : <><Code size={14} /> Copiar Código</>}
          </button>
          
          <button 
            onClick={handleDownloadFile} 
            className={`action-pill ${downloaded ? 'success' : ''}`}
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', border: 'none', color: 'white' }}
          >
            {downloaded ? <><CheckCircle size={14} /> Pronto</> : <><Download size={14} /> Baixar HTML</>}
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="builder-workspace">
        {/* Coluna Esquerda: Editor de Código & Refinador */}
        <section className="left-panel">
          {/* Aba do Painel */}
          <div className="panel-tab">
            <Code size={14} className="text-secondary" />
            <span className="text-xs font-semibold text-white/95">Editor de Código-Fonte</span>
          </div>

          {/* Textarea do Editor */}
          <div className="editor-wrapper">
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="code-textarea"
              placeholder="<!-- Código HTML aqui -->"
              spellCheck={false}
            />
          </div>

          {/* Input de Chat de Refinação por IA */}
          <div className="refine-panel glass">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Sparkles size={14} style={{ color: '#ec4899' }} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">Refinar site com Inteligência Artificial</span>
            </div>
            <form onSubmit={handleRefineSite} className="flex gap-2 relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={refining}
                placeholder="Ex: 'Troque a cor de destaque para azul', 'Adicione uma seção de serviços'..."
                className="refine-input"
              />
              <button
                type="submit"
                disabled={refining || !aiPrompt.trim()}
                className="refine-submit-btn"
                title="Enviar para a IA"
              >
                {refining ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Coluna Direita: Visualizador do Iframe */}
        <section className="right-panel">
          {/* Barra Superior do Navegador Simulado */}
          <div className="browser-bar">
            {/* Controles de responsividade */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem', borderRadius: '8px' }}>
              <button
                onClick={() => setViewMode("desktop")}
                className={`responsive-btn ${viewMode === "desktop" ? "active" : ""}`}
                title="Visualização Computador"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`responsive-btn ${viewMode === "mobile" ? "active" : ""}`}
                title="Visualização Celular"
              >
                <Smartphone size={14} />
              </button>
            </div>

            {/* URL fictícia que direciona para o link público de preview */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <a 
                href={`/preview/${lead?.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="fake-address-bar"
                title="Clique para abrir o preview do cliente em tela cheia numa nova aba"
              >
                {lead?.name ? `${lead.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.flowtechsite.com` : "localhost:3000"} 
                <ExternalLink size={10} style={{ marginLeft: '6px', opacity: 0.7 }} />
              </a>
            </div>
          </div>

          {/* Container do Iframe (Simulador de Dispositivo) */}
          <div className="iframe-container">
            <div className={`preview-wrapper ${viewMode}`}>
              <iframe
                ref={iframeRef}
                srcDoc={htmlCode}
                title="Visualização do Site"
                className="preview-iframe"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .builder-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background: #070913;
        }

        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-radius: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 10;
          height: 65px;
        }

        .action-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.4rem 1rem;
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .action-pill:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .action-pill:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-pill.success {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: #10b981 !important;
          color: #34d399 !important;
        }

        .builder-workspace {
          display: grid;
          grid-template-columns: 460px 1fr;
          flex: 1;
          height: calc(100vh - 65px);
          overflow: hidden;
          background: #05060b;
        }

        .left-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          background: #090a12;
          overflow: hidden;
        }

        .panel-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
          height: 40px;
        }

        .editor-wrapper {
          flex: 1;
          overflow: hidden;
          position: relative;
          height: calc(100% - 160px); /* Ajustando altura para sobrar espaço pro refine */
        }

        .code-textarea {
          width: 100%;
          height: 100%;
          background: #06070d;
          border: none;
          color: #a9b2c3;
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          line-height: 1.5;
          padding: 1rem;
          resize: none;
          outline: none;
          white-space: pre;
          overflow: auto;
        }

        .code-textarea::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .code-textarea::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }
        
        .code-textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .refine-panel {
          padding: 1rem;
          border-radius: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(12, 16, 30, 0.95);
          height: 120px;
        }

        .refine-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          padding: 0.65rem 3.5rem 0.65rem 1.25rem;
          color: white;
          font-size: 0.85rem;
          outline: none;
          width: 100%;
        }

        .refine-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
        }

        .refine-submit-btn {
          position: absolute;
          right: 4px;
          top: 4px;
          bottom: 4px;
          width: 38px;
          height: 38px;
          border-radius: 99px;
          background: #8b5cf6;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .refine-submit-btn:hover:not(:disabled) {
          background: #7c3aed;
          transform: scale(1.05);
        }
        
        .refine-submit-btn:disabled {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.2);
          cursor: not-allowed;
        }

        .right-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #05060b;
          overflow: hidden;
        }

        .browser-bar {
          display: flex;
          align-items: center;
          padding: 0.5rem 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          gap: 1.5rem;
          height: 45px;
        }

        .responsive-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }

        .responsive-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .responsive-btn.active {
          color: var(--secondary);
          background: rgba(34, 211, 238, 0.1);
        }

        .fake-address-bar {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 99px;
          padding: 0.3rem 2rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          min-width: 320px;
          max-width: 480px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .fake-address-bar:hover {
          border-color: var(--secondary);
          color: white;
          background: rgba(34, 211, 238, 0.05);
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.1);
        }

        .iframe-container {
          background: #030408;
          padding: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          height: calc(100% - 45px);
          overflow: hidden;
        }

        .preview-wrapper {
          background: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }

        .preview-wrapper.desktop {
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }

        .preview-wrapper.mobile {
          width: 375px;
          height: 100%;
          max-height: 667px;
          border-radius: 20px;
          border: 8px solid #1a1a24;
        }

        .preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
          flex: 1;
        }
      `}</style>
    </main>
  );
}
