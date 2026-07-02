import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { leads, users } from "@/lib/schema";
import { eq, and, gte, sql, inArray, isNull } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await verifySession();

  try {
    const body = await req.json();
    const { subcat, city } = body;

    // --- Validação de Plano e Limites ---
    let limit = 500;
    let currentCount = 0;
    let remaining = 500;

    if (session?.userId) {
      const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
      if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      const leadsThisMonth = await db.select({ count: sql`count(*)` })
        .from(leads)
        .where(and(
          eq(leads.userId, session.userId),
          gte(leads.createdAt, startOfMonth)
        )).get();

      currentCount = Number(leadsThisMonth?.count || 0);
      
      if (user.plan === "GROWTH") limit = 1000;
      else if (user.plan === "UNLIMITED") limit = Infinity;

      remaining = limit - currentCount;

      if (remaining <= 0) {
        return NextResponse.json({ error: `Você atingiu o limite do seu plano (${user.plan}: ${limit === Infinity ? 'Ilimitado' : limit} leads/mês).` }, { status: 403 });
      }
    }
    // ------------------------------------

    const N8N_URL = process.env.N8N_URL || "https://swimmingseal-n8n.cloudfy.live";

    console.log(`Iniciando prospecção real para: ${subcat} em ${city}`);

    // Chamada para a API do n8n para execução manual
    const response = await fetch(`${N8N_URL}/webhook/prospect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subcat, city }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Erro n8n API:", errorData);
      throw new Error(`n8n API responded with ${response.status}`);
    }

    const leadsData = await response.json();
    console.log("DADOS RECEBIDOS DO N8N:", JSON.stringify(leadsData, null, 2));
    
    // Normaliza os dados recebidos do n8n
    const leadsToProcess = Array.isArray(leadsData) ? leadsData : (leadsData ? [leadsData] : []);

    if (leadsToProcess.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Nenhum lead encontrado para essa busca.",
        count: 0,
        skipped: 0
      });
    }

    // Extrai os dados reais de cada lead (n8n pode envolver em { json: ... })
    const parsedLeads = leadsToProcess
      .map(lead => lead.json || lead)
      .filter(lead => lead.name && lead.place_id); // Ignora leads sem nome ou sem place_id

    console.log(`${parsedLeads.length} leads válidos recebidos do n8n (com nome e place_id).`);

    // ============================================================
    // PROTEÇÃO CONTRA DUPLICATAS
    // Busca todos os place_ids que já existem para este usuário
    // ============================================================
    const currentUserId = session?.userId || null;
    
    const incomingPlaceIds = parsedLeads.map(l => l.place_id);

    // Consulta os place_ids que já existem no banco para esse usuário
    let existingPlaceIds: Set<string> = new Set();

    if (incomingPlaceIds.length > 0) {
      const userCondition = currentUserId 
        ? eq(leads.userId, currentUserId) 
        : isNull(leads.userId);

      const existingLeads = await db
        .select({ place_id: leads.place_id })
        .from(leads)
        .where(and(
          inArray(leads.place_id, incomingPlaceIds),
          userCondition
        ));

      existingPlaceIds = new Set(
        existingLeads
          .map(l => l.place_id)
          .filter((id): id is string => id !== null)
      );
    }

    // Filtra apenas os leads que ainda NÃO existem para este usuário
    const newLeads = parsedLeads.filter(lead => !existingPlaceIds.has(lead.place_id));
    const skippedCount = parsedLeads.length - newLeads.length;

    console.log(`Duplicatas detectadas e ignoradas: ${skippedCount}. Leads novos para inserir: ${newLeads.length}.`);

    // ============================================================
    // INSERÇÃO DOS LEADS NOVOS
    // ============================================================
    const results = [];

    for (const leadItem of newLeads) {
      // Se bater no limite durante a inserção, paramos (apenas se não for ilimitado)
      if (remaining !== Infinity && results.length >= remaining) {
        console.log("Limite do plano atingido durante inserção");
        break;
      }

      try {
        await db.insert(leads).values({
          userId: currentUserId,
          name: leadItem.name,
          phone: leadItem.phone || "",
          website: leadItem.website || "",
          address: leadItem.address || "",
          city: leadItem.city || city,
          type: leadItem.type || subcat,
          rating: leadItem.rating?.toString() || "0",
          place_id: leadItem.place_id,
        });
        
        results.push(leadItem);
      } catch (e: any) {
        // Segurança extra: se por algum motivo o insert falhar por constraint, 
        // apenas loga e continua (não duplica)
        if (e?.message?.includes("UNIQUE constraint")) {
          console.log(`Lead "${leadItem.name}" já existe (constraint). Ignorado.`);
        } else {
          console.error("Erro ao inserir lead individual:", e);
        }
      }
    }

    // Monta a mensagem de retorno clara para o usuário
    let message = "";
    if (results.length > 0 && skippedCount > 0) {
      message = `${results.length} novos leads salvos com sucesso! (${skippedCount} já estavam na sua lista e foram ignorados)`;
    } else if (results.length > 0) {
      message = `${results.length} leads processados e salvos com sucesso.`;
    } else if (skippedCount > 0) {
      message = `Todos os ${skippedCount} leads encontrados já estão na sua lista. Nenhum duplicado foi adicionado.`;
    } else {
      message = "Nenhum lead novo encontrado para essa busca.";
    }

    return NextResponse.json({ 
      success: true, 
      message,
      count: results.length,
      skipped: skippedCount
    });
  } catch (error: any) {
    console.error("Erro na integração n8n:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
