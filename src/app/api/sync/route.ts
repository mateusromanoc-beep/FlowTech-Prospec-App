import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Suporte para um único lead ou um array de leads
    const leadsToInsert = Array.isArray(data) ? data : [data];

    console.log(`Recebendo ${leadsToInsert.length} leads do n8n...`);

    for (const lead of leadsToInsert) {
      await db.insert(leads).values({
        name: lead.name,
        phone: lead.phone,
        website: lead.website,
        address: lead.address,
        type: lead.type,
        rating: lead.rating,
        place_id: lead.place_id,
        review_summary: lead.review_summary,
      }).onConflictDoUpdate({
        target: leads.place_id,
        set: {
          name: lead.name,
          phone: lead.phone,
          website: lead.website,
          address: lead.address,
          type: lead.type,
          rating: lead.rating,
          review_summary: lead.review_summary,
        }
      });
    }

    return NextResponse.json({ success: true, count: leadsToInsert.length });
  } catch (error) {
    console.error("Erro no sync de leads:", error);
    return NextResponse.json({ error: "Erro interno no processamento do sync" }, { status: 500 });
  }
}
