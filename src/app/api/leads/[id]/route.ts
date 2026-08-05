import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Apenas USER_PRO e ADMIN podem acessar
  if (session.role !== "ADMIN" && session.role !== "USER_PRO") {
    return NextResponse.json({ error: "Permissão insuficiente. Requer acesso Pro." }, { status: 403 });
  }

  try {
    const leadId = parseInt(params.id);
    
    // Busca o lead garantindo que pertence ao usuário logado (se não for ADMIN)
    const query = db.select().from(leads).where(
      session.role === "ADMIN" 
        ? eq(leads.id, leadId)
        : and(eq(leads.id, leadId), eq(leads.userId, session.userId))
    );
    
    const lead = await query.get();

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("Erro ao buscar lead:", error);
    return NextResponse.json({ error: "Erro interno ao buscar lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const leadId = parseInt(params.id);
    
    // Deleta apenas se pertencer ao usuário logado
    await db.delete(leads).where(
      and(
        eq(leads.id, leadId),
        eq(leads.userId, session.userId)
      )
    );

    return NextResponse.json({ success: true, message: "Lead excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json({ error: "Erro interno ao excluir lead" }, { status: 500 });
  }
}
