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
    const requestedUserId = searchParams.get("userId");

    const isAdmin = session?.role === "ADMIN";

    // Lógica Multi-tenant com permissão de Admin
    let userFilter = undefined;
    let targetUserIdForPlan = session?.userId;

    if (isAdmin) {
      if (requestedUserId && requestedUserId !== "all") {
        const parsedId = parseInt(requestedUserId, 10);
        if (!isNaN(parsedId)) {
          userFilter = eq(leads.userId, parsedId);
          targetUserIdForPlan = parsedId;
        }
      } else if (requestedUserId === "all") {
        userFilter = undefined;
      } else {
        // Padrão do admin se não passar nada: seus próprios leads
        userFilter = session?.userId ? eq(leads.userId, session.userId) : undefined;
      }
    } else {
      // Usuários normais só veem seus próprios leads sempre
      userFilter = session?.userId ? eq(leads.userId, session.userId) : undefined;
    }

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

    // Lista de Leads (com dados do criador se for Admin)
    let list: any[] = [];
    if (isAdmin) {
      const listQuery = db
        .select({
          id: leads.id,
          userId: leads.userId,
          name: leads.name,
          phone: leads.phone,
          website: leads.website,
          address: leads.address,
          city: leads.city,
          type: leads.type,
          rating: leads.rating,
          place_id: leads.place_id,
          review_summary: leads.review_summary,
          generatedHtml: leads.generatedHtml,
          source: leads.source,
          createdAt: leads.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(leads)
        .leftJoin(users, eq(leads.userId, users.id))
        .orderBy(desc(leads.createdAt))
        .limit(limit);

      if (userFilter) listQuery.where(userFilter);
      list = await listQuery;
    } else {
      const listQuery = db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
      if (userFilter) listQuery.where(userFilter);
      list = await listQuery;
    }

    // Lista de usuários para filtros (apenas se for admin)
    let usersList: any[] = [];
    if (isAdmin) {
      usersList = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users);
    }

    // --- Limites do Plano (Para Dashboard) ---
    let planData = { name: "STARTER", limit: 500, consumed: 0 };
    if (targetUserIdForPlan) {
      const user = await db.select().from(users).where(eq(users.id, targetUserIdForPlan)).get();
      if (user) {
        let maxLimit = 500;
        if (user.plan === "GROWTH") maxLimit = 1000;
        else if (user.plan === "UNLIMITED") maxLimit = -1; // -1 significa ilimitado
        
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const thisMonthQuery = db.select({ value: count() }).from(leads).where(and(eq(leads.userId, targetUserIdForPlan), gte(leads.createdAt, startOfMonth)));
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
      currentUserId: session?.userId || null,
      users: usersList,
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
