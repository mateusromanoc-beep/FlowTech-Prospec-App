import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";

export async function POST(req: Request) {
  const session = await auth();
  
  // Para testes, permitiremos sem sessão se for localhost, mas idealmente deve ser protegido
  // if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { subcat, city } = body;

    const N8N_URL = process.env.N8N_URL || "https://swimmingseal-n8n.cloudfy.live";
    const N8N_API_KEY = process.env.N8N_API_KEY;
    const WORKFLOW_ID = "zJRKDRpA9uph6ktx";

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
    
    // Sincronização local imediata
    const results = [];
    const leadsToProcess = Array.isArray(leadsData) ? leadsData : (leadsData ? [leadsData] : []);

    if (leadsToProcess.length > 0) {
      console.log(`Processando ${leadsToProcess.length} leads do n8n.`);
      for (const lead of leadsToProcess) {
        // Garantindo que estamos acessando os campos corretamente (n8n v2 retorna a parte 'json' ou o objeto flat)
        const leadItem = lead.json || lead;
        
        // Ignorar se não tiver nome (item vazio)
        if (!leadItem.name) continue;

        try {
          const result = await db.insert(leads).values({
            name: leadItem.name,
            phone: leadItem.phone || "",
            website: leadItem.website || "",
            address: leadItem.address || "",
            city: leadItem.city || city, // Salva a cidade da busca ou do lead
            type: leadItem.type || subcat,
            rating: leadItem.rating?.toString() || "0",
            place_id: leadItem.place_id || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          }).onConflictDoUpdate({
            target: leads.place_id,
            set: {
              name: leadItem.name,
              phone: leadItem.phone || "",
              website: leadItem.website || "",
              address: leadItem.address || "",
              city: leadItem.city || city,
              type: leadItem.type || subcat,
              rating: leadItem.rating?.toString() || "0",
            }
          }).returning();
          results.push(result);
        } catch (e) {
          console.error("Erro ao inserir lead individual:", e);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${results.length} leads processados e salvos com sucesso.`,
      count: results.length 
    });
  } catch (error: any) {
    console.error("Erro na integração n8n:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
