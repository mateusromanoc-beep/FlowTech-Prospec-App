import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { verifySession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    const data = await req.json();
    
    // Suporte para um único lead ou um array de leads
    const leadsToInsert = Array.isArray(data) ? data : [data];

    console.log(`Recebendo ${leadsToInsert.length} leads do n8n (sync)...`);

    // Filtra apenas leads com name e place_id válidos
    const validLeads = leadsToInsert.filter(lead => lead.name && lead.place_id);

    if (validLeads.length === 0) {
      return NextResponse.json({ success: true, count: 0, skipped: 0, message: "Nenhum lead válido recebido." });
    }

    // ============================================================
    // PROTEÇÃO CONTRA DUPLICATAS
    // ============================================================
    const currentUserId = session?.userId || null;
    const incomingPlaceIds = validLeads.map(l => l.place_id);

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

    const existingPlaceIds = new Set(
      existingLeads
        .map(l => l.place_id)
        .filter((id): id is string => id !== null)
    );

    // Filtra apenas os leads novos
    const newLeads = validLeads.filter(lead => !existingPlaceIds.has(lead.place_id));
    const skippedCount = validLeads.length - newLeads.length;

    console.log(`Sync: ${newLeads.length} novos, ${skippedCount} duplicatas ignoradas.`);

    // ============================================================
    // INSERÇÃO DOS LEADS NOVOS
    // ============================================================
    let insertedCount = 0;

    for (const lead of newLeads) {
      try {
        await db.insert(leads).values({
          userId: currentUserId,
          name: lead.name,
          phone: lead.phone || "",
          website: lead.website || "",
          address: lead.address || "",
          city: lead.city || "",
          type: lead.type || "",
          rating: lead.rating?.toString() || "0",
          place_id: lead.place_id,
          review_summary: lead.review_summary || null,
        });
        insertedCount++;
      } catch (e: any) {
        if (e?.message?.includes("UNIQUE constraint")) {
          console.log(`Sync: Lead "${lead.name}" já existe (constraint). Ignorado.`);
        } else {
          console.error("Sync: Erro ao inserir lead:", e);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: insertedCount, 
      skipped: skippedCount,
      message: skippedCount > 0 
        ? `${insertedCount} leads sincronizados. ${skippedCount} duplicatas ignoradas.`
        : `${insertedCount} leads sincronizados com sucesso.`
    });
  } catch (error) {
    console.error("Erro no sync de leads:", error);
    return NextResponse.json({ error: "Erro interno no processamento do sync" }, { status: 500 });
  }
}
