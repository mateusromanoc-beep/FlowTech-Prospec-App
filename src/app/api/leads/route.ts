import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { count, desc, gte, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Total de Leads
    const totalResult = await db.select({ value: count() }).from(leads);
    const total = totalResult[0]?.value || 0;
    
    // Novos Hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResult = await db.select({ value: count() })
      .from(leads)
      .where(gte(leads.createdAt, today));
    const todayCount = todayResult[0]?.value || 0;

    // Cidades Ativas (Simplificado com SQL raw para garantir compatibilidade)
    const citiesResult = await db.select({ 
      value: sql<number>`count(distinct city)`
    }).from(leads);
    const cities = citiesResult[0]?.value || 0;

    const list = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);

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
