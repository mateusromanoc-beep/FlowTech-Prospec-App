import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

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
