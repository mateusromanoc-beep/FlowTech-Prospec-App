import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { leads, agentProfiles, users } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Formata número para WhatsApp (padrão BR +55)
function cleanPhoneForWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  return cleaned;
}

export async function POST(req: Request) {
  try {
    // 1. Validar autenticação e permissões
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "USER_PRO") {
      return NextResponse.json(
        { error: "Apenas usuários com a função 'User Pro' têm acesso a este recurso." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { leadId, customPrompt, previousCode, visualStyle = "auto" } = body;

    if (!leadId) {
      return NextResponse.json({ error: "O ID do lead é obrigatório." }, { status: 400 });
    }

    // 2. Buscar o lead no banco de dados garantindo a segurança de multi-tenant
    const query = db.select().from(leads).where(
      session.role === "ADMIN"
        ? eq(leads.id, leadId)
        : and(eq(leads.id, leadId), eq(leads.userId, session.userId))
    );
    const lead = await query.get();

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }

    // Buscar perfil comercial do agente caso exista
    let agentProfile = null;
    if (session.userId) {
      agentProfile = await db
        .select()
        .from(agentProfiles)
        .where(eq(agentProfiles.userId, session.userId))
        .get();
    }

    let prompt = "";
    const cleanPhone = lead.phone ? cleanPhoneForWA(lead.phone) : "5511999999999";
    const agencyName = agentProfile?.companyName || "Flow Prospect";

    // 3. Montar o prompt dependendo se é uma nova geração ou refinação
    if (customPrompt && previousCode) {
      // Prompt de Refinamento de Alta Fidelidade
      prompt = `Você é um Diretor de Arte e Engenheiro Front-End Sênior especializado em Web Design de alta conversão.
Você recebeu o código-fonte de uma Landing Page profissional em ARQUIVO ÚNICO HTML (construída com Tailwind CSS via CDN, Font Awesome e as fontes de design CoFo Sans, Sofia Pro e Caponi).
Sua missão é aprimorar e refinar o website estritamente de acordo com as instruções do usuário, mantendo ou elevando o padrão estético de agência de elite.

DADOS DA EMPRESA:
- Nome da Empresa: ${lead.name}
- Tipo/Nicho: ${lead.type || "Serviços e Negócios Locais"}
- Cidade: ${lead.city || ""}
- Telefone/WhatsApp: ${cleanPhone}

INSTRUÇÃO DE AJUSTE DO USUÁRIO:
"${customPrompt}"

CÓDIGO ANTERIOR DO WEBSITE:
${previousCode}

REGRAS RÍGIDAS DE ATUALIZAÇÃO E DESIGN:
1. Aplique com total precisão as alterações solicitadas (cores, textos, novas seções, imagens ou botões).
2. PRESERVE o carregamento das fontes CoFo Sans, Sofia Pro, Caponi e Font Awesome.
3. **REGRA MANDATÓRIA DE CONTRASTE E TEMA DARK (WCAG AAA)**:
   - Se a página for escura (Dark Mode) ou tiver seções de fundo escuro: NUNCA use texto escuro ou preto (\`text-black\`, \`text-slate-900\`, \`text-gray-900\`, \`color: #000\`).
   - TODOS os textos, títulos, cards, depoimentos, itens do FAQ e formulários no tema escuro DEVEM ser brancos ou cinza claro (\`text-white\`, \`text-slate-100\`, \`text-slate-200\`, \`text-slate-300\`).
   - Inputs e formulários no Dark Mode: fundo \`bg-slate-900/90 border-slate-700 text-white placeholder-slate-400\`. Nenhuma letra pode ficar invisível.
4. **REGRA DE IMAGENS E LOGOTIPO (ZERO IMAGENS QUEBRADAS)**:
   - NUNCA use tag \`<img>\` com caminho relativo (como logo.png, doctor.jpg) ou falso para o logo. O logo DEVE ser sempre tipográfico com ícone Font Awesome.
   - NUNCA use \`source.unsplash.com\`. Use URLs reais e completas do Unsplash (ex: https://images.unsplash.com/photo-...).
5. **REGRA DE TEXTOS E TÍTULOS INTEIROS**:
   - Todos os títulos devem ser frases completas com sentido pleno (ex: 'Nossos Serviços Especializados', 'Conheça Nossa História'). NUNCA deixe palavras soltas como apenas 'Nossos'.
   - Garanta espaçamento perfeito entre palavras.
6. Mantenha os links de WhatsApp ativos para https://wa.me/${cleanPhone}.
7. Garanta 100% de responsividade (mobile, tablet e desktop).
8. **NÃO use tags ou blocos Markdown** (nada de \`\`\`html ou \`\`\`). Retorne APENAS o código HTML puro completo, iniciando exatamente por <!DOCTYPE html> e terminando com </html>.`;
    } else {
      // Prompt de Geração Inicial Ultra-Profissional
      let styleGuidance = "";
      if (visualStyle === "dark") {
        styleGuidance = `Estilo Visual: DARK MODE ULTRA-PREMIUM & TECH.
- Fundo: Preto profundo e grafite escuro (bg-slate-950 ou bg-zinc-950).
- CONTRASTE OBRIGATÓRIO: TODOS os textos, títulos, subtítulos, cards e botões DEVEM SER CLAROS (text-white, text-slate-100, text-slate-200). É ESTRITAMENTE PROIBIDO usar texto preto ou cinza escuro em fundos escuros!
- Detalhes visuais: Gradientes modernos (ciano, violeta ou esmeralda), cards com efeito glassmorphism sutil (bg-white/5 border border-white/10 text-white).
- Formulários: Inputs com fundo escuro (bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400).`;
      } else if (visualStyle === "luxury") {
        styleGuidance = `Estilo Visual: LUXO & ALTO PADRÃO (CAPONI EDITORIAL).
- Fundo: Tons refinados de preto fosco, grafite e toques dourados nobres (text-amber-400, border-amber-500/30).
- Tipografia: Títulos imponentes com a fonte serifada Caponi (estilo revista Vogue/Forbes) e textos de apoio com Sofia Pro.
- CONTRASTE OBRIGATÓRIO: Textos sempre legíveis com alto contraste (text-white ou text-slate-100).`;
      } else if (visualStyle === "clean") {
        styleGuidance = `Estilo Visual: CLEAN, MINIMALISTA & SAÚDE.
- Fundo: Branco puro e cinza neutro suave (bg-slate-50).
- Paleta: Tons de azul marinho, ciano suave e verde menta.
- Tipografia: CoFo Sans e Sofia Pro com espaçamento generoso e máxima legibilidade.`;
      } else if (visualStyle === "vibrant") {
        styleGuidance = `Estilo Visual: ENÉRGICO, COMERCIAL & VIBRANTE.
- Cores: Tons quentes de alto impacto (laranja, vermelho moderno ou amarelo solar) equilibrados com fundos sóbrios.
- Tipografia: CoFo Sans em caixa alta (uppercase) para chamadas fortes de vendas e Sofia Pro para leitura confortável.`;
      } else {
        styleGuidance = `Estilo Visual: ADAPTADO AO NICHO COM QUALIDADE DE AGÊNCIA DE ELITE.
- Escolha uma paleta de cores moderna e profissional adequada especificamente para o segmento da empresa (ex: saúde = azul/verde suave; advocacia/finanças = azul marinho/dourado; estética = rosé/preto/dourado; alimentação = tons apetitosos; tecnologia = índigo/violeta; serviços = azul/laranja).
- Garanta contraste perfeito e legibilidade absoluta em todos os textos e elementos.`;
      }

      prompt = `Você é um Diretor de Arte, Tipógrafo Editorial e Engenheiro Front-End Sênior de uma agência de branding de luxo.
Você vai criar uma Landing Page extraordinária, com estética de revista internacional e pronta para conversão comercial para esta empresa brasileira.

DADOS DA EMPRESA (coletados via Google Maps / Mercado Local):
- Nome Comercial: ${lead.name}
- Segmento / Nicho: ${lead.type || "Serviços e Negócios Locais"}
- Cidade de Atuação: ${lead.city || "Brasil"}
- Endereço Completo: ${lead.address || "Localização central"}
- Telefone / WhatsApp: ${lead.phone || "Não informado"} (Link direto: https://wa.me/${cleanPhone})
- Nota no Google Maps: ${lead.rating || "4.9"} estrelas
- Resumo de Opiniões de Clientes Reais: ${lead.review_summary || "Atendimento impecável, equipe extremamente atenciosa e serviços de excelência comprovada."}

DIRETRIZ DE ESTILO SELECIONADA:
${styleGuidance}

TIPOGRAFIA PREMIUM OBRIGATÓRIA (FUJA TOTALMENTE DE FONTES COM CARA DE IA):
Você DEVE utilizar e alternar com elegância e requinte entre as fontes **CoFo Sans**, **Sofia Pro** e **Caponi**:
1. Carregue no <head>:
   <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/cofo-sans">
   <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/sofia-pro">
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
   <script src="https://cdn.tailwindcss.com"></script>

2. No <style>, defina as fontes personalizadas e fallback elegante:
   @font-face {
     font-family: 'Caponi';
     font-style: normal;
     font-weight: 700;
     src: local('Caponi'), local('DM Serif Display'), serif;
   }
   
3. No script de configuração do Tailwind:
   <script>
     tailwind.config = {
       theme: {
         extend: {
           fontFamily: {
             sans: ['"Sofia Pro"', 'system-ui', 'sans-serif'],
             display: ['"CoFo Sans"', 'sans-serif'],
             editorial: ['"Caponi"', '"DM Serif Display"', 'serif'],
             cofo: ['"CoFo Sans"', 'sans-serif'],
             sofia: ['"Sofia Pro"', 'sans-serif'],
             caponi: ['"Caponi"', '"DM Serif Display"', 'serif'],
           }
         }
       }
     }
   </script>

4. **COMO ALTERNAR AS FONTES NO DESIGN**:
   - Títulos de grande impacto, nome da marca e chamada do Hero: use **font-display** (\`font-['CoFo_Sans']\`) para um visual forte e contemporâneo, ou **font-editorial** (\`font-['Caponi',serif]\`) para um tom sofisticado e autoritário de alta grife.
   - Subtítulos, parágrafos, menus de navegação, cards, depoimentos e formulários: use **font-sans** (\`font-['Sofia_Pro']\`), que confere extrema elegância, legibilidade e ar de design moderno europeu.
   - Alterne estrategicamente entre CoFo Sans e Caponi nos títulos das seções para criar um ritmo visual deslumbrante que não pareça em nada um template pré-fabricado de IA.

REGRA MANDATÓRIA DE CONTRASTE E LEGIBILIDADE (ATENÇÃO ESPECIAL AO TEMA DARK):
- Se o estilo for DARK MODE ou se houver fundos escuros:
  * NUNCA, SOB NENHUMA HIPÓTESE, use texto preto ou cinza escuro (\`text-black\`, \`text-slate-900\`, \`text-gray-900\`, \`color: black\`).
  * Títulos devem ser \`text-white\`.
  * Parágrafos e descrições devem ser \`text-slate-200\` ou \`text-slate-300\`.
  * Cards devem ter fundo escuro com borda suave: \`bg-slate-900/90 border border-white/10 text-white\`.
  * Inputs de formulários: \`bg-slate-900 border border-slate-700 text-white placeholder-slate-400\`. Nenhuma letra ou texto pode sumir.

SEÇÕES OBRIGATÓRIAS DO WEBSITE:
1. **Header Glassmorphism (ZERO IMAGENS QUEBRADAS NO LOGO)**:
   - O Logotipo DEVE ser construído puramente com tipografia e ícone estilizado.
   - **É TERMINANTEMENTE PROIBIDO usar tag \`<img>\` para o logotipo** (para evitar o ícone de imagem quebrada).
   - Use exatamente esta estrutura para o logo:
     \`\`\`html
     <div class="flex items-center gap-3">
       <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
         <i class="fa-solid fa-star-of-life text-lg"></i>
       </div>
       <div class="flex flex-col">
         <span class="font-['CoFo_Sans'] font-extrabold text-xl text-white tracking-tight leading-none">${lead.name}</span>
         <span class="font-['Sofia_Pro'] text-[11px] text-cyan-400 font-semibold tracking-wider uppercase mt-1">${lead.type || "Excelência & Confiança"}</span>
       </div>
     </div>
     \`\`\`
   - Menu com navegação suave para as seções (font Sofia Pro).
   - Botão destacado "Falar no WhatsApp" para https://wa.me/${cleanPhone}.

2. **Hero Section de Alto Padrão**:
   - Selo no topo: "⭐ ${lead.rating || "4.9"} no Google Maps • Destaque em ${lead.city || "sua região"}".
   - Headline magnética focada na dor e solução do cliente.
   - Botão de WhatsApp pulsante verde com ícone e texto persuasivo.
   - Imagem em alta definição do Unsplash com proporção moderna e cantos arredondados (escolha uma das URLs reais da seção de imagens abaixo).

3. **Faixa de Prova Social e Números**: 4 métricas expressivas da empresa com títulos claros.

4. **Grade de Serviços Especializados (ATENÇÃO AO TÍTULO COMPLETO)**:
   - **O TÍTULO DESTA SEÇÃO DEVE SER UMA FRASE COMPLETA**: "Nossos Serviços Especializados" ou "Nossas Especialidades e Tratamentos". NUNCA coloque apenas a palavra "Nossos" solta!
   - De 4 a 6 cards de serviços completos com ícones temáticos da Font Awesome, títulos claros e descrições ricas de 2 a 3 linhas.

5. **Diferenciais / Autoridade**:
   - Título completo: "Por Que Escolher a Nossa Empresa" ou "Diferenciais que Transformam a Sua Experiência".
   - Checklist com ícones verdes de check e benefícios tangíveis.

6. **Depoimentos Reais do Google**:
   - Título completo: "O Que Nossos Clientes Dizem no Google".
   - 3 cards com estrelas douradas, avatares do Unsplash e comentários persuasivos baseados em: "${lead.review_summary || "Atendimento excelente"}".

7. **Perguntas Frequentes (FAQ Interativo)**:
   - Título completo: "Perguntas Frequentes e Dúvidas Comuns".
   - 3 a 4 perguntas e respostas completas com acordeão em JavaScript nativo funcional.

8. **Localização e Contato**:
   - Título completo: "Onde Nos Encontrar e Canais de Contato".
   - Endereço real (${lead.address || "Atendimento local"}), horários e formulário elegante.

9. **Botão Flutuante de WhatsApp**: Fixo no canto inferior direito (fixed bottom-6 right-6 z-50), pulsante e ativo.
10. **Footer Institucional**: Rodapé profissional com direitos autorais e links.

DIRETRIZES RÍGIDAS PARA IMAGENS (NUNCA DEIXE IMAGENS QUEBRADAS):
- É TERMINANTEMENTE PROIBIDO usar \`source.unsplash.com\` (esse serviço foi extinto e quebra as imagens).
- É TERMINANTEMENTE PROIBIDO usar caminhos relativos ou arquivos inexistentes (ex: \`logo.png\`, \`banner.jpg\`, \`clinica.jpg\`).
- Utilize EXCLUSIVAMENTE estas URLs estáveis do Unsplash correspondentes ao nicho:
  * Saúde / Clínicas / Odontologia / Médicos:
    - Hero: https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80
    - Sobre/Ambiente: https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80
  * Advocacia / Finanças / Consultoria / B2B:
    - Hero: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80
    - Sobre/Mesa: https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80
  * Mecânica / Automotivo / Oficinas:
    - Hero: https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80
    - Sobre/Oficina: https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80
  * Beleza / Estética / Barbearias:
    - Hero: https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80
    - Sobre: https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80
  * Gastronomia / Restaurantes / Bares:
    - Hero: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80
    - Pratos: https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80
  * Comércio / Serviços e Empresas Gerais:
    - Hero: https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80
    - Equipe: https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80
  * Avatares de Depoimentos:
    - https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80
    - https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80
    - https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80

REGRA DE COPYWRITING E TEXTO IMPECÁVEL:
- Todos os títulos devem ser frases completas, com sentido perfeito e sem palavras cortadas ou soltas.
- Mantenha espaçamento natural entre palavras e spans (sempre um espaço entre palavras: \`<span>Palavra 1</span> <span>Palavra 2</span>\`).
- Gramática, pontuação e acentuação brasileira impecáveis em 100% dos textos.

REGRAS RÍGIDAS DE FORMATAÇÃO:
- NÃO use blocos Markdown (NUNCA coloque \`\`\`html ou \`\`\`).
- Retorne EXCLUSIVAMENTE o código HTML completo puro, iniciando por <!DOCTYPE html> e finalizando por </html>.`;
    }

    // 4. Invocar o modelo Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let htmlCode = response.text?.trim() || "";

    // Limpar possíveis envoltórios markdown caso o modelo tenha desobedecido as instruções de formatação
    if (htmlCode.startsWith("```html")) {
      htmlCode = htmlCode.substring(7);
    } else if (htmlCode.startsWith("```")) {
      htmlCode = htmlCode.substring(3);
    }
    if (htmlCode.endsWith("```")) {
      htmlCode = htmlCode.substring(0, htmlCode.length - 3);
    }
    htmlCode = htmlCode.trim();

    if (!htmlCode) {
      return NextResponse.json({ error: "Não foi possível gerar o código do site." }, { status: 500 });
    }

    // Salvar o HTML gerado no banco de dados para preview público
    await db.update(leads).set({ generatedHtml: htmlCode }).where(eq(leads.id, leadId));

    return NextResponse.json({ htmlCode });
  } catch (error) {
    console.error("Erro ao gerar site com IA:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição com IA", details: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    );
  }
}

