import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.role !== "ADMIN" && session.role !== "USER_PRO") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const leadId = parseInt(params.id);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "ID de lead inválido" }, { status: 400 });
    }

    const { htmlCode } = await req.json();
    if (htmlCode === undefined) {
      return NextResponse.json({ error: "Código do site é obrigatório" }, { status: 400 });
    }

    // Verifica se o lead pertence ao usuário
    const leadQuery = db.select().from(leads).where(
      session.role === "ADMIN"
        ? eq(leads.id, leadId)
        : and(eq(leads.id, leadId), eq(leads.userId, session.userId))
    );
    const lead = await leadQuery.get();

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }

    // Atualizar o site gerado no banco
    await db.update(leads).set({ generatedHtml: htmlCode }).where(eq(leads.id, leadId));

    return NextResponse.json({ success: true, message: "Site salvo com sucesso." });
  } catch (error: any) {
    console.error("Erro ao salvar site:", error);
    return NextResponse.json({ error: "Erro interno ao salvar o site" }, { status: 500 });
  }
}
