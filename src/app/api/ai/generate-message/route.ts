import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { agentProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    // Verificar autenticação
    let session;
    try {
      session = await verifySession();
    } catch (e) {
      // Continua sem bloquear
    }

    const body = await req.json();
    const { name, type, city, phone, website, rating, review_summary } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome do lead é obrigatório" }, { status: 400 });
    }

    // Tentar buscar perfil do agente cadastrado para o usuário logado
    let agentProfileData = null;
    if (session?.userId) {
      try {
        agentProfileData = await db
          .select()
          .from(agentProfiles)
          .where(eq(agentProfiles.userId, session.userId))
          .get();
      } catch (err) {
        console.error("Erro ao buscar perfil de agente:", err);
      }
    }

    let customInstructions = "";
    if (agentProfileData) {
      customInstructions = `
VOCÊ ESTÁ REPRESENTANDO A SEGUINTE EMPRESA:
- Nome da sua empresa: ${agentProfileData.companyName}
- O que sua empresa faz (Atividade): ${agentProfileData.businessActivity}
- Serviços/produtos que você oferece: ${agentProfileData.servicesOffered}
${agentProfileData.targetAudience ? `- Público-alvo principal: ${agentProfileData.targetAudience}` : ""}
- Tom da mensagem desejado: ${agentProfileData.customTone || "profissional"}

INSTRUÇÕES DE ABORDAGEM E PERSONALIZAÇÃO:
1. Apresente-se brevemente em nome da empresa "${agentProfileData.companyName}".
2. Mostre de forma bem sucinta como os serviços ("${agentProfileData.servicesOffered}") geram valor para o lead ("${type || "Não informado"}").
3. Use o tom "${agentProfileData.customTone || "profissional"}":
   - 'direto': Vá direto ao ponto, explique a proposta em 1 parágrafo curto e convide para falar.
   - 'descontraido': Use linguagem leve, simpática e amigável.
   - 'consultivo': Cite um desafio comum do ramo e ofereça uma solução rápida.
   - 'profissional': Seja formal, claro, cordial e muito objetivo.`;
    } else {
      customInstructions = `
VOCÊ ESTÁ REPRESENTANDO UM CONSULTOR COMERCIAL GENÉRICO:
- Tom da mensagem desejado: profissional e amigável

INSTRUÇÕES DE ABORDAGEM:
1. Proponha uma conversa rápida para entender os desafios do lead no ramo de "${type || "Não informado"}".`;
    }

    const prompt = `Você é um especialista em vendas B2B e prospecção comercial no Brasil. Gere uma mensagem de abordagem fria inicial para enviar via WhatsApp a um potencial cliente (lead).

INFORMAÇÕES DO LEAD:
- Nome da empresa: ${name}
- Ramo/Tipo: ${type || "Não informado"}
- Cidade: ${city || "Não informada"}
- Telefone: ${phone || "Não informado"}
- Website: ${website || "Não informado"}
- Avaliação Google: ${rating || "Não informada"} estrelas
- Resumo de avaliações: ${review_summary || "Sem avaliações disponíveis"}
${customInstructions}

REGRAS CRÍTICAS PARA A MENSAGEM (MUITO IMPORTANTE):
1. **MUITO CURTA E DIRETA**: O WhatsApp exige leitura rápida. A mensagem deve ter no máximo 2 parágrafos curtos (de 2 a 3 linhas cada). O limite absoluto é de 100 palavras.
2. Comece com uma saudação rápida e amigável usando o nome do lead (ou o nome da empresa).
3. Não faça rodeios ou introduções longas. Fale logo a que veio e o benefício direto para eles.
4. Apresente uma proposta de valor clara e de fácil entendimento.
5. Termine com uma pergunta simples e de baixo atrito para iniciar a conversa (ex: "Faz sentido para você?", "Teriam 5 minutos esta semana?").
6. NÃO use linguagem corporativa chata ou artificial ("prezado", "venho por meio desta", "gostaria de apresentar"). Escreva como um ser humano real.
7. Use no máximo 1 ou 2 emojis para dar leveza, sem poluição visual.

Gere APENAS o texto da mensagem, sem nenhuma introdução ou explicação adicional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const message = response.text?.trim();

    if (!message) {
      return NextResponse.json({ error: "Não foi possível gerar a mensagem" }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Erro ao gerar mensagem IA:", error);
    return NextResponse.json(
      { error: "Erro ao gerar mensagem", details: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    );
  }
}
