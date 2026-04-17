import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { count, desc, gte, eq, and, sql } from "drizzle-orm";
import { verifySession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Lógica Multi-tenant
    const isUser = session?.role === "USER";
    const userFilter = isUser && session?.userId ? eq(leads.userId, session.userId) : undefined;

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

    return NextResponse.json({
      leads: list,
      stats: {
        total,
        today: todayCount,
        cities,
        successRate: list.length > 0 ? "100%" : "0%"
      }
    });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json({ error: "Erro interno", details: error instanceof Error ? error.message : "Desconhecido" }, { status: 500 });
  }
}
