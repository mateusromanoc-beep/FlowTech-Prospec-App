import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { count, desc, gte, eq, and, sql } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { users } from "@/lib/schema";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Lógica Multi-tenant
    const userFilter = session?.userId ? eq(leads.userId, session.userId) : undefined;

    // Total de Leads
    const totalQuery = db.select({ value: count() }).from(leads);
    if (userFilter) totalQuery.where(userFilter);
    const totalResult = await totalQuery;
    const total = totalResult[0]?.value || 0;
    
    // Novos Hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayQuery = db.select({ value: count() }).from(leads);
    if (userFilter) {
      todayQuery.where(and(gte(leads.createdAt, today), userFilter));
    } else {
      todayQuery.where(gte(leads.createdAt, today));
    }
    const todayResult = await todayQuery;
    const todayCount = todayResult[0]?.value || 0;

    // Cidades Ativas
    const citiesQuery = db.select({ value: sql<number>`count(distinct city)` }).from(leads);
    if (userFilter) citiesQuery.where(userFilter);
    const citiesResult = await citiesQuery;
    const cities = citiesResult[0]?.value || 0;

    // Lista de Leads
    const listQuery = db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
    if (userFilter) listQuery.where(userFilter);
    const list = await listQuery;

    // --- Limites do Plano (Para Dashboard) ---
    let planData = { name: "STARTER", limit: 500, consumed: 0 };
    if (session?.userId) {
      const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
      if (user) {
        let maxLimit = 500;
        if (user.plan === "GROWTH") maxLimit = 1000;
        else if (user.plan === "UNLIMITED") maxLimit = -1; // -1 significa ilimitado
        
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const thisMonthQuery = db.select({ value: count() }).from(leads).where(and(eq(leads.userId, session.userId), gte(leads.createdAt, startOfMonth)));
        const thisMonthResult = await thisMonthQuery;
        
        planData = {
          name: user.plan,
          limit: maxLimit,
          consumed: thisMonthResult[0]?.value || 0
        };
      }
    }
    // ------------------------------------------

    return NextResponse.json({
      leads: list,
      userRole: session?.role || "USER",
      stats: {
        total,
        today: todayCount,
        cities,
        successRate: list.length > 0 ? "100%" : "0%",
        plan: planData
      }
    });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json({ error: "Erro interno", details: error instanceof Error ? error.message : "Desconhecido" }, { status: 500 });
  }
}
