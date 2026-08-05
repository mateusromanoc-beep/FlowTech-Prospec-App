import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
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
    const { leadId, customPrompt, previousCode } = body;

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

    let prompt = "";
    const cleanPhone = lead.phone ? cleanPhoneForWA(lead.phone) : "";

    // 3. Montar o prompt dependendo se é uma nova geração ou refinação
    if (customPrompt && previousCode) {
      // Prompt de Refinamento
      prompt = `Você é um desenvolvedor web sênior especialista em refinar websites.
Você recebeu o código de um website de arquivo único HTML e precisa fazer alterações nele de acordo com as instruções fornecidas pelo usuário.

DADOS DA EMPRESA:
- Nome da Empresa: ${lead.name}
- Tipo/Nicho: ${lead.type || "Serviços/Comércio"}

INSTRUÇÕES DE ALTERAÇÃO DO USUÁRIO:
"${customPrompt}"

CÓDIGO ANTERIOR DO WEBSITE:
${previousCode}

REGRAS DE REFINAMENTO:
1. Aplique fielmente as alterações solicitadas pelo usuário (ex: alterar cores, adicionar seções, mudar textos, trocar imagens).
2. Tente preservar o máximo possível da estrutura original, dos dados da empresa e dos serviços já existentes no código anterior, modificando apenas o que foi pedido ou o que for necessário para manter o design consistente e profissional.
3. Garanta que o CSS continue inline (dentro de <style>) e o JavaScript também, mantendo tudo em um ARQUIVO ÚNICO HTML.
4. **NÃO use tags ou marcações Markdown** (como \`\`\`html ou \`\`\`) na sua resposta. Retorne APENAS o código HTML completo final modificado puro, iniciando por <!DOCTYPE html> e terminando com </html>.`;
    } else {
      // Prompt de Geração Inicial
      prompt = `Você é um desenvolvedor web especialista em criar websites de alto padrão (landing pages) focadas em conversão para pequenas e médias empresas brasileiras.
Você criará um código de website completo, lindo, moderno e responsivo em um ARQUIVO ÚNICO HTML, incluindo CSS interno (na tag <style>) e JavaScript básico interno (na tag <script>).

DADOS DA EMPRESA (extraídos do Google Maps):
- Nome da Empresa: ${lead.name}
- Tipo/Nicho: ${lead.type || "Serviços/Comércio"}
- Cidade: ${lead.city || ""}
- Endereço Completo: ${lead.address || ""}
- Telefone: ${lead.phone || "Não informado"}
- Site Atual: ${lead.website || "Não possui"}
- Avaliação Média no Google: ${lead.rating || "5.0"} estrelas
- Resumo de Avaliações / Opiniões de Clientes: ${lead.review_summary || "Excelente atendimento e serviços de alta qualidade."}

REQUISITOS OBRIGATÓRIOS DO WEBSITE:
1. **Design Moderno e Premium (Aesthetics)**:
   - Use uma paleta de cores moderna, elegante e adequada para o nicho (ex: tons escuros/violeta para tecnologia; verde/branco para saúde; preto/dourado para serviços de luxo; tons quentes/laranja para alimentação; azul/cinza para advocacia ou serviços corporativos, etc.).
   - Use fontes modernas via Google Fonts (carregue fontes como 'Plus Jakarta Sans', 'Inter' ou 'Outfit' no <head>).
   - Use sombras suaves, transições ao passar o mouse (hover), bordas arredondadas e bom espaçamento interno.
   - Use ícones elegantes do FontAwesome (carregue o CDN no <head>).
2. **Imagens Reais e Relevantes**:
   - Insira imagens do Unsplash relacionadas ao nicho (ex: se for mecânica, use fotos reais do Unsplash como 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'). A IA deve escolher de 3 a 5 URLs de imagens bonitas e realistas do Unsplash que façam sentido para o ramo. Não use placeholders cinzas ou URLs que não funcionam.
3. **Seções Principais**:
   - **Navegação (Header)**: Logo estilizado com o nome da empresa e menu de navegação que rola suavemente para as seções (Home, Serviços, Sobre, Depoimentos, Contato).
   - **Hero Section**: Título forte e persuasivo com proposta de valor clara, subtítulo comercial explicativo, imagem representativa do nicho ao lado ou de fundo, e um botão de Chamada para Ação (CTA) em destaque que redirecione para falar no WhatsApp com a empresa (usando 'https://wa.me/${cleanPhone}' se houver telefone, ou um link de contato).
   - **Nossos Serviços / Diferenciais**: Apresentar em cards modernos e bem alinhados com ícones no mínimo 3 serviços/benefícios que a empresa oferece.
   - **Sobre Nós**: Um pequeno texto institucional cativante sobre a dedicação, qualidade, profissionalismo e história da empresa.
   - **Depoimentos e Prova Social**: Destacar a excelente reputação da empresa no Google Maps (nota ${lead.rating || "5.0"} estrelas) e criar de 2 a 3 depoimentos realistas de clientes, aproveitando o resumo de avaliações: "${lead.review_summary || ""}".
   - **Localização e Contato**: Endereço legível, horário de funcionamento fictício, um formulário de contato bonito (com campos Nome, E-mail, Mensagem - funcionando apenas de forma visual) e um botão de WhatsApp destacado.
   - **Footer (Rodapé)**: Rodapé elegante e direitos autorais.
4. **Interatividade e Responsividade**:
   - O design DEVE ser 100% responsivo para funcionar perfeitamente em celulares, tablets e computadores.
   - Adicione um script simples para abrir/fechar menu hambúrguer no mobile.
5. **Formatação da Resposta**:
   - **NÃO use tags ou marcações Markdown** (como \`\`\`html ou \`\`\$) na sua resposta. Retorne APENAS o código HTML completo final puro, iniciando por <!DOCTYPE html> e terminando com </html>.`;
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
